# SPEC — admin-dashboard-port

**Package:** `admin-dashboard-port`
**Status:** Design phase (not started)
**Owner:** Adi (PO) + Claude.ai (designer) + CC (implementer)
**Created:** 2026-05-04
**Estimated effort:** 3-5 sessions (port + adapt + new features)

---

## 1. Goal

לבנות **Admin Dashboard ל-mobile MVP** שמתבסס על ה-Admin הקיים של Lovable PWA. הDashboard יאפשר ל-Adi לקבל החלטות מבוססות-נתונים על המוצר (funnel, retention, attention triage, family deep-dive).

**עיקרון:** Reuse מקסימלי של קוד Lovable, התאמות מינימליות ל-Supabase של mobile.

---

## 2. Why this is MVP-blocking

החלטה של Adi מ-2026-05-04: "בעיני חלק חשוב מה MVP, בלעדיו אני עיוורת לקבלת החלטות."

**ללא Admin:**
- אין דרך לדעת אם blocked registrations (18+, החלטה היום) קורות
- אין visibility ל-funnel drop-off (Activated → Engaged → Active)
- אין יכולת לזהות families ב-"Stuck in Onboarding" / "Churn Risk" / "Low Engagement"
- אין דרך ללמוד מ-data של families אמיתיות (drill-down + JSON export)

**עם Admin:**
- כל פיצ'ר חדש שמשוחרר מקבל metric.
- בעיות נחשפות תוך ימים, לא חודשים.
- Adi יכולה לבצע CRM ידני (להגיע ל-stuck families).

---

## 3. Architecture decision

### 3.1 Decision A2 — Subdirectory בתוך `buff-mobile` repo

```
buff-mobile/
├── src/                  ← React Native (Expo) — קיים
├── admin-web/            ← Vite + React + shadcn — חדש
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── supabase/             ← Migrations — משותף
├── docs/                 ← Docs — משותף
└── package.json          ← Workspace root (npm workspaces)
```

**נימוקים:**
- Schema sharing: types נגזרים מאותו Supabase project
- Git ops: branch אחד, PR אחד
- Documentation: docs/ במקום אחד
- Workflow: D-2026-05-02-26 (תלת-צדדי) על repo אחד

**נדחה: A1 (repo נפרד)** — drift בטיפוסים, 2 PRs לכל פיצ'ר חוצה-stack.

### 3.2 Decision B1+B2 — Magic Link + RLS

**Auth flow:**
1. כניסה ל-admin.buffadhd.com (או admin.buff.app)
2. הזנת email
3. Supabase שולח Magic Link
4. לחיצה → session 7 ימים
5. RLS policy `is_admin(auth.uid())` מאמתת בכל query

**Migration נדרש:**
```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO admin_users (user_id, email)
VALUES ('<adi-uuid>', 'adi.elgarat@gmail.com');

CREATE OR REPLACE FUNCTION is_admin(uid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = uid);
$$ LANGUAGE SQL SECURITY DEFINER;
```

**נדחה: B3 (env password)** — דליף = exposure, אין session management.

### 3.3 Deploy

- **Vercel** (חינם) — auto-deploy מ-GitHub `main` branch, subdirectory `admin-web/`
- **Custom domain:** `admin.buffadhd.com`
- **Env vars ב-Vercel:**
  - `VITE_SUPABASE_URL` (mobile project)
  - `VITE_SUPABASE_ANON_KEY` (mobile project)

### 3.4 Mobile-only? Desktop-only?

**Decision:** Desktop-only ל-MVP.
- חוסך RN Web complexity
- חוסך responsive design overhead
- Adi עובדת מ-laptop. אין צורך בmobile admin.

**הערה ל-V1.1:** אם בעתיד יידרש mobile admin (למשל בזמן שטח), נוסיף responsive או native screen.

---

## 4. UI Snapshot מ-Lovable Admin (מקור ל-port)

### 4.1 User Funnel
**Cohort filter:** Last 7 / 30 / 90 days / Custom + "Exclude Test Accounts" toggle

| Stage | הגדרה |
|---|---|
| Total Signups | רישום |
| Activated | Added at least 1 child |
| Engaged | Created at least 1 task |
| Active (WAU) | Completed task in last 7 days |

**⚠️ Bug ב-Lovable:** Engaged 139% (>100%) — צריך תיקון בport.

### 4.2 Attention Needed (3 kkrtisיות)

| Card | הגדרה |
|---|---|
| Stuck in Onboarding | Signed up > 24h ago, no child added |
| Churn Risk | Active families, no activity in 4+ days |
| Low Engagement | Has child but 0 tasks created |

