# co-parent-join — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**One-liner:** A second parent joins an existing family with their own Google account, as a full equal co-parent, by entering the family's existing 6-character code. Premium becomes family-wide.

---

## Capabilities & Bottlenecks

### מה CC יכול לעשות (this package)
- Add a SECURITY DEFINER RPC (`join_family_as_parent`) via `apply_migration` — mobile DB has no prod users, migrations applied directly (see memory: mobile-db-no-prod-users).
- Edit `AuthCallbackScreen.tsx`, `useSubscription.ts`, i18n string files, and parent dashboard/settings invite copy.
- Run typecheck + Jest + Expo web preview for the auth/role-selection screen.

### מה Adi חייבת לעשות בעצמה
- Approve this SPEC (`approved, proceed`) before any code.
- Hat-4 real-device verification: a genuine second Google account joining a real family on a physical device (emulator can validate the flow; the real-account OAuth round-trip is device-confirmed).
- Decide on the **fast-follow security gate** (existing-parent approval) — flagged below, NOT in MVP scope.

### צוואר בקבוק / נקודות עצירה צפויות
- Real Google OAuth with a *second distinct* Google account is hard to fully exercise on the emulator; final confirmation is Hat-4.
- Premium-inheritance change touches a shared hook — must regression-check the existing child-inherits-parent path.

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. This is a **parent-facing** feature (account/family structure), so several child-pillar questions map to "does it harm the child experience?" rather than "does the child want it?".

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   N/A — parent-facing account feature. It introduces no reward mechanic to the child. **Neutral / Pass.**
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   No change to rewards. Both parents see the same child-chosen rewards. **Pass.**
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?**
   No new child-facing pressure. **Pass.**

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   Parent-facing copy only; no child-facing shame language. **Pass.**
2. **אם הילד נכשל — האם התגובה היא empathy או pressure?**
   Unchanged. Two parents do not add a surveillance/punishment surface — BUFF still has no "punish" controls (PRD §6.4). **Pass.**
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?**
   None added. **Pass.**
   ⚠️ **Watch:** the chosen "reuse family code" mechanism means a child who knows the code could, in theory, escalate to parent powers (see § Security Risk). This is a Pillar-2 *safety* consideration — documented + mitigation proposed as fast-follow.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   Neutral for the child. For the family it reduces single-parent bottleneck (both parents can run the scaffold). **Pass.**
2. **האם לילד יש קול בפיצ'ר?**
   Unchanged — child voice in tasks/rewards is preserved for both parents equally. **Pass.**
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?**
   It is account infrastructure, not a child-dependency mechanic. **Pass.**

**Values Check Pass:** [x] כן — with the Pillar-2 security watch-item tracked as a fast-follow (not a blocker for MVP).

---

## Goals

- A person who signs in with Google and has **no profile yet** can choose **"Join an existing family"** as a **parent**, enter the family's 6-char code, and become a full co-parent of that family.
- The co-parent sees and manages the **same children, tasks, rewards, redemptions, vibes, settings** as the first parent (family-scoped RLS already grants this).
- **Premium is family-wide:** if any parent in the family has lifetime/founding entitlement, every parent (and child) is treated as subscribed.
- The first parent can understand that the **same family code** invites a co-parent (copy clarity), without a separate code system.

## Non-goals

- No separate parent-invite code or deep link (decision: reuse existing code).
- No limited/role-tiered permissions — both parents are equal (decision).
- No "remove co-parent" / co-parent management UI in this package (fast-follow if needed).
- No change to how children join (ChildJoin flow untouched).
- No billing/seat changes — premium is a family signal, not per-seat.

## Behavior Contract

> מה המערכת עושה end-to-end אחרי שהחבילה הזו נסגרת.

**Joining as a co-parent (new flow):**
1. Partner signs in with Google → no profile exists → `AuthCallbackScreen` shows role selection (`needsRoleSelection`, [AuthCallbackScreen.tsx:19](src/screens/auth/AuthCallbackScreen.tsx)).
2. Partner taps **"Parent"**. Instead of immediately creating a new family, they now see a sub-choice: **"Create a new family"** vs **"Join an existing family"**.
3. **Create a new family** → existing behavior unchanged ([AuthCallbackScreen.tsx:32-44](src/screens/auth/AuthCallbackScreen.tsx)).
4. **Join an existing family** → a code-entry view (mirrors `ChildJoinScreen` step `'code'`) → on submit, call new RPC `join_family_as_parent(p_family_code)`.
5. RPC (SECURITY DEFINER): resolves the family by `short_code` (case-insensitive, like [AuthContext.tsx joinFamily lookup](src/contexts/AuthContext.tsx)). If found, **links the calling auth user as a parent** of that family:
   - If the caller already has a profile → `UPDATE` its `family_id` + `role='parent'`.
   - Else → `INSERT` a parent profile with that `family_id`.
   - Does **not** create a duplicate `app_settings` row (the family already has one from the first parent — guard before insert).
   - Returns `{ found: boolean, reason?: text, family_id?: uuid, family_name?: text }`.
