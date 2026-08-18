import {
  emailTags,
  getEmailFromAddress,
  getEmailReplyTo,
  getVerificationFromAddress,
  type EmailKind,
} from "@/lib/email/config";
import { buildPasswordResetEmail, buildVerificationEmail } from "@/lib/email/templates";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  kind: EmailKind;
};

export type SendEmailResult = {
  sent: boolean;
  devMode?: boolean;
  error?: string;
  messageId?: string;
};

/** Send transactional email via Resend HTTP API (no extra npm package). */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = params.from ?? getEmailFromAddress();
  const replyTo = getEmailReplyTo();

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] RESEND_API_KEY not set — skipping send:", params.subject, "→", params.to);
      return { sent: false, devMode: true };
    }
    console.error("[email] RESEND_API_KEY missing in production");
    return { sent: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        reply_to: replyTo,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        tags: emailTags(params.kind),
        headers: {
          "X-Entity-Ref-ID": params.kind,
        },
      }),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      console.error("[email] Resend error:", response.status, bodyText);
      return { sent: false, error: "Failed to send email" };
    }

    let messageId: string | undefined;
    try {
      const parsed = JSON.parse(bodyText) as { id?: string };
      messageId = parsed.id;
    } catch {
      /* ignore */
    }

    if (messageId) {
      console.info("[email] Sent", params.kind, "→", params.to, "id:", messageId);
    }

    return { sent: true, messageId };
  } catch (error) {
    console.error("[email] Send failed:", error);
    return { sent: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendEmailResult> {
  const { html, text } = buildPasswordResetEmail(resetUrl);
  return sendEmail({
    to,
    subject: "Reset your Parenfy password",
    html,
    text,
    kind: "password_reset",
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<SendEmailResult> {
  const { html, text } = buildVerificationEmail(verifyUrl);
  return sendEmail({
    to,
    subject: "Confirm your Parenfy email address",
    html,
    text,
    from: getVerificationFromAddress(),
    kind: "verification",
  });
}
