# beta-2026-06-01 — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.
> **טיוטה** — חלקים תלויים בתשובות Adi ל-§ Open Questions (Q1-Q4).

---

## Capabilities & Bottlenecks

### מה Claude.ai (web) יכולה
- לעצב UX לbanner של "duplicate profile detected" אם Q2 = parent banner
- לעצב copy ל-error states ול-success messages
- להכריע על נירמול שמות מפרספקטיבת user-trust ו-Values

### מה Claude Code (CC) יעשה
- כתיבת RPC ב-Supabase (אם Q2 = RPC) — schema, function body, RLS-bypass logic
- שינויי קוד ב-`AuthContext.signUp` ו/או `ChildJoinScreen.handleJoin`
- אם Q1 = constants — יצירת `src/constants/ageRanges.ts` ו-helper
- אם Q1 = re-cut buckets — עדכון `onboardingData.ts` + UStep1 picker + כל ה-records של options/rewards
- בדיקה ידנית של ה-flow ב-Expo web (auth-gated flows מצריכים אישור של Adi באמולטור)
- עדכוני canonical docs לפי SPEC_SYNC.md

### מה Adi חייבת לעשות בעצמה
- לענות על Q1-Q4 — חוסם פיתוח
- אישור מפורש ל-Supabase migration אם Q2 = RPC
- בדיקה ידנית באמולטור Android של זרימת ChildJoin המלאה
- עדכון FLAG ב-CLAUDE.md אחרי closeout (CC לא משנה את CLAUDE.md ללא אישור)
- מחיקת ה-FLAG של F-2026-05-03-03 מ-CLAUDE.md אם Q1 = drop

### צוואר בקבוק / נקודות עצירה צפויות
- **תשובות Q1-Q4** — בלעדיהן אין plan ביצועי
- **Supabase migration approval** — אם Q2 = RPC
- **רובסטיות בדיקה ידנית** — auth flows קשים לאוטומציה, צריך אמולטור עם 2+ accounts (parent + child)

---

## Values Check

### על (a) — ChildJoin Orphan Reconciliation

**Pillar 1 — Intrinsic Motivation**

1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   תשובה: ✅ כן. הילד לא מודע ל-"feature" כאן — הוא פשוט מצפה שהשם וההורה שלו יעבדו ביחד. אם תהיה תוצאה הפוכה (duplicate, profile ריק), הילד מרגיש שהאפליקציה "שכחה אותו".

2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   תשובה: ⚠️ בעיה ישירה במצב הנוכחי. ה-orphan profile כולל את ה-tasks וה-rewards שההורה בחר ב-onboarding. אם CC לא מאחד אותם, הילד נכנס ל-profile ריק ולא רואה את התוכנית שהוכנה לו — מאבד את ה-rewards שההורה כבר הגדיר.

3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?**
   תשובה: ניטרלי. תיקון תקלה ב-backend, לא משנה את ה-affect של ההתנסות.

**Pillar 2 — Positive Coaching**

1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   תשובה: שאלה לתלות ב-Q4 (UX לambiguity). אם UX = blocking error "ask your parent", צריך copy שלא מאשים את הילד. **Open: ניסוח Hebrew אינו עדיין נקבע.**

2. **אם הילד נכשל — האם התגובה היא empathy או pressure?**
   תשובה: אם match אמביגואלי → empathy ("נראה שיש פרופיל שיכול להיות שלך — בקש מההורה לאשר"), לא pressure ("פרופיל לא נמצא, נסה שוב").

3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?**
   תשובה: לא רלוונטי — אין BUDDY ב-flow הזה.

**Pillar 3 — Independence-Building**

1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   תשובה: ניטרלי — תיקון תקלה.

2. **האם לילד יש קול בפיצ'ר?**
   תשובה: ⚠️ תלוי ב-Q4. אם UX = picker, הילד בוחר ("האם אתה דני / Daniel / אף אחד מאלה?") = יש קול. אם blocking error, הקול הוא של ההורה בלבד. **המלצה לעקביות עם BUFF_VALUES:** picker אם פתיר טכנית, blocking אם לא.

3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?**
   תשובה: עוד הכרחי — זה לא feature אלא תיקון מצב שגוי בstate management. עוד 6 חודשים, חבילות חדשות יפנו לזה כ-default behavior.

**Values Check Pass עבור (a):** [ ] כן / [ ] לא — תלוי בQ4. ✅ Pass אם Q4 = picker או fall-through ל-parent banner; ⚠️ Conditional Pass אם Q4 = blocking error (תלוי בcopy).

