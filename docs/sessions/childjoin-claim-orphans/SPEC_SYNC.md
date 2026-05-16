# beta-2026-06-01 — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.
> תרחיש A: drop (b) + RPC + NFC + blocking error.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי | מבצע |
|---|---|---|---|
| `CLAUDE.md` | 3 (closeout) | הסרת FLAGs: IN-2026-05-14-03 + F-2026-05-03-03 | **Adi** (CC מציע diff) |
| `docs/INTEGRATION_LEARNINGS.md` | 3 | סטטוס change: IN-2026-05-14-03 → `RESOLVED`; F-2026-05-03-03 → `RESOLVED — CONFIRMED-NOT-APPLICABLE`. הוספת IN-2026-05-16-XX entry שמסכם את הבנדל. | CC |
| `docs/BUFF_GAP_ANALYSIS.md` | 3 | TBD ב-Phase 3 — בדיקה אם ChildJoin מופיע בpotential gap rows; אם כן, סימון resolved | CC (אם רלוונטי) |
| `supabase/migrations/<timestamp>_claim_orphan_profile.sql` | 1 | קובץ migration חדש | CC |
| `src/contexts/AuthContext.tsx` | 2 | signUp קורא ל-preflight + claim RPCs | CC |
| `src/screens/auth/ChildJoinScreen.tsx` | 2 | handleJoin מטפל ב-blocking error codes | CC |
| `src/i18n/he.json`, `src/i18n/en.json` | 2 | `auth.orphanAmbiguous` key | CC |

## Out of Scope (docs שלא משתנים)

- `docs/BUFF_PRD.md` — אין שינוי מצב יעד; הבנדל מתקן bug לפי spec קיים. אין צורך לעדכן.
- `docs/BUFF_VALUES.md` — Adi's doc, CC לא משנה. הValues Check עבר.
- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc. ההחלטה על Q1=drop/Q2=RPC/Q3=NFC/Q4=blocking יכולה להיכנס שם **אם Adi רוצה** — לא חובה. CC לא מעדכן unilaterally.
- `docs/BUFF_BUDDY_SYSTEM.md` — לא רלוונטי לבנדל.
- `docs/BUFF_USER_STORIES.md`, `docs/BUFF_FEATURE_AUDIT.md`, `docs/BUFF_FEATURE_PRIORITIZATION.md` — לא רלוונטיים.
- `docs/teen-ui-design/` — לא רלוונטי (חבילת Teen UI נפרדת).
- `docs/WORKFLOW.md` — אין שינוי תהליך.

## Verification

- [ ] כל פאזה ב-ROADMAP.md כוללת עדכוני docs כחלק מה-chunk המתאים
- [ ] TESTS.md פאזה 3 § בדיקות אוטומטיות עוברות (grep verification)
- [ ] אחרי כל הפאזות — אין drift בין canonical docs לבין המערכת החיה (IN-2026-05-14-03 RESOLVED ב-docs ↔ duplicate-free flow בקוד)
- [ ] Adi מאשרת ידנית את ה-FLAG removals ב-CLAUDE.md ביום ה-closeout
