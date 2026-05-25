# Launch Comms 2026-06-01 — TESTS

> Acceptance per deliverable. אדי מאשרת כל אחד לפני merge.

## Test 1 — Migration Email (HE)

- [ ] Subject תחת 50 תווים, מציין "Lifetime"
- [ ] פתיחה ב-outcome (calmer mornings) ולא ב-mechanics
- [ ] REQ-1 structure שלם: why → how (3 שלבים) → what carries → fallback path
- [ ] Mission tagline "עד שהם כבר לא יזדקקו לנו" מופיע לפני sign-off
- [ ] Founder sign-off block של Adi מופיע במלואו
- [ ] Placeholders: `[APK_OR_PLAY_STORE_URL]`, `[PLAY_STORE_RATING_URL]` — אין
      placeholders חבויים אחרים
- [ ] Brand Check: אין הזכרה של BUFFs / BUDDY / 70% / streaks / rewards / coins
- [ ] אין סימני קריאה
- [ ] שפת Coach (declarative), לא "תזדקקי לעשות X"
- [ ] קל ל-Adi לשלוח (copy/paste, ערוך placeholders, שלח)

## Test 2 — WhatsApp Messages (HE)

- [ ] Short version = 3 שורות תוכן (excluding spacing)
- [ ] Slightly-longer = 5 שורות תוכן
- [ ] שתי הגרסאות מציינות "אותו חשבון Google"
- [ ] שתי הגרסאות מציינות "ענו במייל" כ-trigger ל-grant ידני
- [ ] שתי הגרסאות נטולות סימני קריאה
- [ ] Placeholders: `[APK_OR_PLAY_STORE_URL]` + (longer בלבד) `[PLAY_STORE_RATING_URL]`
- [ ] אין חתימה של 5 שורות בתוך הודעת 5 שורות (נדחה ב-Q5 review)
- [ ] שתי הגרסאות עובדות גם למשתמש שלא היה ב-Lovable — שורת ה-"היית ב-Lovable?"
      מטרגטת חלק מהקהל, לא דורשת מכולם

## Test 3 — Admin Playbook (Lifetime Grant)

- [ ] Project URL מצוין במפורש: `gfrongfnyigxsexuofrg`
- [ ] שאילתת "מי חדש?" עובדת ללא UPDATE
- [ ] שאילתת GRANT אידמפוטנטית: re-run על user already founding לא מקצה מספר חדש
- [ ] שאילתת GRANT מחזירה `display_name` + `founding_member_number` כ-RETURNING
- [ ] שאילתת REVOKE שומרת על `is_lifetime_founding` + `founding_member_number`
      (audit trail) ומכבה רק `is_lifetime_access`
- [ ] שאילתת AUDIT מחזירה count תקין של active vs revoked
- [ ] הוראות מובהקות איפה Adi מדביקה את 49 המיילים (VALUES local או gitignored
      file) — לא ב-repo
- [ ] Edge cases מתועדים: signup with non-Google provider, signup with different
      email, double-click race condition

## Test 4 — F-074 AC (cross-session edit)

- [ ] התוספת ל-lovable-parity SPEC ממוקמת אחרי "Resolved Decisions" ולפני "Out of Scope"
- [ ] שני קישורי WhatsApp (HE + EN) מצויים
- [ ] Rationale-quote של Adi מצוטטת verbatim
- [ ] Source = "pkg/launch-comms-2026-06-01" — חיפוש cross-session ברור
- [ ] אזכור מפורש שה-AC חל על Expo Web Phase 2, **לא** על Lovable הנוכחי

## Values + Brand Check (per BUFF_VALUES.md + BUFF_BRAND.md §6)

- [ ] Pillar 1 — שום copy לא יוצר תלות באפליקציה
- [ ] Pillar 2 — שום copy לא משפיל משתמש שלא חזר ל-Lovable
- [ ] Pillar 3 — Sunset Lovable עצמו עובר את הפילר ("מערכת ש-fades")
- [ ] BRAND glossary scan — שום מילה ב-"לעולם לא" של BRAND §6 לא הופיעה

## Verification before merge

CC מריץ אחרי הכתיבה:
- [ ] `grep -i "BUFFs\|BUDDY\|70%\|streak\|מטבע" deliverables/` — צריך להיות **0 matches**
- [ ] `grep -c "!" deliverables/migration-email-he.md` — צריך להיות 0
- [ ] schema check חוזר על `is_lifetime_access`, `is_lifetime_founding`,
      `founding_member_number` (כבר בוצע 2026-05-25)
