# NiyamHRAI — End-to-end test plan

Run this after the patch is applied and deployed. You'll create one founder, one manager, one HR admin, and one employee, then exercise every new flow. Budget about 45 minutes.

## Prerequisites

- Patch applied (17 files written)
- `npx tsc --noEmit` passed locally
- `firebase deploy --only firestore:rules` succeeded
- `firebase deploy --only firestore:indexes` kicked off (indexes take 2-10 minutes to build in the background; you can proceed without waiting, but the invites list won't render until it's done)
- `git push origin main` done, App Hosting rollout shows SUCCESS
- You have **four** email addresses you can receive mail on (Gmail+aliases work: `youraddress+founder@gmail.com`, `+mgr@`, `+hr@`, `+emp@`)

## 1 — Clean slate

Before testing, optionally clear any existing test accounts:

1. Open https://console.firebase.google.com/project/studio-731784467-aba01/authentication/users
2. Delete the test users you no longer want (this also orphans their Firestore user docs — that's fine for a pilot reset)
3. Optionally: in Firestore console, delete any `users/` docs and the `organizations/` doc you want to reset

## 2 — Founder signup

1. Open production URL in an **incognito** window (keeps auth sessions isolated across roles)
2. Click **Start Free** → **Create Account**
3. Role: **FOUNDER**, organisation name: "Test Org", email: `you+founder@gmail.com`, password: 6+ chars
4. Verify the email via the link
5. Sign in → you should land on `/setup/founder`
6. Complete the 4-step founder DNA diagnostic (takes 2-3 min)
7. Land on `/dashboard` — header reads "FOUNDER · TOP", four stat cards all show **0** (except Team size which is **1**, you)

**✓ Pass criteria:** No console errors, dashboard stats show **real numbers**, not hardcoded `50`.

## 3 — Generate invites

Still signed in as the founder:

1. Sidebar → **Team Members**
2. You see the invite form + your own name in the current team list
3. Create three invites, one at a time:
   - `you+hr@gmail.com`, role: HR_ADMIN, level: SENIOR, Reports to: — None —
   - `you+mgr@gmail.com`, role: MANAGER, level: MIDDLE, Reports to: — None —
   - `you+emp@gmail.com`, role: EMPLOYEE, level: JUNIOR, Reports to: *your-name* (MANAGER not in list yet, so leave None for now — we'll reassign after the manager accepts)
4. Each time, after clicking **Generate invite link**, copy the URL shown in the green box
5. Check the **Invites** section below — should show all three as Pending

**✓ Pass criteria:** No errors, three URLs generated, Pending list visible. If the Pending list doesn't render and the console shows an index error, the indexes deploy hasn't finished — wait 5 more minutes and refresh.

## 4 — Accept invites (do each in a fresh incognito window)

### 4a — Accept as HR_ADMIN
1. Open a **new incognito window** (separate from founder's)
2. Paste the HR invite URL
3. You should see an amber banner: "Invited by *you+founder*" — "Join Test Org as HR ADMIN"
4. Email is pre-filled and read-only, role picker is hidden
5. Enter a password, click **Accept invite**
6. Verify the email, sign in → lands on `/setup/employee` (yes, HR admins also go through the employee-style DNA setup — that's by design)
7. Complete the 4-step DNA setup
8. Dashboard should now show the HR admin view (same as founder's)

### 4b — Accept as MANAGER
Repeat in another incognito window using the manager invite URL.

### 4c — Accept as EMPLOYEE
Repeat for the employee invite. They should have no manager yet (we'll assign one next).

**✓ Pass criteria:** Each invite signup succeeds, lands in the right role's dashboard view, sidebar links match the role (manager sees "My Team", employee does not).

## 5 — Assign the employee to the manager

Back in the **founder's window**:

1. Sidebar → **Team Members**
2. You should now see 4 people (you + 3 invitees)
3. For the employee, we need to set `managerId`. Currently there's no UI for reassignment post-invite (we rely on setting it at invite time). So delete this employee and re-invite with the manager selected:
   - In Firestore console, delete the employee's `users/{uid}` doc
   - Also delete the employee user in Firebase Auth console
   - Back in the Team page, invite `you+emp@gmail.com` again — this time the Manager dropdown now shows your manager account; select them
4. Re-accept the invite in the employee's incognito window (may need to sign out first)

**Note — known v1 limitation:** there's no "Reassign manager" UI yet. If you invite an employee before the manager accepts, you have to delete+re-invite. Fix for later: add an edit-manager action to the Team list row.

## 6 — Submit a check-in as the employee

In the employee's incognito window:

1. Sidebar → **Weekly Rhythm**
2. Paste a real reflection, 50+ words, reference something concrete
3. Submit
4. **Expected:** 2-3 paragraph personalised mentorship response that references your actual words; `synergyDelta` is NOT always `+2`; drift/strength tags reflect your content

**✓ Pass criteria:** If you get the generic "Thank you for your reflection… Focus on connecting your daily decisions…" every time — the `CLAUDE_API_KEY` isn't being read. Check `/dashboard/hr` via the founder window: does the employee now show a synergy score? If yes, Claude is working.

## 7 — Submit ratings

### 7a — HR rating (in HR admin's window)
1. Sidebar → **Team Members** (HR admin sees same page as founder)
2. On the employee row, click **Add HR rating**
3. Drag the slider to 75, add a note "Strong week", Save
4. Row should refresh and the HR column shows 75%

### 7b — Manager rating (in manager's window)
1. Sidebar → **My Team**
2. You should see the employee listed as a direct report with AI and HR scores
3. Click **Rate**, set 40, note "Missed deadline", Save
4. A red **Variance 35pt** badge should appear because |AI - Mgr| > 25

## 8 — Variance alert on Org Insights

Back in the **founder's window**:

1. Sidebar → **Org Neural Insights**
2. Below the 4 stat cards you should now see a **red "Three-way Variance Alert"** banner listing the employee and showing AI/HR/Mgr pills
3. Click "Team page →" to jump to the detailed view

**✓ Pass criteria:** This is the USP moment. If the variance alert doesn't render despite ratings being saved, inspect the browser console for Firestore permission errors.

## 9 — Performance Timeline

Still in founder's window:

1. Sidebar → **Performance Timeline**
2. Toggle through Daily / Weekly / Monthly / Quarterly / H1 / Yearly
3. You should see the line chart populate with at least one data point (from the employee's onboarding DNA snapshot and their check-in)
4. The **Check-in activity** bar chart should show 1 bar

If there's only one data point, the line chart will look empty — that's OK. Do 2-3 more check-ins with 1-day gaps over the following days to see the line take shape.

**✓ Pass criteria:** Page loads, no console errors, toggle works, at least one bar/dot visible.

## 10 — Email verification cleanup

Firebase sends verification emails from `noreply@studio-731784467-aba01.firebaseapp.com` by default. That looks unprofessional for client demos.

1. Go to https://console.firebase.google.com/project/studio-731784467-aba01/authentication/emails
2. Customise the email verification template: sender name ("NiyamAI") and body
3. Test by creating one more invitee and watching the email

This is cosmetic, not a blocker, but do it before any real pilot.

## 11 — Things to watch for

**If the Team page shows "No members yet" but you know there are members:**
- Check browser console for Firestore permission errors
- Verify `firebase deploy --only firestore:rules` ran successfully
- Verify the user doc for the signed-in user has the correct `organizationId`

**If the invite link validates but accept fails:**
- The Admin SDK needs to be properly authorized. On App Hosting this works automatically via ADC.
- Check Cloud Run logs for the failing request: https://console.cloud.google.com/run

**If ratings save but variance alert doesn't appear:**
- Refresh the Org Insights page (it's not real-time — fetches on mount)

**If AI response is always generic canned text:**
- `CLAUDE_API_KEY` isn't reaching the runtime. Verify `apphosting.yaml` has the `secret: CLAUDE_API_KEY` block with `availability: [RUNTIME]` and that `firebase apphosting:secrets:grantaccess CLAUDE_API_KEY --backend studio` was run.

## 12 — When you're ready for pilot

Once all 9 numbered tests pass:

1. Delete all test users and the Test Org in Firebase Auth + Firestore
2. Decide on custom domain (e.g. `app.niyamai.com` or `niyam.smartdna.in`)
3. Map the custom domain in App Hosting: Console → App Hosting → studio backend → Domains → Add custom domain → follow DNS verification steps (adds an A record or CNAME)
4. Update the invite URL logic — `/api/invite/create` uses `req.headers.get('origin')` which will automatically use the custom domain once it's primary
5. Customise the Firebase Auth email template
6. Set up three real pilot orgs: Jammi Ayurveda, K7 Computing, Music Temple

## Deferred (post-pilot)

- Scheduled Cloud Functions for background roll-ups (client-side aggregation is fine through first ~20 orgs)
- White-label settings UI (schema exists, admin UI doesn't)
- Razorpay billing integration (handle manually for first 10 paying clients)
- SSO for enterprise pilots (K7, CETEX)
- Reassign-manager UI on Team page
- Bulk invite (CSV upload)
