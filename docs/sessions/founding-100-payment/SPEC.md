# Founding 100 Payment — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> Phase 1 של [BUFF_GO_TO_MARKET.md](../../BUFF_GO_TO_MARKET.md) דורש מערכת תשלום פעילה כדי לסגור 100 lifetime sales. ה-SPEC הזה מגדיר את העבודה ההנדסית.

**עודכן:** 2026-05-11
**מקור:** [BUFF_FOUNDING_100_KIT.md](../../BUFF_FOUNDING_100_KIT.md) §1 (offer spec), [BUFF_GO_TO_MARKET.md](../../BUFF_GO_TO_MARKET.md) Phase 1, code investigation 2026-05-11 (purchaseService.ts + useSubscription.ts + PaywallScreen.tsx already in place — RevenueCat wired, missing only lifetime SKU + webhook)

---

## Capabilities & Bottlenecks

### מה Claude.ai (web) יכולה
- Review של copy/UX ב-paywall + landing
- אימות מול 3 הפילרים של [BUFF_VALUES.md](../../BUFF_VALUES.md)
- ניסוח email/landing copy ל-/founding-100

### מה Claude Code (CC, אני) יעשה
- Schema migration: `profiles.is_lifetime_founding` + `profiles.founding_member_number`
- `purchaseService.purchaseLifetime()` function
- `useSubscription` update: detect lifetime entitlement from RevenueCat
- `PaywallScreen.tsx` update: lifetime option
- חדש: `FoundingHundredScreen.tsx`
- חדש: `FoundingBadge.tsx`
- Supabase Edge Function: `rc-webhook` (grant lifetime on purchase)
- i18n strings (EN + HE)
- Web (`buff-main` repo): `/founding-100` route + landing page

### מה Adi חייבת לעצמה
1. **RevenueCat dashboard work** — CC לא יכול לגשת ל-RC. צריך ליצור 2 products (`lifetime_founding_99`, `lifetime_founding_149`) ולמפות ל-entitlement "BUFF Premium". פעולה ידנית של ~15 דק'.
2. **Final pricing decision** — $99 / $99+$149 / single $149 / other? (default מ-KIT: $99 first 50, $149 next 50)
3. **Webhook URL config** — אחרי שה-edge function deployed, להוסיף את ה-URL ב-RC dashboard
4. **Run cleanup SQL** (ראי [CLEANUP.sql](CLEANUP.sql)) — לבחור ולהריץ אחרי backup
5. **Cross-reference 14 ghost parents** עם 47 Lovable POC emails (ראי [CROSS_REFERENCE.md](CROSS_REFERENCE.md))

### צוואר בקבוק / נקודות עצירה צפויות
- **RC sandbox testing** — Google Play sandbox דורש Play Console internal testing track + test users. אם Phase 0 ship עוד לא נסגר, ה-RC testing מתעכב
- **Webhook signature verification** — נדרש shared secret מ-RC dashboard. תלוי בגישת Adi ל-RC
- **Sale counter race condition** — אם 2 משתמשים קונים בו-זמנית כשנשארה משימה 1 ($99→$149 boundary), צריך atomic counter ב-DB
- **Apple/Google fees** — 30% ב-Play Store ב-year 1, 15% אחרי. אם השוק העיקרי web (לא mobile in-app), צריך Stripe Checkout במקום RC. **החלטה לבדוק לפני Phase 1.**

---

## Values Check

> 9 שאלות מ-[BUFF_VALUES.md](../../BUFF_VALUES.md). **חייבים לעבור על כולן לפני שCC כותב קוד.**

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   ✅ N/A — הפיצ'ר parent-facing. הילד לא יודע על Founding 100. ה-product effect על הילד הוא שיש למשפחה גישה מלאה (more kids) — הילד לא נחשף ל-pricing logic.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   ✅ ניטרלי — תשלום ההורה לא משנה את ה-real rewards של הילד. הפרסים נשארים מהחיים.
3. **האם הצלחה מורגשת כ-"אני רוצה" או "אני חייב"?**
   ✅ "אני רוצה" — Founding 100 הוא הצעה, לא דרישה. ההורה יכול להישאר ב-free tier (1 ילד) או לעבור ל-monthly. ה-lifetime offer הוא bonus track.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   ✅ Paywall copy מ-[BUFF_MESSAGING.md](../../BUFF_MESSAGING.md) §4.5 מעוצב כ-celebration ("Itay completed X — that's the change you came here for") לא כ-aggressive upsell.
2. **אם ההורה לא רוכש, האם התגובה empathy או pressure?**
   ✅ אין dark pattern. הורה שלא רוכש נשאר ב-free tier (1 ילד). אין FOMO timers, אין fake scarcity. ה-100 cap הוא אמיתי.
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY או האפליקציה?**
   ✅ BUDDY לא משתנה בשום צורה לפי payment state. ה-character הוא child-facing וזה parent-side concern.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   ✅ עקיף — Founding 100 unlocks the multi-kid case, שמאפשר למשפחות עם 2-3 ילדים להשתמש במערכת ה-Scaffold-That-Fades במלואה.
