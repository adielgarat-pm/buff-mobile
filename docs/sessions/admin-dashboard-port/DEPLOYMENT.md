# Deployment & Infrastructure — Decisions & Open Items

**Package:** `admin-dashboard-port`
**Status:** Discovery phase — no infrastructure changes yet
**Created:** 2026-05-04
**Related SPEC:** `docs/sessions/admin-dashboard-port/SPEC.md` §3.3 (Deploy)

---

## 1. מטרת המסמך

מסכם את כל הדיון על deployment של ה-Admin Dashboard, כולל:
- מה כבר ידוע (DNS, domain ownership)
- מה עדיין לא ידוע (hosting provider, account setup)
- מה הוחלט שיהיה לטפל בו אחר כך
- ההיררכיה של הסיכונים והדחיפויות

המסמך הזה הוא reference לכל סשן עתידי שיעסוק ב-deployment, ובמיוחד ל-Phase 10 של ה-port package.

---

## 2. מה כבר ידוע ✓

### 2.1 Domain Ownership

| Item | Value |
|---|---|
| Primary domain | `buffadhd.com` |
| Registrar | Namecheap |
| DNS Management | Namecheap (לא Cloudflare, לא אחר) |
| Status | Active, paid |

### 2.2 Existing DNS Records (`buffadhd.com`)

מצב ל-2026-05-04:

| Type | Host | Value | TTL | מטרה |
|---|---|---|---|---|
| A Record | `@` | `185.158.133.1` | 5 min | מצביע על Lovable PWA |
| CNAME | `www` | `parkingpage.namecheap.com.` | 30 min | Namecheap parking — לא בשימוש פעיל |
| TXT | `_lovable` | `lovable_verify=1026421ac32e96d0ff92224f50...` | 5 min | אימות בעלות של Lovable |

**עיקרון:** אין לגעת ב-records הקיימים. הם דרושים ל-`buffadhd.com` להמשיך לעבוד עם Lovable עד שמובייל ב-production (D-2026-05-01-02).

### 2.3 Subdomain Plan ל-Admin

**Decision (2026-05-04):** Admin Dashboard יחיה ב-`admin.buffadhd.com`, לא ב-`buffadhd.com/admin`.

**נדחה: `buffadhd.com/admin`** (path-based) — דורש rewrite/proxy ב-Lovable codebase, מורכב, שביר. מתנגש עם D-2026-05-01-02 (Lovable יישאר חי עד פרודקשן).

**נדחה: `buff-admin.vercel.app`** (default Vercel URL) — לא מקצועי, נצטרך לעבור בעתיד.

**אופציה שנבחרה:** `admin.buffadhd.com` כ-CNAME record חדש.

### 2.4 DNS Record שיתווסף (לא עכשיו)

ב-Phase 10 של ה-port package נוסיף:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME Record | `admin` | (יבוא מ-hosting provider, סביר `cname.vercel-dns.com`) | Automatic |

**סיכון לאתר הקיים:** 0. CNAME על subdomain חדש לא יכול להפריע ל-records קיימים.

**זמן:** 5 דקות הוספה + 5-30 דקות propagation + SSL אוטומטי.

---

## 3. מה לא ידוע / לא הוחלט ⏳

### 3.1 Hosting Provider

**מצב נוכחי (2026-05-04):**
- Adi לא יודעת אם יש לה Vercel account
- לא נבדק עדיין (Adi לא רוצה לבדוק עכשיו, וזה תקין)
- Adi מודעת לכך ש-hosting הוא decision שצריך לטפל בו בעתיד

**אופציות שעדיין על השולחן:**

| # | Provider | יתרונות | חסרונות | מתאים? |
|---|---|---|---|---|
| 1 | **Vercel** | סטנדרט תעשייה ל-Vite/React, free tier נדיב, GitHub integration | account חדש (אם אין) | כנראה הראשון להציע |
| 2 | **Netlify** | דומה ל-Vercel, יתרון: build hooks קלים יותר | קצת פחות פשוט ל-CNAME | חלופה תקינה |
| 3 | **Cloudflare Pages** | חינמי לחלוטין, ביצועים מעולים, לא נדרש account חדש אם יש Cloudflare | UI פחות פשוט מ-Vercel | טוב אם יש כבר Cloudflare |
| 4 | **GitHub Pages** | חינם, אין תלות חיצונית | לא תומך ב-Vite SPA bem-out-of-the-box, צריך workarounds | לא ממליצה ל-MVP |
| 5 | **Same as Lovable** | אם Lovable מהוסטת ב-Vercel/Netlify, אפשר לקנות אותו account | תלוי במה Lovable עושה | תלוי ב-AUDIT |

**Decision deferred ל:** אחרי AUDIT (Phase 1 של ה-port package). CC עשוי לגלות מה Lovable משתמשת.

### 3.2 Custom Domain Verification

חלק מ-providers דורשים אימות בעלות על דומיין לפני SSL. לרוב זה נעשה אוטומטית, אבל לפעמים צריך TXT record נוסף.

**Decision deferred ל:** Phase 10 — נדע איזה record צריך כשנתחיל setup.

