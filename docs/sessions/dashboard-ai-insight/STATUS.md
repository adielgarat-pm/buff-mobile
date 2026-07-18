# dashboard-ai-insight — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | APPROVED (one package, run all) | 2026-07-14 | 2f40d55 | — | Adi: votes on dashboard v1; no hard expiry + "as of" stamp; Gemini switch folded in as Phase 0 |
| 0 — Gemini + computed_at | DONE (deployed) | 2026-07-14 | 2f40d55 | typecheck ✅ | Edge fn v15 live: Gemini primary + Anthropic fallback (active until Adi sets `GEMINI_API_KEY` secret); migration 042 applied to prod via MCP |
| 1 — Dashboard AI card | DONE + VERIFIED | 2026-07-14 | 2f40d55 | typecheck ✅ · jest 28/28 ✅ · web bundle ✅ · Android emulator ✅ | See verification below |

## Verification (2026-07-14)

**Android (emulator, Hat-3):**
- AI coach card renders on Parent Dashboard: Hebrew headline/message/action, `🧠 Insights · Itay` tag, trial ribbon, **"As of Jun 25" stamp** (computed_at flows through the extended RPC end-to-end).
- 👍 vote tapped on the dashboard card → row written to `smart_insight_feedback` (explicit_vote=1, window_end=2026-07-14) — **the first insight vote ever recorded**.
- Card tap → Insights screen opens; same insight + same "As of" stamp on the Smart Insight card.
- Auto-generate correctly did NOT fire for Itay (activeDays=1 < 2 gate) — old insight shown with its date, per the no-hard-expiry decision.
- No JS errors/crash in logcat.

**Web:**
- Bundle compiles clean from the branch (1758 modules), login screen renders, zero console errors.
- Authenticated dashboard on web needs Adi's manual check (CC cannot enter passwords) — Hat-4 item.

**Not yet exercised:** Gemini path itself (secret not set — Anthropic fallback confirmed live by design); dashboard CTA button (saved insight has no cta_type); auto-generate full flow (needs an entitled child with activeDays ≥ 2 and no current-week insight).

## Hat-4 (Adi)
1. Create Gemini API key (aistudio.google.com) → Supabase Dashboard → Edge Functions → Secrets → `GEMINI_API_KEY`. Next generation switches to Gemini automatically (check `generate-child-insights` logs for "Gemini" vs "Anthropic fallback").
2. Web check: log in at www.buffadhd.com after merge+deploy, confirm the dashboard AI card.
3. Merge PR.
