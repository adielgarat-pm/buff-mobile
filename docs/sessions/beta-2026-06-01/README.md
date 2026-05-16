# beta-2026-06-01 — pre-launch bug bundle

> בנדל של שני תיקונים שמופיעים כחוסמי-בטא לקראת 2026-06-01:
> (a) IN-2026-05-14-03 — ChildJoin לא מאחד עם orphan profiles קיימים
> (b) F-2026-05-03-03 — האם הקוד עוד משתמש ב-13-15 ל-Teen mode detection

## סטטוס

**`_blocked_` — מחכה ל-4 תשובות מ-Adi.** ראי `SPEC.md` § Open Questions למלוא הקונטקסט. תקציר:

1. **Q1 — Scope של (b):** חיפוש מקיף לא מצא hardcoding של `13-15` באף מקום בקוד. F-2026-05-03-03 כבר `CLOSED — STALE` ב-[docs/INTEGRATION_LEARNINGS.md:47-78](../../INTEGRATION_LEARNINGS.md). מה את רוצה שהבנדל הזה יעשה ל-(b)? *(drop / add defensive constants / re-cut age buckets)*
2. **Q2 — מנגנון claim ל-(a):** RLS חוסם UPDATE של orphan על-ידי child user. צריך `SECURITY DEFINER` RPC חדש, או הרחבת RLS, או בלי auto-claim בכלל (banner ל-Parent).
3. **Q3 — אסטרטגיית התאמת `display_name`:** trim בלבד, trim+NFC+case-insensitive, או script-aware confusable detection.
4. **Q4 — UX ל-ambiguity** כשיש orphan ב-cross-script (`דני` orphan, ילד מקליד `Dani`): blocking error / picker לילד / fall-through ל-parent banner.

## קבצים

| קובץ | תפקיד | מצב |
|---|---|---|
| `README.md` | קובץ זה — orientation | _ready_ |
| `SPEC.md` | מצב יעד + Values Check + Open Questions | _draft pending answers_ |
| `ROADMAP.md` | פאזות חבילה — מותנה בתשובות | _draft pending answers_ |
| `STATUS.md` | מעקב פאזות | _blocked on phase 0_ |
| `TESTS.md` | לא נכתב עדיין — נכתב אחרי שתשובות נכנסות | — |
| `SPEC_SYNC.md` | לא נכתב עדיין — נכתב אחרי שתשובות נכנסות | — |

## ממצאי חקירה מרכזיים (מ-Plan Mode)

### על (a) IN-2026-05-14-03 — Real bug, but bigger than client-only

- **`profiles` schema** (מאומת via Supabase MCP, 2026-05-16):
  - `user_id` nullable; UNIQUE קיים רק `WHERE user_id IS NOT NULL` (partial index `profiles_user_id_unique`)
  - **אין UNIQUE על `(family_id, display_name)`** — duplicates מתקיימים בשקט היום
- **RLS policies** קיימים על profiles:
  - `"Users can insert their profile"` — `WITH CHECK (user_id = auth.uid())` או הינדוז של parent יוצר orphan
  - `"Parents can update child profiles in their family"` — מאפשר ל-parent UPDATE על orphan
  - **אין policy שמאפשר לchild user לעשות UPDATE על orphan** → ילד טרי לא יכול לעשות claim מהלקוח
- **Existing manual-link path:** [src/hooks/useUnlinkedChildren.ts:86-109](../../../src/hooks/useUnlinkedChildren.ts) כבר מיישם `linkChild` (UPDATE orphan + DELETE duplicate), אבל אין UI surface שמשתמש בזה היום
- **Signup path היום** ([src/contexts/AuthContext.tsx:368-377](../../../src/contexts/AuthContext.tsx)): INSERT unconditional, ללא pre-check של orphan
- **Orphan creation היום** ([src/screens/onboarding/unified/UStep5_Preview.tsx:138-170](../../../src/screens/onboarding/unified/UStep5_Preview.tsx)): parent יוצר profile עם `user_id: null` בסוף onboarding
- **`display_name` normalization היום:** ב-ChildJoin רק `.trim()` ([src/screens/auth/ChildJoinScreen.tsx:42-49](../../../src/screens/auth/ChildJoinScreen.tsx)); ב-UStep5 בכלל לא — כתוב `params.childName` as-is

### על (b) F-2026-05-03-03 — Empty in code

- **חיפוש מקיף** ב-[src/](../../../src/), migrations, configs, i18n: 0 hits ל-`13-15` או age boundary checks
- **Mode detection היום:** role-based (`profile?.role === 'child'`) ב-[src/contexts/ModeContext.tsx](../../../src/contexts/ModeContext.tsx) ו-[src/navigation/RootNavigator.tsx:102](../../../src/navigation/RootNavigator.tsx); אין age→mode mapping בכלל
- **Onboarding age buckets** ([src/screens/onboarding/unified/onboardingData.ts:14](../../../src/screens/onboarding/unified/onboardingData.ts)): `'6-8' | '9-11' | '12-14' | '15-18'` — לא מתיישר נקי עם 13-17 בכל מקרה
- **Flag entry** ב-[docs/INTEGRATION_LEARNINGS.md:47-78](../../INTEGRATION_LEARNINGS.md) כבר מציין: *"The literal string '13-15' does not exist anywhere in the codebase... there is no code to fix"*. ה-FLAG ב-CLAUDE.md (שורה 297) "needs revisit" נראה לא מסונכרן עם המציאות

## איך לקלוט את החבילה (אחרי שתשובות נכנסות)

1. תשובות נכנסות inline ב-SPEC.md § Open Questions (או ב-issue/Slack — איך שנוח לך)
2. CC ב-Plan Mode חדשה כותב TESTS.md ו-SPEC_SYNC.md לפי התשובות, מעדכן ROADMAP.md
3. הרצה פאזה-אחר-פאזה לפי ROADMAP.md, כל פאזה ב-commit נפרד
4. סוגרים את החבילה לפי הtemplate Closeout checklist

## רצף ביצוע מוצע (תלוי בתשובות Q1-Q4)

מותנה — ראי `ROADMAP.md`. בקצרה:

- **אם Q1 = drop:** רק (a) נכנס לחבילה. 2-3 פאזות.
- **אם Q1 = constants only:** 1 פאזה קטנה נוספת.
- **אם Q1 = re-cut buckets:** פאזה נפרדת, מטפלת בכל הקבצים שמיפים age→options.
- **אם Q2 = RPC:** דורש Supabase migration approval בנפרד.
- **אם Q2 = parent banner only:** ללא backend; פאזה אחת ב-Parent UI.

---

**Branch:** `claude/lucid-sinoussi-235144`
**Worktree:** `.claude/worktrees/lucid-sinoussi-235144`
**Plan file:** `~/.claude/plans/staged-discovering-owl.md` (מקומי ל-CC; לא משותף)
**Drafted:** 2026-05-16 by CC after Plan Mode investigation
