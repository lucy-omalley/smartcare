type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  sent: boolean;
  devMode?: boolean;
  error?: string;
};

/** Send transactional email via Resend HTTP API (no extra npm package). */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Parenfy <hello@parenfy.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] RESEND_API_KEY not set — skipping send:", params.subject, "→", params.to);
      return { sent: false, devMode: true };
    }
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
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] Resend error:", response.status, body);
      return { sent: false, error: "Failed to send email" };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] Send failed:", error);
    return { sent: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendEmailResult> {
  const subject = "Reset your Parenfy password";
  const text = `Reset your Parenfy password\n\nClick this link to choose a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n— Parenfy`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h1>
      <p style="color: #444; line-height: 1.5;">We received a request to reset your Parenfy password. Click the button below — this link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; display: inline-block;">Reset password</a>
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">If you did not request this, you can safely ignore this email.</p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">Parenfy — Your AI Parenting Companion</p>
    </div>
  `.trim();

  return sendEmail({ to, subject, html, text });
}
