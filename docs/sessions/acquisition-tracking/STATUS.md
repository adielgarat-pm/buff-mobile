# STATUS — acquisition-tracking

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| Review + SPEC correction | ✅ done | 2026-07-30 | _(this branch)_ | data-backed review vs live DB | plan `zesty-dreaming-whisper` |
| 1. Schema (families acquisition cols) | ✅ applied | 2026-07-30 | migration 052 | SQL: columns + authenticated INSERT grant verified | — |
| 2. Capture (web first-touch + both signup paths + native-organic) | ✅ code done | 2026-07-30 | _(this branch)_ | 12 jsdom unit tests pass; app typecheck clean | IN-2026-07-30-01 |
| 3. Admin surface (RPC + Source column/badge + signup-region) | ✅ code done | 2026-07-30 | migration 053 + admin-web | admin-web tsc clean | — |
| 4. Native-tagged install referrer | 🚩 DEFERRED | — | — | — | IN-2026-07-30-01 (needs #301 + new dep + Hat-3) |

## Verified
- `tsc --noEmit` clean on both the app and `admin-web`.
- 12/12 jsdom unit tests (`acquisitionCapture.test.ts`) — capture, first-touch-wins, referrer, organic fallback, clear, hostile-input cap, source normalization matrix.
- SQL: `families.acquisition_source/acquisition/acquisition_country` exist; `authenticated` has INSERT on all three; RPC `get_admin_tester_board` recreated (053) selecting the new fields.

## NOT yet verified (manual / Hat)
- 🚩 Real-browser signup e2e: complete a web signup from `?utm_source=fb&utm_campaign=test` and assert a `family_created` `onboarding_events` row + `families.acquisition_source='fb'` + country. (In-app preview browser can't reach localhost; a real signup writes prod.)
- 🚩 Native-organic on Android (Hat-3): fresh signup fires `family_created` with `platform='android'` + region, `acquisition_source='organic'`.

## Link-tagging (prerequisite for utm data — marketing action, mostly outside code)
Outbound links must carry `utm_source` for the web capture to have anything to read: win-back emails (`?utm_source=winback&utm_campaign=<date>`), guide CTAs (`?utm_source=guide`), FB posts (`?utm_source=fb`). Organic/country inference works with zero tags. The web→Play outbound tagger already exists as a model (`src/lib/installTarget.web.ts`).

## Success metric (post-launch)
`% of NEW families with non-null acquisition_source` — target ≥80% within 2 weeks. If it stays ~0, the capture is not firing (the exact failure mode that hid the dead `#345` plumbing).
