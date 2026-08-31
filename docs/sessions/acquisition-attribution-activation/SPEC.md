# Acquisition Attribution — Activation — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**Slug:** `acquisition-attribution-activation`
**Branch:** `claude/stuck-registrations-analysis-nro55c` (או נפרד, לפי החלטת Adi)
**Origin:** שאלת "מאיפה ההרשמות מגיעות", 2026-08-31.
**קשור ל:** `docs/sessions/acquisition-tracking/` — שם נבנתה תשתית ה-capture. **החבילה הזו לא בונה capture חדש — היא מפעילה את הקיים.**

---

## Problem (one paragraph)

בדיקת ה-DB (60 יום, משפחות אמיתיות): **כל** ערך `acquisition_source` שאוכלס = `organic`, ו-`utm_source/medium/campaign` = null בכולם. אבל התשתית **קיימת ועובדת**: `src/lib/acquisitionCapture.web.ts` קורא `utm_*` + `document.referrer` ב-first-touch, `normalizeSource` ממפה `fb/winback/guide/reels/referral/play_ads/organic/unknown`, וזה מחווט ל-`family_created` (`resolveAcquisition`). כלומר ה**קורא** בנוי — מה שחסר זה ש**הלינקים היוצאים מהשיווק לא נושאים utm**, ו-**buffadhd.com לא מעביר את המקור המקורי** ל-לינק האפליקציה (ה-referrer שנקלט הוא תמיד `buffadhd.com`, לא המקור שממנו הגיעו לאתר). התוצאה: קלט תקין → "organic" תמיד. זו בעיית **הפעלה**, לא בעיית קוד-אפליקציה.

---

## Capabilities & Bottlenecks

### מה Claude.ai (אני) יכולה
- להגדיר את קונבנציית ה-utm (הערכים ש-`normalizeSource` כבר ממפה) ולנסח playbook תיוג-לינקים.

### מה Claude Code (CC) יעשה
- **מעט מאוד קוד באפליקציה** (הקורא מוכן). עיקר ה-CC: (1) לוודא ש-`normalizeSource` מכסה את כל התגיות שנשתמש בהן; (2) לכתוב `scripts/acquisition-by-source.sql` למדידה; (3) לכתוב את ה-playbook.
- **buffadhd.com pass-through** — אם הריפו של אתר השיווק נגיש לסשן, ליישם: קליטת utm/referrer נכנס באתר + הצמדתם ל-CTA של האפליקציה. **כנראה ריפו נפרד** (ראה Open Questions).

### מה Adi חייבת לעצמה
- **פעולת שיווק (עיקר הערך, לא קוד):** לתייג כל לינק יוצא ב-`?utm_source=` — Reddit/FB/Reels bio/מיילים/guides/Play listing.
- אימות signup אמיתי מקצה-לקצה (כותב לפרוד).

### צוואר בקבוק
- בלי תיוג-לינקים ע"י השיווק, שום קוד לא ייתן attribution — הקלט פשוט ריק. זו התלות המרכזית.
- buffadhd.com הוא כנראה ריפו/פלטפורמה נפרדת — ה-pass-through אולי מחוץ ל-buff-mobile.

---

## Values Check
> תשתית attribution, צד-שיווק/הורה. אין ילד בלולאה, אין PII של ילד (רק תגיות שיווק + device region).
- Pillar 2: אין ניסוח משפיל/לחץ — לא רלוונטי (telemetry). **Pass** — לא נאסף מידע אישי של ילד (עקבי עם posture הקיים).

## AI Token Cost
- **לא רלוונטי — אין LLM.**

## Goals
- **G1:** לפצל את "organic" לערוצים אמיתיים (fb/reels/guide/referral/winback/play_ads) בלי לכתוב capture חדש.
- **G2:** לשחזר את המקור *לפני* buffadhd.com (מה שאבוד היום כי ה-referrer הוא תמיד האתר).
- **G3:** מדידה: `% משפחות חדשות עם source ≠ organic/null` (יעד ≥80% תוך שבועיים — אותו metric כמו acquisition-tracking).

