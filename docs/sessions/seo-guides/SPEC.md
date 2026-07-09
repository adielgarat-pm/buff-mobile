# SPEC — pkg/seo-guides

> Static `/guides/*` section on buffadhd.com (landing-web) as the home for SEO content.
> Approved by Adi 2026-07-08 ("מעולה" on the campaign-plan session recommendation). Parent plan: [SEO_CONTENT_PLAN.md](../../launch/SEO_CONTENT_PLAN.md) §0 + §4.

## Problem
1. buffadhd.com is a client-rendered Vite SPA — article-length content can't rank from it.
2. The summer transition guide lives on claude.ai as an Artifact that returns **403 to anonymous visitors** — unusable in emails, zero SEO value.
3. `buffadhd.com/download` (no www) serves the landing home — the download page only exists on www. Every asset that used the no-www link leaked clicks.

## Scope (Phase 1 — this package)
- `landing-web/public/guides/summer/index.html` — self-contained static page (Vite copies `public/` verbatim to `dist/`; **no build-config changes, no deps**). Bilingual EN/HE with a toggle (auto-detects Hebrew browsers; `#he` / `?lang=he` deep-link). Brand per BUFF_BRAND §7: Heebo, lavender/violet/mint palette, 12px squircles, no gradients, Spaceship-Test-clean. SEO meta + JSON-LD Article. Single CTA → `www.buffadhd.com/download`.
- **Copy change:** "חגגו 70%" → "חגגו את ה'רוב'" (+ EN equivalent) in the page and in the source doc `docs/guides/summer-transition-guide.md` — "70%" is legacy copy; in-app success moved to absolute count (D-2026-06-14; GEMINI_CONTEXT_PACK ⚠️).
- `landing-web/vercel.json` — 307 redirect `/download` → `https://www.buffadhd.com/download` (fixes the leak; static files still win over the SPA rewrite, so `/guides/*` serves directly).

## Out of scope (later phases per SEO plan)
Back-to-school guide (draft in docs first — new copy needs Adi's redline) · comparison pages · email capture · guides index page.

## Values / Brand check
Content is the already-approved summer guide (built with Adi 2026-07-07). No failure language, no streaks/70%-as-mechanic, no surveillance framing, real features only (camp-schedule import, packing card, Pause). Pillar 3 tagline in footer.

## Platform parity
Web-only surface (marketing site) — no Android counterpart applies; app is untouched.

## Verification
`npm run build` in landing-web (own node_modules; no installs) → `dist/guides/summer/index.html` present; Claude Preview on the dev server (port 5181): both languages render, toggle + RTL work, CTA href correct.
