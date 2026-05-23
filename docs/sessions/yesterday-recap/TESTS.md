# Yesterday Recap — Tests

> Concrete, verifiable pass/fail per phase.
> **Pillar 2 enforcement is automated** via banned-string grep — this is a hard exit gate.

## איך מריצים בדיקות

- **Unit tests** (Phase 1): Jest. CC runs.
- **Manual emulator tests** (Phases 2-3): Adi runs on Android emulator + at least one physical device if available.
- **Banned-string grep** (every phase): CC runs automatically as part of phase exit.
- **Values Check verification** (every phase): Adi re-runs the 9 questions from BUFF_VALUES.md against the implemented behavior, not just the SPEC text.

---

## פאזה 1 — Hook + filter sieve

### בדיקות אוטומטיות (CC מריץ)

`src/utils/__tests__/yesterdayRecapUtils.test.ts`:

- [ ] **Positive case** — Task with `schedule_days=[0,1,2,3,4,5,6]`, `created_at` last week, `assigned_to=childA`, and a `daily_progress` row `(yesterday, childA, completed=true)` → included with `completed=true`
- [ ] **schedule_days exclusion** — Task `schedule_days=[1,2,3,4,5]` (Mon-Fri) → excluded when yesterday is a Saturday/Sunday
- [ ] **created_at exclusion** — Task `created_at=today` → excluded from yesterday's recap
- [ ] **assigned_to exclusion** — Task `assigned_to=childB` → not in childA's recap
- [ ] **Default schedule_days** — Task `schedule_days=null` and `schedule_days=[]` → treated as all 7 days (matches `useChildData` behavior)
- [ ] **No daily_progress row** — Task included with `completed=false`
- [ ] **daily_progress completed=false** — Same as no row → `completed=false`
- [ ] **Pause active** — `shouldHide=true` when `pause_mode_active=true` AND `pause_until > yesterday`
- [ ] **Family too new** — `family.created_at > yesterday_end` → `shouldHide=true`
- [ ] **Child too new** — `child.created_at > yesterday_end` → that child not in `recapByChildId`
- [ ] **No completion data at all** — Empty `daily_progress` array → all included tasks have `completed=false`

### בדיקות מתודולוגיות (תמיד)

- [ ] STATUS.md row added with phase=1, state=passed, commit hash
- [ ] Banned-string grep on `src/utils/yesterdayRecapUtils.ts` and `src/hooks/useYesterdayRecap.ts`: NO matches for `פספסת|החמצת|לא בוצעו|כשלון|missed|failed` (Hebrew + English)
- [ ] No `console.log` left in production code
- [ ] No `any` types in the hook contract

---

## פאזה 2 — UI integration

### בדיקות ידניות באמולטור (Adi)

**Scenario A: Single child, partial completion**
- [ ] Open Parent Dashboard
- [ ] See "אתמול · DD.MM" section title below "Today"
- [ ] See one collapsed card with `child.displayName` + `5/7` summary
- [ ] Tap card → expands smoothly
- [ ] Expanded: 7 rows total, 5 with ✓ (green), 2 with ○ (gray)
- [ ] Each row shows task time + title
- [ ] At least one task time is visible (sanity-check time formatting)
- [ ] No red colors. No ✗ marks. No "missed" or "failed" text anywhere.
- [ ] If §6=B (dismissible tip): see "💬 רעיון לשיחה, לא לבדיקה" — dismiss it — refresh — tip stays dismissed

**Scenario B: Single child, all complete**
- [ ] Card collapsed: `7/7`
- [ ] Tap to expand
- [ ] All ✓ rows
- [ ] Celebration text appears: "כל המשימות סומנו אתמול 🎉"
- [ ] No "tip" line (replaced by celebration)

**Scenario C: Single child, 0 marked (per §2 decision)**
- [ ] Card collapsed shows softened copy "אתמול לא היה סימון" (per §2-C, NOT "0/7")
- [ ] Tap to expand
- [ ] All ○ rows visible (honest data)
- [ ] No counts-of-failure copy

**Scenario D: Two children, mixed states**
- [ ] Two separate cards in the section
- [ ] Each shows its own summary
- [ ] Tapping one doesn't affect the other's expand state

**Scenario E: Visual hierarchy (Pillar-2 specific)**
- [ ] Take a screenshot of the full dashboard
- [ ] "Today" cards are visually dominant (larger, more prominent)
- [ ] "Yesterday" section is muted (smaller header, gray)
- [ ] A parent skimming should see Today first, Yesterday second

### בדיקות אוטומטיות (CC מריץ)

- [ ] Snapshot test for `<YesterdayRecapCard>` in collapsed and expanded states
- [ ] **Banned-string grep on all files in this package** + `src/i18n/{en,he}.json`: no matches

### בדיקות מתודולוגיות (תמיד)

- [ ] STATUS.md row added with phase=2, state=passed
- [ ] No accessibility regressions (test with TalkBack at least for one card)
- [ ] All i18n keys present in both en.json and he.json (count matches)

---

## פאזה 3 — Edge case matrix + ship

### בדיקות ידניות באמולטור (Adi)

**Pause-related:**
- [ ] **Currently paused, paused 2 days ago** → section hidden entirely
- [ ] **Paused yesterday + resumed today** → section shows (V1 limitation per SPEC §3 decision; acceptable)
- [ ] **Paused indefinitely** → section hidden

**Time-related:**
- [ ] **Task created today** → not in yesterday's recap
- [ ] **Task with `schedule_days=[1,2,3,4,5]` on a Saturday** → not in recap (Saturday's tasks)
- [ ] **Child created today** → that child's card not in section; siblings still show
- [ ] **Family created today** → entire section hidden (or graceful "no data yet" — verify which)

**Data integrity:**
- [ ] **Task deleted today (existed yesterday)** → not in recap (DB DELETE removes from view)
- [ ] **Task title edited today** → recap shows current title (not historical) — acceptable per scope
- [ ] **Zero scheduled tasks yesterday across all kids** → section hidden

**Performance:**
- [ ] Dashboard load time not measurably slower than before (subjective, but no obvious lag)
- [ ] Realtime: edit a task → see yesterday's recap update without manual refresh

### בדיקות אוטומטיות (CC מריץ)

- [ ] Full repo grep, banned strings (final check): no matches in any new file
- [ ] All existing Jest tests still pass (no regressions)

### בדיקות מתודולוגיות (תמיד)

- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag `pkg/yesterday-recap/v1` נוצר
- [ ] BUFF_PRD.md §7 updated per SPEC_SYNC
- [ ] F-2026-05-21-01 status: `open` → `resolved` in INTEGRATION_LEARNINGS.md
- [ ] No drift between SPEC and live system

---

## Closeout

- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag נוצר
- [ ] אין drift בין canonical docs לבין המערכת החיה
- [ ] בדיקת end-to-end ידנית באמולטור — כל הflow של החבילה עובד
- [ ] Adi sends Shani the "feature live" WhatsApp message
