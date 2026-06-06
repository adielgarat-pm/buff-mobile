# co-parent-join — TESTS

> קריטריוני פאסה/פייל לכל פאזה. כל פאזה כוללת `[ ] Values check passed for this phase`.

## Phase 1 — Backend RPC + family-wide premium

**RPC (`join_family_as_parent`):**
- [ ] Valid code (existing family) → `{ found:true, family_id, family_name }`.
- [ ] Unknown code → `{ found:false, reason:'code_not_found' }`.
- [ ] Case-insensitive: lowercase input resolves the family.
- [ ] Unauthenticated caller → `{ found:false, reason:'not_authenticated' }`.
- [ ] Caller with no profile → a parent profile is INSERTed with the family's `family_id`.
- [ ] Caller with an existing profile → profile UPDATEd to the new `family_id`, `role='parent'`.
- [ ] No duplicate `app_settings` row created for the joined family.
- [ ] Orphaning guard: caller who already parents a family **with children** → rejected (`already_parent_with_children`), kids NOT stranded.

**Premium (`useSubscription`):**
- [ ] Regression: child on own device still inherits parent entitlement (existing behavior).
- [ ] Second parent (own DB flags false) in a family where the other parent is lifetime/founding → `isSubscribed = true`.
- [ ] Family with no entitlement → second parent still correctly sees `needsUpgrade` when childCount ≥ limit.

**Gates:**
- [ ] `npx tsc --noEmit` clean.
- [ ] Jest suite green.
- [ ] Values check passed for this phase.

## Phase 2 — Join-as-parent UI

- [ ] No-profile user: Parent → "Join existing family" → enter valid seeded code → lands in parent app scoped to that family; existing children visible.
- [ ] The joined parent can complete a parent action (e.g., open a child's tasks) — confirms RLS grants access.
- [ ] Invalid/short code → friendly i18n error, no crash.
- [ ] Code-not-found → friendly i18n error.
- [ ] Guard-rejected (already-parent-with-children) → friendly i18n message.
- [ ] "Create a new family" path → unchanged (new empty family created as before).
- [ ] Back navigation from code entry returns to the role/sub-choice cleanly.
- [ ] Strings present in both `en` and `he`.
- [ ] `npx tsc --noEmit` clean; Jest green.
- [ ] Values check passed for this phase (incl. re-read of Security Risk watch-item).

## Phase 3 — First-parent invite copy

- [ ] Invite card/settings copy communicates the code invites a partner + children.
- [ ] Renders correctly in `en` and `he`; no RTL overlap (cf. bell-rtl learnings).
- [ ] No regression to the child-invite affordance.
- [ ] Values check final pass.

## Hat-4 (Adi, real device — handed off, not blocking PR)

- [ ] A genuine second Google account joins a real family on a physical device and reaches the parent app.
- [ ] Both parents on two devices see the same live data (realtime via `useFamilyMembers`).
