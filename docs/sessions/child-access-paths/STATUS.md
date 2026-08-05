# Child Access Paths — STATUS

| Phase / Chunk | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC v3 + adversarial review | done | 2026-08-04 | 325eccf, 6126fab | — | 3 reviewers (PM/CSM/Growth) + Gemini copy synthesis; all DGs closed by Adi. D-2026-08-04-01 logged (web = child-activation path). |
| Chunk 1 — foundation | done | 2026-08-04 | 607c2fb | tsc 0 · i18n ✓ | Additive migration (profiles.access_mode + day1_push_optout), AccessMode type + 5 funnel events, 16 onboarding.access.* strings (m/f). No behavior change. |
| Chunk 2 — ChildAccessStep screen | done · verified | 2026-08-05 | 3908825 | tsc 0 · no-raw-alert ✓ · **web-verified render** | 3 platform-ordered cards replace UStep7_Phone; 24h reminder removed; step7 strings pruned. |
| Chunk 3 — View-as-Child in-flow | done · verified | 2026-08-05 | bfb2b7a | tsc 0 · **web-verified E2E** | shared_device → UStep8 CTA "בואו נתחיל עם {child}" → reset+previewChildId → dashboard enters View-as-Child. No login screen, no stuck modal. |
| Chunk 3b — dashboard "moment" card | done · verified | 2026-08-05 | 67f9ddb | tsc 0 · **web-verified** | useChildrenDashboard selects access_mode; "🌱 הרגע של {child}" button on shared_device cards → re-enters View-as-Child. |
| Chunk 4 — www join E2E | verified: BROKEN | 2026-08-05 | — | Chrome | `buffadhd.com/join/CODE` redirects to parent UStep1, NOT child-join. Confirms #345 DG3 / DG2 fallback. home_device card correctly stays code-only; smart-link upgrade waits for #301. |
| Chunk 4 — day-1 local reminder | deferred | — | — | — | Native-only; needs a free emulator. Phase-2 scope. |
| Abandon re-entry card | deferred | — | — | — | Existing per-child View-as-Child button already prevents a dead-end. |

## Verification (2026-08-05, Chrome + real signup TEST3, child ZTest)
Full parent onboarding → ChildAccessStep. Verified: bidi-safe title with Latin name; 3 cards; web platform ordering (home_device first + emphasised); masculine gender branching; "send tonight" secondary; shared_device → View-as-Child landing (banner "Viewing as parent — ZParent", no login, no stuck modal); dashboard "moment" card renders for shared_device child and re-enters preview. Test data (ZTest child) cleaned from DB; TEST3 family kept.

## Environment note
node_modules in this checkout was empty → restored with `npm ci` (enables tsc + Metro). `LandingScreen` redirects logged-out web users to buffadhd.com — reach the local branch build via `localhost:19006/Login`.

## Open / next
- PR for Phase 1 (Chunks 1–3b).
- Chunk 4 (day-1 local reminder) after emulator frees up.
- #301 to wire `/join/:code` → child-join, then upgrade home_device card copy.
- Values Check: passed at direction; re-verify against implemented behavior at merge.