## Non-goals
- לא לבנות capture חדש באפליקציה (קיים).
- לא Google Play Install-Referrer (native, נשאר DEFERRED מ-acquisition-tracking — dep חדש + Hat-3).
- לא dashboard/BI חדש (העמודה + admin source-column כבר קיימים מ-migration 052/053).

## Behavior Contract
1. לינק יוצא מתויג `?utm_source=fb` (וכו') → נחיתה web → `captureAcquisitionFromUrl` שומר ל-sessionStorage → `family_created` כותב `acquisition_source='fb'` + raw utm. **כבר עובד היום** ברגע שיש תג.
2. buffadhd.com מקבל `?utm_source=reddit` → שומר → מצמיד `utm_source=reddit` ל-CTA האפליקציה → האפליקציה קולטת reddit במקום organic. **דורש שינוי באתר.**
3. תגית לא-ממופה → `unknown` (raw נשמר ל-triage), היעדר תגית → `organic`. ללא רגרסיה.

## Schema Changes
- **אין.** `families.acquisition_source/acquisition/acquisition_country` קיימים (migration 052); grant INSERT ל-authenticated קיים.
- ייתכן `normalizeSource` יצטרך תגית נוספת (למשל `reddit`, `whatsapp`) — הרחבת enum בקוד בלבד, לא schema.

## API / Route / UI Changes
- **`src/lib/acquisitionCapture.shared.ts`**: הוספת מיפויים חסרים ל-`normalizeSource` (`reddit`, `whatsapp`, `community` — לפי הערוצים שהשיווק בפועל משתמש). הרחבת `AcquisitionSource` enum בהתאם.
- **`scripts/acquisition-by-source.sql` (חדש)**: פילוח משפחות חדשות לפי source × country × platform, ו-metric ההצלחה.
- **buffadhd.com (ריפו נפרד, אם נגיש)**: capture inbound utm/referrer + הצמדה ל-app CTA (מודל קיים: `src/lib/installTarget.web.ts` מתאר את ה-web→Play tagger).
- **אין UI באפליקציה.**

## Open Questions
- **OQ1 — ✅ נפתר (2026-08-31):** הריפו `adielgarat-pm/buff` (buff.lovable.app) הוא אפליקציה ישנה על DB אחר (`iyejaxnugjgjeceqdcky`), **מושבתת** (אישור Adi; ראה IN-2026-08-31-01). **buffadhd.com מוגש ע"י buff-mobile web**, כך שאין hop נפרד לגשר: `acquisitionCapture.web.ts` כבר קולט utm/referrer ב-first-touch על הדומיין הזה. → **ה-pass-through (G2) מבוטל; אין עבודה ב-repo של lovable.** הפער היחיד = תיוג לינקים (UTM_PLAYBOOK).
- **OQ2:** אילו ערוצים בפועל צריך למפות מעבר לקיים? (Reddit? WhatsApp community? מיילים?) — קובע את הרחבת `normalizeSource`.
- **OQ3:** האם לאמת signup אמיתי מול פרוד (עם ניקוי `e2e+`) כדי לאשש שהשרשרת חיה end-to-end, או להסתפק בבדיקת יחידה של `normalizeSource`?

## Out of Scope
- Google Play Install-Referrer (native) — DEFERRED, IN-2026-07-30-01.
- ניקוי 189 פרופילי-הורה עם user_id מת (חבילה נפרדת).
- כל capture חדש באפליקציה.

## Deliverable עיקרי שאינו קוד
**Playbook תיוג-לינקים** (`docs/sessions/acquisition-attribution-activation/UTM_PLAYBOOK.md`): טבלת `utm_source` קנוני לכל ערוץ (בדיוק הערכים ש-`normalizeSource` ממפה), דוגמאות לינק מלאות, והיכן להדביק (Reddit reply, FB, Reels bio, Play listing, מיילים). זו הפעולה שמייצרת את הדאטה.
