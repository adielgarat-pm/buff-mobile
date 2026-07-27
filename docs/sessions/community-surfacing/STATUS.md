# `pkg/community-surfacing` — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| 0 — Recon | ✅ done | 2026-07-27 | — | — | Three draft assumptions corrected (see SPEC § "Corrections found in Phase 0"): install-CTA telemetry is web-only → use `logOnboardingEvent`; guides are bilingual → 8 insertion points; add-child discriminator already available pre-save. `onboarding_events.event_type` verified against prod as **unconstrained** → no migration. |
| 1 — `openExternalUrl` platform helper | ✅ done | 2026-07-27 | see PR | tsc 0 · 15/15 new | `src/platform/openExternalUrl.ts` + `.web.ts`, exported from `src/platform`. Web opens synchronously inside the click handler (RN-Web `Linking.openURL` loses user-activation and gets popup-blocked — the bug already recorded on the Play CTA). |
| 2 — Surface A + B | ✅ done | 2026-07-27 | see PR | tsc 0 · jest green | Settings → About → "קהילת BUFF" / "BUFF Community" row (above Philosophy), and the community block on the Philosophy screen — the four `philosophy.community.*` keys' original home, rendered for the first time. |
| 3 — Surface C | ✅ done | 2026-07-27 | see PR | tsc 0 · jest green | UStep8 quiet text link, below the CTA, one-shot per device (`buff.communityInviteSeen`), suppressed on the add-child path. |
| 4 — Surface D | ✅ done | 2026-07-27 | see PR | verified in browser | 8 blocks across 4 guides; EN sections → EN group, HE sections → HE group. Rendered at 1280 and 375 px, both languages, no console errors, no horizontal overflow, 169×48 tap target. |
| 5 — Exit deliverables | ✅ done | 2026-07-27 | see PR | — | SPEC corrections, this file, RELEASE_QUEUE row, INTEGRATION_LEARNINGS IN-2026-07-27-01. |

## Gate 1 (local)

- `npx tsc --noEmit` → **0 errors**
- `npx jest` → **83 suites / 758 tests green** (a cold first run timed out 3 unrelated suites — LoginScreen, ManageChildren — at the default 5 s; green on re-run, and neither touches this package)
- `npm run check:no-raw-alert` → clean, 363 files
- i18n parity → **2197 / 2197** keys in both catalogs, no orphans either way
- New: `src/lib/__tests__/community.test.ts` → **15/15**

## Gate 2 — open (Hat-4, Adi)

The three in-app surfaces are behind auth, so a real-device pass is the only honest check:

1. Settings → About → **קהילת BUFF** → WhatsApp opens on the **Hebrew** group.
2. Switch app language to English → the same row opens the **English** group.
3. Settings → The BUFF Philosophy → scroll to the bottom → community card → same behavior.
4. **Add a child** from Settings → finish → the community line must **NOT** appear.
5. Fresh install → first-time onboarding → finish → the line appears **once**; return to that
   screen later (add-child) → it never appears again.

Web equivalent of 1–3 on `npm run web` (link opens in a new tab, not a blocked popup).

## Delivery

JS + static HTML only — no new dependency, no schema change, no native module.
**Android:** OTA-eligible on the vc68 runtime. **Web (app):** Vercel redeploy.
**Guides:** static assets under `landing-web/public/guides`, live on the landing deploy.
