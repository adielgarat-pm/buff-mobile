# Sandbox purchase test — the LAST step before launching with billing

> Created 2026-06-20. Everything else is wired (GCP APIs, Play products, RevenueCat products/entitlements/offering, webhook + matching secret). This is the final verification.

## Why it can't be web/emulator-quick
- **Web:** RevenueCat isn't wired on web — can't test Play billing there.
- **Emulator:** possible but needs a **Google Play** system image + your Google account as a license tester + the app installed **from the internal testing track** (a local dev build can't do Play Billing). A real device is simpler.

## Setup (once)
1. Play Console → **Setup → License testing** → add your Google account (and any tester accounts) to the license-testers list. (License testers get sandbox/test purchases — no real charge, and RevenueCat auto-detects sandbox.)
2. Make sure the device/emulator is signed in with that Google account.
3. Install BUFF from the **internal testing track** (the tester install link) on that device — NOT a local dev APK.

## The test
1. Open the app → reach the **Paywall** (e.g. as a non-subscribed parent: add a 2nd child, or tap Insights once chunk 3a is in a build).
2. ✅ Confirm **real prices** show (₪/$ for Monthly $9.99 + Annual $59.99) — this alone proves the offering/products are wired.
3. Buy **Monthly** (sandbox) → confirm premium unlocks (no charge).
4. Tap **Founding 100** → buy `$99` (sandbox) → confirm:
   - The Founding badge + member number appear.
   - **Webhook worked:** in Supabase, the buyer's `profiles` row has `is_lifetime_founding = true` + a `founding_member_number`. (This proves RC→Supabase webhook + secret are correct.)
5. Test **Restore purchases** after reinstall.

## If something fails
- **No prices / "package not found":** re-check the offering's Monthly/Annual packages have the Play products (they do as of 2026-06-20) and that the device account is a license tester.
- **Founding badge doesn't set (webhook):** check the rc-webhook logs in Supabase (Edge Functions → Logs). If 401 → secret mismatch (re-check RC Authorization header == Supabase `REVENUECAT_WEBHOOK_SECRET`). If 500 "Server misconfigured" → secret unset.
- CC can read the webhook logs via the Supabase MCP (`get_logs`) to diagnose.

## After it passes
You're ready to launch with billing. (Separately: the monetization-model code — task-limit gating chunk 3b + insights screen — needs a new build, but does not block the billing test.)
