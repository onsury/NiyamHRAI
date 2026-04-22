# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (note: port 9002, not 3000; uses Turbopack)
npm run dev

# Genkit dev UI (for Gemini flows in src/ai/flows/)
npm run genkit:dev
npm run genkit:watch

# Type check (strict). There is no separate test runner.
npx tsc --noEmit        # or: npm run typecheck

# Lint / build
npm run lint
npm run build           # sets NODE_ENV=production

# Install — postinstall scripts can hit blocked CDNs (ngrok dep), so prefer:
npm install --ignore-scripts

# Deploy Firestore rules / indexes (App Hosting auto-deploys Next.js from main)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Rotate a runtime secret
firebase apphosting:secrets:set CLAUDE_API_KEY
```

End-to-end manual test plan is in `TESTING.md` (covers the full founder → invite → check-in → ratings → variance-alert flow). There is no automated test suite.

## Architecture

**Product in one line.** NiyamAI maps a founder's decision-making style into a 67-trait neural signature, then measures how closely each employee tracks against that signature over time. The USP is the **three-way variance alert**: when the AI synergy score, the HR rating, and the manager rating disagree by more than 25 points, the Org Neural Insights page surfaces it. Keep this in mind — single-score changes are not the load-bearing signal, *disagreement* is.

**Stack.** Next.js 15 App Router + React 19 + TypeScript, Tailwind + shadcn/ui (Radix primitives under `src/components/ui/`), Firebase (Auth, Firestore, App Hosting), two AI vendors (Claude via direct `fetch`, Gemini via Genkit).

### Two-tier Firebase pattern

- **Client SDK** (`src/lib/firebase.ts`, `src/lib/firestore-service.ts`): used inside `'use client'` React pages. Every read/write is subject to `firestore.rules`.
- **Admin SDK** (`src/lib/firebase-admin.ts`): used inside `src/app/api/**/route.ts`. Bypasses rules. Always verifies the caller's ID token (`adminAuth.verifyIdToken(...)`) and re-checks authorization against the `users/{uid}` doc before writing. Use the Admin SDK whenever an operation needs privileges the caller's own rules forbid (e.g. writing someone else's `managerRating`, creating an `invites/{token}` doc, appending to `ratingHistory`).
- On App Hosting the Admin SDK uses Application Default Credentials automatically. Locally it falls back to `FIREBASE_SERVICE_ACCOUNT` (a JSON service-account string) if set.

### Multi-tenancy

All tenancy flows through `organizationId` on the user doc. Helpers in `firestore.rules` (`isAdminOfOrg`, `isManagerOf`, `belongsToOrg`) enforce it; any server route that touches another user **must** compare `caller.organizationId === target.organizationId` before writing (`src/app/api/ratings/route.ts` is the canonical example).

### Data model invariants

Documented fully in `src/lib/data-models.ts` (comment-only file; the schema lives in rules + runtime writes, not types). Key rules:

- `users/{uid}/dnaHistory`, `/checkIns`, `/honingSessions`, `/reports`, `/ratingHistory` are **immutable** — `update`/`delete` are denied by rules. Never add a "correct last entry" path; write a new entry.
- `role` and `organizationId` on `users/{uid}` cannot be changed by the user themselves (rule-level guard against privilege escalation).
- `organizations/{orgId}/orgAnalytics/{id}` is **server-only write** (client writes are denied).
- The organization doc ID equals the founder's UID (`setDoc(doc(db,'organizations',uid), ...)` in `auth-context.tsx`).

### Signup and roles

Four roles: `FOUNDER`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`. Only **FOUNDER** can self-signup (creates a new org). Everyone else is **invite-only**:

1. Admin calls `/api/invite/create` → server writes `invites/{token}` via Admin SDK, returns a signed URL with 7-day expiry.
2. Invitee hits `/login?invite=<token>` → client creates Firebase Auth account → calls `/api/invite/accept` with the ID token.
3. Server validates token, confirms the invitee's verified email matches `invite.email`, writes the `users/{uid}` profile with role/level/managerId copied from the invite, and marks the invite used.

Email verification is **required** before access (`src/app/dashboard/layout.tsx` redirects to `/verify-email` otherwise). The dashboard layout also redirects non-onboarded users to `/setup/founder` or `/setup/employee` based on role.

### AI model routing

Two independent pipelines — do not conflate them:

- **Claude** (check-ins, mentorship, honing eval, reports): called directly via `fetch('https://api.anthropic.com/v1/messages', ...)` inside `src/app/api/{checkin,honing/evaluate,report,practices/*}/route.ts`. Model is usually `claude-haiku-4-5-20251001`. Every such route **must** implement a no-key fallback that returns a structured stub response — see `src/app/api/checkin/route.ts` for the pattern (fallback branch when `!CLAUDE_KEY`). This keeps the UI functional when the secret isn't wired up and is expected behaviour, not a bug.
- **Gemini via Genkit** (honing scenarios, HR insights, founder diagnostic, onboarding DNA mapping): flows live in `src/ai/flows/*.ts` and are wired up in `src/ai/dev.ts`. `src/ai/genkit.ts` reads `GEMINI_API_KEY` from env (and attempts `firebase-functions` config as a secondary source, though the app runs on App Hosting, not Functions).

When adding a new Claude-backed route, preserve the diagnostic logging pattern in `checkin/route.ts` (log key presence + length, HTTP status, response structure, and first 200 chars of Claude's text) — those logs are the first thing to check when the model appears to "return generic canned text" in production.

### Environment variables

Required at runtime:

```
CLAUDE_API_KEY            # secret, runtime-only
GEMINI_API_KEY            # secret, runtime-only
NEXT_PUBLIC_FIREBASE_*    # six public client config vars (set inline in apphosting.yaml)
FIREBASE_SERVICE_ACCOUNT  # optional, local-only Admin SDK fallback (JSON string)
```

Secrets live in Google Cloud Secret Manager and are referenced from `apphosting.yaml` with `availability: [RUNTIME]`. Never inline secret values there. After rotating a secret, access must be explicitly granted: `firebase apphosting:secrets:grantaccess <NAME> --backend studio`.

### Path alias

`@/*` → `./src/*` (see `tsconfig.json`). Always use `@/lib/...`, `@/components/...`, etc. over relative imports across directories.

### Styling

Tailwind + shadcn/ui (config in `components.json`, icons via `lucide-react`). Brand palette in `docs/blueprint.md`: navy `#1B2541` (primary), indigo `#6366F1` (accent), amber `#F59E0B` (CTA). Inter for body, Space Grotesk for headings. Cards use generous padding and `rounded-3xl`+.

## Known v1 limitations (from TESTING.md)

- No "reassign manager" UI — if an employee is invited before their manager accepts, you must delete the user doc + Auth user and re-invite.
- Org roll-ups are computed client-side on page load (not real-time). Acceptable through ~20 orgs.
- No bulk CSV invite, no SSO, no Razorpay billing yet.

## Deployment

- Firebase project: `studio-731784467-aba01`
- App Hosting auto-deploys on every push to `main`
- Production URL: `https://studio--studio-731784467-aba01.us-central1.hosted.app`
- Watch rollouts at Firebase console → App Hosting → `studio` backend
