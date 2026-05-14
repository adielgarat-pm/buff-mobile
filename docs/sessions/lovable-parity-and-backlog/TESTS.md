# Lovable Parity & Backlog — Tests

> חבילת תיעוד — אין tests באמולטור. בדיקות = code review של ה-diff + אימות עקביות בין docs.

## איך מריצים בדיקות

- CC מציג diff (`git diff main`), אדי סוקרת.
- אין שום שינוי runtime — אין צורך לפתוח אמולטור.

---

## פאזה 1

### בדיקות אוטומטיות (CC מריץ)
- [ ] `git diff --stat main..HEAD` מראה שינויים **רק** בנתיבים הבאים:
  - `docs/BUFF_PRD.md`
  - `docs/BUFF_FEATURE_PRIORITIZATION.md`
  - `docs/INTEGRATION_LEARNINGS.md`
  - `docs/sessions/lovable-parity-and-backlog/**`
- [ ] **אין** שינוי ב-`src/`, `app.json`, `package.json`, `supabase/`, `android/`, `ios/`.
- [ ] **אין** שינוי ב-`docs/BUFF_DECISIONS_LOG.md`, `docs/BUFF_VALUES.md`, `docs/BUFF_GAP_ANALYSIS.md` (לפי CLAUDE.md — אלה של אדי).
- [ ] grep ל-`F-024`, `F-025`, ו-`F-071` עד `F-075` ב-`BUFF_FEATURE_PRIORITIZATION.md` — כל אחד מופיע פעם אחת בדיוק.
- [ ] grep ל-"Web Strategy" ב-`BUFF_PRD.md` — מופיע בדיוק פעם אחת בכותרת.
- [ ] טבלת Summary Counts ב-`BUFF_FEATURE_PRIORITIZATION.md` עברה אדפטציה (ספירה חדשה משקפת את ה-7 חדשים + שינוי F-006).

### בדיקות ידניות (Adi — code review)
- [ ] עברתי על 7 השורות החדשות ב-`BUFF_FEATURE_PRIORITIZATION.md` ואני מסכימה עם ה-priority של כל אחת:
  - [ ] F-024 (Daily summary) → Out / Phase 2 — בסקציית PARENT DASHBOARD
  - [ ] F-025 (Schedule parsing AI) → Out / Phase 2 — בסקציית PARENT DASHBOARD
  - [ ] F-071 (In-app reviews mechanism) → Out / Phase 2 — בסקציית TECHNICAL (description refined post-commit-1; see SPEC.md Resolved Decisions §6)
  - [ ] F-072 (Email password recovery) → Out / Phase 2 — Conditional — בסקציית TECHNICAL
  - [ ] F-073 (Web build) → Should Have / Phase 2 — בסקציית TECHNICAL
  - [ ] F-074 (Static landing) → Should Have / Phase 2 — בסקציית TECHNICAL
  - [ ] F-075 (Sunset Lovable) → Should Have / Phase 2 — בסקציית TECHNICAL
- [ ] שינוי F-006 ל-Out מתאים לכוונה שלי (ויתור על הגירה אוטומטית).
- [ ] סעיף Web Strategy ב-`BUFF_PRD.md` מתאר נכון את הכוונה: תלת-שכבתי, Expo Web פוסט-MVP, אתר שיווקי בנפרד.
- [ ] ה-FLAG החדש ב-`INTEGRATION_LEARNINGS.md` ברור — אדע מתי להפעיל אותו (לפני התקנת dep חדש).
- [ ] טיוטת ה-decision ב-`STATUS.md` כוללת את כל הנקודות שהוסכמו ואני יכולה להעתיק כמות שזה ל-`BUFF_DECISIONS_LOG.md` (אולי עם תיקוני ניסוח).

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=1, state=passed, commit hash מלא.
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md נוכחים באותו commit כמו עדכון STATUS.md.
- [ ] Values Check עדיין עובר אחרי implementation (לא רק בSPEC).
- [ ] INTEGRATION_LEARNINGS.md עודכן (FLAG החדש קיים).

---

## Closeout

- [ ] בדיקות הפאזה עוברות.
- [ ] STATUS.md closeout checklist הושלם.
- [ ] Git tag `pkg/lovable-parity-and-backlog/v1` נוצר.
- [ ] אין drift בין canonical docs לבין החלטות החבילה.
- [ ] טיוטת ה-decision הועתקה ע"י אדי ל-`BUFF_DECISIONS_LOG.md` (תיעוד ב-STATUS.md אחרי שאדי מאשרת).
