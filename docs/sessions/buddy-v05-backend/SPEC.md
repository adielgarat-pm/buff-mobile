# buddy-v05-backend — SPEC

> Backend infrastructure for Buddy System V0.5 per [BUFF_BUDDY_SYSTEM.md](../../BUFF_BUDDY_SYSTEM.md).
> **Pure backend.** UI consumers + booster mechanics + toast notifications come in follow-up packages.

**Slug:** `pkg/buddy-v05-backend`
**Branch:** `pkg/buddy-v05-backend`
**Origin:** Architectural unlock identified yesterday in [GAP_ANALYSIS.md "מה נותר — סדר עבודה מוצע"](../../BUFF_GAP_ANALYSIS.md). Top of the queue.
**Unblocks:** `pkg/teen-ui-with-buddy-bundle` (Stitch 03 + 05A + extend 5B-lite to full + 01-with-buddy variant). Also unblocks future packages for boosters, EOD logic, toasts, "tap on Buddy" navigation.

---

## Capabilities & Bottlenecks

### Adi (PM)
- Surfaces if any product behavior in the Behavior Contract feels off (definition of "successful day," level thresholds, what `pause_mode_active` halts, etc.).
- Reviews this SPEC for product/scope concerns; technical-architectural decisions are CC's per the 2026-05-15 architect directive.

### CC (architect + implementer)
- Owns and decides: schema, RLS, EOD mechanism, time zone, backfill, hook design, file structure, test strategy.
- Writes and runs the migration via Supabase MCP. Migration SQL also saved as `phase-1-migration.sql` in this folder for traceability.
- Implements EOD trigger.
- Adds `useBuddyRelationship(childId)` hook. AsyncStorage `usePetState` untouched.
- Adds Jest unit tests for the pure functions (level threshold logic, day-aggregation logic).
- Updates STATUS per workflow.

### Bottlenecks
- **`usePetState` is AsyncStorage-only with no Supabase writes** ([usePetState.ts:6-8](../../../src/hooks/usePetState.ts:6)). The V0.5 fields need server-side truth — this package introduces that without breaking the existing local-only flow.
- **Existing data volume** for backfill — addressed by the chosen backfill strategy (see "Architectural Decisions" below).

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?**
   ✅ Backend itself is invisible. Q applies to the surfaces it powers — those check again in their own UI packages. For the backend: powers a friendship arc, not a reward loop.
2. **Does this bring the child closer to a self-chosen reward?**
   ✅ Friendship levels gate Boosters which include Reward Discounts (level 5) → faster path to parent-set rewards. Pure facilitator.
3. **Does success feel like "I want to" or "I have to"?**
   ✅ Per BUDDY_SYSTEM.md philosophy: "BUDDY נותן, לא לוקח" — gifts arrive in response to successful days, never asked for, never lost.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / display failure?**
   ✅ N/A for backend. Future UI surfaces will check.
2. **If the child fails — is the response empathy or pressure?**
   ✅ Spec: "לא רצוף — אם פספסת יום, אתה לא חוזר ל-0". `successful_days_count` only increments, never decrements. No "broken streak" semantics anywhere in this schema.
3. **Is there a "suffering / loss / anger" mechanic for BUDDY?**
   ✅ No. Pause Mode freezes counters (no decrement during break). EOD trigger short-circuits when `pause_mode_active = true`.

### Pillar 3 — Independence-Building
1. **Does this make the child more capable *without* the app?**
   🟡 Backend itself doesn't. Features it powers (gradual autonomy in Booster choice from Level 3+) do.
2. **Does the child have a voice in this feature?**
   ✅ Yes — `buddy_relationships.buddy_visible` lets teens hide the buddy entirely. Level-3+ boosters are child-chosen.
3. **In 6 months, is this still necessary or did it do its job?**
   ✅ Active for the lifetime of usage; the friendship arc is the retention mechanism but it's tied to *real-world reward delivery*, not in-app currency loops.

**Values Check Pass:** ✅ Yes for the backend. UI packages re-check at their own time.

---

## Goals
- Server-side source of truth for V0.5 fields (friendship level, successful days, gift history, daily check).
- An EOD process that aggregates a child's day, decides if it counted as "successful," updates `successful_days_count`, and triggers level-ups + pending gifts when thresholds are crossed.
- A read-only hook for the UI to consume the new state.
- RLS so children read only their own row, parents read all their family's children's rows.

