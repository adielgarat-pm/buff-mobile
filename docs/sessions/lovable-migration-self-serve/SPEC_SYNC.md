# Lovable Migration (Self-Serve) — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.
> מאומת בסקירת ה-diff של הפאזה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 0, 5 | פאזה 0: IN-2026-05-26-XX — מה מצאנו בסכמת ה-snapshot (איפה ה-email, האם orphan family pattern מאומת, כמה כאלה). פאזה 5: סגירה של flag לגבי 79% non-return — אם migration עזרה לחלקן לחזור. |
| `docs/BUFF_DECISIONS_LOG.md` | 1, 5 | פאזה 1: D-2026-05-XX-01 (schema additions: `email_lookup`, `migrated_at`, `scheduled_delete_at`, `migration_source`). D-2026-05-XX-02 (RPC משותף עם childjoin-claim-orphans — אם הוחלט לאחד). פאזה 5: D על סיום החבילה ועל מי בפועל עברה. |
| `docs/BUFF_PRD.md` | 2, 5 | פאזה 2: סעיף Onboarding מקבל פסקה על "זיהוי משתמשת קיימת" וה-3 נתיבים. פאזה 5: שיקוף תוכן ה-fallback "כבר היית ב-BUFF?" בהגדרות. |
| `docs/BUFF_USER_STORIES.md` | 2, 3, 5 | סיפורי משתמש חדשים: "אני אמא ל-Lovable, אני נכנסת לראשונה לגרסה החדשה" × 3 (העבר הכל / בחרי / התחילי נקי). פאזה 5: סיפור fallback "התחברתי במייל אחר". |
| `docs/BUFF_GAP_ANALYSIS.md` | 5 | פאזה 5: סגירה של פער "אין נתיב migration מ-Lovable". הוספת flag חדש "child voice במעבר" כ-V1 candidate. |
| `docs/ARCHITECTURE.md` | 1 | פאזה 1: תוספת ל-section "Database Functions" — `check_lovable_orphan` ו-`claim_orphan_family`. תוספת ל-"Cron Jobs" — `lovable_snapshot_cleanup`. |
| `STATUS.md` | 0, 1, 2, 3, 4, 5 | שורה לכל phase: state, date, commit hash, tests result, learnings link. |

## Out of Scope

> Docs שעלולים להראות רלוונטיים אבל **מפורשות לא** משתנים בחבילה הזו, עם הסבר.

- `docs/BUFF_BUDDY_SYSTEM.md` — BUDDY relationships לא ב-snapshot, לא מועברים, לא משתנים.
- `docs/teen-ui-design/` — חבילה זו age-neutral, אין UI ייעודי לטין.
- `docs/BUFF_VALUES.md` — אנחנו *מיישמים* את ה-values, לא מעדכנים אותם.
- `docs/WORKFLOW.md` — תהליכי העבודה לא משתנים.
- `CLAUDE.md` — חוקי הפרויקט לא משתנים.
- `docs/README.md` — אינדקס docs לא נוגע (אין docs חדשים מעבר ל-SPEC הזה ול-SPEC_SYNC).
- `docs/CONVERSATION_STARTER.md` — אין דפוס שיחה חדש שראוי לתעד שם.
- `docs/BUFF_FEATURE_AUDIT.md` / `BUFF_FEATURE_PRIORITIZATION.md` — אם נדרש update, זה דרך חבילה אחרת (Lovable Parity).

## Verification

- [ ] כל פאזה ב-ROADMAP.md (יווצר ב-Phase 0 exit) כוללת עדכוני docs כחלק מה-chunk
- [ ] TESTS.md כולל "doc updated per SPEC_SYNC" בכל פאזה רלוונטית
- [ ] אחרי כל הפאזות — אין drift בין canonical docs לבין המערכת החיה
- [ ] Values Check (3 flags ב-SPEC §Values Check) מאומתים בקוד החי, לא רק ב-SPEC

---

**Last reviewed:** 2026-05-26
**Status:** Draft — לא תקף עד שאדי מאשרת את SPEC.md
