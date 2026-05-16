# beta-2026-06-01 — Roadmap

> פאזות עם תנאי עצירה מפורשים. כל גבול פאזה הוא שער שניתן לבדוק.
> **טיוטה — פאזות 2-N מותנות בתשובות ל-Q1-Q4 ב-SPEC.md.**

---

## פאזה 0 — Adi עונה על Open Questions

**Scope:**
- קריאת SPEC.md § Open Questions
- מענה ל-Q1 (scope of (b)), Q2 (claim mechanism), Q3 (name matching), Q4 (ambiguity UX)
- אישור מפורש ל-Supabase migration אם Q2 = RPC

**תנאי עצירה (concrete, measurable):**
- כל 4 השאלות נענו ב-SPEC.md (או בעדכון explicit ל-CC)
- אם Q2 = RPC: יש "approved, proceed" ל-Supabase migration

**Exit Deliverables:**
- [ ] SPEC.md מתעדכן עם תשובות (commit נפרד מ-Adi או CC לפי איך שנוח)
- [ ] CC נכנס ל-Plan Mode קצר לעדכון ROADMAP פאזות 1-N
- [ ] CC כותב `TESTS.md` ו-`SPEC_SYNC.md` (לא נכתבו עדיין כדי לא להתחייב על assumptions)

**מצב נוכחי:** `_blocked_` — מחכה ל-Adi.

---

## ⚠️ פאזות 1-N — מותנות בQ1-Q4. הטיוטה כאן היא **תוכנית מותנית**, לא תוכנית סופית.

### תרחיש A: Q1 = drop, Q2 = RPC, Q3 = NFC+lower, Q4 = blocking error *(המלצת CC לכל הארבעה)*

#### פאזה 1 — Supabase RPC `claim_orphan_profile`
- **Scope:**
  - Migration: SECURITY DEFINER function כפי שמופיע ב-SPEC.md § Schema Changes
  - בדיקת RLS שלא נשברה
  - GRANT EXECUTE רק ל-authenticated
- **תנאי עצירה:**
  - Migration applied נקיון ב-Supabase (לא local — staging migration)
  - SQL test: function עובדת ידנית עם 3 cases (no match / single match / ambiguous)
- **Exit Deliverables:**
  - [ ] Migration file ב-`supabase/migrations/`
  - [ ] STATUS.md row
  - [ ] INTEGRATION_LEARNINGS.md אם הפתעות

#### פאזה 2 — Client integration ב-`AuthContext.signUp`
- **Scope:**
  - שינוי [src/contexts/AuthContext.tsx:368-377](../../../src/contexts/AuthContext.tsx) לקרוא ל-RPC לפני INSERT
  - טיפול בכל reason code (`family_not_found`, `no_orphan_match`, `ambiguous_match`, `claimed`)
  - שינוי ב-[src/screens/auth/ChildJoinScreen.tsx](../../../src/screens/auth/ChildJoinScreen.tsx) לקבל את ה-error code החדש ולהציג blocking message (תרחיש A = Q4 blocking error)
- **תנאי עצירה:**
  - 3 idle cases עוברים ידנית באמולטור:
    1. Orphan קיים → child תובע, נכנס ל-ChildApp עם ה-tasks וה-rewards
    2. אין orphan → INSERT חדש, child נכנס ל-profile חדש
    3. Ambiguous → child רואה את הblocking message ב-Hebrew
- **Exit Deliverables:**
  - [ ] שינויי קוד
  - [ ] Hebrew copy ב-i18n (`auth.orphanAmbiguous`)
  - [ ] STATUS.md row
  - [ ] עדכון GAP_ANALYSIS לסגירת IN-2026-05-14-03
  - [ ] Values Check passed (verified)

#### פאזה 3 — Closeout
- **Scope:**
  - עדכון FLAGs ב-CLAUDE.md:
    - הסרת FLAG IN-2026-05-14-03 (closed)
    - הסרת FLAG F-2026-05-03-03 (CLOSED-NOT-APPLICABLE per Q1=drop)
  - עדכון INTEGRATION_LEARNINGS.md עם entry IN-2026-05-16-01 שמסכם
  - Git tag `pkg/beta-2026-06-01/v1`
