# Lovable Parity & Backlog — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.
> מאומת בסקירת ה-diff של הפאזה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/BUFF_PRD.md` | 1 | הוספת סעיף חדש "9.X Web Strategy" — ארכיטקטורה תלת-שכבתית (static landing + Expo Web app + Supabase) כתכנית פוסט-MVP. כולל trade-offs ידועים (PWA push limitations, responsive desktop work). |
| `docs/BUFF_FEATURE_PRIORITIZATION.md` | 1 | הוספת 7 שורות חדשות: F-024 (Daily summary), F-025 (Schedule parsing AI), F-026 (Translate review), F-027 (Email password recovery), F-028 (Web build via Expo Web + PWA), F-029 (Static marketing landing), F-071 (Sunset Lovable). שינוי F-006 (Beta migration) מ-Must Have/MVP ל-Out. עדכון Summary Counts בהתאם. |
| `docs/INTEGRATION_LEARNINGS.md` | 1 | הוספת FLAG: "לפני התקנת native dep חדש — לבדוק שעובר ל-Expo Web (אחרת ה-Web build יישבר עתידית)". |
| `docs/BUFF_DECISIONS_LOG.md` | — | **CC לא נוגע.** טיוטה ב-STATUS.md של הסשן; אדי בלבד מעתיקה/עורכת. |

## Out of Scope

> Docs שעלולים להראות רלוונטיים אבל **מפורשות לא** משתנים בחבילה הזו.

- `CLAUDE.md` — אין שינוי כללי עבודה.
- `docs/WORKFLOW.md` — workflow לא משתנה.
- `docs/BUFF_VALUES.md` — לא נוגעים (של אדי).
- `docs/BUFF_GAP_ANALYSIS.md` — לא נוגעים (של אדי). עדכוני gap-analysis מ-Lovable שייכים לסשן Spec Sync נפרד אם בכלל.
- `docs/BUFF_BUDDY_SYSTEM.md` — לא רלוונטי.
- `docs/BUFF_USER_STORIES.md` — לא רלוונטי.
- `docs/BUFF_FEATURE_AUDIT.md` — לא רלוונטי (אינוונטר של פיצ'רים *קיימים* בקוד; F-024..F-029 עדיין לא קיימים).
- `docs/teen-ui-design/` — לא רלוונטי.
- `docs/CONVERSATION_STARTER.md` — לא רלוונטי.
- `docs/BUFF_BRAND.md`, `BUFF_PERSONAS.md`, `BUFF_MESSAGING.md`, `BUFF_COMPETITORS.md` — לא רלוונטי לחבילה הזו (אם הסאנסט יחייב הודעה למשתמשים, יהיה סשן messaging נפרד).

## Verification

- [ ] כל פאזה ב-ROADMAP.md כוללת עדכוני docs כחלק מה-chunk
- [ ] TESTS.md כולל "doc updated per SPEC_SYNC" בכל פאזה רלוונטית
- [ ] אחרי הפאזה — אין drift בין canonical docs לבין החלטות החבילה
