# Web Landing — `/founding-100` Deployment Guide

> The page that visitors land on from the 47-email outreach, Facebook group replies, and LinkedIn essay. Live sales counter, tier-aware CTA, deep-link to mobile app for purchase.

**Component:** [Founding100.tsx](Founding100.tsx)
**Target:** Lovable.dev project — `buff-main` repo / `buffadhd.com`
**Route:** `/founding-100` (public, no auth)

---

## Why this is in `buff-mobile` and not `buff-main`

`buff-main` is a Lovable.dev project, not a normal git repo on Adi's machine. The canonical source for this page lives here in `buff-mobile/docs/sessions/founding-100-payment/web-landing/` for two reasons:

1. **One source of truth.** Every other Founding 100 artifact (SPEC, migrations, mobile screens, edge function) is in this repo. Keeping the web landing here means everything ships together.
2. **Lovable can ingest from here.** Adi pastes the file contents into Lovable's file editor (or AI prompt) and Lovable syncs to its deployed site.

---

## Deployment — 4 steps via Lovable

### Step 1: Open the Lovable project

Go to [lovable.dev](https://lovable.dev) → BUFF project. (The deployed site is at https://buff.lovable.app and https://buffadhd.com aliases to it.)

### Step 2: Create the page file

In Lovable's file tree:
- Navigate to `src/pages/`
- Create new file: `Founding100.tsx`
- Paste the entire contents of [Founding100.tsx](Founding100.tsx) into it

### Step 3: Register the route

Edit `src/App.tsx` — find the existing routes section (look for `<Route path="/" element={<PublicRoute>...`) and add this NEW route alongside the others:

```tsx
<Route path="/founding-100" element={<PublicRoute><Founding100 /></PublicRoute>} />
```

Also add the import at the top of `App.tsx` (alongside the other page imports):

```tsx
import Founding100 from "./pages/Founding100";
```

### Step 4: Test live

After Lovable auto-deploys (~30 seconds):
- Visit https://buffadhd.com/founding-100 (or the Lovable preview URL)
- You should see: live counter (showing current `get_founding_count()` value — likely 0), offer table, hero, founder note
- Click the language toggle — content should switch to Hebrew with RTL layout

---

## Verification checklist

- [ ] Page renders at `/founding-100` without console errors
- [ ] Live counter widget pulls from `get_founding_count` RPC (anonymous read works)
- [ ] Counter shows correct tier ($99 / $149) and "X spots left at $Y"
- [ ] Language toggle works (EN ↔ HE with proper RTL)
- [ ] CTA button attempts `buff://founding-100` deep link (silent fail on desktop is expected)
- [ ] Email fallback (`mailto:buff.parenting@gmail.com`) opens email client — note: domain email `adi@buffadhd.com` does NOT exist yet (deferred Google Workspace setup); switch back to it once Workspace is live
- [ ] When `count >= 100`, page shows "Founding 100 closed" empty state with a "Back to BUFF" CTA
- [ ] Footer links work (Privacy, Terms, Community WhatsApp)

---

## How the live counter works

The page calls `supabase.rpc('get_founding_count')` on mount and then every 30 seconds. This RPC was created in [migrations/004_founding_count_rpc.sql](../../../migrations/004_founding_count_rpc.sql) — it's a public, SECURITY DEFINER function that bypasses RLS to return a single integer (no PII).

`get_founding_count()` returns: `SELECT COUNT(*) FROM profiles WHERE is_lifetime_founding = true`

This is granted EXECUTE to `anon, authenticated, service_role` — so the unauthenticated landing page can call it.

---

## Tier logic

| Sales count | Tier shown | CTA price |
|---|---|---|
| 0–49 | $99 | "Claim spot #N — lifetime access" |
| 50–99 | $149 | Same copy, $149 price |
| 100+ | "Founding 100 closed" empty state | Fallback to /, no CTA |

When the page detects `count >= 100`, it renders a different layout — sold-out empty state with a CTA back to the main site.

---

## Deep link behavior

The CTA button does `window.location.href = 'buff://founding-100'`:
- **Mobile (Android with BUFF installed):** OS handles the `buff://` scheme, opens the app to FoundingHundredScreen
- **Mobile (without BUFF):** silently fails or browser shows "no app to handle" (graceful degradation)
- **Desktop:** silently fails

For desktop users, the **email fallback** ("Email Adi") opens their email client with a pre-filled subject — Adi can manually set them up.

---

## i18n keys (none needed yet — strings are inline)

The component currently has English and Hebrew strings inline (not in the i18n JSON files). This is intentional for v1 to keep deployment simple — fewer files to touch in Lovable.

**Future improvement:** extract to `i18n/en.json` + `i18n/he.json` using `landing.founding100.*` keys. Standard work — defer until other landing pages need similar refactoring.

---

## SEO

The component sets `document.title` and updates the `meta[name="description"]` tag based on language. For full SEO add Open Graph + Twitter card meta tags (currently inherited from `index.html` static template — fine for v1).

---

## Brand palette used

Matches [BUFF_BRAND.md §7](../../../BUFF_BRAND.md):

| Token | Hex | Usage |
|---|---|---|
| Deep violet canvas | `#1a1636` | Page bg |
| Primary violet | `#8b5cf6` | Secondary buttons (Cap-reached state) |
| Soft violet | `#A78BFA` | Secondary text |
| Lime green | `#A8E63E` | CTA button, counter number, accents |
| White | `#FFFFFF` | Headings, primary text on dark |

Inline `bg-[#...]` Tailwind classes are used instead of theme tokens to keep the component portable (no dependency on tailwind config changes in Lovable).

---

## When the 47-email outreach lands

The email from [BUFF_FOUNDING_100_KIT.md §2.2](../BUFF_FOUNDING_100_KIT.md) links to:

```
https://buffadhd.com/founding-100
```

Once Lovable deploys this page, that link is live. Combined with the working webhook + mobile app, the full Founding 100 funnel is operational:

1. Email/social link → `/founding-100` web page
2. Visitor sees offer + live counter
3. Clicks CTA → opens BUFF mobile app
4. App's `FoundingHundredScreen` triggers `purchaseLifetime()`
5. RC processes purchase → fires webhook
6. Edge function grants `founding_member_number = N`
7. Web counter refreshes within 30 seconds
8. Buyer sees Founding Member badge in app

---

## Next steps after deployment

- **Adi:** verify the page renders correctly. Take screenshots for `BUFF_TESTIMONIALS.md` future inclusion.
- **Adi:** add the URL to LinkedIn bio + Facebook page + footer of buffadhd.com main site
- **Engineering:** when Phase 0 ships, register `buff://` as a deep link scheme in the Android manifest so the mobile CTA actually opens the app
