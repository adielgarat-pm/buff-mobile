# pkg/fcm-push-notifications — Spec Sync

> Which canonical docs change in which phase. CC must update each listed doc as part of the named phase's exit deliverable, in the same commit. Verified during diff review.

## Docs touched in this package

| Doc | Phase(s) | Nature of change |
|---|---|---|
| `docs/sessions/fcm-push-notifications/STATUS.md` | every | Phase row appended at exit |
| `app.json` | Phase 2 (mobile plugin), Phase 9 (web config) | Add `expo-notifications` plugin; add web push config |
| `package.json` | Phase 2 (`expo-notifications`), Phase 9 (`firebase` web SDK) | New deps |
| `src/i18n/he.json`, `src/i18n/en.json` | Phase 4 (push copy + permission pre-prompt), Phase 8 (local notification copy) | New keys per recipient role + locale |
| `docs/BUFF_PRD.md` | Phase 11 | §9.2 FCM line → shipped status; any §4 references updated |
| `docs/BUFF_FEATURE_AUDIT.md` | Phase 11 | S-01 (push notifications) → ✅ |
| `docs/BUFF_FEATURE_PRIORITIZATION.md` | Phase 11 | F-039 (push reminders, child, MVP) + F-063 (FCM, system, MVP) → shipped |
| `docs/BUFF_GAP_ANALYSIS.md` | Phase 11 | Corresponding row for push notifications → ✅ |
| `docs/INTEGRATION_LEARNINGS.md` | Phase 0 (Firebase blocker flag — done), Phase 11 (any execution surprises) | EX-X entries per surprise; resolution of IN-2026-05-17-03 |

## Docs intentionally NOT touched

- `CLAUDE.md` — Adi's doc; CC does not edit unilaterally. **Adi-pending after merge:** add `pkg/fcm-push-notifications` and `pkg/parent-notification-feed` to § Open FLAGs as MVP-critical.
- `docs/WORKFLOW.md` — no workflow changes
- `docs/BUFF_VALUES.md` — Adi-only doc; values unchanged
- `docs/BUFF_DECISIONS_LOG.md` — Adi-only doc; no formal DECISION entries needed
- `docs/BUFF_BUDDY_SYSTEM.md` — locked at V0.5; this package consumes the body-doubling framing from L25
- `docs/BUFF_BRAND.md` — Adi's doc. **Adi-pending:** §6 amendment to capture body-doubling voice template (proposed in IN-2026-05-19-03)
- `docs/BUFF_USER_STORIES.md` — existing user stories cover notification needs
- `docs/sessions/daily-vibe-check/*` — frozen; this package consumes the existing surface
- `migrations/011_parent_sos_notification_trigger.sql` — locked, do not modify

## Out of Scope (explicit non-targets)

- **`docs/BUFF_DECISIONS_LOG.md`** — Adi-only per CLAUDE.md. If a push-notification decision rises to formal DECISION status, Adi creates the entry.
- **`docs/teen-ui-design/*`** — design source for Stitch UI; not affected by push infra.
- **`buff-lovable` repo** — separate project; sunset path per project memory.

## Per-phase canonical doc actions

| Phase | Action |
|---|---|
| 0 | Update STATUS.md (this row). INTEGRATION_LEARNINGS already has IN-2026-05-19-01/02/03 from planning. |
| 1 | None (DB migration only). STATUS.md row at exit. |
| 2 | `app.json` + `package.json`. STATUS.md row at exit. |
| 3 | None (Edge Function + idempotency table — separately deployed). STATUS.md row. |
| 4 | `src/i18n/he.json` + `en.json`. STATUS.md row. |
| 5 | None. STATUS.md row. |
| 6 | None. STATUS.md row. |
| 7 | None (new migration). STATUS.md row. |
| 8 | None (`src/i18n` additions are part of Phase 4 ideally; if more local-only keys needed, Phase 8). STATUS.md row. |
| 9 | `app.json` (web config) + `package.json` (firebase web SDK — needs separate npm approval). STATUS.md row. |
| 10 | SPEC appendix only. STATUS.md row. |
| 11 | PRD §9.2 + AUDIT S-01 + PRIORITIZATION F-039 + F-063 + GAP_ANALYSIS + INTEGRATION_LEARNINGS + STATUS closeout. |

## Verification

- [ ] Each Phase's plan in CC includes the SPEC_SYNC row(s) for that phase as part of the chunk
- [ ] Each Phase's TESTS.md includes "doc updated per SPEC_SYNC" check
- [ ] At closeout: `grep "FCM" docs/BUFF_PRD.md` shows shipped; `grep "S-01" docs/BUFF_FEATURE_AUDIT.md` shows ✅
- [ ] No drift between canonical docs and live system at PR open time
- [ ] CC does not silently edit Adi's docs (CLAUDE.md, BUFF_BRAND.md, BUFF_VALUES.md, BUFF_DECISIONS_LOG.md)
