# NiyamAI

**Your founder's vision. Every employee's compass.**

NiyamAI is a founder-aligned HR platform that maps the founder's thinking patterns into a 67-trait neural signature, then measures how closely each employee's decisions, reflections, and growth trajectory track against that signature over time. It is built for founder-led SMBs where cultural drift — not capability — is the real scaling risk.

The product layers three independent assessments of every employee:

- **AI synergy score** — a continuous, reflection-based signal computed by Claude from weekly check-ins, honing-lab exercises, and DNA snapshots
- **HR rating** — a periodic numeric assessment submitted by HR admins with notes
- **Manager rating** — a periodic numeric assessment submitted by the employee's direct manager

When the three disagree by more than 25 points, the Org Neural Insights page surfaces the variance and invites investigation. That three-way disagreement — not any single score in isolation — is the signal worth acting on.

## Architecture

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | Next.js API routes, Firebase Admin SDK (server), Genkit flows (Gemini) |
| Data | Firestore (multi-tenant by `organizationId`), immutable history collections |
| AI | Claude Haiku 4.5 (check-ins, mentorship, reports), Gemini 1.5 Pro (honing scenarios, HR insights) |
| Auth | Firebase Auth (email + password, email verification required) |
| Hosting | Firebase App Hosting (Cloud Run backend, auto-deploy from `main`) |
| Secrets | Google Cloud Secret Manager (`CLAUDE_API_KEY`, `GEMINI_API_KEY`) |
| Charts | Recharts |

## Roles

- **FOUNDER** — creates the organisation; root admin; can invite, assign, assess anyone
- **HR_ADMIN** — same admin powers as founder except cannot delete the organisation; can submit HR ratings
- **MANAGER** — reads their direct reports' DNA, check-ins, history; submits manager ratings for their reports
- **EMPLOYEE** — owns their own DNA, reflections, honing history; cannot see anyone else's

## Signup rules

- Founders: open signup with an organisation name (creates a new org)
- Everyone else: **invitation-only**. An admin generates a signed invite link via `/dashboard/team`. The invitee's email is locked to the link, which expires in 7 days.

## Collections

```
users/{uid}
├── role, level, organizationId, managerId
├── hrRating: { score, notes, updatedAt }
├── managerRating: { score, notes, updatedAt }
├── /employeeDNA/current     (mutable — current state)
├── /dnaHistory/{id}         (IMMUTABLE — time-series)
├── /checkIns/{id}           (IMMUTABLE)
├── /honingSessions/{id}     (IMMUTABLE)
├── /reports/{id}            (IMMUTABLE)
└── /ratingHistory/{id}      (IMMUTABLE — HR/Manager assessment audit)

organizations/{orgId}
├── /founderDNA/current
├── /competencyFramework/{id}
├── /orgAnalytics/{id}       (server-only write)
└── /settings/{id}

invites/{token}              (server-managed via Admin SDK)
```

## Local development

```bash
# Install (skip postinstall scripts that need blocked CDNs — ngrok is optional)
npm install --ignore-scripts

# Start dev server on :9002
npm run dev

# Start Genkit dev UI
npm run genkit:dev

# Type-check
npx tsc --noEmit
```

Environment variables in `.env`:

```
CLAUDE_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Deployment

App Hosting deploys on every push to `main`. Secrets are stored in Google Cloud Secret Manager and referenced from `apphosting.yaml` (never inline values).

```bash
# Rotate a secret
firebase apphosting:secrets:set CLAUDE_API_KEY

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Watch rollout
open https://console.firebase.google.com/project/$PROJECT/apphosting
```

## Project

- Firebase project: `studio-731784467-aba01`
- Production URL: `https://studio--studio-731784467-aba01.us-central1.hosted.app`
- Owner: SmartDNA Business Intelligence & Advisory

## License

Proprietary. All rights reserved.