### על (b) — Teen Age Range

**Pillar 1 — Intrinsic Motivation**
תשובה: אין relevance ישיר — תיקון defensive בלבד, או no-op אם Q1 = drop. ✅ Pass.

**Pillar 2 — Positive Coaching**
תשובה: אין relevance ישיר. ✅ Pass.

**Pillar 3 — Independence-Building**
תשובה: אם Q1 = re-cut buckets — כן יש relevance. שינוי gap שמפצל 12-14 ל-9-12 + 13-17 פוטנציאלית משפר את matching של options ל-stage development של הילד. בכל אופציה אחרת — אין relevance. ✅ Pass.

**Values Check Pass עבור (b):** ✅ כן בכל אופציה.

---

## Goals

### (a) ChildJoin Orphan Reconciliation
- כשילד עם valid family code מקליד שם שמתאים ל-orphan קיים — לא נוצר profile כפול
- ה-orphan מקבל `user_id = auth.uid()` של הילד החדש
- ה-tasks וה-rewards שההורה הגדיר ב-onboarding נשארים על אותו profile
- אם המנגנון נכשל / ambiguous — UX ברור (תלוי Q4)

### (b) Teen Age Range
**(מותנה Q1)**
- אם `drop`: FLAG מתועד כ-CLOSED-NOT-APPLICABLE, אין שינויי קוד
- אם `constants only`: `src/constants/ageRanges.ts` נוצר, ערכים מרוכזים
- אם `re-cut buckets`: buckets ב-onboardingData תואמים ל-spec 13-17

## Non-goals

- ❌ לעצב Teen UI mode-detection (work נפרד, חבילת `pkg/teen-ui-my-stats-full` כבר פתוחה)
- ❌ לשנות Schema של `families` או `tasks`
- ❌ Subscription/RevenueCat work
- ❌ לבנות BUDDY interactions
- ❌ לתקן את ChildJoin UX כללית (רק orphan reconciliation)
- ❌ לטפל בלוגיקה של username collision ב-`@buff.app` email (קיים TODO נפרד)
- ❌ לעדכן את `src/screens/onboarding/unified/UStep5_Preview.tsx` שגם הוא לא עושה normalization של `params.childName` — outside scope אלא אם Q3 קובע אחרת

---

## Behavior Contract

### (a) ChildJoin — End-to-end flow אחרי שהחבילה נסגרת

תרחיש מרכזי:
1. Parent עושה onboarding ב-UStep5_Preview → נוצר orphan profile עם `family_id=F`, `display_name="דני"`, `user_id=null`
2. Parent משתף family code עם הילד
3. Child בוחר "ChildJoin" → מקליד `name="דני"` + family code
4. **חדש:** signup ל-auth מצליח; לפני INSERT — query ל-orphan בfamily לפי normalized display_name
5. **אם match יחיד:** UPDATE orphan SET user_id=auth.uid(). אין INSERT חדש. ה-tasks וה-rewards נשארים.
6. **אם 0 matches:** INSERT חדש כמו היום.
7. **אם 2+ matches או cross-script ambiguity:** UX לפי Q4.
8. RootNavigator מזהה session ו-`profile.role === 'child'` → ילד נכנס ל-ChildApp עם ה-tasks וה-rewards שההורה הגדיר.

### (b) Teen Age Range — End-to-end

תלוי Q1. ראי § Open Questions.

---

## Schema Changes

> **תלוי Q2.** אם `RPC`:

```sql
-- Migration: claim_orphan_profile RPC (SECURITY DEFINER)
-- מטרה: לאפשר ל-child user טרי לתבוע orphan profile בfamily שלו
-- אבטחה: דורש שילוב של (a) match על family_code (b) match על normalized display_name
-- אטומיות: SELECT + UPDATE + DELETE בfunction אחת

CREATE OR REPLACE FUNCTION public.claim_orphan_profile(
  p_family_code text,
  p_display_name text,
  p_new_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_family_id  uuid;
  v_orphan_id  uuid;
  v_match_count int;
  v_normalized text;
BEGIN
  -- Step 1: resolve family by code (case-insensitive on short_code)
  SELECT id INTO v_family_id
  FROM families
  WHERE upper(short_code) = upper(trim(p_family_code))
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'family_not_found');
  END IF;

  -- Step 2: normalize display_name (תלוי Q3 — placeholder: trim+lower+NFC)
  v_normalized := lower(normalize(trim(p_display_name), NFC));

  -- Step 3: find matching orphan(s)
  SELECT count(*), max(id) INTO v_match_count, v_orphan_id
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized;

  IF v_match_count = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_orphan_match');
  ELSIF v_match_count > 1 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'ambiguous_match', 'count', v_match_count);
  END IF;

  -- Step 4: claim atomically
  UPDATE profiles
  SET user_id = p_new_user_id,
      updated_at = now()
  WHERE id = v_orphan_id;

  RETURN jsonb_build_object('claimed', true, 'profile_id', v_orphan_id);
END;
$$;

-- Grant for authenticated users only
REVOKE EXECUTE ON FUNCTION public.claim_orphan_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_orphan_profile TO authenticated;
```

