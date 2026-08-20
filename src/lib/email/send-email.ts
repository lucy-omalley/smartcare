type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
};

export type SendEmailResult = {
  sent: boolean;
  devMode?: boolean;
  error?: string;
};

function emailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || "hello@parenfy.com";
}

function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "Parenfy <hello@parenfy.com>";
}

/** Send transactional email via Resend HTTP API (no extra npm package). */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = emailFrom();
  const replyTo = params.replyTo ?? emailReplyTo();

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
        reply_to: replyTo,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        tags: params.tags,
        headers: {
          "X-Entity-Ref-ID": params.to,
          ...params.headers,
        },
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

function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${text}</div>`;
}

function emailShell(body: string, preheaderText: string): string {
  return `
    ${preheader(preheaderText)}
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      ${body}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="color: #888; font-size: 12px; line-height: 1.5; margin: 0;">
        Parenfy · Your AI parenting companion<br />
        <a href="https://parenfy.com" style="color: #0f766e;">parenfy.com</a>
        · Reply to this email if you need help
      </p>
    </div>
  `.trim();
}

function spamTipBlock(): string {
  return `
    <p style="color: #666; font-size: 13px; line-height: 1.5; background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 24px;">
      Not in your inbox? Check spam or promotions, mark this as <strong>Not spam</strong>, and add
      <strong>${emailReplyTo()}</strong> to your contacts so future Parenfy emails arrive reliably.
    </p>
  `;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendEmailResult> {
  const subject = "Reset your Parenfy password";
  const text = `Reset your Parenfy password\n\nClick this link to choose a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n— Parenfy (${emailReplyTo()})`;
  const html = emailShell(
    `
      <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h1>
      <p style="color: #444; line-height: 1.6;">We received a request to reset your Parenfy password. Click the button below — this link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 600;">Reset password</a>
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">Or copy this link:<br /><a href="${resetUrl}" style="color: #0f766e; word-break: break-all;">${resetUrl}</a></p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">If you did not request this, you can safely ignore this email.</p>
    `,
    "Reset your Parenfy password — link expires in 1 hour."
  );

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: "category", value: "password-reset" }],
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string,
  firstName?: string | null
): Promise<SendEmailResult> {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const subject = "Verify your email for Parenfy";
  const text = `${greeting}\n\nThanks for joining Parenfy. Verify your email to finish signing up (link expires in 24 hours):\n${verifyUrl}\n\nAfter verifying, you'll set up your child's profile and unlock Today's Plan.\n\nIf you did not create an account, ignore this email.\n\n— Parenfy (${emailReplyTo()})`;
  const html = emailShell(
    `
      <h1 style="font-size: 20px; margin-bottom: 8px;">Verify your email</h1>
      <p style="color: #444; line-height: 1.6;">${greeting}</p>
      <p style="color: #444; line-height: 1.6;">Thanks for joining the Parenfy public beta. Confirm your email to unlock Today's Plan, Growth Journey, and Family Adventures.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 600;">Verify email</a>
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">Or copy this link into your browser:<br /><a href="${verifyUrl}" style="color: #0f766e; word-break: break-all;">${verifyUrl}</a></p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">This link expires in 24 hours. After verifying, complete your child profile to finish registration.</p>
      ${spamTipBlock()}
    `,
    "Verify your Parenfy email to finish signing up and unlock Today's Plan."
  );

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: "category", value: "email-verification" }],
  });
}

export async function sendEmailVerificationReminderEmail(
  to: string,
  verifyUrl: string,
  firstName?: string | null
): Promise<SendEmailResult> {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const subject = "Reminder: verify your Parenfy email to finish signup";
  const text = `${greeting}\n\nYou started signing up for Parenfy but haven't verified your email yet. One quick step unlocks the app for your family:\n${verifyUrl}\n\nAfter verifying, complete your child's profile to finish registration.\n\nIf you didn't sign up, you can ignore this email.\n\n— Parenfy (${emailReplyTo()})`;
  const html = emailShell(
    `
      <h1 style="font-size: 20px; margin-bottom: 8px;">Finish your Parenfy signup</h1>
      <p style="color: #444; line-height: 1.6;">${greeting}</p>
      <p style="color: #444; line-height: 1.6;">You created a Parenfy account but haven't verified your email yet. Tap below to confirm your address and complete registration — it takes about 30 seconds.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #0f766e; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 600;">Verify email &amp; continue</a>
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">Or copy this link:<br /><a href="${verifyUrl}" style="color: #0f766e; word-break: break-all;">${verifyUrl}</a></p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">Link expires in 24 hours. After verifying, you'll set up your child's profile and unlock Today's Plan.</p>
      ${spamTipBlock()}
    `,
    "Quick reminder — verify your email to finish Parenfy signup."
  );

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: "category", value: "verification-reminder" }],
  });
}
