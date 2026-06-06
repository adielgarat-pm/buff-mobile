# co-parent-join — TESTS

> Pass/fail per phase. Each phase includes `[ ] Values check passed for this phase`.

## Phase 1 — RPC + family-wide premium

**RPC (`switch_user_family`):**
- [ ] Valid code → `{ success:true, new_family_id }`; caller's profile `family_id` updated.
- [ ] **Role preserved** — a parent remains `role='parent'` after the switch.
- [ ] Unknown code → `{ success:false, error:'code_not_found' }`.
- [ ] Same family as current → `{ success:false, error:'already_member' }`.
- [ ] Unauthenticated → `{ success:false, error:'not_authenticated' }`.
- [ ] Case/whitespace-insensitive: `' abc123 '` resolves `ABC123`.
- [ ] Old family had only the caller → old family + its family-scoped rows (app_settings, credit_vault, store_rewards, tasks, timetables, daily_progress, lesson_progress) deleted.
- [ ] Old family still has other members (e.g., a child) → old family **not** deleted.

**Premium (`useSubscription`):**
- [ ] Regression: child on own device still inherits parent entitlement.
- [ ] Second parent (own flags false) in a family where another parent is lifetime/founding → `isSubscribed = true`.
- [ ] Family with no entitlement → second parent still sees `needsUpgrade` when childCount ≥ limit.

**Gates:** [ ] `npx tsc --noEmit` clean · [ ] Jest green · [ ] Values check passed.

## Phase 2 — Join UI in settings

- [ ] Logged-in parent: Settings → Join Family → enter valid seeded code → success → now sees that family's children; old empty family gone.
- [ ] Joined parent can perform a parent action on a joined child (confirms RLS).
- [ ] Invalid/short code → friendly i18n error, no crash.
- [ ] code_not_found / already_member → friendly i18n errors.
- [ ] Strings present in `en` and `he`; no RTL overlap.
- [ ] Family-code hint communicates partner invite.
- [ ] [ ] `npx tsc --noEmit` clean · Jest green · Values check passed.

## Parity check (vs Lovable)

- [ ] Flow matches Lovable: code entry in settings → switch → reload into joined family.
- [ ] RPC logic matches `20260127160241_*.sql` (modulo error codes vs Hebrew literals).

## Hat-4 (Adi, real device — handed off, not blocking PR)

- [ ] A real second Google account joins a real family on a physical device and lands in the parent app scoped to that family.
- [ ] Both parents on two devices see the same live data (realtime via `useFamilyMembers`).