**אם Q2 = parent banner only:** אין schema change. משתמשים ב-`useUnlinkedChildren` הקיים.

**אם Q2 = broaden RLS:** מסוכן, ראי § Open Questions Q2 נגד-המלצה.

---

## API / Route Changes

### Client side

**אם Q2 = RPC** — שינויים ב-[src/contexts/AuthContext.tsx:368-377](../../../src/contexts/AuthContext.tsx):

```typescript
// במקום:
const { error: profileError } = await supabase.from('profiles').insert({ ... });

// יהיה:
if (familyCode && role === 'child') {
  const { data: claimResult } = await supabase.rpc('claim_orphan_profile', {
    p_family_code: familyCode,
    p_display_name: displayName,
  });
  if (claimResult?.claimed) {
    // No INSERT needed — orphan was claimed
    await refreshProfile(authData.user.id);
    return { error: null };
  }
  if (claimResult?.reason === 'ambiguous_match') {
    // תלוי Q4: יהיה blocking error / picker / fall-through
  }
}
// fall-through to INSERT (no orphan match)
const { error: profileError } = await supabase.from('profiles').insert({ ... });
```

**אם Q2 = parent banner only:**
- Signup ללא שינוי
- New component: banner ב-ParentHome שמשתמש ב-`useUnlinkedChildren.linkChild` כאשר `unlinked.length > 0 && linkable.length > 0`

---

## UI Changes

### Banner ל-Parent (Q2 = parent banner only)
- Location: Parent's home screen, top
- Copy (טיוטה Hebrew):
  > "שמנו לב שדני הצטרף למשפחה. האם זה אותו דני שיצרת ב-onboarding?
  > [כן, חברו לפרופיל הקיים] [לא, זה ילד אחר]"
- אם "כן" → קורא ל-`linkChild`; אם "לא" → dismiss

### Child error UX (Q4 = blocking error)
- Copy:
  > "מצאנו פרופיל קיים במשפחה הזו שיכול להיות שלך. בקש מההורה שלך לוודא את השם ונסה שוב."
- שום duplicate לא נוצר
- כפתור "חזור"

### Child picker UX (Q4 = picker)
- Copy:
  > "האם אחד מאלה זה אתה?"
- רשימה של orphan display_names (כולל הילדים האחרים במשפחה — שיקול privacy)
- "אף אחד מאלה" → INSERT חדש

---

## Open Questions

> **קריטי.** ארבעת השאלות האלו חוסמות את הביצוע. CC לא ימשיך עד שכל אחת תיענה.
> בכל שאלה: סמני [x] על האופציה שבחרת, או כתבי תשובה חופשית ליד "**תשובת Adi:**".

### Q1 — Scope של (b) Teen Age Range

**רקע:** חיפוש מקיף לא מצא hardcoding של `13-15` באף מקום בקוד. F-2026-05-03-03 כבר `CLOSED — STALE`. הFLAG בCLAUDE.md מציין "needs revisit pending Teen Mode UI start" אבל המצב היום:
- Mode detection: role-based (`profile.role === 'child'`), לא age-based
- Onboarding buckets: `'6-8' | '9-11' | '12-14' | '15-18'`
- Teen UI work קיים בחבילה נפרדת: `pkg/teen-ui-my-stats-full`

**אופציות:**

- [x] **Drop (b) — confirm CLOSED-NOT-APPLICABLE** *(המלצת CC — נבחר 2026-05-16)*
  - מסיר את ה-FLAG מ-CLAUDE.md (Adi עושה, לא CC)
  - מוסיף entry verified-clean ב-INTEGRATION_LEARNINGS
  - לא מוסיף קוד שאף אחד לא קורא לו
  - הבנדל מצטמצם ל-(a) בלבד
- [ ] **Add defensive `src/constants/ageRanges.ts`**
- [ ] **Re-cut onboarding age buckets ל-13-17 alignment**
- [ ] **Other**

