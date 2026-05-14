// patch-resend-integration.js
// Integrates Resend transactional email into the invite-create flow.
//
// Creates:  src/lib/email.ts
// Patches:  src/app/api/invite/create/route.ts
//           src/app/dashboard/team/page.tsx
//           apphosting.yaml
// Backups:  *.before-resend-integration  (auto-ignored by your *.before-* gitignore rule)
//
// Run from D:\projects\NiyamHRAI:
//   node patch-resend-integration.js

const fs = require('fs');
const path = require('path');

const BACKUP = '.before-resend-integration';

function backup(file) {
  if (!fs.existsSync(file)) return;
  const bak = file + BACKUP;
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

function fail(msg) {
  console.error('X ' + msg);
  process.exit(1);
}

function readNormalized(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

console.log('=== Resend email integration patch ===\n');

// ============================================================
// 1. Create src/lib/email.ts
// ============================================================
console.log('1. Creating src/lib/email.ts');
const EMAIL_LIB = path.join('src', 'lib', 'email.ts');
const EMAIL_LIB_CONTENT = `// Resend transactional email helper.
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
  const subject = \`You've been invited to join \${args.orgName} on NiyamHR\`;

  const html = \`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>\${subject}</title></head>
<body style="margin:0;padding:0;background:#f8f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:32px 40px 0;">
      <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:12px;color:#ffffff;font-weight:900;font-size:20px;text-align:center;line-height:48px;">N</div>
      <p style="color:#d97706;font-size:10px;font-weight:700;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Neural Cloud</p>
    </div>
    <div style="padding:24px 40px 32px;">
      <h1 style="color:#0f172a;font-size:24px;font-weight:900;margin:0 0 16px;line-height:1.2;">You're invited to join \${args.orgName}</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>\${args.invitedByName}</strong> has invited you to join <strong>\${args.orgName}</strong> on NiyamHR as a <strong>\${roleLabel}</strong> (\${args.level}).
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 32px;">
        NiyamHR is an AI-powered employee development platform that maps your professional DNA to the founder's vision and helps you grow in ways aligned with your team's culture.
      </p>
      <a href="\${args.inviteUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.5px;">Accept invitation</a>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:24px 0 0;">
        Or copy this link into your browser:<br>
        <span style="color:#475569;word-break:break-all;">\${args.inviteUrl}</span>
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
</html>\`;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [args.to], subject, html }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      return { ok: false, error: \`Resend \${res.status}: \${errBody}\` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
`;

if (!fs.existsSync('src/lib')) fail('src/lib does not exist - are you in the project root?');
backup(EMAIL_LIB);
fs.writeFileSync(EMAIL_LIB, EMAIL_LIB_CONTENT, 'utf8');
console.log('   OK ' + EMAIL_LIB);

// ============================================================
// 2. Patch src/app/api/invite/create/route.ts
// ============================================================
console.log('\n2. Patching invite-create API route');
const ROUTE = path.join('src', 'app', 'api', 'invite', 'create', 'route.ts');
let routeContent = readNormalized(ROUTE);

if (routeContent.includes("from '@/lib/email'")) {
  console.log('   already patched, skipping');
} else {
  backup(ROUTE);

  routeContent = routeContent.replace(
    "import { randomBytes } from 'crypto';",
    "import { randomBytes } from 'crypto';\nimport { sendInviteEmail } from '@/lib/email';"
  );

  const oldReturn = "    return NextResponse.json({ token, url, expiresAt, orgName });";
  if (!routeContent.includes(oldReturn)) {
    fail('Could not find expected return statement in route.ts');
  }

  const newBlock = `    // Send invite email (non-blocking - log failure but always return success)
    const emailResult = await sendInviteEmail({
      to: String(email).toLowerCase().trim(),
      orgName,
      invitedByName: user.displayName || user.email || 'Your team',
      role,
      level,
      inviteUrl: url,
    });
    if (!emailResult.ok) {
      console.warn('Invite email send failed:', emailResult.error);
    }

    return NextResponse.json({
      token,
      url,
      expiresAt,
      orgName,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
    });`;

  routeContent = routeContent.replace(oldReturn, newBlock);
  fs.writeFileSync(ROUTE, routeContent, 'utf8');
  console.log('   OK ' + ROUTE);
}

// ============================================================
// 3. Patch src/app/dashboard/team/page.tsx
// ============================================================
console.log('\n3. Patching team page UI');
const TEAM = path.join('src', 'app', 'dashboard', 'team', 'page.tsx');
let teamContent = readNormalized(TEAM);

if (teamContent.includes('lastInviteEmailSent')) {
  console.log('   already patched, skipping');
} else {
  backup(TEAM);

  // Add new state vars after lastInviteUrl
  const oldState = "  const [lastInviteUrl, setLastInviteUrl] = useState('');";
  if (!teamContent.includes(oldState)) fail('Could not find lastInviteUrl state in team page');
  teamContent = teamContent.replace(
    oldState,
    oldState + "\n  const [lastInviteEmailSent, setLastInviteEmailSent] = useState(false);\n  const [lastInviteEmail, setLastInviteEmail] = useState('');"
  );

  // Capture emailSent from response
  const oldCapture = "      setLastInviteUrl(data.url);\n      setInviteEmail('');";
  if (!teamContent.includes(oldCapture)) fail('Could not find setLastInviteUrl in team page');
  teamContent = teamContent.replace(
    oldCapture,
    "      setLastInviteUrl(data.url);\n      setLastInviteEmailSent(data.emailSent === true);\n      setLastInviteEmail(inviteEmail.trim());\n      setInviteEmail('');"
  );

  // Dynamic success message
  const oldMsg = '<p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Invite link ready</p>';
  if (!teamContent.includes(oldMsg)) fail('Could not find success message in team page');
  teamContent = teamContent.replace(
    oldMsg,
    '<p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">{lastInviteEmailSent ? `Email sent to ${lastInviteEmail}` : "Invite link ready (email not sent -- share manually)"}</p>'
  );

  fs.writeFileSync(TEAM, teamContent, 'utf8');
  console.log('   OK ' + TEAM);
}

// ============================================================
// 4. Patch apphosting.yaml
// ============================================================
console.log('\n4. Patching apphosting.yaml');
const YAML = 'apphosting.yaml';
let yamlContent = readNormalized(YAML);

if (yamlContent.includes('EMAIL_FROM')) {
  console.log('   EMAIL_FROM already configured, skipping');
} else {
  backup(YAML);

  const oldBlock = `  - variable: RESEND_API_KEY
    secret: RESEND_API_KEY`;

  const newBlock = `  - variable: RESEND_API_KEY
    secret: RESEND_API_KEY
    availability:
      - RUNTIME
  - variable: EMAIL_FROM
    value: NiyamHR <onboarding@resend.dev>
    availability:
      - RUNTIME`;

  if (!yamlContent.includes(oldBlock)) fail('Could not find RESEND_API_KEY block in apphosting.yaml');
  yamlContent = yamlContent.replace(oldBlock, newBlock);
  fs.writeFileSync(YAML, yamlContent, 'utf8');
  console.log('   OK ' + YAML);
}

console.log('\n=== Done ===');
console.log('\nFiles touched:');
console.log('  + src/lib/email.ts (new)');
console.log('  ~ src/app/api/invite/create/route.ts');
console.log('  ~ src/app/dashboard/team/page.tsx');
console.log('  ~ apphosting.yaml');
console.log('\nBackups: *' + BACKUP);
console.log('\nDeploy:');
console.log('  git add .');
console.log('  git commit -m "feat: resend email integration for invite flow"');
console.log('  git push');
console.log('\nThen wait ~5 min for Firebase deploy.');