6. Client calls `refreshProfile(user.id)` → `RootNavigator` routes the new parent into the existing parent app, now scoped to the joined family.

**Premium family-wide:** `useSubscription` currently inherits parent entitlement **only for children** (`childInheritedAccess`, [useSubscription.ts:106-108](src/hooks/useSubscription.ts)). Change to a **family-wide** check so a parent also inherits when any *other* parent has entitlement. RC entitlements remain device-local (unchanged).

**First-parent side:** the family code already shown on the dashboard invite card now carries copy that it can invite a partner too (no new code, no new mechanism).

## Schema Changes

> SQL-like notation, **not** a real migration — that's CC's Plan-Mode output.

New RPC (SECURITY DEFINER, `search_path` pinned), modeled on `list_family_children` / `link_child_profile`:

```sql
create or replace function public.join_family_as_parent(p_family_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_family_name text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('found', false, 'reason', 'not_authenticated');
  end if;

  select id, name into v_family_id, v_family_name
  from families
  where short_code ilike trim(p_family_code)
  limit 1;

  if v_family_id is null then
    return jsonb_build_object('found', false, 'reason', 'code_not_found');
  end if;

  -- GUARD (see Open Questions): refuse if caller already owns children in a
  -- DIFFERENT family, to avoid orphaning their kids. CC to confirm exact rule.

  if exists (select 1 from profiles where user_id = v_uid) then
    update profiles
       set family_id = v_family_id, role = 'parent'
     where user_id = v_uid;
  else
    insert into profiles (user_id, family_id, display_name, role, marketing_consent)
    values (v_uid, v_family_id, coalesce(/* full_name */ 'Parent'), 'parent', false);
  end if;

  return jsonb_build_object('found', true, 'family_id', v_family_id, 'family_name', v_family_name);
end;
$$;
```

- **No table/column changes.** No new constraints. No change to `families.short_code` generation.
- RLS already grants the new parent everything (family-scoped). Verified against `pg_policies` during SPEC research.

## API / Route Changes

- **New RPC:** `join_family_as_parent(p_family_code text) → jsonb`.
- **`AuthCallbackScreen.tsx`** — add the Parent → {Create new / Join existing} sub-step + code entry. No new navigation route required (stays within the callback screen state machine); if cleaner, CC may add a dedicated `ParentJoin` screen mirroring `ChildJoin` — CC's call in Plan Mode.
- **`useSubscription.ts`** — replace `childInheritedAccess` with family-wide entitlement.

## UI Changes

- **AuthCallbackScreen:** after tapping "Parent", a two-button choice (Create new family / Join existing family). Choosing "Join" reveals a 6-char code input (reuse `ChildJoinScreen` visual pattern — same `familyCodeInput` style, `autoCapitalize="characters"`, `maxLength={6}`).
- **Parent dashboard / Settings invite copy:** make explicit that the family code invites a partner as well as children. Minimal copy change — no new screen.
- All new strings go through i18n (en + he) per `i18n-string-plumbing` conventions.

## Security Risk (must read)

Reusing the **child-shared family code** for parent join means: anyone who knows the code + has a Google account can choose "Join as parent" and gain **full parent powers** (see all children's data, change settings, approve their own redemptions). In a children's app this is a real privilege-escalation surface (Pillar-2 safety).

- **MVP stance (approved by the decision to reuse the code):** accept it. Kids don't reach this path in normal use — they enter via `RoleSelection → "I'm a kid" → ChildJoin` (profile picker), not via Google-sign-in → "Parent". Escalation requires deliberate, non-obvious steps + a personal Google account.
- **Fast-follow (recommended, NOT in this package):** existing-parent **approval gate** — a join request creates a *pending* co-parent that an existing parent confirms in-app before powers are granted. Flag for Adi as a separate package.

## Open Questions

> CC resolves these in Plan Mode — do NOT pre-solve here.

- **Orphaning guard:** if the joining user already has a profile in *another* family that has children, reassigning `family_id` would strand those kids. Recommended default: the RPC **refuses** the join with a friendly reason (`already_parent_with_children`) and the UI explains it. CC to confirm the exact predicate and message.
- **Empty-family cleanup:** if the partner had earlier created their own empty family (very likely — they may have already signed in once), joining reassigns their profile and leaves an orphaned childless family row. Acceptable as a harmless orphan, or CC may soft-delete it. CC to decide + note in learnings.
- **Display name on insert:** pull from `user.user_metadata.full_name` (mirror [AuthCallbackScreen.tsx:60](src/screens/auth/AuthCallbackScreen.tsx)) — confirm the RPC has access or pass it as a param.
- **Where the sub-choice lives:** inline state in `AuthCallbackScreen` vs a dedicated `ParentJoin` screen mirroring `ChildJoin`. CC picks the lower-risk option.

## Out of Scope

- Co-parent removal / management UI.
- Separate parent invite code or `buff://` deep link for parents.
- Per-seat billing.
- Notification routing changes (RLS already lets both parents read family notifications).
- Any change to the ChildJoin flow.