**להוסיף לכרטיסיות שלאחר decision של היום:**
- Blocked Registrations (18+) — חדש

### 4.3 KPI Cards

**Long-term:**
- Weekly Completion %
- Active Children (WAU)
- Points Utilization
- סה"כ משפחות (+ פירוט הורים/ילדים)
- Community Subscribers (+ "העתק רשימת תפוצה")

**Daily:**
- משפחות ללא ילדים
- השלמות היום
- ילדים פעילים היום
- סה"כ השלמות (lifetime)

### 4.4 Charts

- Growth vs. Engagement Daily (dual axis: signups + active families)
- Task Completion by Category (7d) — bar / pie toggle
- מגמת השלמות 8 שבועות אחרונים — line chart
- שיעור השלמה היום + 7 ימים — gauge cards
- סוג מכשיר ילדים — donut (נפרד / משותף)

### 4.5 Tabs

1. App Pulse (default)
2. Users / Pro
3. Emails
4. PWA Analytics ⚠️ **דחוי ל-V1.1** (לא רלוונטי במובייל)
5. משפחות
6. Reviews ⚠️ **דחוי ל-V1.1** (אין reviews ב-mobile עדיין)

### 4.6 Family Deep-dive Modal

5 tabs: ילדים / מערכת / פרסים / משימות / מעקב (default)

**Mעקב tab:**
- שם ילד + 🔥 ימים רצופים + %
- 3 KPIs (הושלמו / פוטנציאל / lifetime)
- Progress bar
- Day-of-week breakdown
- Category chips
- Activity dates (first / last)

**ייצוא JSON** — מחזיר structure:
```
family_name, family_id, exported_at,
children[]: { id, birth_date, daily_goal, display_name, credit_balance,
              bag_prep_enabled, school_quest_enabled, age,
              tasks[], rewards[], timetable }
general_tasks[], general_rewards[]
```

---

## 5. Capability Check

**Claude.ai:**
- כותבת SPEC, design feedback, query design
- לא רואה קוד Lovable ישירות (robots.txt חוסם GitHub tree)

**CC:**
- `git clone` של `adielgarat-pm/buff` ל-temp dir, audit כל קבצי Admin
- Port קוד שורה-שורה
- Setup workspace structure, vite config
- Supabase migrations (RLS, admin_users, is_admin function)
- Vercel config

**Adi:**
- אישור scope per session
- Vercel account setup + custom domain
- Supabase admin actions (אם service role נדרש)
- Manual testing
- "merged" confirmation

**Unknowns שייפתרו ב-AUDIT (Phase 1):**
- מה בדיוק יש ב-Lovable Admin codebase
- אילו queries (SQL) רצים
- אילו components reusable
- כמה כתוב ב-Lovable-specific (`@lovable.dev/cloud-auth-js`) ויידרש החלפה

---

## 6. Values Check (3 pillars × 3 questions)

### Pillar 1 — Intrinsic Motivation
1. Admin משפיע על הילד? **לא ישיר.** Admin = כלי ל-Adi.
2. החלטות מבוססות-data של Admin מקרבות אותנו לפיצ'רים שמשרתים motivation? **כן.** Funnel ו-engagement metrics מסבירים אילו פיצ'רים עובדים.
3. אין סיכון ל-extrinsic creep מהDashboard עצמו? **אין.** Admin לא נחשף לילד.

### Pillar 2 — Positive Coaching
1. Admin מציג נתונים שיכולים להתפרש כ"שיים"? "Stuck in Onboarding" — האם זה תפיסה שלילית? **בעיני Adi, לא** — זו triage list ל-CRM, לא דירוג. **בכל מקרה לא נחשף ל-משתמש.**
2. הנתונים נסטטיים או דינמיים? **דינמיים** — משתנים כשמשפחות מתקדמות. אין "דירוג קבוע" של משפחה.
3. ה-CRM שAdi תעשה על-בסיס Admin = supportive, לא חודרני. **תלוי באיך Adi פועלת** — מחוץ ל-scope של הקוד.

### Pillar 3 — Independence-Building
1. Admin בונה תלות של Adi בכלי? **לא.** זה כלי management סטנדרטי, לא משהו שעובר ל-משתמש.
2. Admin מאפשר ל-Adi לזהות מתי משפחות לא צריכות יותר את BUFF? **כן.** "Active Children (WAU) ירידה" יכולה להיות סימן טוב (ילד עצמאי) או רע (נטישה). שתיהן info שAdi צריכה.
3. Admin תומך ב-MVP success → תומך ב-mission: ילד פחות תלוי ב-BUFF. **כן.**

