# STATUS — pkg/lifecycle-emails

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| DESIGN (SPEC + templates v2) | ✅ approved by Adi | 2026-07-17 | (this PR) | n/a | Templates = Gemini-refined hybrid; T3 subject conditional on completions>=5 |
| Phase 1 — idempotency index + unsubscribe fn | ✅ deployed | 2026-07-17 | (this PR) | Live rejection tests PASS (400 no-params / malformed / wrong-sig; 405 bad method; 0 rows mutated). Happy-path e2e deferred to Phase 3 dry-run (needs sender-generated sig). | Migration `lifecycle_email_idempotency` applied to prod; edge fn `email-unsubscribe` v1 ACTIVE (verify_jwt=false, HMAC auth) |
| Phase 0 — Resend account + DNS (Adi) | ⬜ pending Adi | | | | Blocks Phase 3 sends only |
| Phase 2 — OAuth consent ask (client) | ⬜ not started | | | | Android+Web; needs build/OTA |
| Phase 3 — sender fn + T2 dry-run | ⬜ not started | | | | Dry-run list to Adi before arming |
| Phase 4 — T1/T3/T4 + pg_cron | ⬜ not started | | | | |
