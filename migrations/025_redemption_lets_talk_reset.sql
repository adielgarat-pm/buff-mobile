-- 025_redemption_lets_talk_reset.sql
-- pkg/redemption-talk-reset
--
-- Redesign of the "let's talk about it" path for reward redemptions.
--
-- Before: "discussing" was a persistent OPEN state. Parent + child both kept
-- seeing it; the parent could still approve it later.
--
-- After (Adi-approved flow): "let's talk" is a clean two-sided RESET.
--   requested  → child asked, awaiting parent              (parent + child see it)
--   discussing → parent tapped "let's talk", awaiting child (child only)
--   discussed  → child tapped "got it", closed   [NEW]     (nobody sees it; re-requestable)
--   approved   → parent approved + deducted (terminal)
--   withdrawn  → child cancelled (terminal)
--
-- The parent no longer approves a discussed item directly — after the IRL talk,
-- the child re-requests (the reward is repeatable; the open-per-reward unique
-- index — status in ('requested','discussing') — frees once status='discussed').
-- So that index needs NO change here.

-- ─── 1. Allow the new terminal status ───────────────────────────────────────
alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_status_check,
  add constraint reward_redemptions_status_check
    check (status in ('requested','discussing','approved','withdrawn','discussed'));

-- ─── 2. Let a child acknowledge ("got it") their own discussing request ──────
-- The child-side UPDATE policy previously only permitted status='withdrawn'
-- (cancel). The "got it" tap moves the row to 'discussed', so the child needs
-- to be allowed to write that status too. USING (row ownership) is unchanged.
drop policy if exists "Children can withdraw their redemptions" on public.reward_redemptions;

create policy "Children can withdraw or acknowledge their redemptions"
  on public.reward_redemptions for update
  using (family_id = get_my_family_id()
         and child_id = (select id from profiles where user_id = auth.uid() limit 1))
  with check (status in ('withdrawn','discussed'));
