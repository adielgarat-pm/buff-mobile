# pkg/parent-notification-feed — Spec Sync

> Which canonical docs change in which phase. CC must update each listed doc as part of the named phase's exit deliverable.

## Docs touched in this package

| Doc | Phase | Nature of change |
|---|---|---|
| `docs/sessions/parent-notification-feed/STATUS.md` | every | Row appended per phase |
| `src/i18n/he.json`, `src/i18n/en.json` | 6 | New keys for bell, screen, sections, empty state, per-type rows |
| `src/navigation/ParentTabs.tsx` | 2 | Add `headerRight: ParentNotificationBell` |
| `src/hooks/useParentNotifications.ts` | 1 | Refactor to thin selector on `useNotificationsFeed` |
| `docs/BUFF_FEATURE_AUDIT.md` | 7 | Add row for parent notification feed → ✅ Shipped |
| `docs/INTEGRATION_LEARNINGS.md` | 7 | Any execution surprises |

## Docs intentionally NOT touched

- `CLAUDE.md` — Adi's doc. Adi-pending: add `pkg/parent-notification-feed` to § Open FLAGs.
- `docs/BUFF_PRD.md` — feature not currently in PRD. Phase 7 surfaces decision to Adi: add §7 entry OR mark out-of-PRD.
- `docs/BUFF_VALUES.md`, `docs/BUFF_DECISIONS_LOG.md`, `docs/BUFF_GAP_ANALYSIS.md` — Adi-only docs per CLAUDE.md.
- `docs/sessions/daily-vibe-check/*` — frozen. Dashboard SOS surface MUST NOT regress.
- `migrations/*` — no DB changes in this package; reads from existing `public.notifications` only.

## Per-phase canonical doc actions

| Phase | Action |
|---|---|
| 0 | Update STATUS.md (this commit) |
| 1 | None (hook refactor only). STATUS row. |
| 2 | None (component + nav edit only). STATUS row. |
| 3 | None (new screen + route + components). STATUS row. |
| 4 | None (reuse existing notificationRouter). STATUS row. |
| 5 | None (mutation logic only). STATUS row. |
| 6 | `src/i18n/he.json` + `en.json`. STATUS row. |
| 7 | BUFF_FEATURE_AUDIT.md (new row); INTEGRATION_LEARNINGS.md if surprises; STATUS closeout. |

## Verification

- [ ] tsc clean
- [ ] jest 79+ green (no regression)
- [ ] i18n:check clean
- [ ] Dashboard SOS surface snapshot test passes (regression guard)
- [ ] Bell visible on all 5 ParentTabs
- [ ] Kid UI verified clean of feed exposure
