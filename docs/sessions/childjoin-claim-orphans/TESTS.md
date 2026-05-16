# beta-2026-06-01 — Tests

> קריטריוני pass/fail לכל פאזה. **קונקרטי וניתן לאימות.**
> תרחיש A: drop (b) + RPC + NFC matching + blocking error.

## איך מריצים בדיקות

- **RPC tests (פאזה 1):** CC מריץ SQL ידנית דרך Supabase MCP `execute_sql`.
- **Client tests (פאזה 2):** CC עושה smoke test ב-Expo web ([npm run web](../../../package.json)). Adi עושה verification ידני באמולטור Android עם 2 חשבונות (parent + child) — auth flows קשים לאוטומציה.
- **Doc tests (פאזה 3):** ידני — בדיקה ש-IN-2026-05-14-03 ו-F-2026-05-03-03 שניהם מסומנים `RESOLVED` ב-INTEGRATION_LEARNINGS.

---

## פאזה 1 — RPC `claim_orphan_profile` + `preflight_claim_orphan`

### בדיקות אוטומטיות (CC מריץ דרך execute_sql)

**Setup state בתוך transaction (rollback בסוף):**
```sql
BEGIN;
-- Create test family
INSERT INTO families (id, name, short_code, preferred_language)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'TestFam', 'TEST01', 'he');
```

**Test 1.1 — No orphan, preflight returns `no_orphan_match`**
```sql
SELECT public.preflight_claim_orphan('TEST01', 'דני');
-- Expected: {"claimed": false, "reason": "no_orphan_match"}
```

**Test 1.2 — Single exact NFC match, preflight returns `match_found`**
```sql
INSERT INTO profiles (family_id, display_name, role, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'דני', 'child', NULL);

SELECT public.preflight_claim_orphan('TEST01', 'דני');
-- Expected: {"claimed": false, "reason": "match_found"}

SELECT public.preflight_claim_orphan('TEST01', '  דני  ');
-- Expected: {"claimed": false, "reason": "match_found"} (trim applied)
```

**Test 1.3 — Case insensitivity (Latin)**
```sql
INSERT INTO profiles (family_id, display_name, role, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Dani', 'child', NULL);

SELECT public.preflight_claim_orphan('TEST01', 'dani');
-- Expected: {"claimed": false, "reason": "ambiguous_match", "count": 2}
-- (matches both דני and dani — but dani matches Dani case-insensitively, and דני is also unmatched orphan = ambiguous)

-- Actually we need to think — דני and Dani are different by NFC. Let me re-test:
-- Test: only "Dani" exists
DELETE FROM profiles WHERE display_name = 'דני';
SELECT public.preflight_claim_orphan('TEST01', 'dani');
-- Expected: {"claimed": false, "reason": "match_found"}
```

**Test 1.4 — Ambiguous match (2 orphans, same NFC)**
```sql
INSERT INTO profiles (family_id, display_name, role, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Yossi', 'child', NULL);
INSERT INTO profiles (family_id, display_name, role, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'yossi', 'child', NULL);

SELECT public.preflight_claim_orphan('TEST01', 'YOSSI');
-- Expected: {"claimed": false, "reason": "ambiguous_match", "count": 2}
```

**Test 1.5 — Cross-script candidate exists (no NFC match but orphan present)**
```sql
DELETE FROM profiles WHERE family_id = 'aaaaaaaa-0000-0000-0000-000000000001';
INSERT INTO profiles (family_id, display_name, role, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'דני', 'child', NULL);

SELECT public.preflight_claim_orphan('TEST01', 'Dani');
-- Expected: {"claimed": false, "reason": "cross_script_candidate_exists"}
```

**Test 1.6 — Family not found**
```sql
SELECT public.preflight_claim_orphan('NONE99', 'דני');
-- Expected: {"claimed": false, "reason": "family_not_found"}
```

**Test 1.7 — Claim mutation (requires auth.uid())**
```sql
-- Run as a real authenticated user via the client. SQL test placeholder:
-- SET LOCAL request.jwt.claim.sub = '<test user uuid>';
-- SELECT public.claim_orphan_profile('TEST01', 'דני');
-- Expected: {"claimed": true, "profile_id": "<uuid>"}
-- AFTER: profile.user_id = test user, count = 1 (no duplicate)
```

**Test 1.8 — Cleanup**
```sql
ROLLBACK;
```

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=1, state=passed
- [ ] Migration file ב-`supabase/migrations/` נוכח באותו commit
- [ ] INTEGRATION_LEARNINGS.md עודכן אם היו הפתעות (e.g. RLS interaction, GRANT mishap)

---

## פאזה 2 — Client Integration

### בדיקות אוטומטיות (CC ב-Expo web)

CC ירוץ `npm run web` ויאמת באמצעות Claude_Preview MCP:
- [ ] Screen renders ללא קונסול errors
- [ ] Submit triggers הRPC call (network tab — `rpc/preflight_claim_orphan` request)
- [ ] בתחילת זרימה (לא signed in), preflight נקרא בלי טוקן

