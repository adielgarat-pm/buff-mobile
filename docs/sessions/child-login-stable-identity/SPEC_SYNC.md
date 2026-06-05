# SPEC_SYNC — child-login-stable-identity

Every canonical doc, with an explicit decision on whether this package touches it.

| Doc | Touched? | Phase | Note |
|---|---|---|---|
| `CLAUDE.md` | No | — | No repo-rule change. |
| `docs/README.md` | No | — | — |
| `docs/CONVERSATION_STARTER.md` | No | — | — |
| `docs/WORKFLOW.md` | No | — | — |
| `docs/BUFF_VALUES.md` | **No (Adi-only)** | — | No principle change. |
| `docs/BUFF_PRD.md` | **Yes** | 1 | Document corrected child-login/auth behavior (§auth). CC updates in same commit as the fix. |
| `docs/BUFF_DECISIONS_LOG.md` | **Propose only (Adi-only)** | — | This fix may merit a decision entry (child-login keyed to stable identity). CC surfaces a suggested entry; **Adi writes it**, if she agrees. |
| `docs/BUFF_GAP_ANALYSIS.md` | **Propose only (Adi-only)** | — | Auth/child-login status likely needs a status update. CC surfaces; **Adi edits**. |
| `docs/BUFF_USER_STORIES.md` | No | — | — |
| `docs/BUFF_FEATURE_AUDIT.md` | No | — | — |
| `docs/BUFF_FEATURE_PRIORITIZATION.md` | No | — | — |
| `docs/BUFF_BUDDY_SYSTEM.md` | No | — | Out of scope (no BUDDY logic change; fix only protects continuity). |
| `docs/ARCHITECTURE.md` | Optional | 1 | If/when this "to-be-built" doc exists, capture the child↔auth identity model. If absent, skip — don't create it in this package. |
| `docs/INTEGRATION_LEARNINGS.md` | **Yes** | 0/1 | Append the root-cause finding + that the Liah instance was repaired manually on 2026-06-04. |
| `docs/teen-ui-design/` | No | — | — |

**Adi-only files** (`DECISIONS_LOG`, `GAP_ANALYSIS`, `VALUES`) are never edited by CC. CC surfaces suggestions; Adi decides.