2. **האם לילד יש קול בפיצ'ר הזה?**
   ⚠️ לא — זו החלטת רכש של ההורה. אבל זה התואם עם מבנה ה-product: ההורה משלם, הילד משתמש. אין צורך בהשתתפות הילד בהחלטת התשלום.
3. **האם בעוד 6 חודשים הפיצ'ר עדיין יהיה הכרחי?**
   ✅ כן — תשתית lifetime/founding tier היא permanent infrastructure. ה-CAP (100) הוא חד-פעמי אבל ה-architecture נשאר.

**Pass on all 9.** OK to proceed to engineering.

---

## Scope

### IN (this package)

**Schema (Supabase migration `002_founding_100.sql`):**
- `profiles.is_lifetime_founding boolean NOT NULL DEFAULT false`
- `profiles.founding_member_number integer NULL` (1–100, unique)
- Index on `is_lifetime_founding = true` for the sale counter query

**RevenueCat (Adi configures in dashboard):**
- Product `lifetime_founding_99` ($99 one-time, Google Play + App Store)
- Product `lifetime_founding_149` ($149 one-time, Google Play + App Store)
- Both mapped to entitlement `BUFF Premium` (existing) + custom entitlement `Founding Member`
- Webhook URL pointing to `rc-webhook` edge function

**Mobile (`buff-mobile`):**
- `src/services/purchaseService.ts` — add `purchaseLifetime(tier: 99 | 149)`
- `src/hooks/useSubscription.ts` — detect Lifetime/Founding Member entitlement
- `src/contexts/AuthContext.tsx` — `Profile` interface: `is_lifetime_founding`, `founding_member_number`
- `src/screens/PaywallScreen.tsx` — add Lifetime CTA (above Monthly/Yearly)
- New `src/screens/FoundingHundredScreen.tsx` — dedicated offer screen with offer table + live counter + CTA
- New `src/components/FoundingBadge.tsx` — reads `is_lifetime_founding`, renders badge in profile + (optional) dashboard
- `src/navigation/types.ts` — add `FoundingHundred` route
- `src/i18n/en.json` + `he.json` — strings from KIT §2 + paywall copy from BUFF_MESSAGING §4.5

**Web (`buff-main`):**
- New `/founding-100` route in `src/pages/Founding100.tsx`
- Components: offer table (from KIT §1), sale counter widget, CTA to mobile app / direct purchase
- Hebrew + English versions

**Supabase Edge Function:**
- `supabase/functions/rc-webhook/index.ts` — verifies RC signature, parses purchase event
- On `INITIAL_PURCHASE` with product_id in (`lifetime_founding_99`, `lifetime_founding_149`):
  - `UPDATE profiles SET is_lifetime_access = true, is_lifetime_founding = true, founding_member_number = next_number() WHERE user_id = <RC.app_user_id>`
  - `next_number()` = atomic `SELECT COALESCE(MAX(founding_member_number), 0) + 1 FROM profiles WHERE is_lifetime_founding = true FOR UPDATE`
- On `CANCELLATION` / `REFUND`: revert (`SET is_lifetime_founding = false, founding_member_number = NULL, is_lifetime_access = false`)

**Tier-switching logic:**
- Hosted in the edge function, not the client
- When `founding_member_number = 50` is assigned, ANY future purchase attempts the `_99` SKU → return error "this tier is sold out, please use the $149 tier"
- Client detects this and updates the UI to show $149 only

### OUT (deferred)
- Founding Member exclusive in-app skin → v1.1
- Referral bonus for founding members → v1.1
- Physical mailing / branded swag → not in scope
- Stripe Checkout fallback for web-only buyers → evaluate after Phase 1 sales data shows mobile-vs-web split

---

## Phases

### Phase 1 — Schema + RC Config (~1 day)
**Adi:**
1. Create 2 products in RC dashboard
2. Map to entitlements

**CC:**
1. Write migration `002_founding_100.sql` (columns + index)
2. Apply migration (requires Adi approval per CLAUDE.md schema rule)
3. Update `Profile` interface in AuthContext.tsx
4. Type-generate via `mcp__supabase__generate_typescript_types` if applicable

**Exit criteria:** schema live, RC products visible via `Purchases.getOfferings()` in dev

---

### Phase 2 — Webhook (~1 day)
**CC:**
1. Scaffold `supabase/functions/rc-webhook/`
2. Implement signature verification (HMAC SHA256 with RC shared secret stored in Supabase secrets)
3. Implement event handler — `INITIAL_PURCHASE`, `CANCELLATION`, `RENEWAL` (no-op for lifetime), `BILLING_ISSUE`
4. Atomic `founding_member_number` assignment with `FOR UPDATE` lock
5. Deploy via `mcp__supabase__deploy_edge_function`

**Adi:**
1. Add webhook URL to RC dashboard
2. Add RC shared secret to Supabase project secrets

**Exit criteria:** test purchase in RC sandbox → user's profile updated correctly → badge appears in app

