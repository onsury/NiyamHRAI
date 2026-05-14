// Resend transactional email helper.
// Uses plain fetch() - no npm package required.

const RESEND_API_URL = 'https://api.resend.com/emails';

type InviteEmailArgs = {
  to: string;
  orgName: string;
  invitedByName: string;
  role: string;
  level: string;
  inviteUrl: string;
};

export async function sendInviteEmail(args: InviteEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.EMAIL_FROM || 'NiyamHR <onboarding@resend.dev>';
  const roleLabel = args.role.replace('_', ' ').toLowerCase();
  const subject = `You've been invited to join ${args.orgName} on NiyamHR`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f8f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:32px 40px 0;">
      <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:12px;color:#ffffff;font-weight:900;font-size:20px;text-align:center;line-height:48px;">N</div>
      <p style="color:#d97706;font-size:10px;font-weight:700;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Neural Cloud</p>
    </div>
    <div style="padding:24px 40px 32px;">
      <h1 style="color:#0f172a;font-size:24px;font-weight:900;margin:0 0 16px;line-height:1.2;">You're invited to join ${args.orgName}</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>${args.invitedByName}</strong> has invited you to join <strong>${args.orgName}</strong> on NiyamHR as a <strong>${roleLabel}</strong> (${args.level}).
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 32px;">
        NiyamHR is an AI-powered employee development platform that maps your professional DNA to the founder's vision and helps you grow in ways aligned with your team's culture.
      </p>
      <a href="${args.inviteUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.5px;">Accept invitation</a>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:24px 0 0;">
        Or copy this link into your browser:<br>
        <span style="color:#475569;word-break:break-all;">${args.inviteUrl}</span>
      </p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:24px 0 0;">
        This invitation expires in 7 days. If you weren't expecting this email, you can safely ignore it.
      </p>
    </div>
    <div style="padding:20px 40px;background:#f8f8fa;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">Sent by NiyamHR Neural Cloud . niyamhr.in</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [args.to], subject, html }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${errBody}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
