type TransactionalEmailContent = {
  preheader: string;
  title: string;
  bodyHtml: string;
  actionLabel: string;
  actionUrl: string;
  footerNote: string;
  plainText: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML layout tuned for transactional deliverability (text fallback, preheader, plain link). */
export function buildTransactionalEmail(content: TransactionalEmailContent): {
  html: string;
  text: string;
} {
  const preheader = escapeHtml(content.preheader);
  const title = escapeHtml(content.title);
  const actionUrl = escapeHtml(content.actionUrl);
  const actionLabel = escapeHtml(content.actionLabel);
  const footerNote = escapeHtml(content.footerNote);
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || "hello@parenfy.com";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#0f766e;letter-spacing:0.04em;text-transform:uppercase;">Parenfy</p>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;color:#18181b;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-size:15px;line-height:1.6;color:#3f3f46;">
              ${content.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <a href="${actionUrl}" style="background:#0f766e;color:#ffffff;padding:12px 22px;border-radius:12px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;">${actionLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;font-size:13px;line-height:1.6;color:#71717a;word-break:break-all;">
              <p style="margin:0 0 8px;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="margin:0;"><a href="${actionUrl}" style="color:#0f766e;">${actionUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;line-height:1.5;color:#a1a1aa;border-top:1px solid #f4f4f5;">
              <p style="margin:16px 0 8px;">${footerNote}</p>
              <p style="margin:0;">Questions? Reply to this email or contact <a href="mailto:${escapeHtml(replyTo)}" style="color:#0f766e;">${escapeHtml(replyTo)}</a></p>
              <p style="margin:12px 0 0;">Parenfy · AI family companion</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: content.plainText };
}

export function buildVerificationEmail(verifyUrl: string) {
  return buildTransactionalEmail({
    preheader: "Confirm your email to start using Parenfy.",
    title: "Confirm your email address",
    bodyHtml: `<p style="margin:0 0 12px;">Thanks for joining the Parenfy public beta.</p>
<p style="margin:0;">Please confirm your email address to unlock Today's Plan, MumBot, and the rest of the app.</p>`,
    actionLabel: "Confirm email address",
    actionUrl: verifyUrl,
    footerNote: "This link expires in 24 hours. If you did not create a Parenfy account, you can ignore this email.",
    plainText: `Confirm your Parenfy email address

Thanks for joining the Parenfy public beta.

Open this link to confirm your email (expires in 24 hours):
${verifyUrl}

If you did not create an account, you can ignore this email.

— Parenfy
hello@parenfy.com`,
  });
}

export function buildPasswordResetEmail(resetUrl: string) {
  return buildTransactionalEmail({
    preheader: "Reset your Parenfy password — link expires in 1 hour.",
    title: "Reset your password",
    bodyHtml: `<p style="margin:0 0 12px;">We received a request to reset your Parenfy password.</p>
<p style="margin:0;">Click the button below to choose a new password. This link expires in 1 hour.</p>`,
    actionLabel: "Reset password",
    actionUrl: resetUrl,
    footerNote: "If you did not request a password reset, you can safely ignore this email.",
    plainText: `Reset your Parenfy password

Open this link to choose a new password (expires in 1 hour):
${resetUrl}

If you did not request this, you can ignore this email.

— Parenfy
hello@parenfy.com`,
  });
}