## Non-goals
- **No UI changes.** GamerMyStatsScreen, dashboards, etc. stay on the lite version until the follow-up package extends them.
- **No booster grant/use mechanics.** Schema captures `buddy_gifts_history` rows but no flow lets the child redeem ×2 Buffs / Skip Token / etc. yet. Separate package.
- **No toast notifications.** A `has_pending_gift` flag will be set when a level-up happens; UI consumption is the follow-up package.
- **No tap-on-Buddy navigation.** UI follow-up.
- **No Boosters Levels 4-5.** Per BUDDY_SYSTEM.md Phase 1, only levels 1-3 + 2 starter boosters (Custom Theme Color, ×2 Buffs schema entries — no logic for "use").
- **No deprecation of `usePetState`.** Stays as-is; the new hook reads from Supabase. Reconciliation deferred to UI packages.

---

## Behavior Contract

After this package merges:

1. Each existing child profile has a `buddy_relationships` row, populated per the backfill strategy chosen in Open Question 3.
2. EOD process (per chosen mechanism, OQ1) runs once per child per day. For each child:
   - Inserts a `buddy_daily_check` row with `tasks_assigned`, `tasks_completed`, `completion_rate`, `is_successful_day` (true if rate ≥ 0.70).
   - If `is_successful_day` AND `pause_mode_active = false` AND no prior successful day already counted for this date: increments `successful_days_count`.
   - If new count crosses a threshold (3 or 10 — only first 3 levels in this package): increments `friendship_level`, sets `has_pending_gift = true`, inserts a `buddy_gifts_history` row of the appropriate gift_type for that level.
3. `useBuddyRelationship(childId)` hook returns `{ relationship, loading, error }` reading from buddy_relationships.
4. RLS: child SELECTs own row + history; parent SELECTs all family children's rows; admin sees all.

## Schema Changes

> CC will write these as a single migration. Adi reviews the migration file before CC runs `mcp__supabase__apply_migration`.

### `buddy_relationships`

```sql
CREATE TABLE buddy_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  friendship_level INT NOT NULL DEFAULT 1 CHECK (friendship_level BETWEEN 1 AND 5),
  successful_days_count INT NOT NULL DEFAULT 0 CHECK (successful_days_count >= 0),

  -- Customization (sourced from existing pet_state.current_skin if backfill chosen)
  current_skin_id TEXT,
  current_theme_color TEXT,
  buddy_name TEXT,                            -- nullable; UI defaults to 'Stormy' for Wolf, 'Buddy' otherwise
  buddy_visible BOOLEAN NOT NULL DEFAULT true, -- false when teen chose no-buddy variant

  has_pending_gift BOOLEAN NOT NULL DEFAULT false,

  relationship_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_level_up_at TIMESTAMPTZ,
  last_successful_day_date DATE,              -- DATE not TIMESTAMPTZ — used for "did we already count today" check

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(child_profile_id)
);

CREATE INDEX idx_buddy_relationships_child ON buddy_relationships(child_profile_id);
```

**Differences from BUDDY_SYSTEM.md spec:**
- Dropped `total_days_together` and `total_tasks_completed` — not used by Phase 1 UI; YAGNI.
- Dropped `current_mood_pack` — Boosters phase 2.
- `last_successful_day_at TIMESTAMPTZ` → `last_successful_day_date DATE` — semantic match for "have we counted today?" check, simpler reasoning.
- Added explicit CHECK constraints + indexes.

### `buddy_gifts_history`

```sql
CREATE TABLE buddy_gifts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  gift_type TEXT NOT NULL CHECK (gift_type IN (
    'theme_color',     -- Level 2 + 4
    'double_buffs',    -- Level 3
    'mood_pack',       -- Level 3
    'skip_token',      -- Level 4
    'reward_discount', -- Level 5
    'skin'             -- Level 5
  )),
  gift_value TEXT,                    -- e.g. 'green' for theme_color, NULL for double_buffs
  given_at_level INT NOT NULL CHECK (given_at_level BETWEEN 2 AND 5),
  given_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  used_at TIMESTAMPTZ,
  is_used BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buddy_gifts_child ON buddy_gifts_history(child_profile_id, given_at DESC);
```

### `buddy_daily_check`

```sql
CREATE TABLE buddy_daily_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,

  tasks_assigned INT NOT NULL CHECK (tasks_assigned >= 0),
  tasks_completed INT NOT NULL CHECK (tasks_completed >= 0 AND tasks_completed <= tasks_assigned),
  completion_rate DECIMAL(3,2) NOT NULL,
  is_successful_day BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(child_profile_id, check_date)
);

CREATE INDEX idx_buddy_daily_check_child_date ON buddy_daily_check(child_profile_id, check_date DESC);
```

### RLS proposals

