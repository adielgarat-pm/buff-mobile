# BUFF — Marketing Assets

Long-term storage for marketing materials: screenshots, social media graphics, brand asset variants, video thumbnails, exported PDFs.

## Folder convention

Filename pattern: `{purpose}-{descriptor}-{date}.{ext}`

Examples:
- `philosophy-hero-2026-05-15.jpg` — screenshot of `/philosophy` page hero, used for LinkedIn launch post 2026-05-15
- `linkedin-post-pm-heresy-2026-05-15.png` — final LinkedIn image (if you make a custom graphic)
- `mission-tagline-card-violet-1200x630.png` — quote card with "Until they don't need us" in brand violet

## What lives here vs. elsewhere

- **Screenshots / social images / brand visuals** → here
- **Brand identity source-of-truth (colors, typography rules, logo usage)** → [BUFF_BRAND.md](../BUFF_BRAND.md) §7
- **Logo files** → buff-mobile/assets/ (used by the React Native app) and buff repo /public (used by the web)
- **Marketing copy templates** → [BUFF_MESSAGING.md](../BUFF_MESSAGING.md), [BUFF_ADVISOR_OUTREACH_KIT.md](../BUFF_ADVISOR_OUTREACH_KIT.md)
- **Stitch design files (Teen UI)** → docs/teen-ui-design/

## Rules

1. **Don't commit large binary files (>1MB) without compression.** PNG/JPEG screenshots should be optimized.
2. **Date every file.** Helps with versioning when assets get updated.
3. **Reference assets in their use-context docs.** E.g., link to a screenshot from a session SPEC or marketing kit so future-you can find what was used where.
4. **Source originals stay separate from posted versions.** If you crop/edit a screenshot for a specific platform (LinkedIn, FB, Twitter), keep both the source and the edited version with platform suffix (e.g., `philosophy-hero-2026-05-15.jpg` original, `philosophy-hero-2026-05-15-linkedin.png` LinkedIn-cropped).

## Current contents

| File | Purpose | Used in |
|---|---|---|
| `philosophy-hero-2026-05-15.jpg` (pending — Adi to save from chat) | Screenshot of `/philosophy` 3-Principles hero | LinkedIn post 2026-05-15 (planned) |
| `fb-cover-founder-2026-07-24.png` | Facebook cover photo — deep-violet, mission tagline "Until they don't need us." + real logo. 3280×1248 (2× of 1640×624 FB upload size). Brand-exact (BRAND §7.2 tokens, spaceship-test compliant). | Adi's FB profile refurbish — [MARKETING_BACKLOG Track H / H-1](../BUFF_MARKETING_BACKLOG.md#66-track-h--group-reputation--profile-as-landing-page-brief) |