**הגבלה:** Expo web אינו תומך באמת ב-deep-link OAuth flows ו-blocked על Supabase auth signUp ל-`@buff.app` emails. הflow המלא של ChildJoin צריך אמולטור Android. **CC לא יסיים פאזה 2 כ-passed עד שAdi מאמתת ידנית.**

### בדיקות ידניות באמולטור (Adi)

**Setup:**
1. Parent account A — צור chess via Expo Go / Android emulator. עבור onboarding מלא ב-UStep5_Preview עם childName="דני".
2. הוצא את ה-family code מה-app (Parent home → Family settings) → e.g. `XK7M2P`.

**Test 2.1 — Happy path A: exact NFC match**
- [ ] Logout parent
- [ ] בחר "ChildJoin" → הקלד `name="דני"`, `familyCode="XK7M2P"`
- [ ] לחץ "Join"
- [ ] **Expected:** נכנס ל-ChildApp. רואה את ה-tasks שההורה הגדיר (Morning Routine, Homework, etc.) + ה-rewards.
- [ ] **Verify:** ב-Supabase Studio או דרך MCP `SELECT * FROM profiles WHERE family_id = '<id>'` — רק row אחד עם `display_name='דני'`, `user_id=<child auth uid>`, לא NULL.

**Test 2.2 — Happy path B: no orphan**
- [ ] צור family חדשה Parent B + onboarding **חצוי** (signup בלבד, לא עשה UStep5)
- [ ] הוצא family code
- [ ] Logout, "ChildJoin" → `name="יוסי"`, family code → Join
- [ ] **Expected:** נכנס ל-ChildApp עם profile ריק (אין tasks). אין error.
- [ ] **Verify:** רק row אחד ב-profiles עם `display_name='יוסי'`, `user_id=<child auth uid>`.

**Test 2.3 — Cross-script blocking**
- [ ] חזור ל-Parent A (family עם orphan "דני")
- [ ] Logout, "ChildJoin" → `name="Dani"`, `familyCode="XK7M2P"`
- [ ] **Expected:** error message מופיע ב-Hebrew: "מצאנו פרופיל קיים במשפחה הזו שיכול להיות שלך. בקש מההורה לוודא את השם ונסה שוב."
- [ ] **Verify:** אין profile חדש שנוצר. ה-auth user שנוצר ב-auth.signUp **לא** נוצר (preflight חוסם לפני).

**Test 2.4 — Ambiguous match**
- [ ] עם Adi-Parent A: ב-Supabase Studio, ידני: INSERT עוד orphan ב-family עם display_name="דני" (לסימולציה)
- [ ] Logout, "ChildJoin" → `name="דני"`, family code → Join
- [ ] **Expected:** אותו error message כמו 2.3
- [ ] **Verify:** 2 ה-orphans עדיין שם, לא נוצרו row חדשים

**Test 2.5 — Invalid family code (regression)**
- [ ] "ChildJoin" → `name="X"`, `familyCode="BADCODE"` → Join
- [ ] **Expected:** "קוד משפחה לא נמצא" (existing copy, לא תקול)

### Values Check verification (post-implementation)
- [ ] Pillar 2 — copy של ה-error לא משפיל, לא מאשים את הילד. Verify: "בקש מההורה לוודא את השם" — empathic, lays cause on the system/parent, not the kid. ✅
- [ ] Pillar 3 — האם לילד יש קול? במצב blocking — לא ישיר. אבל ברירת המחדל (NFC match) נותנת לילד עצמאות מלאה. רק edge cases נופלים ל-parent. ✅
- [ ] Pillar 1 — Intrinsic motivation לא נפגע; אם משהו, המצב משופר (הילד שומר את ה-rewards שההורה הגדיר). ✅

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=2, state=passed
- [ ] Values Check passed (verified above)

---

## פאזה 3 — Closeout

### בדיקות אוטומטיות
- [ ] grep ב-docs/INTEGRATION_LEARNINGS.md: `IN-2026-05-14-03` בסטטוס `RESOLVED`
- [ ] grep ב-docs/INTEGRATION_LEARNINGS.md: `F-2026-05-03-03` בסטטוס `RESOLVED — CONFIRMED-NOT-APPLICABLE`
- [ ] git tag exists: `pkg/beta-2026-06-01/v1`

### בדיקות ידניות (Adi)
- [ ] Adi קוראת את ה-2 closure entries לפני merge
- [ ] Adi מסירה ידנית את ה-FLAGs מ-CLAUDE.md (CC מציע diff, Adi מבצעת)
- [ ] PR ל-main merged

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md closeout checklist הושלם
- [ ] Verify-Before-Delete protocol עבר לפני מחיקת branch (per CLAUDE.md § Verify-Before-Delete)
- [ ] Adi מאמתת ידנית במצב production: ChildJoin עובד end-to-end עם orphan קיים

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag נוצר
- [ ] אין drift בין canonical docs לבין המערכת החיה
- [ ] בדיקת end-to-end ידנית באמולטור — ChildJoin flow המלא עובד