```sql
ALTER TABLE buddy_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_gifts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_daily_check  ENABLE ROW LEVEL SECURITY;

-- Child: read own only.
-- Parent: read any child profile in same family.
-- (Mirrors the existing pattern on `profiles` — confirm during implementation.)

CREATE POLICY child_or_parent_reads_buddy ON buddy_relationships FOR SELECT
  USING (
    child_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR child_profile_id IN (
      SELECT p2.id FROM profiles p1
      JOIN profiles p2 ON p1.family_id = p2.family_id
      WHERE p1.user_id = auth.uid() AND p1.role = 'parent' AND p2.role = 'child'
    )
  );

-- Same shape for buddy_gifts_history and buddy_daily_check.
-- Writes: only via service-role / EOD function. No INSERT/UPDATE/DELETE policies.
```

**Open question for Adi**: confirm RLS pattern matches existing tables. If existing tables use a different join pattern, CC mirrors it instead.

## Prompts Changes

**None.**

## API / Route Changes

- **New hook:** `src/hooks/useBuddyRelationship.ts` — reads `buddy_relationships` for the active child. Returns `{ relationship, loading, error, refetch }`. No writes.
- **New TypeScript types:** `src/types/buddy.ts` — generated via `mcp__supabase__generate_typescript_types` post-migration, then exported.
- **No new routes / screens / navigation changes.**

## UI Changes

**None.** That's the follow-up package's job.

## Architectural Decisions (CC — architect role per 2026-05-15)

Recorded for traceability. Adi can redirect any of these if a product implication is missed.

| # | Decision | Reasoning |
|---|---|---|
| 1 | **EOD trigger via pg_cron** (`SELECT cron.schedule(...)`) | Simplest infra, no client dependency, deterministic. Falls back to client trigger only if pg_cron extension isn't available on this Supabase plan — checked at impl time. |
| 2 | **Time zone: Asia/Jerusalem** for "today" rollover. Stored as `DATE` in `last_successful_day_date` and `buddy_daily_check.check_date`, computed via `(now() AT TIME ZONE 'Asia/Jerusalem')::date` in SQL. | Matches user expectations for the MVP audience. Per-family TZ is over-engineering for now; add a `families.timezone` column when international users matter. |
| 3 | **Backfill: start at 0 for all existing children.** Migration creates `buddy_relationships` rows with `friendship_level=1`, `successful_days_count=0`. | Cleanest. The future UI package will soften with a "Welcome to the Friendship!" first-launch message. `pet_state` JSONB stays untouched — no data loss. |
| 4 | **Keep both "successful day" definitions.** `pet_state.evolution_days_count` (AsyncStorage, any-completion) and `buddy_relationships.successful_days_count` (Supabase, 70%+) coexist. | Different concepts deserving different counters. The lite GamerMyStatsScreen will switch its "Successful days" stat to the new field in the follow-up UI package. |
| 5 | **No booster grant/use flow in this package.** Schema captures `buddy_gifts_history` rows on level-up; "use" logic (e.g. ×2 Buffs day-application) is a separate package. | Single-responsibility — backend infrastructure only. Use mechanics touch every task-completion path; deserves its own scoped work. |
| 6 | **Schema supports all 5 levels; EOD trigger handles only L2 + L3 thresholds (3 + 10 days).** | Phase 1 in BUDDY_SYSTEM.md = first 3 levels only. CHECK constraint `BETWEEN 1 AND 5` lets L4/L5 slot in later without migration. |
| 7 | **RLS via `auth.uid()` joined through `profiles`.** CC will inspect existing table policies during impl and mirror their pattern (likely the same `SECURITY DEFINER` style if used elsewhere). | Consistent with existing patterns; no surprises for future maintainers. |
| 8 | **Hook: `useBuddyRelationship(childId)`** — read-only, `{ relationship, loading, error, refetch }`. Realtime subscription **deferred** to a UI follow-up; this hook polls once on mount + exposes `refetch`. | Sufficient for MVP. Realtime adds complexity (channel cleanup, RLS edge cases) that the UI package can take on if needed. |
| 9 | **TypeScript types** — generated post-migration via `mcp__supabase__generate_typescript_types`, then narrowed/exported in `src/types/buddy.ts`. | Standard pattern; keeps types in sync with schema. |

## Open Questions (product — for Adi if anything looks off)

None blocking. The Behavior Contract above is the surface that affects users; if any of those reads wrong, redirect.

## Out of Scope

- UI extensions to GamerMyStatsScreen (the lite version stays put until the follow-up).
- Booster grant logic / "use" flow / ×2 Buffs application to task completion.
- Toast notifications on level-up.
- "Tap on Buddy → Me & Buddy" navigation.
- Hide/Show Buddy preference UI in Settings (the column is here; the UI is later).
- FCM push notifications for level-ups (depends on FCM setup, separate `pkg/fcm-push-notifications`).
- Levels 4-5 logic and their gifts.
- Deprecation / migration of `usePetState` AsyncStorage state.
- Any change to the existing `pet_state` JSONB column on `profiles`.
- Multi-device sync of pet_state (separate concern).
