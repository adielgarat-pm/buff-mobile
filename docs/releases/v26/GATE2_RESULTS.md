# V26 (v1.2.0, versionCode 28) — Gate 2 Functional Smoke

**Run:** 2026-06-04, emulator-5554, dev client (current `release/v26-aab` JS), Hat 3.
**Concurrent build:** caf7aab7 — finished ✅ before smoke completed.

## Verdicts

| # | Scenario | Verdict | Evidence / Note |
|---|---|---|---|
| 1 | App boots, V26 code live | ✅ | Parent dashboard renders with V26 surfaces: "Send Sticker", "View as Child", "+ Bonus" |
| 2 | **View-as-Child fix (#151)** | ✅ | Tapped View-as-Child → child Vibe Check → child dashboard showing Ben's **real data** (task "Get dressed and ready for school +10 BUFFs", stats, pet) + "Viewing as parent — Exit" banner. The headline bug (empty parent-id screens) is fixed. |
| 3 | Parent→child Sticker (#149) | 🤔 | "Send Sticker" button present on dashboard; full send→reveal not exercised (see blocker). |
| 4 | Bonus modal | ✅ | Opened, shows ⚡10/20/50/100 + note field + Send Bonus (incidental pass). |
| 5 | Parent edit/delete task (#154) | ⚠️ blocked | Tasks tab repeatedly interrupted by dev-mode RevenueCat LogBox (see below). Not exercised on emulator. |
| 6 | Child credit-once (#4) | ⚠️ blocked | Same dev/emulator limitation. |
| 7 | Subscription gates (#148) / rewards-shop ungate (#147) | ⚠️ blocked | Requires working RevenueCat billing — unavailable on emulator. |

## Blocker classification — NOT a release blocker

The emulator has **no Google Play Billing** → RevenueCat throws `BILLING_UNAVAILABLE` on every subscription check. In the **dev client**, each `console.error` opens a LogBox overlay, which loops on parent screens and blocks interaction.

- This is a **dev-build + emulator artifact only.** In the **production AAB** LogBox is disabled and never shows. On a **real device** Play Billing works and RevenueCat resolves normally.
- It is **not** a V26 regression and **not** present in the artifact being shipped.

## Outcome

- **No beta-blocker found.** The one V26 fix fully exercisable on emulator (#151 View-as-Child — the highest-risk, user-facing one) **PASSED**.
- Items 5–7 move to the **Hat-4 real-device checklist** (where billing + production build make them testable). Already listed in HAT4_CHECKLIST.md.
- Gate 1 (tsc/jest/expo-doctor/i18n) fully green; build finished. **Safe to take the AAB to Play Console internal track for Hat-4 verification.**
