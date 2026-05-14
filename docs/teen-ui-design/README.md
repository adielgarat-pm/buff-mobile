# Teen UI — Stitch Designs

עיצוב Teen UI ל-BUFF Mobile, Created by Adi + Itay (May 2026).

## Status

| מסך | סטטוס | אחרון עודכן |
|---|---|---|
| 01 — Dashboard with Buddy | 🟡 Without-buddy variant (Itay's pick) shipped as GamerDashboardScreen; with-buddy variant pending Buddy V0.5 backend | 2026-05-14 |
| 02 — Dashboard without Buddy | ✅ Shipped as GamerDashboardScreen (re-skinned to BUFF brand palette per BRAND.md §7.5 — violet canvas + lime accent, not Stitch's green-on-green) | 2026-05-14 |
| 03 — Buddy toggle flow | ⚪ Not started — needs `buddy_relationships.buddy_visible` (Buddy V0.5 backend) | — |
| 04 — Tasks detail | ✅ Shipped as GamerTasksScreen | 2026-05-14 |
| 05A — Me & Buddy | ⚪ Not started — needs Buddy V0.5 backend (LEVEL/BOOSTERS) | — |
| 05B — My Stats | 🟡 Lite version (no LEVEL/BOOSTERS, no hero) shipped as GamerMyStatsScreen — full 5B pending pkg/buddy-v05-backend | 2026-05-14 |
| 06 — Rewards shop | ✅ Shipped as GamerRewardsScreen (6a-from-parent variant); FROM BUDDY tab is a placeholder pending Buddy V0.5 backend | 2026-05-14 |
| 07 — Settings | ⚪ Not yet designed in Stitch | — |
| 08 — Teen Onboarding Choice | ⚪ Not yet designed in Stitch (decision D-2026-05-02-13 v2) | — |

## Design Reference

ראה [BUFF_BUDDY_SYSTEM.md](../BUFF_BUDDY_SYSTEM.md) לקונטקסט מלא.

## Design Tokens

- **Primary background:** `#0A0A0A` (deep black)
- **Primary accent:** `#39FF14` (neon green)
- **Card background:** `#1A1A1A`
- **Border / muted:** `#2A2A2A`
- **Text primary:** `#FFFFFF`
- **Text secondary:** `#999999`
- **Typography:** Inter or Manrope (sans-serif, modern)

## Used in

- Implementation: `src/screens/child/Gamer*Screen.tsx` (Gamer-theme dispatcher pattern — `Child*Screen.tsx` routes to Gamer or Pastel based on themeName)
- Mockups: `docs/teen-ui-design/0X/stitch-screenshot.png`