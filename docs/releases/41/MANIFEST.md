# Release v1.4.3 (versionCode 41) — Manifest

**Cut date:** 2026-06-10
**Anchor:** build 40 commit `c30c9dc` (1.4.2, vc40 — finished AAB, not promoted)
**Branch:** `pkg/release-41` (off `origin/main` @ `07ba6d0`)
**Track:** internal / Alpha

## Why this build (vs the existing build 40)
Build 40 (1.4.2) finished but was cut **before** the denial-banner safe-area fix merged. This build = **build 40 content + the two commits merged on top**, so the banner fix actually ships.

## What's in this release (delta over build 40)

| # | Commit / PR | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) |
|---|---|---|---|---|---|
| 1 | `80782b4` (#215) | fix | **Denial-permission banner safe-area** — banner no longer collides with the Android nav bar; CTA + ✕ tappable | NotificationGate denial banner | Stage permission=denied (parent) → banner CTA + ✕ reachable above nav bar |
| 2 | `f6fbc14` (#211) | feat | **Kid shares a good mood with a parent** — non-low Vibe Check (≥3) offers "share this feeling?"; parent gets push (gated on "Alerts to me") + INFO bell row | Child Vibe Check → share step; Parent notification feed | Vibe ≥3 → share opt-in → parent bell row appears; opt-out → nothing |

> Inherited from build 40 (already EAS-validated there): #209 redemption discovery/talk-reset, #198 pause calendar-midnight, #199/#201 off-routine, #194 dev-toggle removal, notifications UI (Phase 4). Re-listed in `docs/releases/40/`.

## Gate 1 — Static (2026-06-10)
| Check | Result |
|---|---|
| tsc | ✅ 0 errors |
| jest | ✅ 358/358 (initial 3 timeout-flakes under parallel load; green isolated @ 20s timeout) |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing either locale |
| Values Check (#211) | ✅ see below |

**Values Check — #211 (kid vibe-share, feat):**
- P1 Intrinsic: ✅ sharing a good feeling is intrinsic/social, no reward attached; opt-in per vibe; "I want" not "I must".
- P2 Coaching: ✅ positive-only (mood ≥3), no comparison/failure; opt-out = nothing happens; no sad-BUDDY. ⚠️ copy still DRAFT — Pillar-2 wording gate is Adi/Itay (tracked).
- P3 Independence: ✅ practices emotional expression (real-world skill); kid initiates + chooses; scaffold that fades.

## Schema changes in this release?
- [x] **none new in this delta.** #211's migration `025_vibe_shared_notification` is **already live** on `gfrongfnyigxsexuofrg` (applied at merge). No migration ships in the AAB.

## Notable risk / watch-items
- ⚠️ **#211 copy is still marked DRAFT** (kid + push wording, Adi/Itay gate). Adi accepted it riding this build 2026-06-10 (it merged before the banner fix → can't be cleanly separated).
- ⚠️ **`push-notification-fanout` Edge Function**: #211's push path + the Phase-3b preference enforcement deploy **only when this build is promoted** (per RELEASE_QUEUE). The bell rows work without it; pushes stay silent until deploy.
- Banner fix is layout-only; the live bug remains on builds 39/40 until 41 is promoted.
