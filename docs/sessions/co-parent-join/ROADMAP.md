# co-parent-join — ROADMAP

> Mirrors Lovable. CC works chunk-by-chunk, diff after each, Adi approves before the next.

## Phase 1 — Backend RPC + family-wide premium

**Scope:**
- Port `switch_user_family(p_new_family_code text) → jsonb` from Lovable (`20260127160241_*.sql`) via `apply_migration`. Return machine error codes (not Hebrew literals). Confirm orphan-cleanup vs FK cascade for mobile tables.
- `useSubscription.ts`: replace child-only `childInheritedAccess` with a family-wide `familyHasEntitlement` so parents inherit too.

**Stop condition:**
- RPC: valid code → `{success:true,new_family_id}`; bad code → `code_not_found`; same family → `already_member`; no auth → `not_authenticated`. Profile's `family_id` updated, **role unchanged**. Old empty family + its family-scoped rows removed; non-empty old family left intact.
- `useSubscription`: existing child-inherits path still green; a non-purchasing second parent in a premium family reads `isSubscribed = true`.
- typecheck + Jest green.

## Phase 2 — Join UI in settings + i18n

**Scope:**
- Port `JoinFamilySection` → RN `JoinFamilyCard`, render in `ParentSettingsScreen` (near Family section / above Danger Zone).
- Port `joinFamily.*` strings (en + he) from Lovable.
- Family-code hint copy that it invites a partner.

**Stop condition:**
- On Expo web / emulator: a logged-in parent enters a seeded family's code → joins it → sees that family's children; their old empty family is gone.
- Invalid / not-found / already-member → friendly i18n errors, no crash.
- Strings present in en + he; no RTL break (cf. bell-rtl learnings).
- typecheck + Jest green; Values Check re-confirmed against implemented behavior.

## Exit (after Phase 2)

- `STATUS.md` complete; canonical docs per `SPEC_SYNC.md`.
- `INTEGRATION_LEARNINGS.md`: multi-parent ported from Lovable; RLS was already family-scoped; switch-model preserves role (no escalation); orphan-cleanup approach chosen.
- `docs/RELEASE_QUEUE.md` Queued row (release-tracking-in-files).
- PR opened; Hat-4 (real second Google account) handed to Adi.
- **Lovable Publish reminder:** N/A — this package changes the **mobile** repo only, not buffadhd.com. (The feature already lives in Lovable.)
