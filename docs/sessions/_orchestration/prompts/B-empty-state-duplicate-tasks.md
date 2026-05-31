# Session B — `fix/empty-state-duplicate-tasks`

> Open a fresh CC session and paste the block below. Covers IN-2026-05-29-08.
> No dependency on other sessions. Recommended to run first (data-integrity bug).

```
Branch: fix/empty-state-duplicate-tasks. Start in Plan Mode.

Bug (Adi, real): adding tasks for an EXISTING child via the parent Tasks-tab empty-state
CTA created DUPLICATE tasks/rewards for Itay (Emi unaffected), and the flow "didn't return
to the dashboard." Full code-level investigation is in docs/INTEGRATION_LEARNINGS.md
IN-2026-05-29-08 — read it first. Key proven finding: UStep5_Preview.saveAll inserts
task rows (~:225) and reward rows (~:252) UNCONDITIONALLY on every run, including the
existingChildId path — no "child already has tasks?" guard, and saveAll re-runs on remount
/ error-retry / null-childProfileId goNext. existingChildId threading is NOT the bug (it's
intact end-to-end).

Do:
1. Reproduce on the Android emulator: parent → Tasks tab → child with 0 tasks → "Set up
   tasks" → finish flow → observe (a) are tasks duplicated? (b) where does it land?
2. Add idempotency: on the existingChildId path, do NOT insert tasks/rewards the child
   already has — gate on a live count/dedupe, not just the tasks.length===0 entry condition.
3. Fix the return so it lands on the parent TASKS tab (existing-child goNext currently does
   navigation.navigate('ParentApp') → default tab; see UStep5_Preview.tsx:286 + RootNavigator
   modal group :171-180).
4. Data cleanup: via Supabase MCP (mobile DB gfrongfnyigxsexuofrg, no prod users), inspect
   tasks + store_rewards for Itay's profile, confirm the duplicate shape, and delete the
   extra set. Show Adi the before/after counts before deleting.

Note: this branch touches UStep5_Preview.tsx, which pkg/onboarding-starter-tasks (PR #120)
also changed. If #120 merges first, rebase and keep both changes (idempotency + timeOfDay).

Verify: emulator repro now clean; tsc/jest green. Branch + PR, no direct main.
```
