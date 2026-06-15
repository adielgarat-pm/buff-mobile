# STATUS — pkg/buddy-gift-loop

| Date | State | Commit | Tests / Verification | Learnings |
|------|-------|--------|----------------------|-----------|
| 2026-06-15 | Built + verified; PR pending. Backend migration **applied live** to mobile project (`gfrongfnyigxsexuofrg`). | _(this commit)_ | `tsc --noEmit` ✅ 0 errors · jest **402/402** (39 suites) · live-DB probe: `use_buddy_gift('000…')` → `not_authenticated` (auth branch + callable confirmed) · no schema change, no data migration | success-count fix (#235) already shifted EOD off 70%; the docs phase-1 migration file was stale — rebuilt the function from the **live** definition. |

## What shipped
**Goal: close the BUDDY friendship loop — a level-up gift can now be opened and used, and the climb continues to L4/L5.**

### Backend (live on mobile DB, migration `buddy_gift_loop`)
- `compute_buddy_eod_for_child`: added **L4 (30 days)** + **L5 (100 days)**; every level-up gift is now the cosmetic `theme_color` (L3 was `double_buffs` — zero blast radius, L3=0 kids today).
- `use_buddy_gift(p_gift_id)` RPC (`SECURITY DEFINER`, granted to `authenticated`): validates family ownership (parent View-as-Child **or** own-device child), marks the gift used, sets `current_theme_color` from a deterministic per-level palette, clears `has_pending_gift` when no unused gift remains.

### Client (`pkg/buddy-gift-loop`)
- `useChildBuddyGifts.useGift()` — RPC mutator.
- `useBuddyGiftReveal` — shared confirm→reveal orchestration (5A + 5B).
- `BuddyGiftModal` — two-phase reveal (body-double copy, no metrics talk).
- `BuddyHero` — consumes `current_theme_color` (frame tint) + shows a lime gift dot when `has_pending_gift`.
- `BoostersCarousel` — locked L4/L5 placeholders re-mapped to cosmetic; fixed the wrong "Used Day X" caption → "Opened".
- `GamerMeAndBuddyScreen` (5A) + `GamerMyStatsScreen` (5B) + `GamerDashboardScreen` wired; the hardcoded "coming soon" Alert removed.
- `BUDDY_GIFT_LEVEL_COLOR` palette in `types/buddy.ts` (mirrors the SQL — keep in sync).
- i18n: `buddy.gift.*` + `buddy.boosters.used` (en + he parity).
- Tests: `useBuddyGiftReveal` (6), `useChildBuddyGifts.useGift` (3), updated screen + carousel tests.

## Open follow-ups (Adi)
- **Hat-3 on emulator** — force a pending gift on a test child → open → frame tints + dot clears → re-open rejected.
- **Content redline** — `buddy.gift.*` Hebrew/English copy (body-double register; draft shipped).
- **Propose** `BUFF_GAP_ANALYSIS.md` flip (gift loop ✅) + `BUFF_DECISIONS_LOG.md` entry (v1 = cosmetic-only gifts).
- **RELEASE_QUEUE.md** row to add at merge to main.
- Deferred (SPEC §8): economy gifts (need credit ledger), `skin`/`mood_pack` cosmetics (need inventory infra), realtime level-up toast.
