# co-parent-join — ROADMAP

> רצף פאזות עם תנאי עצירה. CC עובד chunk-by-chunk, diff אחרי כל chunk, אישור Adi לפני הבא.

## Phase 1 — Backend RPC + family-wide premium

**Scope:**
- Add `join_family_as_parent(p_family_code text) → jsonb` via `apply_migration` (SECURITY DEFINER, `search_path=public`), including the orphaning guard (per Open Questions default).
- Edit `useSubscription.ts`: replace `childInheritedAccess` with a family-wide `familyHasEntitlement` check so parents inherit too.

**Stop condition:**
- RPC returns `found:true` + correct `family_id` for a valid code; `code_not_found` for a bad code; guard rejects an already-parent-with-children caller.
- `useSubscription` regression: existing child-inherits-parent path still passes; a non-purchasing second parent in a premium family now reads `isSubscribed = true`.
- typecheck + Jest green.

## Phase 2 — Join-as-parent UI

**Scope:**
- `AuthCallbackScreen`: Parent tap → {Create new family / Join existing family}. "Join" reveals 6-char code entry (reuse `ChildJoinScreen` visual pattern). On submit → call RPC → `refreshProfile`.
- Error states: invalid code, code-not-found, guard-rejected — all i18n, all friendly.
- New i18n strings (en + he).

**Stop condition:**
- On Expo web / emulator: a no-profile user can pick Parent → Join existing → enter a valid seeded family code → lands in the parent app scoped to that family, seeing its existing children.
- "Create a new family" path unchanged (regression).
- typecheck + Jest green; Values Check re-confirmed against implemented behavior.

## Phase 3 — First-parent invite copy

**Scope:**
- Update the dashboard/settings invite card copy so the family code is understood to invite a **partner** as well as children. No new code generation, no new screen.
- i18n (en + he).

**Stop condition:**
- Copy renders correctly in both languages; no layout/RTL break (watch Hebrew RTL per bell-rtl learnings).
- Values Check final pass.

## Exit (after Phase 3)

- `STATUS.md` rows complete for all phases.
- Canonical docs updated per `SPEC_SYNC.md`.
- `INTEGRATION_LEARNINGS.md` entry (multi-parent now supported; security watch-item; empty-family-orphan note).
- Add row to `docs/RELEASE_QUEUE.md` (Queued) per release-tracking-in-files.
- PR opened; Hat-4 (real second Google account) handed to Adi.
- **Lovable reminder:** N/A unless buffadhd.com copy is touched (it is not in this package).
