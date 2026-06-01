# Session — Screenshots Validation (pre-submission gate)

> Open a fresh CC session and paste the block below. **Run this AFTER the
> production session has populated `docs/marketing-screenshots/v21/final/EN/`
> and `.../final/HE/`.**
> This is the last gate before Adi uploads to Play Console. Verdict: go / no-go,
> with a per-shot table.

```
Package: pkg/play-store-screenshots-validation. Start in Plan Mode.

Goal: validate the final EN + HE screenshots for v1.1.0 against every gate
that would cause Play Store + Designed for Families to reject the listing
(faster to catch it here than in Google's review queue, which costs 3-7 days).

Read FIRST:
- docs/marketing-screenshots/v21/SHOT_LIST.md (the source of truth — every
  final must trace to a shot in here)
- docs/marketing-screenshots/v21/OVERLAY_COPY.md (exact overlay strings —
  the validation here is "did production match the strategy")
- Google Play "Phone screenshots" spec:
  https://support.google.com/googleplay/android-developer/answer/9866151
- Google Play "Designed for Families program" requirements:
  https://support.google.com/googleplay/android-developer/answer/9893335
- CLAUDE.md memory `feedback_marketing_why_what` (outcome-led copy is a hard
  rule; "BUFFs", "70%", "BUDDY", "tasks count" in overlay text = blocker)
- CLAUDE.md tech-stack note that Sentry is configured with aggressive PII
  scrubbing — any PII visible in a screenshot would be a separate fail
  independent of Sentry

Inputs:
- All PNGs in `docs/marketing-screenshots/v21/final/EN/`
- All PNGs in `docs/marketing-screenshots/v21/final/HE/`

Per-shot checks (run for EVERY final image):

1. **Dimensions**: width=1080 px, height=1920 px, aspect 9:16 portrait. PNG
   (not JPEG). No alpha channel issues that would render black on dark Play
   Store backgrounds.
2. **Pairing**: every EN shot has a HE counterpart at the same shot number
   and vice versa.
3. **No dev artifacts visible** — scan the image for:
   - "ZTest" anywhere
   - "תצוגה" preview-name banner (Gamer mode)
   - RevenueCat error red badge or red full-screen LogBox
   - Metro "Bundling N%" overlay
   - any "DEV" / "Development Build" text
   - the round Expo-dev-client target logo
4. **No PII**: no real email, no real phone number, no surname, no real
   address. Demo family names (Leia, etc.) are fine.
5. **Outcome copy in overlay**: the overlay text matches OVERLAY_COPY.md
   character-for-character; AND it does NOT contain the banned words
   "BUFF/BUFFs/BUDDY/tasks count/<percent>%/mission". The banned-word grep
   should return zero. If a banned word is in OVERLAY_COPY.md too, that's a
   strategy-session bug — escalate, don't pass.
6. **Hebrew RTL correctness**: open each HE final, visually verify text
   reads right-to-left, punctuation lands at the correct end, no character
   orientation flips.
7. **DFF child-safety read** (judgment call per Google's "Designed for
   Families" content policy):
   - shot does not solicit personal info from a child
   - shot shows kid-appropriate content (BUFF is fine here, but verify)
   - shot does not depict ads, in-app purchase prompts at child age, or
     adult themes
8. **No status-bar leakage**: time, battery, wifi visible (kept), but no
   notification icons with private content (e.g. someone's Telegram badge).

Output:
- `docs/marketing-screenshots/v21/VALIDATION.md` with:
  - Header row: date, validator (CC), final shot count (EN + HE), verdict
    (GO / NO-GO).
  - One table row per shot (or per EN+HE pair) with each check column above
    marked ✅ / ❌, plus an "evidence" column linking the file path.
  - Bottom section: any ❌ must have a "fix path" — usually "Adi recaptures
    raw shot N" or "production session redoes overlay for shot N".
  - Final verdict line at the bottom: **GO — ready to upload to Play
    Console listing** or **NO-GO — see ❌ rows above**.

Do NOT modify the final images here. Validation is read-only.

Hard rule: if any ❌ exists on any check, verdict is NO-GO. There is no
"acceptable with caveats" for store-submission assets. Adi can override only
by replying after seeing this output.

Branch + PR (docs-only). Out of scope: capture (Adi), production (separate
prompt), the listing copy itself (already in Play Console).
```
