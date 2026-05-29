# TESTS — pkg/child-suggest

## Automated (CC, done)
- [x] `npm run typecheck` — clean.
- [x] `npm test` — 250 passing.
- [x] `npm run i18n:check` — all static keys resolve in he + en.
- [x] DB trigger smoke test: INSERT `child_suggestions` (pending) → a `child_suggestion`
      notification row is created with correct `entity_name` + `child_name`; test rows
      cleaned up afterwards.
- [x] Values Check (SPEC.md) — passes; Pillar 2 clean (no decline path).

## Hat-4 — Adi, real device/emulator (auth-gated; cannot run headless)

### Child side — Gamer mode
- [ ] Tasks tab: "יש לי רעיון למשימה" opens the modal; submit → "נשלח להורה 💚" toast and
      the idea appears under "הרעיונות שלי" with status "נשלח להורה ✓".
- [ ] Rewards tab (FROM PARENT): "יש לי רעיון לפרס" opens the modal with an emoji field;
      submit works the same way.
- [ ] Remove (withdraw) clears the idea.

### Child side — Mint mode
- [ ] Same two flows on `PastelChildTasks` and `PastelChildRewards`.

### Parent side
- [ ] Bell badge increments; NotificationFeed shows "{child} sent you an idea".
- [ ] ParentTasks shows the task idea under "רעיונות מ{name}". **"כן, בואו נעשה את זה"**
      opens the time + Buffs modal → save creates the task (appears in the list).
- [ ] ParentRewards shows the reward idea; **"כן"** opens the add-reward modal prefilled →
      save creates the reward.
- [ ] **"בואו נדבר על זה"** marks the idea "בשיחה 💬" (does NOT create anything; no decline).
- [ ] After "Let's talk", the child sees "ההורה רוצה לדבר על זה יחד 💬".
- [ ] Created task/reward row has `proposed_by_child = true` (SQL check below).

### SQL spot-checks
```sql
-- a created-from-suggestion task/reward is flagged
select id, title, proposed_by_child from tasks where proposed_by_child = true order by created_at desc limit 5;
select id, title, proposed_by_child from store_rewards where proposed_by_child = true order by created_at desc limit 5;
-- a resolved suggestion links to the created entity
select kind, status, created_entity_id from child_suggestions where status = 'approved' order by resolved_at desc limit 5;
```
