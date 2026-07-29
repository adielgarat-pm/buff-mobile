# SPEC_SYNC — Smart Organizer Discovery

> אילו canonical docs מתעדכנים בכל phase, **באותו commit כמו הקוד**.

| Phase | Canonical doc | עדכון |
|---|---|---|
| **P1+P2** | `docs/BUFF_FLOWS.md` | מסע ההורה → כניסת המארגן החכם מובילה ישירות למסך הלכידה (לא דרך מרכז "השבוע"); Package Queue: P1 → ✅ |
| **P1+P2** | `docs/RELEASE_QUEUE.md` | שורה חדשה: `smart-organizer-discovery` P1+P2 — web auto / Android OTA (JS בלבד, ה-fingerprint לא זז) |
| **P1+P2** | `docs/sessions/smart-organizer-discovery/STATUS.md` | שורה: state, תאריך, commit hash, tsc/jest/i18n, לינק ללמידות |
| **P1+P2** | `docs/sessions/smart-organizer-discovery/TESTS.md` | תרחישי Hat-1 + Hat-3 בשני הצדדים (אנדרואיד + ווב); `[ ] Values check passed` מול ההתנהגות שנבנתה |
| **P1+P2** | `scripts/` | שאילתת הבסיס מ-SPEC §3 (`capture_runs` / `capture_opened` ללא Adi וללא חשבונות בדיקה) + מעקב `capture_entry_seen`/`capture_entry_tapped`, בדפוס `scripts/insight-usage.sql` |
| **P1+P2** | `docs/INTEGRATION_LEARNINGS.md` | **חובה, לא "אם הפתיע":** הפער בין "0% חוזרים" ל-"0% התחילו" — איך ממצא red-team קיבל מסגור שגוי כי אף אחד לא שאל *מי* הריץ את 9 ההרצות |
| **P3** (אם יאושר) | `docs/BUFF_DECISIONS_LOG.md` | **להציע ל-Adi** — D: אישור תלות npm ל-share-intent + מעבר מ-OTA ל-build |
| **P3** (אם יאושר) | `docs/sessions/smart-organizer-discovery/SPEC.md` | §2 P3 מתעדכן מהחלטה פתוחה למצב-יעד מוכרע |

> **כלל:** `GAP_ANALYSIS` / `DECISIONS_LOG` / `BUFF_VALUES` = מסמכי Adi. **להציע, לא לעדכן חד-צדדית** (CLAUDE.md).
> **אין שינוי סכימה ב-P1+P2** — האירועים החדשים נכנסים ל-`onboarding_events` הקיימת דרך `logOnboardingEvent`, בלי DDL. אם משהו בכל זאת ידרוש שינוי DB — זו עצירה והצפה, לא המשך.
> **P3 אינו OTA.** תלות נייטיב חדשה מזיזה את ה-fingerprint ⇒ build חדש + מספור גרסה, ולכן הוא חבילה נפרדת עם שורת RELEASE_QUEUE משלה.
