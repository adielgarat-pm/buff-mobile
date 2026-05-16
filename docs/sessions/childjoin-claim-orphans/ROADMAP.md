# beta-2026-06-01 — Roadmap

> פאזות עם תנאי עצירה מפורשים. כל גבול פאזה הוא שער שניתן לבדוק.
> **התרחיש שנבחר: A (CC's recommended path)** — Q1=drop / Q2=RPC / Q3=NFC+lower / Q4=blocking error.
> אומת ב-2026-05-16 דרך "do them all" של Adi.

---

## פאזה 0 — Open Questions [✅ PASSED 2026-05-16]

**Scope:** Adi עונה על Q1-Q4 ב-SPEC.md § Open Questions.

**תוצאה:** כל ה-4 נענו. הבנדל נמשך לפי תרחיש A.

---

## פאזה 1 — Supabase RPC `claim_orphan_profile`

**Scope:**
- Migration: SECURITY DEFINER function כפי שמופיע ב-SPEC.md § Schema Changes
- Implementation עם Q3 = trim + NFC + lower
- Q1 case: 0 matches → return `{claimed:false, reason:'no_orphan_match'}` (client עושה INSERT רגיל)
- 1 match → UPDATE atomically, return `{claimed:true, profile_id:...}`
- 2+ matches → return `{claimed:false, reason:'ambiguous_match', count:N}` (client מציג blocking error)
- Cross-script case (`דני` orphan, child input `Dani`): נופל ל-`no_orphan_match` (Q3 לא חוצה scripts) — *זה מתאים ל-blocking-error UX של Q4 אבל ב-fallthrough היום ייצור duplicate*. ראי § Cross-script handling למטה.
- REVOKE EXECUTE FROM PUBLIC; GRANT EXECUTE TO authenticated

**Cross-script handling:** הRPC צריך גם להחזיר reason ספציפי `cross_script_candidate_exists` במקרה של 0 NFC-matches אבל יש orphan קיים ב-family עם cyrillic/Hebrew/Latin-only display_name שייתכן וזה אותו ילד. אחרת blocking error לא ייפעל ב-cross-script case. **הוספה לדרוש בPhase 1:**
- מלא: בדיקת `count(*) FROM profiles WHERE family_id=X AND role='child' AND user_id IS NULL`
- אם 0 → `no_orphan_match` (INSERT חדש)
- אם >0 ובאף אחד מהם אין NFC-match על display_name → `cross_script_candidate_exists` (blocking error)

**תנאי עצירה (concrete, measurable):**
- Migration applied נקיון ב-production Supabase
- SQL test passes ל-4 cases:
  1. No orphans in family → `no_orphan_match`
  2. Exact NFC match → `claimed:true`
  3. 2 orphans both matching → `ambiguous_match`
  4. 1 orphan exists, NFC ≠ input → `cross_script_candidate_exists`

**Exit Deliverables:**
- [ ] Migration file ב-`supabase/migrations/` (אם הconvention)
- [ ] Function applied ל-production
- [ ] SQL test results מתועדים בכאן (commit message)
- [ ] STATUS.md row לפאזה 1 = `_passed_`
- [ ] INTEGRATION_LEARNINGS.md אם הפתעות

---

## פאזה 2 — Client Integration

**Scope:**
- שינוי [src/contexts/AuthContext.tsx:368-377](../../../src/contexts/AuthContext.tsx) — קריאה ל-`claim_orphan_profile` RPC לפני INSERT, רק כאשר `role === 'child' && familyCode`
- טיפול ב-4 reason codes:
  - `claimed:true` → `refreshProfile`, return success
  - `no_orphan_match` → INSERT רגיל (today's flow)
  - `ambiguous_match` → throw structured error
  - `cross_script_candidate_exists` → throw structured error
- שינוי [src/screens/auth/ChildJoinScreen.tsx](../../../src/screens/auth/ChildJoinScreen.tsx) `handleJoin` לזהות error.message כתואם ל-`ambiguous_match` / `cross_script_candidate_exists` ולהציג blocking copy
- i18n strings ב-[src/i18n/he.json](../../../src/i18n/he.json) ו-[src/i18n/en.json](../../../src/i18n/en.json):
  - `auth.orphanAmbiguous` — "מצאנו פרופיל קיים במשפחה הזו שיכול להיות שלך. בקש מההורה לוודא את השם ונסה שוב."

**תנאי עצירה — ידני באמולטור Android (Adi מאמתת):**
1. **Happy path A — exact match:** parent יוצר orphan "דני" → child מקליד "דני" + family code → נכנס ל-ChildApp עם ה-tasks וה-rewards שההורה הגדיר. אין duplicate profile.
2. **Happy path B — no orphan:** parent עוד לא עשה onboarding, child מקליד "Yossi" + family code → INSERT חדש, profile ריק כמו היום.
3. **Cross-script blocking:** parent יוצר orphan "דני" → child מקליד "Dani" + family code → blocking error מופיע ב-Hebrew, אין profile חדש, גם ה-auth user נמחק (rollback) או נשאר orphan auth (TBD — ראי § Auth Cleanup למטה).
4. **Ambiguous:** parent יוצר 2 orphans באותו שם → child מקליד אותו שם → blocking error.

**Auth Cleanup question:** אם blocking error הופיע אחרי `supabase.auth.signUp` — ה-auth.user כבר נוצר. נופל ל-orphan auth user. שתי אופציות:
- (i) Sign out + return error → user יישאר ב-auth.users ללא profile = state messy.
- (ii) פתרון: לעשות את ה-RPC check לפני ה-auth.signUp. Pre-validation: `claim_orphan_profile_dry_run(family_code, display_name)` שמחזיר את אותו reason אבל בלי לעשות UPDATE. רק אם תוצאה היא `claimed` או `no_orphan_match` → ממשיכים ל-auth.signUp.
- **בחירת CC:** אופציה (ii). דורש 2 RPC functions או param `dry_run` ב-function אחת. ייושם ב-Phase 1.

**Exit Deliverables:**
- [ ] שינויי קוד ב-AuthContext.tsx, ChildJoinScreen.tsx
- [ ] i18n strings ב-Hebrew + English
- [ ] STATUS.md row לפאזה 2
- [ ] Values Check verified post-implementation (Hebrew copy עובר Pillar 2 — empathy, לא pressure)

---

## פאזה 3 — Closeout

**Scope:**
- עדכון [docs/INTEGRATION_LEARNINGS.md](../../INTEGRATION_LEARNINGS.md):
  - IN-2026-05-14-03 → `RESOLVED` עם תאריך + commit hash
  - F-2026-05-03-03 → `RESOLVED — CONFIRMED-NOT-APPLICABLE` עם הסבר
  - הוספת IN-2026-05-16-XX entry שמסכם את הבנדל (RPC, normalization, blocking-error UX)
- **לא** משנה את CLAUDE.md FLAGs — Adi עושה את זה (CC לא משנה את CLAUDE.md ללא אישור)
- **לא** מעדכן את BUFF_DECISIONS_LOG.md — Adi עושה (decisions doc)
- עדכון BUFF_GAP_ANALYSIS.md אם רלוונטי (TBD — בדיקה בPhase 3)
- Git tag `pkg/beta-2026-06-01/v1`

**תנאי עצירה:**
- PR ל-main, fast-forward merge
- Verify-Before-Delete protocol עבר לפני מחיקת branch (per CLAUDE.md § Verify-Before-Delete Protocol)

**Exit Deliverables:**
- [ ] INTEGRATION_LEARNINGS.md מעודכן (2 closures + 1 new entry)
- [ ] PR opened, merged
- [ ] STATUS.md closeout checklist הושלם
- [ ] Tag נוצר
- [ ] Diff מ-CLAUDE.md FLAGs proposed ל-Adi (CC מציג, Adi מבצעת)

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (`pkg/beta-2026-06-01/v1`)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge
- [ ] Verify-Before-Delete protocol עבר לפני מחיקת branch
- [ ] FLAG entries ב-CLAUDE.md מעודכנים (Adi מאשרת — CC לא משנה את CLAUDE.md ללא אישור)
