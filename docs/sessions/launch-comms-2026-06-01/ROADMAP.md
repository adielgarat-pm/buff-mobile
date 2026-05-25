# Launch Comms 2026-06-01 — ROADMAP

> חבילה חד-פאזית. כל הדליברבלס נמסרים יחד באותו PR.

## Phase 1 — Author all deliverables (in this PR)

**מטרה:** לספק 4 דליברבלס מוכנים לפעולה — מייל, WhatsApp HE, playbook, F-074 AC.

**Scope:**
1. `deliverables/migration-email-he.md`
2. `deliverables/whatsapp-messages-he.md`
3. `deliverables/admin-playbook-lifetime.md`
4. תוספת F-074 AC ב-`docs/sessions/lovable-parity-and-backlog/SPEC.md`

**תנאי עצירה / stopping conditions:**
- כל ה-placeholders מסומנים `[NAME]` ולא ערבוב בין placeholder וערך אמיתי.
- ה-playbook עבר sanity-check ב-`mcp__supabase__execute_sql` (SELECT-only —
  אין הרצת UPDATE בזמן הסשן). UPDATE / מספור founding יבוצעו ב-pre-send בלבד
  בידי Adi.
- F-074 AC כולל את שני קישורי WhatsApp.

**Tests** (ראי `TESTS.md`):
- Code/copy review checklist
- Brand Check 9 שאלות (BUFF_VALUES.md)
- Glossary scan (BUFF_BRAND §6 — אין HOW words)
- SQL syntax + idempotency check ל-playbook

**Exit deliverables:**
- 4 קבצים committed
- STATUS.md מתעדכן עם הפאזה
- אם משהו הפתיע ב-execution → INTEGRATION_LEARNINGS.md entry

## Phase 2+ — Out of scope, רק רשימה

מה ייתכן וצריך בעוד 1-3 חודשים אחרי ה-launch:

- `pkg/pending-lifetime-grants` — בנייה של Option B אם הטיפול הידני מאמץ יותר
  מדי. Trigger: 10+ grants/week באופן עקבי.
- `pkg/comms-en-translations` — אם הקהילה האנגלית גדלה.
- `pkg/lifetime-audit-log` — טבלה ייעודית ל-tracking של feedback received + revoke
  events, אם יש N>5 חוזרים.
- `pkg/dangling-profiles-cleanup` — טיפול ב-187 dangling profiles
  (TRACK_5_findings open question #1).
