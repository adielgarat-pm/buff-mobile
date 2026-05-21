# Yesterday Recap — SPEC

> Target state for this package. Authoritative within the package scope.
> Pillar 2 (Positive Coaching) anchor: "neutral observation, never counts of failure."

**עודכן:** 2026-05-21
**מקור:** Beta-user feedback (Shani, 2026-05-21) — parent asked to see what kid didn't mark yesterday · D-2026-05-02-07 (no penalty/streak-loss mechanics) · F-2026-05-21-01 (edge cases) · BUFF_VALUES Pillar 2 (anti-pattern "counts of failure")
**Slug:** `yesterday-recap`
**Status:** Draft — awaiting Adi review

---

## Why this exists

A beta user (Shani, mom of Matan) reported that her son often forgets to mark tasks the same day, and her current workaround is marking for him in the evening — which breaks BUFF's independence pillar (kid loses the marking loop). Two prior design attempts surfaced and were dropped:

1. **Kid late-marking** (parent-gated toggle): dropped by both Adi and Shani as it risks teaching "I can defer" / "neglect."
2. **Parent retroactive marking**: dropped — strips kid's agency.

What Shani actually converged on:

> *"אולי רק שאני אוכל לגשת 'לראות' מה לא סומן אתמול ... בלי האפשרות לסמן"*
> (Maybe just so I can access "to see" what wasn't marked yesterday ... without the option to mark)

This package builds exactly that: **a read-only section on the Parent Dashboard showing yesterday's task completion per child, with no marking action.**

The feature is **not in BUFF_PRD or BUFF_GAP_ANALYSIS** — it's emergent from beta feedback. If accepted, post-package the PRD should be amended (see §SPEC_SYNC).

---

## Capabilities & Bottlenecks

### What Claude.ai (web) does
- Brand/UX review of Hebrew copy (esp. neutral-observation framing, no counts-of-failure)
- Validation against [BUFF_VALUES.md](../../BUFF_VALUES.md) — particularly Pillar 2
- Final approval on visual prominence (this is a *secondary* feature, must not dominate "Today")

### What Claude Code (CC) does
- New hook: `useYesterdayRecap()` — reads `tasks` + `daily_progress` for yesterday, applies F-2026-05-21-01 filter sieve
- New component: `YesterdayRecapCard` (one per child, mounted under existing "Today" section)
- Wire into [ParentDashboardScreen.tsx](../../../src/screens/parent/ParentDashboardScreen.tsx) (insert after children "Today" cards loop)
- i18n keys (EN + HE)
- Pause Mode integration (hide section when family was paused all of yesterday)
- Empty/edge-case states

### What Adi does
1. **Approve the SPEC** — say `approved, proceed` before code work
2. **Decide on Open Decisions §1–§7** (see below)
3. **Approve final Hebrew copy** — copy is value-critical for Pillar 2
4. **Run emulator tests** per [TESTS.md](./TESTS.md) when phases land

### Bottlenecks / risks to watch
- **Pillar 2 framing.** Easy to drift into "X משימות הוחמצו" (counts of failure, banned per BUFF_VALUES.md L82). Mitigation: hard-coded copy review per phase; specific anti-pattern grep in tests.
- **`daily_progress.date` is UTC-derived** (existing `getTodayKey()` in [useChildProgress.ts:25](../../../src/hooks/useChildProgress.ts) uses `new Date().toISOString().split('T')[0]`). At 1am Israel time, this returns "yesterday." We will reuse the same logic for consistency with existing data, NOT fix the underlying timezone behavior in this package. Note added as Open Decision §8.
- **Ad-hoc no-school days.** No data model exists for "today is a school holiday." This is captured in [F-2026-05-21-01](../../INTEGRATION_LEARNINGS.md#f-2026-05-21-01). V1 punts: parent uses Pause Mode for unexpected off-days; we don't introduce a new "no-school-today" flag here.

---

## Values Check

> 9 questions from [BUFF_VALUES.md](../../BUFF_VALUES.md). **All must pass before code begins.**

### Pillar 1 — Intrinsic Motivation

1. **Would the child want this feature without any virtual reward?**
   ✅ N/A directly — parent-only feature, child does not see it. Indirectly: the child benefits from a parent who has better data to coach with, not surveil with. The kid's reward loop (today's marks → BUFFs → real rewards) is untouched.

2. **Does it bring the child closer to a reward they chose themselves?**
   ✅ Neutral. No new reward mechanic. Yesterday's already-earned BUFFs remain unchanged.

3. **Is success felt as "I want to" or "I have to"?**
   ✅ N/A for the child (doesn't see it). For the parent: if used well, this is "I want to understand what's hard for my kid" — an empathy tool. **Risk:** if used poorly, parent could pressure kid ("you missed 3 things yesterday!"). Mitigation: copy framing + a one-line philosophy tip in the section header (see §Open Decisions §6).

### Pillar 2 — Positive Coaching

1. **Does any copy shame / compare / display failure?**
   ⚠️ **This is the critical risk.** Specifically prohibited by [BUFF_VALUES.md L82](../../BUFF_VALUES.md): *"❌ 'היום פספסת 3 משימות' — counts of failure. נאסר."*

   **How we comply:**
   - Section title: *"אתמול"* (neutral, observational). NOT: *"מה החמצת"*, *"לא בוצע"*, *"פספוסים"*.
   - Summary: *"5 מתוך 7 סומנו"* (neutral). NOT: *"2 לא סומנו"*, *"2 חסרות"*.
   - Per-task: ✓ (filled) or ○ (empty circle) — NOT ✗ (X mark), NOT red color, NOT "X" emoji.
   - Color palette: muted grays + the same `T.success` green as elsewhere for ✓. Empty ○ uses `T.textMuted` gray.
   - No comparison ("Less than yesterday", "Worse than Tuesday") — anti-pattern per BUFF_VALUES.md L83.

2. **If the child "failed" (had unmarked tasks), is the response empathy or pressure?**
   ✅ Empathy by design. The section is purely informational. The natural parent action this enables is conversation ("noticed mornings were tough yesterday — what would help?"), not pressure. We surface this via the section header tip (Pillar 1 q.3 mitigation): *"רעיון לשיחה, לא לבדיקה"* (A conversation starter, not an inspection).

3. **Is there a "sad / lost / angry" BUDDY or app state?**
   ✅ No. BUDDY not involved. Visual tone is calm (gray ○ for unmarked, not red, not crying emoji).

### Pillar 3 — Independence-Building

1. **Does the feature make the child more capable *without* the app, or more dependent *on* it?**
   ✅ More capable, indirectly. The parent gains specificity ("Matan misses teeth-brushing on weekends" → environmental conversation), rather than relying on the kid to articulate this himself. Better support → faster path to autonomy.

2. **Does the child have a voice in this feature?**
   ⚠️ No direct voice. The kid doesn't see, doesn't control. **However:** the explicit purpose (per §1 above) is to *enable parent-child conversation*, which IS giving the kid a voice. We don't gate this through copy or UI — but Open Decision §6 (philosophy tip) is the lever.

3. **Will this feature still be necessary in 6 months?**
   ⚠️ Possibly diminishing. As kids gain autonomy (Pillar 3 main goal), the parent's need for yesterday-recap data should decrease. We don't ramp this down explicitly, but `useParentInsights` (existing patterns surfacer) already handles long-term — if a kid has high marking rates, this section just looks like ✓✓✓ and adds no signal. **Acceptable: feature has natural fadeout via good behavior, not via removal.**

**Result:** All 9 questions pass with explicit Pillar 2 mitigation plan. ✅ OK to proceed once Adi approves §Open Decisions.

---

## Scope

### IN — this package

**Schema:** None. All required data exists in `tasks`, `daily_progress`, `app_settings`.

**New hook (`src/hooks/useYesterdayRecap.ts`):**

```typescript
export interface YesterdayTask {
  taskId:    string;
  title:     string;
  time:      string;
  category:  string;
  icon:      string | null;
  completed: boolean; // true if completed yesterday, false otherwise
}

export interface ChildYesterdayRecap {
  childId:         string;
  tasks:           YesterdayTask[];
  totalScheduled:  number;  // tasks.length after sieve
  totalCompleted:  number;
}

export interface UseYesterdayRecapResult {
  recapByChildId:  Record<string, ChildYesterdayRecap>;
  shouldHide:      boolean;          // true if pause was active all of yesterday OR family too new
  yesterdayDate:   string;            // ISO date string yyyy-mm-dd (for display)
  loading:         boolean;
  error:           Error | null;
  refetch:         () => void;
}

export function useYesterdayRecap(): UseYesterdayRecapResult;
```

**Filter sieve** (per F-2026-05-21-01, applied to all family tasks for yesterday):

A task is included in yesterday's recap iff **all** of:
1. `task.family_id === currentFamilyId`
2. `task.assigned_to === childId` (one of the family's children)
3. `task.created_at <= yesterday_end_iso` (existed by end of yesterday)
4. `yesterday_weekday ∈ task.schedule_days` (if `schedule_days` is empty or null, default to all 7 days — matches current code in `useChildData`)
5. Task still exists in DB at query time (no soft-delete column in `tasks`, so DELETE removes from view automatically)

For each surviving task, check `daily_progress` for `(family_id, child_id, yesterday_date, task_id)`:
- Row exists AND `completed === true` → `YesterdayTask.completed = true`
- Row absent OR `completed !== true` → `YesterdayTask.completed = false`

**Pause Mode interaction (`shouldHide` logic):**

```
shouldHide = true IF:
  (settings.pause_mode_active === true AND yesterday < pause_until)
  OR
  (family had pause active for all of yesterday — historical pause state)
```

V1 simplification: we only check **current** `pause_mode_active`. If it's currently true AND yesterday falls within the pause window, hide. We do NOT reconstruct historical pause state across resumes. Adi confirms in Open Decisions §3.

**Also hide if:**
- `yesterday < family.created_at` (family didn't exist yet)
- `yesterday < child.created_at` (for that specific child's card; sibling cards may still render)
- No `recapByChildId` entries have any tasks (everyone's yesterday is empty)

**New component (`src/components/YesterdayRecapCard.tsx`):**

```typescript
interface Props {
  childName:  string;
  childAvatar: string;
  recap:      ChildYesterdayRecap;
  defaultExpanded?: boolean; // default false
}
```

**Visual (default collapsed state):**
```
┌─────────────────────────────────────────────────┐
│  🚀 Matan                            5/7  ▾    │
│  אתמול                                          │
└─────────────────────────────────────────────────┘
```

**Expanded state:**
```
┌─────────────────────────────────────────────────┐
│  🚀 Matan                            5/7  ▴    │
│  אתמול                                          │
│  ─────────────────────────────────              │
│  ✓  07:00  צחצוח שיניים                        │
│  ✓  07:15  ארוחת בוקר                          │
│  ○  07:30  להתלבש                              │
│  ✓  14:00  שיעורי בית                          │
│  ✓  18:00  מקלחת                               │
│  ○  20:30  סידור התיק                          │
│  ✓  20:45  צחצוח שיניים בערב                   │
│                                                  │
│  💬 רעיון לשיחה, לא לבדיקה                     │
└─────────────────────────────────────────────────┘
```

- Collapsed by default (Open Decision §4).
- Empty-state row (○) uses muted gray.
- Completed row (✓) uses `T.success` green.
- No red, no ✗, no emoji on miss.
- The "💬" tip is rendered ONLY if there is at least one unmarked task. If all are ✓, the tip is replaced with: *"כל המשימות סומנו אתמול 🎉"* (Pillar 2 positive-reinforcement opportunity).

**Parent Dashboard integration ([ParentDashboardScreen.tsx](../../../src/screens/parent/ParentDashboardScreen.tsx)):**

Insertion point: **after the children Today cards `.map()` loop closes (line 337), before the `</LinkChildModal>`** (line 339).

New section structure:
```
{!yesterdayLoading && !yesterdayShouldHide && (
  <View>
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{t('dashboard.yesterday')}</Text>
    </View>
    {children.map(child => {
      const recap = recapByChildId[child.childId];
      if (!recap || recap.totalScheduled === 0) return null;
      return (
        <YesterdayRecapCard
          key={child.childId}
          childName={child.displayName}
          childAvatar={child.avatar}
          recap={recap}
        />
      );
    })}
  </View>
)}
```

**i18n keys (`src/i18n/en.json` + `he.json`):**

| Key | EN | HE |
|---|---|---|
| `dashboard.yesterday` | "Yesterday" | "אתמול" |
| `yesterdayRecap.summary` | "{completed} of {total}" | "{completed} מתוך {total}" |
| `yesterdayRecap.allComplete` | "All tasks marked yesterday 🎉" | "כל המשימות סומנו אתמול 🎉" |
| `yesterdayRecap.tipConversation` | "A conversation starter, not an inspection" | "רעיון לשיחה, לא לבדיקה" |
| `yesterdayRecap.empty` | "No tasks scheduled yesterday" | "לא היו משימות מתוכננות אתמול" |

### OUT — deferred

- **Child-side visibility.** Shani suggested it ("so he sees he forgot"); Adi & CC agreed to defer due to Pillar 2 risk ("שכחת אתמול" feels like judgment to a kid even when unintended). Revisit in V1.1 only if parent-side proves the use case has legs.
- **Arbitrary date selection** (date picker, last-7-days view). Out of scope; this is "yesterday" only.
- **Notification triggers** ("you missed 2 yesterday") — explicitly NOT building. Would be a Pillar 2 violation regardless of phrasing.
- **Marking from this UI.** Hard out. If we ever add late-marking, it's a different package.
- **Ad-hoc "no-school-today" parent flag.** Real need but new schema + UX surface; defer to a dedicated package after this ships and we see if Pause Mode covers it.
- **`useParentInsights` threshold tuning.** Adi raised the concern that current 50% threshold misses "1-2 task slippage." Real issue but separate package — this one is about a different surface (per-day, per-task) and doesn't need to change the 7-day patterns logic.
- **Premium gating.** Insights are Premium-gated. Yesterday Recap will be **free** in this package (rationale: it's a small section, the data is already the user's, and premium-gating diminishes the trust-building value with beta users). Adi can override in Open Decisions §7.
- **Historical reconstruction of pause state.** V1 only checks current `pause_mode_active`. If parent paused yesterday then resumed today, the section will render normally (showing yesterday's tasks). Acceptable trade-off — fixing this needs a `pause_log` table.

---

## Phases

### Phase 1 — Hook + filter logic (~2.5 hours)

**CC:**
1. Implement `src/hooks/useYesterdayRecap.ts` with the contract above
2. Implement the F-2026-05-21-01 filter sieve as a pure function in `src/utils/yesterdayRecapUtils.ts` (testable in isolation)
3. Unit tests for the sieve (`src/utils/__tests__/yesterdayRecapUtils.test.ts`):
   - Task included when all conditions met
   - Task excluded when `schedule_days` doesn't include yesterday's weekday
   - Task excluded when `created_at > yesterday_end`
   - Task excluded when missing `assigned_to` match
   - Tasks with empty/null `schedule_days` default to all 7 days
   - Pause active → `shouldHide = true`
   - Family/child too new → `shouldHide = true`
4. Realtime subscription on `daily_progress` and `tasks` to refetch when relevant rows change

**Exit criteria:**
- Hook returns correct structure for: 1 child + 7 yesterday tasks, 2 children, no children, paused family, family-created-today
- Filter sieve passes all unit tests
- Realtime updates when parent or kid adds/removes a task today (e.g., a deleted task disappears from yesterday's recap)

**Out of phase 1:** No UI yet. Hook callable but not rendered.

---

### Phase 2 — UI integration (~3 hours)

**CC:**
1. `src/components/YesterdayRecapCard.tsx` per spec above
2. Wire `useYesterdayRecap` into `ParentDashboardScreen.tsx` at the documented insertion point
3. Section header with "אתמול" title
4. Empty state copy + "all complete" celebration variant
5. i18n keys + strings (EN + HE)
6. Style consistency with existing `childCard` pattern (same border radius, paddings)
7. Accessibility: ✓/○ symbols have `accessibilityLabel` ("completed" / "not marked") for screen readers

**Claude.ai (review):**
- Brand check on Hebrew strings against Pillar 2 anti-patterns
- Grep check that no string in the package contains: "פספסת", "החמצת", "לא בוצעו", "כשלון", "missed", "failed"

**Exit criteria:**
- Section renders below "Today" on Parent Dashboard
- Per-child cards collapse/expand correctly
- Visual hierarchy is correct: "Today" cards prominent, "Yesterday" muted
- Pause Mode hides the section
- Empty state (no tasks yesterday) doesn't render the section at all
- "All complete" celebration appears for kids who marked everything

---

### Phase 3 — Tests, edge cases, ship (~1.5 hours)

**CC:**
1. Manual flow test matrix:
   - 1 child with mixed completion → expanded shows correct ✓/○
   - 2 children (one all-done, one half) → both cards render appropriately
   - Pause active today (paused 2 days ago) → section hidden
   - Just resumed from pause yesterday → section shows (acceptable per scope decision)
   - Task created today → not in yesterday's recap
   - Task with `schedule_days = [1-5]` on a Saturday → not in yesterday's recap
   - Child created today → that child's card not in section (sibling card still shows)
   - Family created today → entire section hidden
   - Zero scheduled tasks yesterday across all kids → section hidden
2. Update [STATUS.md](./STATUS.md) with phase completion + commit hash
3. Update `BUFF_PRD.md` §7 (Features) to add "Yesterday Recap" line item — see [SPEC_SYNC.md](./SPEC_SYNC.md)
4. Update `BUFF_GAP_ANALYSIS.md` if this maps to a gap row (Adi to confirm — likely a new row, NOT auto-add per CLAUDE.md rule about Adi's docs)

**Exit criteria:**
- All matrix scenarios tested in emulator
- No copy contains banned strings (grep check)
- Values Check still passes against implemented behavior (re-run by Adi)
- Canonical doc updates landed per `SPEC_SYNC.md`

---

## Files Affected

### Mobile (`buff-mobile`)

**New:**
- `src/hooks/useYesterdayRecap.ts` — main hook
- `src/utils/yesterdayRecapUtils.ts` — pure filter sieve (testable)
- `src/utils/__tests__/yesterdayRecapUtils.test.ts` — unit tests
- `src/components/YesterdayRecapCard.tsx` — UI component

**Edit:**
- `src/screens/parent/ParentDashboardScreen.tsx` — insert section after Today cards
- `src/i18n/en.json` + `src/i18n/he.json` — new keys per §i18n above

### Docs (this package)
- `docs/sessions/yesterday-recap/SPEC.md` (this file)
- `docs/sessions/yesterday-recap/README.md`
- `docs/sessions/yesterday-recap/ROADMAP.md`
- `docs/sessions/yesterday-recap/TESTS.md`
- `docs/sessions/yesterday-recap/SPEC_SYNC.md`
- `docs/sessions/yesterday-recap/STATUS.md`

### Canonical (updated per SPEC_SYNC after Phase 3)
- `docs/BUFF_PRD.md` §7 — add feature
- `docs/INTEGRATION_LEARNINGS.md` — F-2026-05-21-01 transitions from `open` to `resolved` upon ship

---

## Open Decisions for Adi

Each is a stop-decision (no defaults applied until Adi answers).

### §1 — Section placement
**Question:** Where exactly does the "Yesterday" section live on the Parent Dashboard?
- **A.** Below the "Today" children cards, full-width per child (current SPEC default)
- **B.** Inside each "Today" child card, as an expandable footer
- **C.** Above the Today section (less recommended — yesterday should not dominate today)

**Recommendation:** A. Cleanest separation, easiest to ignore when not relevant.

### §2 — Visibility for kids with no tasks marked yesterday (0/7)
**Question:** If a kid marked literally nothing yesterday, do we show that card with `0/7` and all ○, or hide it entirely?
- **A.** Show it. Honest data. (Risk: parent panic.)
- **B.** Hide cards that are 0/N (treat as data outlier — likely kid didn't open the app at all)
- **C.** Show but with softening: "אתמול לא היה סימון" instead of "0/7"

**Recommendation:** C. Honest but reframed — parent sees that the kid didn't use the app, not that the kid failed.

### §3 — Pause Mode reconstruction
**Question:** Should the section hide based on **current** pause state (V1), or attempt to reconstruct **yesterday's** pause state (V1.1+)?
- **A.** Current only (V1 — simpler, may miss edge case of "paused yesterday, resumed today")
- **B.** Add `pause_log` table to track historical pause state (out of scope expansion)

**Recommendation:** A. V1.1 if we see complaints.

### §4 — Default expanded/collapsed
**Question:** Cards collapsed by default with tap to expand, or always expanded?
- **A.** Collapsed by default (current SPEC). Reduces visual weight; opt-in detail.
- **B.** Expanded by default. Always-visible info.

**Recommendation:** A. Yesterday is secondary to today; default collapse respects that.

### §5 — "Yesterday" date display
**Question:** Do we display the actual date alongside the word "אתמול"?
- **A.** Just "אתמול" (cleaner, but ambiguous on Monday — was "yesterday" Sunday or weekend?)
- **B.** "אתמול · יום שלישי 20.5" (clearer, more text)
- **C.** "אתמול · 20.5" (compact)

**Recommendation:** C.

### §6 — "Philosophy tip" inside the card
**Question:** Should we include the *"רעיון לשיחה, לא לבדיקה"* line when there are unmarked tasks?
- **A.** Yes, always when there's at least one ○ (current SPEC). Anchors Pillar 2 framing for parents.
- **B.** Show once and dismiss-forever (like `PhilosophyTip`).
- **C.** No, redundant.

**Recommendation:** B. Show once until dismissed. Avoids preachiness while still planting the framing.

### §7 — Premium gating
**Question:** Free for everyone, or Premium-gated like Insights?
- **A.** Free (current SPEC). Trust-building, especially for beta users.
- **B.** Premium-gated. Consistent with Insights.

**Recommendation:** A. The patterns insight is the premium hook; daily recap is operational hygiene.

### §8 — Timezone / "yesterday" definition
**Question:** Use same `getTodayKey()` UTC-derived logic as existing code (consistent but buggy near midnight), or compute Israel-local "yesterday"?
- **A.** Reuse `getTodayKey()` minus 1 day (consistent with `daily_progress.date` rows already in DB)
- **B.** Compute in Asia/Jerusalem timezone (correct but creates date-key mismatches with existing daily_progress rows)

**Recommendation:** A. Match the existing data convention; the underlying timezone bug is a separate package.

---

## Dependencies on Other Work

- **Pause Mode (shipped 2026-05-12)** — `useAppSettings().isPauseActive` is consumed. No changes needed there.
- **`useChildrenDashboard`** — consumed for child list (avatar, displayName, childId). Already-realtime; we piggyback.
- **`useParentInsights`** — independent, unaffected. Continues serving 7-day patterns.
- **`useParentNotifications` (Daily Vibe Check 4b, shipped 2026-05-17)** — independent. Lives on the same dashboard but serves a different signal type (today's SOS). No interaction.
- **`pkg/parent-notification-feed` (draft, not yet shipped)** — *Adjacent surface*: bell + feed for `parent_sos`, `reward_redeemed`, `task_completed`, `quest_milestone`. Different access pattern (chronological event feed vs. per-day completion grid). **Not blocking**, but Phase 2 should verify visual coexistence on Parent Dashboard once both ship.
- **F-2026-05-19-01** — `pkg/parent-reengagement-tools` (v1.1 idea, not in MVP) raises the same Pillar 2/3 tensions about parent observability tools. Worth re-reading before finalizing Open Decision §6 (philosophy tip copy).
- **None blocking.** This package can ship standalone.

---

## What This Unblocks

- **Beta-user retention** — direct response to Shani's request. Closes the loop with the most engaged beta cohort.
- **Pillar 2 demonstration** — shipping a feature that *could* have been a "counts of failure" but isn't is a strong proof point for parents.
- **Future "patterns + specifics" combo** — the patterns view (Insights) + yesterday's specifics (this) is a complete parent-observability story without ever surveilling the kid.

---

## Approval gate

**Status: awaiting `approved, proceed` from Adi.**

Before approval, Adi answers Open Decisions §1–§8 (or accepts the recommendations).

After approval:
1. CC starts Phase 1 (hook + filter sieve + unit tests)
2. After Phase 1 lands: show diff, wait for "continue" before Phase 2
3. Each phase ships as its own commit per [WORKFLOW.md](../../WORKFLOW.md) chunk-by-chunk protocol

**Estimated total:** ~7 hours of engineering across 3 phases. Realistically: 1-2 focused sessions.