**Values check: עובר.** עיקר הדאגה — שמילוי הDashboard לא יהפוך ל-vanity metric chase. **Mitigation:** כל KPI שנוסף צריך לענות על "מה אני אעשה אחרת אם זה במצב X?"

---

## 7. Out of scope ל-MVP

נדחה ל-V1.1 או מאוחר:
- PWA Analytics tab (לא רלוונטי במובייל)
- Reviews moderation (אין reviews ב-mobile עדיין)
- Mobile admin (responsive)
- Multi-admin (יותר מ-Adi)
- Audit log כללי (כל פעולה במערכת) — נכנס בסשן נפרד אם יידרש
- Real-time updates (live data) — polling 30s מספיק ל-MVP

---

## 8. Phases (estimated)

| # | Phase | מי | זמן |
|---|---|---|---|
| 1 | **AUDIT** — CC clones Lovable repo, מסכם codebase ב-`AUDIT.md` | CC | 30-45 דק׳ |
| 2 | **Workspace setup** — npm workspaces, admin-web subdirectory, vite + react + tailwind + shadcn | CC | 30 דק׳ |
| 3 | **Auth foundation** — Supabase migrations (admin_users + is_admin), Magic Link login screen | CC | 45 דק׳ |
| 4 | **Layout + tabs** — App shell, sidebar/topbar, tab routing | CC | 30 דק׳ |
| 5 | **Funnel + KPIs** — Cohort filter, 4-stage funnel, KPI cards | CC | 60-90 דק׳ |
| 6 | **Attention Needed** — 3 cards + drill-down lists | CC | 45 דק׳ |
| 7 | **Charts** — Growth/Engagement, Task by Category, completion trend | CC | 60-90 דק׳ |
| 8 | **Family deep-dive** — Search + modal + 5 tabs + JSON export | CC | 90-120 דק׳ |
| 9 | **Blocked Registrations** — חדש, מבוסס על audit_log table | CC | 45 דק׳ |
| 10 | **Vercel deploy** — Production deploy, env vars, custom domain | Adi + CC | 30 דק׳ |
| 11 | **Polish + testing** | Adi + CC | session |

**Total estimate:** 8-12 שעות עבודה, מפוזרות על 3-5 סשנים.

**MVP-minimum** (לפני שAdi יכולה להשתמש לקבלת החלטות): Phases 1-7 + 10. Phases 8-9 ב-MVP+1.

---

## 9. Open questions

1. **Domain:** `admin.buffadhd.com`? `admin.buff.app`? אחר? **(Adi)**
2. **Vercel account:** קיים או צריך setup? **(Adi)**
3. **Supabase project URL:** mobile project ID + anon key — צריך לאתר. **(CC ב-AUDIT)**
4. **`is_test_account` field:** ב-Lovable יש toggle "Exclude Test Accounts." האם השדה קיים ב-mobile DB? **(CC ב-AUDIT)**
5. **Service role key:** האם נצטרך אותו ל-queries מסוימות? תלוי ב-RLS coverage. **(CC ב-AUDIT)**
6. **Reviews data source:** אם יש reviews ב-mobile (לא ידוע) — האם להציג? **(Adi)**
7. **JSON export naming:** `family-{name}-{date}.json` כמו ב-Lovable? **(Adi)** ← default: כן, חיקוי מלא של פורמט

---

## 10. Success criteria

לסגירת ה-package כ-"shipped":

- [ ] Admin עולה ב-`admin.buffadhd.com` (או דומה) עם HTTPS
- [ ] Magic Link מעבד login של Adi
- [ ] RLS חוסם משתמשים שאינם admin
- [ ] User Funnel מציג נתוני אמת מ-Supabase של mobile (גם 0 משפחות = תקין)
- [ ] 3 כרטיסיות "Attention Needed" מציגות נתוני אמת
- [ ] Family search + drill-down מציגים נתוני אמת
- [ ] JSON export מוריד קובץ עם schema זהה ל-Lovable
- [ ] Charts (לפחות 2 מתוך 4) מציגים נתוני אמת
- [ ] Adi הצליחה לזהות לפחות **משפחה אחת אמיתית** ולקרוא לה (CRM action)
- [ ] STATUS.md מלא, FLAGs פתוחים מתועדים, EOD נוצר

---

## 11. Reference materials

- **Lovable repo:** https://github.com/adielgarat-pm/buff
- **Mobile repo:** https://github.com/adielgarat-pm/buff-mobile
- **Snapshot של UI** (screenshots + JSON export): נכנסו לזיכרון Claude.ai 2026-05-04
- **Lovable production:** https://buffadhd.com/admin

---

**End of SPEC.**
