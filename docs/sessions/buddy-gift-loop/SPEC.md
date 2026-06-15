# SPEC — pkg/buddy-gift-loop  *(DRAFT — Plan Mode, awaiting Adi approval)*

> **Goal:** close the BUDDY friendship loop so a level-up gift can actually be *opened and used*, and so the climb continues past L3 to L4/L5. Today the gift is granted but inert — 4 kids hold a `has_pending_gift` they cannot open.

**Status:** ✅ **BUILT + VERIFIED (2026-06-15)** on `pkg/buddy-gift-loop`. Decisions: gift effects = cosmetic-only, scope = both phases. Backend live on mobile DB; tsc clean; jest 402/402. Hat-3 (emulator) + Adi merge pending.
**Branch (proposed):** `pkg/buddy-gift-loop`
**Author:** CC (architect role for backend per `feedback_cc_is_architect`)
**Date:** 2026-06-15

---

## 1. Verified current state (DB live + code, 2026-06-15)

| Layer | Truth |
|---|---|
| EOD function `compute_buddy_eod_for_child` (live, post-#235) | success = `tasks_completed >= LEAST(3, assigned)`. Grants at **L2 only (3 days → `theme_color`)** and **L3 (10 days → `double_buffs`)**. Sets `has_pending_gift=true` + inserts a `buddy_gifts_history` row. **No L4/L5.** |
| Tables | `buddy_relationships`, `buddy_gifts_history` (append-only), `buddy_daily_check`. RLS = authenticated SELECT only; all writes via `SECURITY DEFINER` functions. |
| Gift **grant** | ✅ works — rows exist, `has_pending_gift` flips true. |
| Gift **use** | ❌ does not exist. `handleBoosterPress` shows a hardcoded `Alert` ("coming soon"), ignores which gift was tapped. `is_used`/`used_at` never written; `has_pending_gift` never cleared. |
| Gift **effect** | ❌ none of the 6 `gift_type`s does anything. `gift_value` is null on grant. |
| UI | `BoostersCarousel` already renders Available / Used / Locked states + L4/L5 locked placeholders (`skip_token`@4, `reward_discount`@5). 5A + 5B both feed it via `useChildBuddyGifts`. No "you have a gift!" badge anywhere yet. |
| Live distribution | L1=101, L2=5 (max 6 days), L3=0. 4 pending gifts unredeemed. |

---

## 2. Gap → scope

Two independent gaps. Proposed to ship together (small, same surface):

### Phase A — Extend the climb + cosmetic re-map (backend-only, low risk)
Update the live EOD function (one idempotent `CREATE OR REPLACE FUNCTION`, via `apply_migration`):
- Add 30 successful days → **L4**, and 100 → **L5**.
- **Re-map every level's gift to `theme_color`** (cosmetic, per the locked decision). The per-level color is deterministic (palette map in §3) — `gift_value` stays null on grant; the use-RPC derives the color from `given_at_level`, so **no backfill of existing rows** is needed.
  - L2 → `theme_color` (already this — keep)
  - L3 → `theme_color` (**was `double_buffs`** — zero blast radius: L3=0 kids today)
  - L4 → `theme_color` (new)
  - L5 → `theme_color` (new)

No schema change, no data migration (the 4 existing pending gifts are already L2 `theme_color`).

### Phase B — Close the use-loop (the real value)
1. **`use_buddy_gift(p_gift_id uuid)` RPC** (`SECURITY DEFINER`): validates the gift belongs to the caller's child profile, is unused → sets `is_used=true`, `used_at=now()`; clears `has_pending_gift` when no other unused gift remains; **applies the gift effect** (see §3). Returns the updated gift + relationship. Atomic.
2. **Client wiring:** `useChildBuddyGifts` gains `useGift(giftId)`; the carousel's Available tap opens a confirm/reveal sheet → calls the RPC → optimistic update + refetch → reveal animation. Replaces the stub `Alert` in both 5A + 5B.
3. **Pending-gift affordance:** a small lime "gift" dot on the BuddyHero (dashboard + 5A) when `has_pending_gift` — so the kid *knows* a gift is waiting. (Fixes the "inert" feel for the 4 current kids.)
4. **BuddyHero consumes `current_theme_color`** as its accent/glow when set — this is the visible payoff of opening a color gift (today it ignores the column).
5. **Carousel placeholders** (`LOCKED_PLACEHOLDERS` = `skip_token`@4 / `reward_discount`@5) re-mapped to `theme_color` so the locked L4/L5 cards match the cosmetic decision.
6. **Bugfix (drive-by):** `BoostersCarousel` "Used Day X" caption passes `given_at_level` as the day — wrong. Use `used_at` date (or drop the day).

---

## 3. Gift effect — LOCKED: cosmetic buddy-color unlock

**Decision (Adi, 2026-06-15): cosmetic-only.** v1 effect = **unlock a new buddy theme color**, escalating per level. Chosen as the *single* cosmetic effect because it's fully served by an existing column (`buddy_relationships.current_theme_color`) with **zero new infrastructure** — unlike `skin` (device-local AsyncStorage today, no cross-device inventory — see IN-2026-06-08-01) and `mood_pack` (no sticker system exists). Those two cosmetics, plus the three economy gifts (`double_buffs`/`skip_token`/`reward_discount`), are **deferred** (§8).

**Deterministic palette (in the use-RPC; on-brand violet/lime family, NOT the legacy cyan/navy gamer tokens per IN-2026-06-14-01):**

| Level | `current_theme_color` set on use | Feel |
|---|---|---|
| L2 | `#A8E63E` (lime) | the day-0 brand accent |
| L3 | `#7C5CFF` (violet) | deeper friendship |
| L4 | `#FF9F45` (amber) | warm/established |
| L5 | `#FFD23E` (gold) | best-friends |

The use-RPC sets `current_theme_color = palette[given_at_level]`. `gift_value` may stay null. **BuddyHero must consume `current_theme_color`** as its accent/glow when set (today it ignores it — wiring work in Phase B). This is the visible "effect" the kid sees the moment they open the gift.

Microcopy stays in the body-double register (`feedback_kid_microcopy_pillar1`) — a friend giving you a color, never "you earned X".

---

## 4. Microcopy / Values framing (Pillar 1)

A gift = a relationship token from BUDDY, never a slot-machine payout. Reveal copy follows the body-double register (no "reward", "BUFFs", "count", "level up!"). Draft direction (Adi/Itay to redline at content gate):
- Reveal: "STORMY wanted to give you something." / "סטורמי רצה לתת לך משהו."
- Confirm-use: "Open it?" / "לפתוח?"
All final strings via `t()` + en/he parity (the `i18nNoHardcodedCopy` guard already enforces this).

---

## 5. Values Check (to be answered in full at design-finalize, verified in tests at exit)
- **Pillar 1 (Intrinsic):** gift framed as friendship, cosmetic-only in v1 → no extrinsic-reward inflation. ✅ (pending copy redline)
- **Pillar 2 (Positive coaching):** no punishment for *not* using; gift never expires. ✅
- **Pillar 3 (Independence):** the kid chooses if/when to open; nothing auto-applies. ✅

## 6. Test plan (exit gate)
- Unit: `use_buddy_gift` — happy path, double-use rejected, wrong-child rejected, `has_pending_gift` clears only when last unused gift used.
- Jest: carousel tap → RPC call → optimistic used-state; pending-gift badge shows/hides.
- Hat-3 (emulator): force a pending gift on a test child → open it → effect visible (theme color changes) → badge clears → re-open rejected.
- i18n parity guard green.

## 7. Exit deliverables (per CLAUDE.md)
- `SPEC_SYNC.md` rows; `STATUS.md` row; `INTEGRATION_LEARNINGS.md` if surprised.
- Propose (not edit) `BUFF_GAP_ANALYSIS.md` flip for the gift loop; propose `BUFF_DECISIONS_LOG.md` entry for the v1-cosmetic-only decision.
- `RELEASE_QUEUE.md` row at merge.

## 8. Out of scope (explicit)
- **Economy-touching gift effects** (`double_buffs` / `reward_discount` / `skip_token`) — deferred to post-credit-ledger (`project_buff_credit_fragility`).
- **Other cosmetic effects** (`skin` unlock, `mood_pack`) — deferred: `skin` needs a cross-device inventory model (today device-local AsyncStorage, IN-2026-06-08-01); `mood_pack` needs a sticker system that doesn't exist. v1 is theme-color only.
- Realtime level-up toast (overnight EOD bump) — separate package.
- PNG buddy assets / Buddy Story copy redline — separate tracks.
