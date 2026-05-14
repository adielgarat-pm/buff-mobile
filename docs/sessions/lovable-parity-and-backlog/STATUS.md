# Lovable Parity & Backlog — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 1 | _blocked_ | 2026-05-14 | ed5e817 (initial) + (this refinement) | awaiting Adi review per TESTS.md | F-2026-05-14-01, F-2026-05-14-02 added |

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני (סקירה של אדי, וכו')

## Closeout

- [ ] הפאזה עברה
- [ ] INTEGRATION_LEARNINGS.md עודכן (FLAG חדש על web compat)
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (`pkg/lovable-parity-and-backlog/v1`)
- [ ] PR ל-main, fast-forward merge, branch נמחק (לפי Verify-Before-Delete Protocol)
- [ ] טיוטת decision הועתקה ע"י אדי ל-DECISIONS_LOG
- [ ] הסשן מסומן closed

---

## Decision Draft for `BUFF_DECISIONS_LOG.md`

> CC מציע. **אדי בלבד מעתיקה/עורכת ל-`docs/BUFF_DECISIONS_LOG.md`.** CC לא נוגע ב-DECISIONS_LOG (כלל ב-CLAUDE.md).
> מספר ההחלטה (D-2026-05-14-XX) — אדי קובעת לפי הסידור בקובץ.

---

**D-2026-05-14-XX — Web Strategy & Lovable Sunset Plan**

**הקשר:**
שיחת תכנון 2026-05-14 בין אדי ל-CC. אדי שאלה מתי ואיך לסאנסט את אפליקציית הווב Lovable POC הקיימת, מתוך כוונה ארוכת-טווח שאפליקציית BUFF המובייל תחליף את כל המקורות כדי לא לתחזק שני קוד-בייסים. CC מיפה את Lovable repo (`C:\Users\adiel\buff-lovable`, frozen מ-2026-04-18) וחקר את הסטנדרטים בתעשייה ל-2026.

**החלטות:**

1. **ארכיטקטורת web עתידית — תלת-שכבתית:**
   - **שכבה 1 — אתר שיווקי סטטי** (buffadhd.com): קוד נפרד (Astro/Next/HTML), קל, SEO-optimized. **לא חולק לוגיקה עם האפליקציה.** זה לא "קוד-בייס שני" כי אין בו לוגיקה.
   - **שכבה 2 — אפליקציה (Expo)**: קוד-בייס אחד שמקומפל ל-Android (היום), iOS (עתיד), ו-Web/PWA (עתיד קרוב) — דרך Expo Web (= React Native Web).
   - **שכבה 3 — Backend (Supabase)**: ללא שינוי.

2. **Web build = תחליף זמני ל-iOS:** עד שיוצא iOS native, משתמשי iPhone יקבלו את ה-Web build וניתן להתקנה כ-PWA למסך הבית — נראה ומרגיש כמו אפליקציה.

3. **בחירת Expo Web על-פני Capacitor או web נפרד:**
   - Expo Web (= React Native Web) היא production-grade ב-2026: X/Twitter, Coinbase, Discord. Meta מפתחים את React Strict DOM כעבר הבא, **בנוי מעל RNW** ולא מחליף — אין סיכון "RNW יישבר מחר".
   - Capacitor מתאים ל-web-first, לא ל-mobile-first שכבר השקיע ב-Expo.
   - Web נפרד = שני קוד-בייסים = בדיוק מה שרצינו להימנע ממנו.

4. **Lovable — לסאנסט פוסט-MVP:**
   - 49 משתמשים נרשמו, אבל רק **2 פעילים** באמת (לפי בדיקה ב-Lovable admin, 2026-05-14).
   - **אין הגירה אוטומטית** — שני המשתמשים הפעילים יקבלו תקשורת ויעברו ידנית לאפליקציית Android או ל-Web build (כשייצא).
   - 47 הנותרים — נטושים. בקפיצה לסאנסט.
   - **F-006 (Beta migration from PWA) — מבוטל** כתוצאה מהחלטה זו (היה Must Have/MVP, עובר ל-Out).
   - תאריך סאנסט מדויק יוחלט אחרי שיוצא MVP יציב לפרודקשן + 30 יום observation.

5. **Trade-off ידוע ומתקבל:**
   - מודולים native (במיוחד Push notifications דרך FCM) מוגבלים מאוד ב-PWA, במיוחד באייפון.
   - משתמשי web יקבלו חוויה נחותה ממובייל native — מקובל כ-fallback זמני עד יציאת iOS native.
   - F-039 ב-FEATURE_PRIORITIZATION כבר מציין: "Without push, the PWA problem repeats" — אנו מודעים שזו לא תיהיה חוויית default ארוכת-טווח.

**Implications:**

1. **בקלוג מעודכן ב-`BUFF_FEATURE_PRIORITIZATION.md`:**
   - PARENT DASHBOARD: הוספת F-024 (Daily summary) ו-F-025 (Schedule parsing AI) — שניהם Out / Phase 2.
   - TECHNICAL INFRASTRUCTURE: הוספת F-071 (In-app reviews mechanism — Out, refined description per Adi), F-072 (Email password recovery — Out / Conditional), F-073 (Web build — Should Have), F-074 (Static landing — Should Have, **uses translated Lovable reviews as social proof**), F-075 (Sunset Lovable + **white-glove migration** of 2 active users — Should Have, S→M).
   - שינוי F-006 (Beta migration) → Out.
2. **PRD מעודכן:** סעיף 9.4 Web Strategy חדש ב-`BUFF_PRD.md`.
3. **FLAGs חדשים ב-INTEGRATION_LEARNINGS:**
   - F-2026-05-14-01: לפני התקנת native dep — לבדוק web compat.
   - F-2026-05-14-02: Lovable reviews extraction queued (blocked on Lovable Supabase access).
4. **F-072 (Email password recovery) — Out / Conditional:** הקוד מובייל קורא ל-`resetPasswordForEmail` (LoginScreen.tsx:65) אבל אין ResetPassword screen + deep link handler. החלטת 2026-05-14: אדי שאלה "אם Google תומך בזה, למה צריך?" — מסומן Out כל עוד אין החלטה להסיר email/password auth. אם email/password יישאר ב-MVP, F-072 חוזר ל-Should Have.
5. **ChildJoinScreen.tsx:49 משתמש ב-`signUp(email, autoPassword, ...)`** — הסרת email/password auth תשבור את onboarding של ילדים דרך הזמנה. דורש ניתוח בסשן Auth Strategy עתידי לפני שמסירים את email/password auth.
6. **F-071 refined to "In-app reviews mechanism" + Adi choice to use Play Store ratings + extract Lovable reviews as testimonials separately** (INTEGRATION_LEARNINGS F-2026-05-14-02).
7. **F-075 expanded to white-glove approach** for the 2 active Lovable users: pre-create accounts in mobile Supabase + personal email. No automated data migration. Effort S→M to account for white-glove ops.

**מקורות:**
- [Expo for Web — official docs](https://docs.expo.dev/workflow/web/)
- [React Strict DOM — Meta](https://facebook.github.io/react-strict-dom/)
- [React Native vs Expo vs Capacitor 2026 — PkgPulse](https://www.pkgpulse.com/guides/react-native-vs-expo-vs-capacitor-cross-platform-mobile-2026)
- [Coinbase RN transition](https://www.coinbase.com/blog/announcing-coinbases-successful-transition-to-react-native)
- [From RNW to RSD — Callstack podcast](https://www.callstack.com/podcasts/from-react-native-web-to-react-strict-dom)
- [Lovable repo audit](file:///C:/Users/adiel/buff-lovable) (CC, 2026-05-14)
