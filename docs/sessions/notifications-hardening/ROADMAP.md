# `pkg/notifications-hardening` — ROADMAP

Order is dependency-driven: server correctness first (cheap, testable via SQL/logs), client + device-only work last.

1. **Phase 1** — Edge Function: `child_suggestion` fix + push=action-required taxonomy. *(unblocks: nothing depends on it; ships value immediately)*
2. **Phase 2** — Crons: anchor split + `activation_nudge`. *(independent of Phase 1)*
3. **Phase 3** — Preferences schema + server-side preference enforcement. *(blocks Phase 4 client toggles)*
4. **Phase 4** — Client: denial-recovery + one-time two-toggle prompt + Settings screen. *(depends on Phase 3 schema)*
5. **Phase 5** — Age gate + shared-device routing. *(highest risk; needs Hat-4 real-device test)*
6. **Phase 6** — i18n + Values + grep gate + doc sync + close.

**Critical path to real-user value:** Phase 4 (permission model) — until it ships, no real tester has a usable notification grant, so Phases 1-2 nudges stay silent. Consider sequencing Phase 4 earlier if device-grant adoption is the priority.