- **תנאי עצירה:**
  - PR ל-main, fast-forward merge
  - Verify-Before-Delete protocol עבר לפני מחיקת branch
- **Exit Deliverables:**
  - [ ] PR merged
  - [ ] STATUS.md closeout checklist הושלם

---

### תרחיש B: Q1 = drop, Q2 = parent banner only

#### פאזה 1 — Build "Claim Child" banner ב-ParentHome
- **Scope:**
  - Component חדש שמשתמש ב-`useUnlinkedChildren` ([src/hooks/useUnlinkedChildren.ts](../../../src/hooks/useUnlinkedChildren.ts))
  - מציג banner כאשר `unlinked.length > 0 && linkable.length > 0`
  - Copy: "ראינו שדני הצטרף. האם זה אותו דני שיצרת ב-onboarding? [כן, חברו] [לא]"
  - קורא ל-`linkChild` בלחיצה
- **תנאי עצירה:**
  - Banner מופיע כשorphan + child-signup duplicate קיימים
  - לחיצה "כן" מאחדת ומסירה את ה-duplicate
  - לחיצה "לא" dismiss persistent (לא חוזר באותו session)
- **Exit Deliverables:**
  - [ ] Component code
  - [ ] Hebrew + English copy
  - [ ] STATUS.md row

#### פאזה 2 — Closeout (כמו תרחיש A פאזה 3)

---

### תרחיש C: Q1 = constants only, Q2 = RPC

#### פאזה 1 — `src/constants/ageRanges.ts`
- **Scope:**
  - יצירת קובץ עם `TEEN_MIN_AGE`, `TEEN_MAX_AGE`, `getModeFromAge(birthDate)` helper
  - בלי call sites — defensive בלבד
  - Unit test ל-helper (אם יש Jest config)
- **תנאי עצירה:**
  - קובץ נוצר, helper מחזיר 'teen' לגיל 13-17 ו-'child' אחרת
- **Exit Deliverables:**
  - [ ] קובץ קוד
  - [ ] Test אם רלוונטי
  - [ ] STATUS.md row

#### פאזות 2-3 — כמו תרחיש A (RPC + integration + closeout)

---

### תרחיש D: Q1 = re-cut buckets

#### פאזה 1 — Bucket refactor
- **Scope (גדול):**
  - שינוי `AgeGroup` ב-[src/screens/onboarding/unified/onboardingData.ts:14](../../../src/screens/onboarding/unified/onboardingData.ts) מ-`'6-8'|'9-11'|'12-14'|'15-18'` ל-`'6-8'|'9-12'|'13-17'`
  - עדכון `OPTIONS_BY_AGE` (3 buckets במקום 4)
  - עדכון `REWARD_PICKS` (5 motivators × 3 buckets = 15 entries; היום 20)
  - עדכון [src/screens/onboarding/unified/UStep1_ChildProfile.tsx:17](../../../src/screens/onboarding/unified/UStep1_ChildProfile.tsx) `AGE_GROUPS`
  - migration consideration: profiles קיימים עם `pro_settings.age_group` ישן — האם migrate? (תלוי כמה accounts יש)
- **תנאי עצירה:**
  - Onboarding flow עובד ב-Expo web עם כל 3 ה-buckets
  - אין profiles קיימים שנשברים (verified via SQL count)
- **Exit Deliverables:**
  - [ ] שינויי קוד
  - [ ] Migration לprofiles קיימים אם נחוץ
  - [ ] עדכון DECISIONS_LOG עם החלטה D-2026-05-16-XX
  - [ ] STATUS.md row

#### פאזות 2-3 — כמו תרחיש A (RPC + integration + closeout)

---

## Closeout (משותף לכל התרחישים)

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md (ייכתב אחרי Q1-Q4)
- [ ] Git tag נוצר (`pkg/beta-2026-06-01/v1`)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge
- [ ] Verify-Before-Delete protocol עבר לפני מחיקת branch
- [ ] FLAG entries ב-CLAUDE.md מעודכנים (Adi מאשרת — CC לא משנה את CLAUDE.md ללא אישור)

---

**Drafted:** 2026-05-16 by CC. פאזות 1-N תקפות רק לתרחיש המתאים לתשובות Adi.
