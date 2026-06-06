# co-parent-join — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**One-liner:** Port Lovable's proven co-parent flow to mobile — a logged-in parent enters another family's 6-char code in Settings and is moved into that family (role preserved), via the `switch_user_family` RPC, which also cleans up the now-empty old family. Premium becomes family-wide.

**Design source of truth:** the Lovable web app (`C:\Users\adiel\buff-lovable`, repo `adielgarat-pm/buff`). Adi: "המימוש בלוובל מושלם, אני רוצה פה אותו דבר." This SPEC mirrors it.

---

## Lovable reference (what we are porting)

| Piece | Lovable file |
|---|---|
| RPC `switch_user_family(p_new_family_code text)` | `supabase/migrations/20260127160241_*.sql` |
| Join UI (code input + Join button) | `src/components/JoinFamilySection.tsx` |
| Placement (parent settings, near sign-out) | `src/components/ParentSettings.tsx:351` |
| i18n keys `joinFamily.*` | `src/i18n/en.json:596-606`, `he.json` |
| Family code display (already exists on mobile) | `src/components/FamilyCodeDisplay.tsx` |

**Lovable's RPC behavior (verbatim logic):**
1. `auth.uid()` → caller's profile + current `family_id`.
2. Look up new family by `short_code = UPPER(TRIM(code))`.
3. Reject: not authenticated / profile not found / code not found / **already in that family**.
4. `UPDATE profiles SET family_id = <new>` for the caller — **role is preserved** (a parent stays a parent).
5. If the old family now has **0 members**, delete its family-scoped rows (`app_settings`, `credit_vault`, `store_rewards`, `tasks`, `timetables`, `daily_progress`, `lesson_progress`) then the `families` row.
6. Return `{ success, new_family_id }`.

---

## Capabilities & Bottlenecks

### מה CC יכול לעשות (this package)
- Port `switch_user_family` RPC to the mobile Supabase via `apply_migration` (mobile DB has no prod users — see memory mobile-db-no-prod-users).
- Port `JoinFamilySection` → an RN component in `ParentSettingsScreen`.
- Port `joinFamily.*` i18n strings (en + he).
- One-line family-wide fix in `useSubscription.ts`.
- typecheck + Jest + Expo web preview of the settings join flow.

### מה Adi חייבת לעשות בעצמה
- Approve this SPEC (`approved, proceed`).
- Hat-4: a real second Google account joining a real family on a physical device.
- **Lovable parity confirmation is automatic here** (we read the source), but Adi confirms the UX feels identical.

### צוואר בקבוק / נקודות עצירה צפויות
- The orphan-cleanup DELETE list must match mobile's FK reality (mobile has extra family/child tables Lovable lacked — `child_vibes`, `buddy_*`, `notifications`, `reward_redemptions`, `stickers`, `child_suggestions`). CC verifies `ON DELETE CASCADE` on `families`/child FKs in Plan Mode and either relies on cascade or extends the explicit deletes. (Note: cleanup only runs at **0 members**, so child-scoped tables are already empty — the risk is limited to family-scoped leftovers.)
- Real second-Google-account OAuth is hard to fully exercise on emulator → Hat-4.

---

## Values Check

> Parent-facing account feature; child-pillar questions map to "does it harm the child experience?".

### Pillar 1 — Intrinsic Motivation
1. Child wants it without reward? — N/A (parent account feature), no child reward mechanic added. **Pass.**
2. Brings child closer to a self-chosen reward? — Unchanged; both parents see the same rewards. **Pass.**
3. "I want" vs "I must"? — No new child-facing pressure. **Pass.**

### Pillar 2 — Positive Coaching
1. Copy ever shames/compares/shows failure? — Parent-facing copy only. **Pass.**
2. On child failure, empathy or pressure? — Unchanged; no surveillance/punishment surface added (PRD §6.4). **Pass.**
3. Buddy "suffer/loss/anger" mechanism? — None. **Pass.**
   ✅ **Security resolved by the Lovable model:** the switch **preserves the caller's role**, and the join UI lives only in **parent-only Settings**. There is no privilege-escalation path (unlike a signup-time "pick parent" branch). Earlier watch-item from the prior draft is closed.

### Pillar 3 — Independence-Building
1. Child more capable without the app? — Neutral for child; reduces single-parent bottleneck for the family. **Pass.**
2. Child has a voice? — Unchanged; preserved equally for both parents. **Pass.**
3. Still necessary in 6 months? — Account infrastructure, not a child-dependency mechanic. **Pass.**

**Values Check Pass:** [x] כן.

---

## Goals

- A logged-in parent can enter another family's 6-char code in **Parent Settings** and be moved into that family as a **full equal parent** (role preserved).
- The moved parent immediately sees/manages the joined family's children, tasks, rewards, etc. (family-scoped RLS already grants this).
- The moved parent's previous **empty** family is cleaned up automatically (no orphan rows).
- **Premium is family-wide:** if any parent in the family has entitlement, every parent (and child) is treated as subscribed.
- Behavior is **identical to Lovable**.

## Non-goals

