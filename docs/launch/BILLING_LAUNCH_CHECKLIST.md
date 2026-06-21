# BUFF — Billing Launch Checklist (Play + RevenueCat)

> Generated 2026-06-19 from the actual code. Every name/ID below is what the app
> code expects — **type it exactly**, or the paywall breaks (no pricing) or
> entitlements won't unlock.
>
> Source files:
> - `src/services/purchaseService.ts` (API key, entitlement IDs, product IDs)
> - `src/hooks/useSubscription.ts` (entitlement logic, grace period)
> - `src/screens/PaywallScreen.tsx` (monthly/annual packages)
> - `src/screens/FoundingHundredScreen.tsx` (Founding 100 tiers)
> - `supabase/functions/rc-webhook/index.ts` (webhook → DB)

---

## ⚠️ Read first — two facts that change the plan

1. **The code is already live for billing.** RevenueCat is integrated, paywall +
   purchase buttons are wired, webhook is deployed. The blocker is **config in
   your dashboards, not code.**
2. **The beta grace period ended 2026-05-01.** On Android the real billing logic
   is already active. Testers are fine (most have `is_lifetime_access`), but a
   **new organic Android user will hit a broken paywall** if RC has no products
   configured. So steps below are real launch blockers.

---

## The chain (do in this order)

### ☐ STEP 1 — Google Play merchant / Payments profile  ← the page you're on
**Why first:** Google's identity + bank + tax verification can take **several
days** and is outside your control. Start today.

- Play Console → **Setup → Payments profile** (or the "set up a seller account"
  prompt you saw).
- Provide: legal business/individual identity, bank account, tax info.
- **Owner:** Adi only (account-bound). CC cannot do this.

---

### ☐ STEP 2 — Create the products in Google Play Console
Play Console → **Monetize → Products**.

**Subscriptions** (Monetize → Subscriptions):
| Plan | Base plan | Price | Notes |
|------|-----------|-------|-------|
| Monthly | monthly auto-renew | **$9 / mo** (code default label $9.99) | |
| Yearly | annual auto-renew | your call (e.g. $59–$79/yr) | savings % auto-computed on paywall |

**In-app products — one-time** (Monetize → In-app products) for Founding 100:
| Product ID (EXACT) | Price | Tier |
|--------------------|-------|------|
| `lifetime_founding_99`  | **$99**  | spots 1–50 |
| `lifetime_founding_149` | **$149** | spots 51–100 |

> ⚠️ The two Founding IDs must match **character-for-character** — they're
> hardcoded in `purchaseService.ts` AND in the webhook. A typo = "product not
> found" error on purchase.

---

### ☐ STEP 3 — Connect Google Play → RevenueCat
- RevenueCat dashboard → your Android app → **Service Account credentials**.
- Upload the Google Play service account JSON (grant it access in Play Console →
  Users & permissions).
- **Owner:** Adi (account-bound). CC can guide the exact clicks.

---

### ☐ STEP 4 — Configure products + entitlements in RevenueCat
RevenueCat dashboard.

**Entitlements** (create both, names EXACT — case + space matter):
| Entitlement ID (EXACT) | Attach these products |
|------------------------|-----------------------|
| `BUFF Premium`   | monthly, yearly, `lifetime_founding_99`, `lifetime_founding_149` |
| `Founding Member`| `lifetime_founding_99`, `lifetime_founding_149` only |

**Offering** — the code reads `offerings.current.monthly` and
`offerings.current.annual`, so:
- Mark one offering as **Current (default)**.
- Add a **Monthly** package (`$rc_monthly`) → your monthly product.
- Add an **Annual** package (`$rc_annual`) → your yearly product.
- ⚠️ The Founding products are **NOT** in the offering — the code buys them
  directly by ID (`purchaseStoreProduct`). Just create them + map entitlements.

**Android API key:** already in code → `goog_JXENrpCCcYObBesSjSeFGoKvuaA`.
Verify it matches your RC project's Android key. (Public key — safe in code.)

---

### ☐ STEP 5 — Webhook + Supabase secret  ← CC can do this part
**Webhook URL** (RevenueCat → Project → Integrations → Webhooks):
```
https://gfrongfnyigxsexuofrg.supabase.co/functions/v1/rc-webhook
```
- Set an **Authorization header value** = a shared secret you pick.
- Then set the same secret in Supabase: secret name **`REVENUECAT_WEBHOOK_SECRET`**.

> The webhook is already deployed (rc-webhook, version 9, verify_jwt off ✅).
> It only handles Founding 100 events (grants the DB badge + member number).
> Regular monthly/annual subs don't need it — they're checked live via RC.
> **CC can set the Supabase secret once you give me the shared-secret string.**

---

### ☐ STEP 6 — Sandbox test (before going live)
1. Add a Play **license tester** (Play Console → Setup → License testing).
2. On a test device: open paywall → confirm real prices show.
3. Buy monthly (sandbox) → confirm premium unlocks (buddy/insights/2nd child).
4. Buy `lifetime_founding_99` → confirm: Founding badge appears, member #N set,
   webhook log shows "granted #N", DB `is_lifetime_founding=true`.
5. Test **Restore purchases** after reinstall.

---

## Known gap to decide on (not a hard blocker)

**Monthly/annual subscriptions don't inherit to family members.** RC entitlements
are device-local. The webhook only sets a DB flag for **Founding 100**, so:
- Founding 100 buyer → kids on their own devices + co-parents inherit ✅
- Monthly/annual buyer → only that device is premium; an own-device kid or a
  co-parent would still hit the paywall ❌

Most kids share the parent's device (View-as-Child), so they're fine. This only
affects the minority of own-device kids / co-parents on the *subscription* tiers.
Same root as the logged "subscription family-scoping gap." **Decide:** ship as-is
(Founding 100 is the launch hero offer and works), or do a small follow-up to
mirror monthly/annual into a DB flag too.

---

## Ownership summary
| Step | Owner |
|------|-------|
| 1. Merchant account | Adi (start today) |
| 2. Play products | Adi |
| 3. Play→RC service account | Adi (CC guides) |
| 4. RC entitlements/offering | Adi (CC guides) |
| 5. Webhook + Supabase secret | **CC** (needs the secret string from Adi) |
| 6. Sandbox test | Adi on device + CC on logs/DB |
