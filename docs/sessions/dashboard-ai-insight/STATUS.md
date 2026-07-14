# dashboard-ai-insight — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | APPROVED (one package, run all) | 2026-07-14 | — | — | Adi: votes on dashboard v1; no hard expiry + "as of" stamp; Gemini switch folded in as Phase 0 |
| 0 — Gemini + computed_at | DONE (deployed) | 2026-07-14 | (this branch) | typecheck ✅ | Edge fn v15 live: Gemini primary (needs `GEMINI_API_KEY` secret from Adi) + Anthropic fallback; migration applied to prod via MCP |
| 1 — Dashboard AI card | IN VERIFICATION | 2026-07-14 | (this branch) | typecheck ✅, jest 28/28 ✅, web bundle ✅ | Emulator + web verification in progress |