**תשובת Adi:** Drop. אומת ב-`do them all` 2026-05-16. CC מקרצב כך שהבנדל מצטמצם ל-(a) בלבד.

---

### Q2 — מנגנון Claim ל-(a)

**רקע:** RLS חוסם UPDATE של orphan על-ידי child user. צריך אחד מהבאים כדי לעשות auto-claim.

**אופציות:**

- [x] **`SECURITY DEFINER` RPC `claim_orphan_profile`** *(המלצת CC — נבחר 2026-05-16)*
  - Atomic server-side claim עם validation מובנה (family_code + normalized display_name)
  - לא מרחיב RLS באופן רחב — keeps surface area תחום
  - SQL מלא בסעיף § Schema Changes למעלה
- [ ] **Broaden RLS — child יכול UPDATE orphan ב-family שלו**
- [ ] **No auto-claim — surface duplicate ל-Parent דרך banner**
- [ ] **Other**

**תשובת Adi:** RPC. אומת ב-`do them all` 2026-05-16. Supabase migration approved.

---

### Q3 — אסטרטגיית התאמת `display_name`

**רקע:** ה-orphan נוצר עם הקלדה של ההורה. הילד מקליד עצמאית. ההבדל יכול להיות case ("Dani" vs "dani"), trim, או diacritics ב-Hebrew.

**אופציות:**

- [x] **Trim + Unicode NFC + case-insensitive** *(המלצת CC — נבחר 2026-05-16)*
  - `lower(normalize(trim(display_name), NFC))` בשני הצדדים
  - חזק ל-Hebrew diacritics ול-Latin casing
  - **לא חוצה scripts** — `דני` לא יזוהה כ-`Dani` → נופל ל-Q4 logic
- [ ] **Trim בלבד — שומר case**
- [ ] **NFC + case-insensitive + cross-script confusable detection**
- [ ] **Other**

**תשובת Adi:** NFC + lower + trim. אומת ב-`do them all` 2026-05-16.

---

### Q4 — UX ל-Ambiguity

**רקע:** Q3 = NFC matching לא חוצה scripts. אם match הוא cross-script (`דני` orphan, ילד מקליד `Dani`), או יש 2+ orphans באותו שם — מה הילד רואה?

**אופציות:**

- [x] **Block signup; "Ask your parent" message** *(המלצת CC — נבחר 2026-05-16)*
  - Error בעברית: "מצאנו פרופיל קיים במשפחה הזו שיכול להיות שלך. בקש מההורה לוודא את השם ונסה שוב."
  - אין duplicate
  - הורה מאשר את השם — safeguard נגד kid A תובע orphan של kid B
  - **Tradeoff acknowledged:** scenario חוקי של Hebrew parent + English keyboard kid → friction. תיקון: parent יודע על המגבלה אחרי setup.
- [ ] **Show child a picker of orphan candidates**
  - חולשה: kid A יכול לבחור orphan של kid B = takeover
- [ ] **Create new profile + surface ל-Parent banner**
- [ ] **Other**

**תשובת Adi:** Block + empathic Hebrew copy. אומת ב-`do them all` 2026-05-16.

---

## Out of Scope

- ❌ עדכון `pro_settings` semantics — נשאר כמו ש-`useUnlinkedChildren.linkChild` עושה (clear ל-`{}`)
- ❌ Migration של orphan profiles ישנים שכבר קיימים ב-DB (אם יש) — נטופל ידנית אם רלוונטי
- ❌ Login/recovery flow אם child הקליד שם שגוי בפעם הראשונה — out of scope, יוטפל ב-`pkg/childjoin-recovery` בעתיד
- ❌ עדכון של עמודת `families.short_code` ל-case-insensitive uniqueness — נראה תקין היום (verified via `ilike` query בsignUp)

---

## Verification (post-decision, pre-implementation)

לאחר ש-Q1-Q4 נענו, CC חוזר ל-Plan Mode קצר ויכתוב:
- `TESTS.md` עם תנאי pass/fail קונקרטיים (כולל cases של orphan שנמצא / לא נמצא / ambiguous)
- `SPEC_SYNC.md` עם רשימת canonical docs שמתעדכנים (לפי Q1: CLAUDE.md FLAGs, INTEGRATION_LEARNINGS, BUFF_DECISIONS_LOG אם החלטה חדשה)
- `ROADMAP.md` יעודכן עם פאזות concrete

---

**Drafted:** 2026-05-16 by CC after Plan Mode investigation against branch `claude/lucid-sinoussi-235144`
