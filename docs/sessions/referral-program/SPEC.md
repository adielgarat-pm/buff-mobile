# SPEC — referral-program

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Branch:** `pkg/referral-program`
**Last updated:** 2026-06-22

---

## 1. Problem statement

BUFF has no organic growth mechanism. Word-of-mouth already happens (parents in ADHD WhatsApp groups), but there is no structured loop to capture it. Marketing is a concern and a referral program is the lightest leverage point — it rewards the behavior that's already happening.

Additionally, `useSubscription` has no time-boxed premium state. Subscription is binary: you either have lifetime/founding access (DB flags) or an active RevenueCat entitlement. There is no `premium_expires_at` field. This limits future mechanics (trials, referral grants, win-back campaigns) that require temporary premium access.

---

## 2. Two goals, one package

**Goal A — Infrastructure:** Add `premium_until` to the DB and wire it into `useSubscription`. This is foundational; referral is the first consumer.

**Goal B — Referral program:** Bilateral 14-day grant. Every family that refers a new family gets 14 days of premium. The new family also gets 14 days free trial.

These ship together in one package.

---

## 3. Target state

### 3.1 DB schema additions

#### `profiles` table — new column
```sql
premium_until timestamptz DEFAULT NULL
```
- `NULL` = no time-boxed grant
- If set, extends premium access until this timestamp regardless of RC status
- Does not replace `is_lifetime_access` / `is_lifetime_founding` — those remain as-is

#### New table: `referrals`
```sql
CREATE TABLE referrals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_family_id uuid NOT NULL REFERENCES families(id),
  referred_family_id uuid REFERENCES families(id),       -- NULL until new family joins
  code              text NOT NULL UNIQUE,                -- 6-char alphanumeric, e.g. "BF3K9X"
  status            text NOT NULL DEFAULT 'pending',    -- pending | completed | expired
  created_at        timestamptz DEFAULT now(),
  completed_at      timestamptz
);
```

RLS:
- Parent can SELECT their own family's referral (referrer_family_id = family_id)
- INSERT allowed for authenticated parents (one per family)
- No UPDATE from client — all state changes via RPC

#### New RPC: `redeem_referral(code text)`
Called by a newly onboarded parent after they sign up. Logic:
1. Find referral row by `code` where `status = 'pending'`
2. Check: referred family ≠ referrer family (no self-referral)
3. Check: referred family has not already used a referral code (one per family)
4. Set `referred_family_id`, `status = 'completed'`, `completed_at = now()`
5. Extend `premium_until` on ALL parent profiles in BOTH families — top-up mechanic:
   ```sql
   new_val = LEAST(
     GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days',
     now() + interval '14 days'
   );
   UPDATE profiles SET premium_until = new_val WHERE family_id IN (...);
   ```
   Net effect: always tops up to exactly 14 days from now. If you have 10 days left → 14. If you have 0 → 14. Never accumulates beyond 14.
6. Return `{ success: true }` or an error code

---

### 3.2 `useSubscription` changes

Priority order (updated):

```
1. is_lifetime_access (DB)     → always subscribed
2. is_lifetime_founding (DB)   → always subscribed
3. familyHasEntitlement (DB)   → any parent in family has 1 or 2
4. premium_until (DB)          → now() < premium_until   ← NEW
5. Grace period (< 2026-05-01) → already expired, kept for safety
6. rcSubscribed / rcFounding   → live RevenueCat entitlement
7. noIapPaywallHidden          → iOS/Web beta exception
```

New derived value exposed:
```ts
referralPremiumUntil: Date | null  // from profile.premium_until
isReferralPremium: boolean          // now() < referralPremiumUntil
```

---

### 3.3 Referral code generation

Each family gets one referral code. Generated on first request (lazy), stored in `referrals` table with `status = 'pending'` and `referred_family_id = NULL`.

Code format: 6 uppercase alphanumeric characters, no ambiguous chars (0/O, 1/I/L). Example: `BF3K9X`.

A family can have multiple rows (one per referral they send out) — but only one unredeemed `pending` per family at a time. On re-request, return the existing pending code.

---

### 3.4 Share flow — parent UI

**Entry point:** ParentSettingsScreen → new "Invite a friend" row (below account section).

