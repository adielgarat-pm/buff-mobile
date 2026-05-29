# SPEC — pkg/child-suggest

**Target state:** A child can propose a **task** and a **reward** to their parent. The
parent responds with a **deal-making** flow — **"Yes, let's do it"** (the idea becomes a
real task/reward) or **"Let's talk about it"** (a warm conversation prompt, *not* a
decline). Works in **both** Gamer and Mint child modes. Closes the two dead-stub CTAs from
IN-2026-05-29-01.

## Why deal-making, not approve/decline
BUFF_PRD §227 frames this as a *"Deal-making interface — propose tasks and rewards for
parent approval"* and §165 *"The child is a stakeholder."* There is **no reject/decline**
path anywhere (BUFF_VALUES Pillar 2). The worst outcome a child can experience is *"my
parent wants to talk about my idea"* — engagement, never shame. Confirmed by Adi 2026-05-29.

## Behaviour contract

1. **Storage — new `public.child_suggestions` table** (dedicated, *not* a flag on
   `tasks`/`store_rewards`). Pending ideas stay invisible to all existing task/reward/
   progress/EOD-cron logic until a parent promotes one through the existing insert path.
   Columns: `id, family_id, child_id, kind('task'|'reward'), title, emoji,
   status('pending'|'discussing'|'approved'|'withdrawn'), created_at, resolved_at,
   resolved_by, created_entity_id`. **No `declined` value by design.**

2. **RLS** — INSERT: any family member (`family_id = get_my_family_id()`) — works for both
   a real ChildJoin child session and a parent-on-shared-device. SELECT: parents see all
   family suggestions; a child sees only their own. UPDATE: parents resolve
   (approve/discussing); a child may only set their own row to `withdrawn` (never
   self-approve). No change to `tasks`/`store_rewards` RLS.

3. **Notify** — `trg_notify_parent_on_child_suggestion` (AFTER INSERT, SECURITY DEFINER)
   inserts a `notifications` row of new type **`child_suggestion`**, giving the parent bell
   badge + FCM push for free (mirrors `notify_parent_on_reward_redeemed`).

4. **Child entry points** — a shared `SuggestModal` (title only; + optional emoji for
   rewards) and `SuggestionStatusList` (the child's own open ideas with status + remove).
   - Gamer: wires the two existing stubs (`GamerTasksScreen`, `GamerRewardsScreen`).
   - Mint: adds the button + modal to `PastelChildTasks` and `PastelChildRewards`.
   - Child-facing status copy: `pending` → "נשלח להורה ✓"; `discussing` → "ההורה רוצה
     לדבר על זה יחד 💬"; approved ideas just become the real task/reward. Simple +
     inviting, no "why" embedded (CLAUDE.md feedback-kid-task-copy-simple).

5. **Parent surface** — `PendingSuggestions` section on `ParentTasksScreen` and
   `ParentRewardsScreen` (per selected child). **"Yes"** opens an editor prefilled with the
   child's title so the parent sets Buffs/time/size — the parent keeps the economy. On save
   the real row is created with **`proposed_by_child = true`** (wiring the dormant PRD
   column) and the suggestion is marked `approved`. **"Let's talk about it"** → `discussing`
   (still approvable later). Reward approve reuses the existing add-reward modal; task
   approve uses a small time + Buffs modal (category defaults to `responsibility`, every day).

## Decisions (confirmed by Adi, 2026-05-29)
- **No decline — deal-making with "Let's talk about it"** instead. *(Adi's direction.)*
- **Child input = title only** (+ optional emoji for rewards); parent sets the economy. *(rec)*
- **"Let's talk" message = fixed warm line** for now; per-parent note deferred. *(rec)*
- **CTA wording** kept simple ("יש לי רעיון למשימה / לפרס"). *(rec)*
- **Dedicated table** over reusing tasks/store_rewards — blast-radius isolation. *(CC arch.)*

## Capability Check
- **CC did:** migration + RLS + trigger (mobile DB, no prod users), hooks, shared child +
  parent components, both child themes, both parent screens, notification wiring, i18n
  (both locales), typecheck/jest/i18n:check, DB-level trigger smoke test (insert →
  notification → cleanup), docs.
- **Adi must do (Hat-4):** run on a real device/emulator (auth-gated) — child submits a
  task + reward in both Gamer and Mint; parent sees the idea + bell badge; "Yes" creates
  the real item; "Let's talk" shows the child the warm prompt; child withdraw works.
- **Bottleneck:** child/parent screens are auth-gated → no headless runtime check here.

## Values Check (9 questions — passes)
**Pillar 1 — Intrinsic Motivation**
1. Want it without a virtual reward? — It's the child's own idea / own chosen reward. ✅
2. Closer to a child-chosen reward? — The child literally proposes the reward. ✅
3. "Want" vs "must"? — Child-initiated; pure agency. ✅

**Pillar 2 — Positive Coaching**
1. Ever demeaning / comparison / failure framing? — **No decline exists.** Worst case is an
   invitation to talk. ✅
2. On "failure", empathy vs pressure? — There is no failure state; "Let's talk" is
   engagement. ✅
3. BUDDY suffering / loss / anger? — None. ✅

**Pillar 3 — Independence-Building**
1. More capable without the app? — Practices self-advocacy + real-world negotiation with a
   parent. ✅
2. Child has a voice? — This *is* the child-voice feature; child also withdraws own ideas. ✅
3. Necessary in 6 months? — A channel for voice that fades as the child gains direct say. ✅

## Out of scope (flagged, untouched)
- Per-parent custom "Let's talk" note (fixed line for now).
- Encoding suggestion `kind` into the notification type (single `child_suggestion` type;
  routes to ParentTasks, which today just returns to the tab navigator like all parent_*).
- Dormant `stickers` table (Lovable-era, wired nowhere) — not repurposed.