- No signup-time / AuthCallback changes (the Lovable model joins from Settings — earlier draft's AuthCallback branch is **dropped**).
- No separate parent-invite code, deep link, or QR (reuse the existing family code; QR is a possible later parity item).
- No limited/tiered permissions — both parents equal.
- No "leave family" / co-parent management UI beyond what `switch_user_family` provides.
- No change to ChildJoin.

## Behavior Contract

> End-to-end after this package closes — mirrors Lovable.

1. Both partners sign up normally with Google. Each initially gets their own family (existing behavior, unchanged).
2. The "owner" parent (e.g., Tamar) reads the **family code** already shown in Settings → Account → Family Code ([ParentSettingsScreen.tsx:73-84](src/screens/parent/ParentSettingsScreen.tsx)).
3. The partner signs in, opens **Parent Settings → Join Family**, enters Tamar's code, taps **Join**.
4. Client calls `supabase.rpc('switch_user_family', { p_new_family_code })`.
5. RPC moves the partner's profile into Tamar's family (**role preserved**), and deletes the partner's now-empty old family + its family-scoped rows.
6. Client `refreshProfile(user.id)` → partner is now scoped to Tamar's family and sees its children/tasks/rewards (family-scoped RLS, verified during research).
7. **Premium:** `useSubscription` treats entitlement as **family-wide**, so the partner inherits Tamar's plan.

## Schema Changes

> Port of Lovable's `switch_user_family`. SQL-like; CC produces the real migration in Plan Mode.

```sql
create or replace function public.switch_user_family(p_new_family_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_family_id uuid;
  v_new_family_id uuid;
  v_member_count int;
  v_profile_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select id, family_id into v_profile_id, v_current_family_id
  from profiles where user_id = v_user_id limit 1;
  if v_profile_id is null then
    return jsonb_build_object('success', false, 'error', 'profile_not_found');
  end if;

  select id into v_new_family_id
  from families where short_code = upper(trim(p_new_family_code));
  if v_new_family_id is null then
    return jsonb_build_object('success', false, 'error', 'code_not_found');
  end if;
  if v_new_family_id = v_current_family_id then
    return jsonb_build_object('success', false, 'error', 'already_member');
  end if;

  update profiles set family_id = v_new_family_id  -- role preserved
   where id = v_profile_id;  -- + updated_at = now() if column exists

  if v_current_family_id is not null then
    select count(*) into v_member_count from profiles where family_id = v_current_family_id;
    if v_member_count = 0 then
      delete from app_settings   where family_id = v_current_family_id;
      delete from credit_vault   where family_id = v_current_family_id;
      delete from store_rewards  where family_id = v_current_family_id;
      delete from tasks          where family_id = v_current_family_id;
      delete from timetables     where family_id = v_current_family_id;
      delete from daily_progress where family_id = v_current_family_id;
      delete from lesson_progress where family_id = v_current_family_id;
      delete from families       where id = v_current_family_id;
    end if;
  end if;

  return jsonb_build_object('success', true, 'new_family_id', v_new_family_id);
end;
$$;
```

**Deltas from Lovable's verbatim SQL (CC to confirm in Plan Mode):**
- Return machine error **codes** (`not_authenticated`, `code_not_found`, `already_member`, …) instead of Lovable's Hebrew literals — the mobile client maps them to i18n (en-first market).
- `updated_at` only if `profiles` has that column.
- Cleanup list: verify mobile FK `ON DELETE CASCADE` on `families` and child tables; rely on cascade or extend the explicit deletes to cover mobile-only family-scoped tables. Cleanup only fires at 0 members.
- No table/column/constraint changes. RLS already family-scoped (no policy edits needed).

## API / Route Changes

- **New RPC:** `switch_user_family(p_new_family_code text) → jsonb`.
- **`useSubscription.ts`:** replace child-only `childInheritedAccess` with family-wide entitlement so a parent also inherits ([useSubscription.ts:106-116](src/hooks/useSubscription.ts)).
- No navigation/route changes; the join lives inside the existing settings screen (modal or inline card).

## UI Changes

- **New `JoinFamilyCard` RN component** (port of Lovable `JoinFamilySection`): 6-char code input (`autoCapitalize="characters"`, `maxLength={6}`, LTR), Join button, inline error + success toast/alert; on success calls `refreshProfile`. Rendered in `ParentSettingsScreen` (near the Family section / above Danger Zone, mirroring Lovable's placement above Sign Out).
- **Family code copy:** add the Lovable hint vibe — the code invites a **partner** too (`joinFamily.hint`: "Ask your partner for the family code from their settings"). Light copy only.
- All strings via i18n (en + he), ported from Lovable `joinFamily.*`.

## Open Questions

> CC resolves in Plan Mode.

- **Cleanup completeness vs FK cascade:** rely on `ON DELETE CASCADE` or mirror explicit deletes (+ mobile-only family tables)? CC verifies and notes in learnings.
- **Edge — switching parent still has children in the old family:** if a parent who *owns children* switches, the old family keeps ≥1 member (the kids), so cleanup does NOT fire — but those kids are left parent-less. Lovable does not guard this. For BUFF's real case (partner has no kids) it's fine; CC to decide whether to add a friendly guard or match Lovable exactly (default: **match Lovable**, note the edge).
- **Inline card vs modal** for the join UI in the RN settings screen — CC picks the pattern that fits `ParentSettingsScreen`'s existing component style (cf. `PauseModeCard`).

## Out of Scope

- AuthCallback / signup changes.
- Separate parent code / deep link / QR.
- Co-parent removal/management UI.
- Per-seat billing.
- ChildJoin changes.