**Screen: Referral Sheet (bottom sheet)**

```
┌─────────────────────────────────────────┐
│  Give a friend 2 free weeks of BUFF     │
│                                         │
│  Share your invite link and you BOTH    │
│  get 14 days of BUFF Premium — free.    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │   buffadhd.com/join?ref=BF3K9X   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [  Share via WhatsApp  ]               │
│  [  Copy link           ]               │
│                                         │
│  You've referred: 0 families            │
│                                         │
└─────────────────────────────────────────┘
```

WhatsApp message template (editable by user before sending):
```
גיליתי אפליקציה שעוזרת ל[שם הילד] עם משימות יומיות. 
היא עוזרת לנו לא להיות שוטרים כל הזמן 🙌
הנה 2 שבועות בחינם: buffadhd.com/join?ref=BF3K9X
```

**If user is already on Premium (RC or lifetime):** Show the sheet normally. Their `premium_until` will stack on top of their current subscription when a referral completes — they bank extra days for when their RC sub lapses.

---

### 3.5 Redemption flow — new user onboarding

Onboarding Step 1 (after Google sign-in): if the user arrived via `buff.app/join?ref=XXXXXX`, the `ref` query param is captured and stored locally.

After the parent completes onboarding → call `redeem_referral(code)` silently in the background.

On success: show a one-time toast: "🎉 2 free weeks of BUFF Premium activated!"

**Web:** query param captured from URL on landing. Passed through to the app via deep link or stored in AsyncStorage.
**Android:** if opened via the referral URL, the deep link carries the `ref` param.

---

### 3.6 Expiry cleanup (cron)

Supabase pg_cron job — daily at 03:00 UTC:
```sql
UPDATE profiles
SET premium_until = NULL
WHERE premium_until IS NOT NULL
  AND premium_until < now();
```

This keeps `premium_until` clean. `useSubscription` also checks client-side (`now() < premium_until`) so expiry is instant even before the cron runs.

---

## 4. Out of scope (this package)

- Admin view of referral stats (future)
- Referral rewards beyond 14 days (future)
- Deep link routing changes beyond capturing `ref` param (deep link package is separate)
- RevenueCat webhook integration for referral tracking
- SMS / email share (WhatsApp + copy link is sufficient for v1)

---

## 5. Values check

| Pillar | Question | Answer |
|--------|----------|--------|
| Intrinsic motivation | Does this make the child experience feel transactional? | No — referral is parent-facing only. Children never see it. |
| Positive coaching | Does this create pressure or guilt on parents? | No — it's an optional benefit, not a prompt. |
| Independence-building | Does premium gating affect child autonomy features? | No — referral unlocks existing premium, not new locked features. |

---

## 6. Phases

### Phase 1 — DB + RPC (no UI)
- Add `premium_until` column to `profiles`
- Create `referrals` table + RLS
- Create `redeem_referral` RPC
- Add pg_cron cleanup job
- Update `useSubscription` to read `premium_until`
- Unit test: `useSubscription` with `premium_until` in the past / future / null

### Phase 2 — Share UI
- `useReferral` hook: `getOrCreateCode()`, `getReferralStats()`
- Referral bottom sheet component
- "Invite a friend" row in ParentSettingsScreen
- WhatsApp share + copy link

### Phase 3 — Redemption
- Capture `ref` query param in onboarding
- Call `redeem_referral` post-onboarding
- Success toast
- Web: param capture from URL

### Phase 4 — Hat 1 + Hat 3
- Jest: `useSubscription` with referral grant
- Jest: `redeem_referral` RPC edge cases (self-referral, already-used, expired code)
- Hat 3: end-to-end — generate code → share → redeem → both families see premium

---

## 7. Open questions — ALL RESOLVED (2026-06-22)

1. ~~**URL domain:**~~ `buffadhd.com/join?ref=XXXXXX`
2. ~~**Referral code expiry:**~~ Permanent — no expiry on pending codes.
3. ~~**Capping:**~~ Top-up to 14 days max. Never accumulates beyond 14 days ahead. No monthly rate limit.
4. ~~**Onboarding placement:**~~ Redeemed at end of onboarding, after first child is connected.
5. ~~**Grant duration:**~~ 14 days (≈$5 value). Both referrer and referred family receive it.
