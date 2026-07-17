# STATUS — pkg/lifecycle-emails

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| DESIGN (SPEC + templates v2) | ✅ approved by Adi | 2026-07-17 | (this PR) | n/a | Templates = Gemini-refined hybrid; T3 subject conditional on completions>=5 |
| Phase 1 — idempotency index + unsubscribe fn | ✅ deployed | 2026-07-17 | (this PR) | Live rejection tests PASS (400 no-params / malformed / wrong-sig; 405 bad method; 0 rows mutated). Happy-path e2e deferred to Phase 3 dry-run (needs sender-generated sig). | Migration `lifecycle_email_idempotency` applied to prod; edge fn `email-unsubscribe` v1 ACTIVE (verify_jwt=false, HMAC auth) |
| Phase 0 — Resend account + DNS (Adi) | ⬜ pending Adi | | | | Blocks Phase 3 sends only |
| Phase 2 — OAuth consent ask (client) | ✅ code complete + web runtime-verified | 2026-07-17 | (this PR) | tsc clean; i18n guard tests 5/5; web E2E PASS: fresh signup → provider flipped to google (fixture) → prompt appeared on ParentDashboard with correct copy → "כן, אשמח" → DB shows marketing_consent=true + asked_at → reload → NOT asked again. Fixture fully cleaned from prod. Android runtime check = next build/OTA (same crossAlert code path) | `useMarketingConsentPrompt` in ParentTabs; asked-once in onboarding_data; never defaults to true |
| Phase 3 — sender fn + T2 dry-run | ⬜ not started | | | | Dry-run list to Adi before arming |
| Phase 4 — T1/T3/T4 + pg_cron | ⬜ not started | | | | |
