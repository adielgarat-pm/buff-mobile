# SPEC — pkg/empty-state-onboarding

**Target state:** A parent viewing the Tasks tab for a child who has **0 tasks** sees
an inviting CTA that launches the challenge-selection flow for **that existing child**.
Completing the flow attaches starter tasks + rewards to the existing child profile
(no duplicate profile) and returns the parent to the Tasks tab, now populated.

## Behaviour contract

1. **Entry — ParentTasksScreen empty state**
   - When `tasks.length === 0` and a child is selected: show `emptyTitle`, `emptyBody`,
     and a primary CTA `setupCta` ("Set up tasks for {name}").
   - CTA handler fetches the child's `pro_settings` (the dashboard hook doesn't expose age):
     - `age_group` present → `navigate('UStep2_Goal', { childName, ageGroup, gender, birthDate, existingChildId })`
     - `age_group` absent  → `navigate('UStep1', { existingChildId, prefillName: childName })`
       (UStep1 collects age, then continues to UStep2_Goal threading `existingChildId`).

2. **Threading** — `existingChildId?: string` added to the shared `UBase` type. Every
   onboarding step already spreads `{ ...params }`, so it flows UStep1/2 → 3 → 4 →
   Loading → UStep5 untouched.

3. **UStep5_Preview — the gate (duplicate-profile guard)**
   - `existingChildId` set → skip the `profiles` INSERT, reuse it as the child id.
   - Tasks INSERT + rewards INSERT run identically (same code path as onboarding),
     using that id (`assigned_to` for tasks, `child_id` for rewards).
   - `goNext` on the existing-child path → `navigate('ParentApp')` (Tasks tab). Skips
     UStep7_Phone (child already exists) and UStep8_Complete (which would overwrite the
     already-onboarded parent's `pro_settings`). CTA label = `ctaExistingChild`; Skip hidden.

4. **Refresh** — ParentTasksScreen gains a `useFocusEffect(refetch)` because `useChildData`
   has no focus/realtime refetch on `tasks`; without it the created tasks wouldn't appear
   on return while the tab stays mounted.

## Decisions (confirmed by Adi, 2026-05-28)
- **Exit flow:** return to Tasks, skip UStep7/UStep8. *(recommended)*
- **Rewards on re-run:** create tasks **+ rewards** (motivator-driven; the reward loop is
  core to Pillar 1; an empty-task child usually has no rewards either). *(recommended)*
- **Missing age_group:** fall back to UStep1 to collect age. *(recommended — and per
  Supabase check this is the **common** path: only 3 of ~90 children have `age_group`.)*
- **Land step:** mainChallenge selection (UStep2_Goal). *(Adi, plan item #3)*

## Capability Check
- **CC did:** all code (5 files), i18n (both locales), typecheck/jest/i18n:check, Supabase
  read-only schema/data validation, docs.
- **Adi must do (Hat-4):** run the flow on a real device/emulator (auth-gated parent
  session) and confirm tasks appear + no duplicate profile (queries in TESTS.md).
- **Bottleneck:** the flow is auth-gated, so runtime verification can't be done headless here.

## Values Check (9 questions — passes)
**Pillar 1 — Intrinsic Motivation**
1. Want it without virtual reward? — Tasks tie to motivator-chosen **real** rewards (same
   engine as onboarding); no virtual-pet/coin loop. ✅
2. Closer to a reward the child chose? — Rewards derive from the motivator step. Parent
   initiates here (same as onboarding). ✅
3. "Want" vs "must"? — Setup action, not a child success event; neutral. ✅

**Pillar 2 — Positive Coaching**
1. Demeaning / comparison / failure framing? — Empty state is invitational
   ("Let's get {name} started"), never "no tasks / behind / nothing done." ✅
2. On failure, empathy vs pressure? — N/A (setup). ✅
3. BUDDY suffering / loss / anger? — None. ✅

**Pillar 3 — Independence-Building**
1. More capable without the app? — Starter tasks scaffold routines; same as onboarding. ✅
2. Child has a voice? — Parent-initiated (consistent with onboarding); challenge/motivator
   reflect the child. ⚠️→✅ Acceptable as the shipped-onboarding parity case. See note.
3. Necessary in 6 months? — One-time unstick helper; not engagement-bait. ✅

**Note / adjacency:** F-2026-05-18-01 (child-side empty Dashboard) flagged that **silent
default tasks** risk Pillar 1/3. This package does **not** create silent defaults — it
routes through the deliberate challenge + motivator selection, identical to shipped
onboarding. It does **not** resolve F-2026-05-18-01 (whose leaning solution is a BUDDY
welcome bridge for the *child's* first touch). The two are adjacent, not the same.

## Out of scope (flagged, untouched)
- Duplicate i18n keys in en.json (e.g. two `onboarding.step2.title`) — pre-existing.
- `STARTER_TASKS_BY_CHALLENGE` not covering every `OPTIONS_BY_AGE` id (FALLBACK_TASKS used) —
  pre-existing, identical to normal onboarding.
- UStep8_Complete overwriting parent `pro_settings` — noted in learnings; latent in the
  existing "Add Child" flow; avoided here by skipping UStep8.
