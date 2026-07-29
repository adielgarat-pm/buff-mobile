# STATUS — Smart Organizer Discovery

| Phase | State | תאריך | Commit | Gate 1 (tsc / jest / guards) | למידות |
|---|---|---|---|---|---|
| P1+P2 | **shipped (pending merge)** | 2026-07-29 | `pkg/capture-discovery` | tsc 0 · jest `src/lib/parentCapture` 77/77 (4 חדשים) · `i18n:check` ✅ · `check:no-raw-alert` ✅ | [INTEGRATION_LEARNINGS](../../INTEGRATION_LEARNINGS.md) — IN-2026-07-29 |
| P3 (שיתוף מוואטסאפ) | **not started — טעון אישור** | — | — | — | SPEC §2 P3 |

## מה נשלח ב-P1+P2

- `ParentCaptureEntry` אומר **"מארגן חכם"** + **"הדביקי הודעה מאחת הקבוצות — ונסדר ממנה את השבוע"**, ומנווט ישירות ל-`ParentCapture` במקום למרכז "השבוע".
- `capture.placeholder` הוכלל באותה רוח ("מאחת הקבוצות…" במקום "מקבוצת כיתה או חוג…") כדי שהכרטיס והמסך שמאחוריו יבטיחו אותו דבר.
- קישור **"השבוע שלי"** נוסף לכותרת מסך הלכידה — בלעדיו מרכז "השבוע" היה נשאר נגיש רק אחרי אישור ריצה.
- שני אירועים: `capture_entry_seen` (דדופ פר-session) ו-`capture_entry_tapped`. אין DDL — `onboarding_events.event_type` הוא `text` ללא CHECK (אומת מול הפרודקשן).
- `scripts/capture-discovery.sql` — שאילתת הבסיס ומעקב המשפך.

## מה **לא** נעשה, ולמה

| פריט | סיבה |
|---|---|
| `docs/BUFF_FLOWS.md` | **הקובץ עדיין לא ב-`main`** — הוא WIP לא-מקושר של סשן מקביל. עדכון מסע ההורה יתווסף כשהקובץ ייכנס. |
| שורת `RELEASE_QUEUE.md` | מתווספת **אחרי המרג'** (CLAUDE.md: "on merge"). שני PR-ים מקבילים נגעו בקובץ הזה הלילה וכבר יצרו קונפליקט אחד; שורה שלישית בו-זמנית הייתה מייצרת עוד. |
| אימות ויזואלי | `ParentDashboard` ו-`CaptureScreen` מאחורי אימות. **Hat-4** — ראו `TESTS.md`. |

## תנאי יציאה שנרשם ב-SPEC

אם P3 (שיתוף מוואטסאפ) יעלה לאוויר, כרטיס הכניסה עצמו הופך למיותר וצריך **להיעלם**, לא להצטבר לצד הטריגר החדש (Values Check, Pillar 3 שאלה 3).