---

### Phase 3 — Mobile UI (~1 day)
**CC:**
1. `FoundingBadge.tsx` component
2. `FoundingHundredScreen.tsx`:
   - Offer table from KIT §1
   - Sale counter (live: `SELECT COUNT(*) FROM profiles WHERE is_lifetime_founding = true`)
   - "Spots left at $99: 50 − count" / "Total spots left: 100 − count"
   - CTA: tier-aware (calls `purchaseLifetime(99)` or `purchaseLifetime(149)` based on current count)
   - "Founding 100 has closed" empty state after #100
3. Update `PaywallScreen` to surface "Founding 100" CTA above standard plans (only when count < 100)
4. i18n strings

**Claude.ai (review):**
- Brand check: copy matches BUFF_BRAND tone of voice
- Persona check: targets P3 (Tried Everything) and P5 (Coach-Curious) primarily

**Exit criteria:** full purchase flow works in RC sandbox, badge renders, counter live, tier-switching at 50 verified

---

### Phase 4 — Web Landing (~1 day, in `buff-main` repo)
**CC (`buff-main` working tree):**
1. New `/founding-100` route
2. Sale counter widget (queries Supabase anon-RPC for current count — RLS allows public read)
3. Offer table component (matches mobile KIT §1)
4. CTA logic: "Open BUFF app to claim" + deep link `buff://founding-100`
5. EN + HE versions
6. SEO meta: title, description, OpenGraph

**Adi:**
- Approve copy + visual layout

**Exit criteria:** landing live at https://buffadhd.com/founding-100, mobile deep link works

---

### Phase 5 — Test + Ship (~0.5 day)
**CC:**
1. E2E test in RC sandbox: full purchase → webhook → DB update → mobile UI update
2. Test refund: webhook revoke → badge disappears → entitlement removed
3. Test cap: simulate 100 purchases → next attempt errors out
4. Test tier-switch: simulate 50 purchases → next attempt forces $149 SKU
5. Test race condition: 2 concurrent purchases at boundary (#50 or #100)

**Adi:**
1. Approve sandbox test results
2. Activate production RC products
3. Send first email to 47 Lovable POC users (per [BUFF_FOUNDING_100_KIT.md](../../BUFF_FOUNDING_100_KIT.md) §2.2)

**Exit criteria:** real sale #1 lands ✓ → marketing kit unlock → public outreach begins

---

## Files Affected

### Mobile (`C:\Users\adiel\buff-mobile`)
- **New:**
  - `src/screens/FoundingHundredScreen.tsx`
  - `src/components/FoundingBadge.tsx`
  - `supabase/functions/rc-webhook/index.ts`
  - `migrations/002_founding_100.sql`
- **Edit:**
  - `src/services/purchaseService.ts` (add `purchaseLifetime`)
  - `src/hooks/useSubscription.ts` (lifetime detection)
  - `src/contexts/AuthContext.tsx` (Profile interface)
  - `src/screens/PaywallScreen.tsx` (lifetime CTA)
  - `src/navigation/types.ts` (FoundingHundred route)
  - `src/i18n/en.json` + `he.json`

### Web (`C:\Users\adiel\buff-main\buff-main`)
- **New:**
  - `src/pages/Founding100.tsx`
- **Edit:**
  - `src/App.tsx` (route registration)

---

## Open Decisions for Adi

1. **Final pricing:** $99 (first 50) + $149 (next 50) ← default from KIT / single $99 / single $149 / other?
2. **Founding Member visibility:** badge only / badge + member number (#7 of 100) visible publicly / internal-only?
3. **RC dashboard work:** Adi configures, or grants CC dashboard access (likely Adi — RC requires Apple/Google Play credentials)
4. **Cap-reached message:** what does the post-100 user see? Default: *"The Founding 100 has closed. Welcome — start free, upgrade to Family Plan ($9/mo) when ready."*
5. **Stripe alternative for web buyers:** Phase 1 attempt mobile-only first (cheaper, simpler). Re-evaluate if landing traffic suggests web buyers can't convert via "open the app to buy."
6. **Refund window:** 30-day guarantee per KIT §1. Confirm against RC/Stripe defaults.

---

## Dependencies on Other Work

- **Phase 0 (ship the app)** must complete before RC sandbox testing makes sense
- **Cleanup of ghost profiles** ([CLEANUP.sql](CLEANUP.sql)) is independent — can run any time without blocking this
- **Cross-reference of 14 ghost parents** ([CROSS_REFERENCE.md](CROSS_REFERENCE.md)) is independent — feeds outreach list, doesn't block engineering

---

## What This Unblocks

- Email to 47 Lovable POC users (KIT §2) — needs working purchase flow
- Public landing /founding-100 — needs working purchase flow + sale counter
- LinkedIn inaugural essay (KIT §4) — anchored to "I'm running Founding 100" requires the system to be live
- All Phase 1 revenue per [BUFF_GO_TO_MARKET.md](../../BUFF_GO_TO_MARKET.md) §1

---

**סוף SPEC.**
