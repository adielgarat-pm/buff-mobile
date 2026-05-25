# pkg/pending-lifetime-grants

> Backend mechanism that auto-grants `is_lifetime_access=true` to Lovable migrants and beta-window signups when they create a profile on the mobile app — no manual flagging, no support ticket.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו |
| `ROADMAP.md` | רצף 4 פאזות עם תנאי עצירה |
| `TESTS.md` | 6 idempotency cases + Hat-3 emulator scenarios |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה (spoiler: כמעט אף אחד) |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |
| `cohort_emails.csv` | **gitignored.** רשימת 16 emails שנזרעו + 8 cohort members בלי email (לרפרנס של Adi) |

## רקע

הקהילה הראשונה של BUFF (Lovable POC, ינואר–אפריל 2026) צריכה ליהנות מ-lifetime access אוטומטית כשהם עוברים למובייל. אין Lovable→mobile auth migration — הם נרשמים מחדש דרך Google OAuth ומקבלים `auth.users` חדש. החבילה הזו בונה את הגשר: כשפרופיל חדש נוצר, trigger בודק אם ה-email מופיע ברשימה מוכנה או אם הוא בחלון beta (5/30–6/30) — ואם כן, מעניק lifetime.

## תלויות

- `pkg/childjoin-claim-orphans` חייב להיות ב-main לפני (✓ verified — commit a28fcc7)
- `public.profiles.is_lifetime_access` חייב להתקיים (✓ verified — exists since pre-2026-04 founding-100)
- Supabase MCP מחובר ל-mobile project gfrongfnyigxsexuofrg (✓)