### 3.3 Environment Variables ל-Production

ה-Admin צריך לדעת איך להגיע ל-Supabase של mobile:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Decision deferred ל:** Phase 10. נצטרך:
1. ל-locate את הערכים מ-Supabase Dashboard (Adi או CC)
2. להגדיר אותם ב-hosting provider (Vercel/Netlify/etc.)

### 3.4 Build Configuration

`buff-mobile/admin-web/` יהיה Vite project. צריך לוודא ש-hosting provider יודע:
- שזה subdirectory (לא root)
- איזה build command להריץ (`npm run build` בתוך `admin-web/`)
- איזה directory לשרת (`admin-web/dist/`)

**Decision deferred ל:** Phase 2 (workspace setup) של ה-port package.

---

## 4. סיכונים והערכת דחיפות

### 4.1 מה דחוף (לא דוחים)

| Item | מתי | למה |
|---|---|---|
| Lovable PWA נשאר חי | קבוע | D-2026-05-01-02 — לא לפגוע במשתמשים קיימים |
| Subdomain plan = `admin.*` | הוחלט | סוגר את architecture decision |

### 4.2 מה לא דחוף (אפשר לדחות בלי סיכון)

| Item | מתי לטפל | למה אפשר לדחות |
|---|---|---|
| Hosting provider account | Phase 10 (5-10 ימי עבודה) | הקוד של Admin עוד לא קיים. אין מה לדפלוי. |
| DNS record בפועל | Phase 10 | הוספת record בלי ל-deploy = שגיאות עד שיש שרת |
| Env vars setup | Phase 10 | תלוי ב-hosting provider שעדיין לא נבחר |
| Build config | Phase 2 | אחרי שהקוד קיים |

### 4.3 מה אסור לעשות עכשיו

- ❌ להוסיף CNAME `admin` ל-Namecheap לפני ש-hosting מוכן (יחזיר שגיאה)
- ❌ למחוק או לשנות records קיימים ב-Namecheap (ישבור את `buffadhd.com`)
- ❌ להתחיל deploy לפני שיש קוד (אין מה לדפלוי)

---

## 5. תהליך מומלץ ל-Phase 10 (כשנגיע)

זהו ה-runbook שיופעל כשה-port code מוכן:

### Step 1 — בחירת hosting provider
- בדוק AUDIT findings (אם Lovable כבר משתמשת ב-Vercel — שקול שימוש באותו account)
- אם אין preference — לך עם Vercel (הסטנדרט)

### Step 2 — Account setup (אם אין)
- 5 דקות, GitHub OAuth, חינם
- חבר את `buff-mobile` repo

### Step 3 — Project configuration
- Build command: `cd admin-web && npm install && npm run build`
- Output directory: `admin-web/dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Step 4 — First deploy
- Push to `main` → auto-deploy
- Verify live ב-`buff-admin.vercel.app` (או דומה)
- Test: login flow, basic page load

### Step 5 — Custom domain
- ב-hosting provider: Add domain `admin.buffadhd.com`
- ה-provider מציג את הערך המדויק של ה-CNAME
- ב-Namecheap: הוסף CNAME עם הערך המדויק
- המתן 5-30 דקות
- SSL אוטומטי
- Test: `https://admin.buffadhd.com` עובד

### Step 6 — Document
- עדכן את המסמך הזה עם: provider שנבחר, account email, כל credentials שAdi צריכה לשמור
- צור entry ב-DECISIONS_LOG: "D-YYYY-MM-DD-XX: Admin Dashboard hosting on [Vercel/Netlify/etc.]"

---

## 6. Open Questions

1. **Vercel account status** — Adi לא יודעת אם יש לה. תיבדק רק כשנגיע ל-Phase 10.
2. **Lovable hosting** — איפה Lovable PWA מהוסטת? (כנראה Lovable דרך Vite/Netlify/Vercel) — תיבדק ב-AUDIT.
3. **Free tier limits** — האם BUFF traffic יחרוג מ-free tier בעתיד? לא ל-MVP. נחזור אם יהיה צורך.
4. **Email for SSL warnings** — לאיזה email Vercel ישלח התראות SSL/billing/etc.? כנראה `adi.elgarat@gmail.com` (זהה לאדמין login).

---

## 7. Summary

| Topic | Status |
|---|---|
| Domain ownership | ✓ Confirmed (Namecheap) |
| Existing DNS understood | ✓ Audited (3 records, all needed for Lovable) |
| Subdomain plan | ✓ Decided (`admin.buffadhd.com`) |
| Hosting provider | ⏳ Deferred to Phase 10 |
| Vercel account | ⏳ Unknown, will check later |
| DNS record addition | ⏳ Phase 10 (5 min when needed) |
| Risk to existing site | ✓ Zero (subdomain isolation) |

**Bottom line:** Adi has a domain. Adi has a plan for the subdomain. Adi has not yet picked or set up a hosting provider, and that's okay — it's not blocking any current work. We will revisit at Phase 10 of the admin-dashboard-port package, with full information from the AUDIT.

---

**End of document.**
