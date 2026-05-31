# Session — Screenshots Strategy + Shot List (v1.1.0 Play Store)

> Open a fresh CC session and paste the block below. **Run this BEFORE Adi captures any phone screenshots.**
> Output: a shot-by-shot runbook Adi follows on the phone + the text overlays each shot gets later.

```
Package: pkg/play-store-screenshots-strategy. Start in Plan Mode.

Goal: produce a tight, Adi-ready shot list of 6-7 Play Store phone screenshots for
BUFF v1.1.0 (versionCode 21, internal-test link
https://play.google.com/apps/internaltest/4701243578877467187), plus the 1-line
text overlay each screenshot will carry (English + Hebrew).

Read FIRST, in full:
- docs/BUFF_MESSAGING.md §5 (listing copy that's already pasted in Play Console)
- docs/BUFF_PRD.md (what the product actually is)
- docs/BUFF_BRAND.md (tone, palette, typography)
- docs/sessions/play-store-listing/EOD_2026-05-27.md (V18 listing state — what's
  uploaded vs pending; treat as state of the world)
- docs/marketing-screenshots/v17/PHONE_CAPTURE_PLAYBOOK.md (Adi's capture
  playbook; folder name stale, content valid for v21 too)
- CLAUDE.md memory `feedback_marketing_why_what` (WHY/WHAT not HOW —
  outcomes/feelings, not BUFFs/percentages/tasks count)
- CLAUDE.md memory `feedback_kid_task_copy_simple` (child-facing copy = simple +
  inviting, never explain a category)

Constraints (hard):
1. **Designed for Families compliance** — kids' app screenshots must show
   kid-appropriate content, NO real PII, NO inappropriate imagery, NO solicitation
   of personal info from kids in the screenshot.
2. **No dev artifacts in any screen** — no "ZTest", no "תצוגה" preview marker, no
   RevenueCat error toast, no LogBox overlay, no dev-build banner, no test
   family data visible.
3. **Demo data, not real PII** — use the Leia demo family per EOD 2026-05-27
   (already in DB). Or set up similar clean demo data if Leia's not enough.
4. **Outcome-first copy** — "calmer mornings" not "complete 5 tasks"; "the family
   gets back time together" not "BUFFs are 70% redeemed". Adi has a strong rule.
5. **Pair English + Hebrew** — produce both for every overlay (Israel-first +
   English listing).

Deliverable:
A new file at `docs/marketing-screenshots/v21/SHOT_LIST.md` with this exact shape:

# Shot list — BUFF v1.1.0 Play Store (6-7 phone screenshots)

For each shot (numbered 1..N):

**Shot N — <hero outcome in 3 words>**
- **Screen**: <which app screen, e.g. "Parent Dashboard with 3 children" /
  "View-as-Child Gamer Tasks tab" / "UStep5 onboarding preview" / etc.>
- **State to set up** (what Adi does on phone before tapping shutter):
  - exact account: which parent / which child profile
  - exact toggles: theme, mode, locale (English unless explicitly Hebrew shot)
  - any mid-state needed: scroll position, modal open, time of day on device
- **Why this shot** (1 sentence, outcome framing — what feeling the viewer gets)
- **Overlay EN**: <≤8 words, outcome-led>
- **Overlay HE**: <≤8 words, outcome-led, RTL-safe>
- **Placement**: top / bottom (away from status bar + nav bar + UI thumbs)
- **Dev-artifact watchlist**: explicit things this screen could leak (e.g. "no
  child name typed in Latin", "no RevenueCat toast — kill+relaunch first")

End the file with:
- A "Capture order" section ordering the shots to minimize phone-state churn (group
  same-account shots, defer locale switches).
- A "Time estimate" (target: 30-45 min total for Adi).

Also produce a second file `docs/marketing-screenshots/v21/OVERLAY_COPY.md` with
ONLY the overlay strings in a copy-paste table (EN + HE side by side) — this is
what the production session reads to draw text onto the raw captures.

Constraints on the file itself:
- Reference EOD 2026-05-27's reminder that v17 folder screens were DEV-ARTIFACT
  CONTAMINATED — confirm fresh captures are clean before this session ends.
- Do NOT touch BUFF_MESSAGING.md, BUFF_BRAND.md, BUFF_VALUES.md (Adi-only).
- This session does NOT capture screenshots itself. It produces the runbook
  Adi follows.

Branch + PR (small, docs-only). Out of scope: actual image production (separate
prompt `screenshots-2-production.md`), validation (separate prompt
`screenshots-3-validation.md`).
```
