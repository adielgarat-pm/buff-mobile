# SPEC_SYNC — Parent IA + Tab Audit + AHA

> אילו canonical docs מתעדכנים בכל phase, **באותו commit כמו הקוד**.

| Phase | Canonical doc | עדכון |
|---|---|---|
| **0** | `docs/RELEASE_QUEUE.md` | שורה: valence fix + door de-brand |
| **1** | `src/lib/onboardingFunnel.ts` | union חדש: `parent_tab_viewed`, `aha_detected` |
| **1** | `docs/INTEGRATION_LEARNINGS.md` | `source` derivation via role+isChildPreview; `mainChallenge` כבר נשמר (תיקון הנחה) |
| **1** | `scripts/` | שאילתות audit: active-parents + tab-funnel (בדפוס `insight-usage.sql`) |
| **2** | `docs/BUFF_FLOWS.md` | מסע ההורה → 5 טאבים חדשים; Progress חינם-קודם |
| **2** | `docs/RELEASE_QUEUE.md` | שורה: nav redesign |
| **2** | `docs/sessions/parent-ia-and-aha/STATUS.md` | state/commit/tests/RTL-screenshots |
| **CHECKPOINT** | `scripts/aha-baserate.sql` | שאילתת fallback מתוקן; תוצאה ל-Adi לפני 3-4 |
| **3** | `docs/INTEGRATION_LEARNINGS.md` | גלאי AHA + דדופ צד-שרת; רטרו=ספירה |
| **4** | `docs/BUFF_BRAND.md §4` | **להציע ל-Adi** — trophy card נבנה; קופי תצפיתי (לא "without asking") |
| **4** | `docs/BUFF_MESSAGING.md §4.5` | **להציע ל-Adi** — קופי תצפיתי; מחיר/מטבע revalidation |
| **5** | `docs/BUFF_DECISIONS_LOG.md` | **להציע ל-Adi** — go/no-go paywall; §4.5 red-line redraft |

> **כלל:** BRAND / MESSAGING / DECISIONS_LOG / VALUES = מסמכי Adi. להציע, לא לעדכן חד-צדדית.
> **החלטות-סכימה** (`is_pain_target`) = apply_migration + flag existing-user impact (`feedback_schema_change_gate`).
