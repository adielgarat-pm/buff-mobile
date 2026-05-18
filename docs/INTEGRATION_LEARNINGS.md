# BUFF — Integration Learnings

> זיכרון ארוך טווח של הפרויקט. הפתעות, FLAGs פתוחים, החלטות שלא הפכו לDECISIONS רשמיות אבל לא רוצות להיעלם.

**מבנה כל ערך:**
- **תאריך** של גילוי / יצירה
- **מקור** — מי גילה (Adi / Claude.ai / CC) ובאיזה הקשר
- **תיאור** — מה זה
- **השפעה** — על מה זה משפיע
- **סטטוס** — `open` / `resolved` / `deferred`
- **קשור ל** — DECISION ID, package slug, וכו'

---

## Implementation Notes

### IN-2026-05-16-01: Egg/evolution-stage removal queued

- **תאריך:** 2026-05-16
- **מקור:** Adi + CC — surfaced during pkg/teen-ui-with-buddy-character Phase 1 design (Capybara added as parallel buddy, exposed the question "what does a capybara's egg look like?").
- **תיאור:** The pre-character evolution mechanic in [src/types/pet.ts:5-13](../src/types/pet.ts:5) (`EvolutionStage = 'egg' | 'hatchling' | 'scout' | 'guardian'` with thresholds 0/3/7/13 days) is vestigial pre-V0.5 spec drift. V0.5 Friendship Levels already start with the character visible at L1 day-0. The egg layer:
  - Violates Pillar 1 (extrinsic gamification — egg-hatch reveal is the exact dopamine-trigger anti-pattern BUFF rejects, cf. D-2026-05-02-07 streaks rejection).
  - Violates Pillar 2 (a child who uses BUFF day 1+2 then stops never meets their buddy — soft failure framing).
  - Violates Pillar 3 (app decides when child sees their own pick — no voice).
  - Breaks cross-species coherence (wolves, capybaras, pandas, unicorns don't hatch from eggs).
  - Is explicitly flagged as "reconciliation deferred" in [BUFF_BUDDY_SYSTEM.md:7-9](BUFF_BUDDY_SYSTEM.md:7).
- **השפעה:** Touches `src/types/pet.ts` (remove `EvolutionStage`, `EVOLUTION_THRESHOLDS`, `getEvolutionStage`, `getNextEvolutionThreshold`, `STAGE_VISUALS`, default `evolution_stage: 'egg'`), `src/components/PetDisplay.tsx`, `src/components/EmojiPet.tsx`, any `pet.stage.*` i18n keys, and the contradictory line at [BUFF_BUDDY_SYSTEM.md:94](BUFF_BUDDY_SYSTEM.md:94) ("egg/hatchling/scout/guardian"). `pet_state` is AsyncStorage-only so no DB migration needed — existing `evolution_stage` values can be read-once-then-ignored.
- **סטטוס:** `open` — queued as `pkg/drop-egg-evolution-stage` to run after `pkg/teen-ui-with-buddy-character` ships. The current package already builds against a no-egg world (BuddyHero renders Wolf STORMY / Capybara LUNA at friendship_level L1 from day 0).
- **קשור ל:** D-2026-05-16-?? (Adi to formalize in BUFF_DECISIONS_LOG.md), `pkg/teen-ui-with-buddy-character` (this package), `pkg/drop-egg-evolution-stage` (queued follow-up).

---

### IN-2026-05-14-04: Runtime theme switch (Mint ↔ Gamer) blanked the child tab bar

- **תאריך:** 2026-05-14
- **מקור:** Adi + CC — surfaced visually during pkg/hide-paywall-from-child preview verification.
- **תיאור:** Toggling between Mint and Gamer themes from the child Settings → Theme picker caused the entire tab navigator to render as a black screen with no tabs. Affected all child screens. Root cause was two compounding sources of React Navigation reference instability in `src/navigation/ChildTabs.tsx`:
  1. **Inline `tabBarButton: () => null`** and **inline `tabBarItemStyle: { display: 'none' }`** — fresh arrow function and object literal references every render. React Navigation's reconciler treats these as "different component" / "different style" and re-mounts the tab item; the conditional toggle on theme change cascaded into unmount loops the navigator couldn't recover from.
  2. **Inline `screenOptions` closure** — fresh function every render, causing per-route options re-evaluation on every parent render.
- **השפעה:** Adi could not switch themes mid-session without a full app restart. Blocked any UI verification cycle that involved toggling themes.
- **סטטוס:** `resolved` — fixed in `pkg/fix-runtime-theme-switch` (PR #41, commit b514c0b). Fix uses module-level stable constants (`HIDDEN_TAB_OPTIONS`, `HIDDEN_TAB_BUTTON`), `useCallback`-memoized `screenOptions`, per-screen `options` instead of conditional in-screenOptions, plus a self-redirect useEffect in `ChildMyStatsScreen` that navigates away if the user lands on the hidden tab after a theme switch.
- **קשור ל:** `pkg/fix-runtime-theme-switch`. Pending Adi's emulator verification (web preview was unreliable for repeated theme-toggle cycles).

---

### IN-2026-05-14-02: Paywall / subscribe CTAs visible to children — should be parent-only

- **תאריך:** 2026-05-14
- **מקור:** Adi — discovered while testing pkg/teen-ui-my-stats-lite in Pastel theme as Itay (child role)
- **תיאור:** Four places in the child UI showed payment/subscribe CTAs to non-subscribed users without checking that the logged-in user is a child (vs parent). The intended product behavior is: only parents see "subscribe" prompts since they are the buyer. Children should see a softer "ask your parent to unlock" message or just have the locked content hidden — never a CTA they can't act on.
  - `src/screens/child/ChildDashboardScreen.tsx:182` (Pastel) — "Buddy locked 🔒 → Unlock ✨" → opened Paywall
  - `src/screens/child/ChildRewardsScreen.tsx:78` (Pastel) — replaced shop with full `PaywallContent`
  - `src/screens/child/GamerRewardsScreen.tsx:139` (Gamer) — same — replaced shop with `PaywallContent`
  - `src/screens/child/ChildSettingsScreen.tsx:130` — locked skin picker overlays + Paywall nav
- **השפעה:** Children saw "subscribe" CTAs they couldn't action. Mild UX bug for non-paying families.
- **סטטוס:** `resolved` — fixed in `pkg/hide-paywall-from-child` (PR #40, commit a8c9424). Added `viewMode === 'child'` gates next to every `isSubscribed` check; replaced CTAs with calm "ask your parent" empty states. New i18n namespace `childLockedState.*` (EN + HE). Parent flow unchanged.
- **קשור ל:** `pkg/hide-paywall-from-child`.

---

### IN-2026-05-14-03: ChildJoin doesn't reconcile with pre-existing orphan profiles

- **תאריך:** 2026-05-14
- **מקור:** Adi — discovered trying to log in as Itay via the family-code flow while testing pkg/teen-ui-my-stats-lite
- **תיאור:** When a parent pre-creates a child profile during onboarding, the profile may end up with `user_id IS NULL` (no auth user linked) until the child signs in. When the child later joins via ChildJoin (name + family code), the flow creates a NEW profile linked to a new auth user, rather than claiming the existing orphan profile that matches the same name + family_id. Result: duplicate "child" profiles in the same family, only one of which is functional.
  - Reproduced on family KWYEL5: existed profile `איתי` (Hebrew, no user_id, created 2026-04-17). Adi entered name "Itay" + code "KWYEL5" → new profile `Itay` (Latin) created 2026-05-14 16:34, linked to existing `itay@buff.app` auth user. Original `איתי` orphan still dangling.
  - Same family also has `עדי בדיקה` orphan profile (no user_id, created 2026-04-17) from earlier test flow.
- **השפעה:** Data integrity — duplicate child profiles per family. Adi might also be confused about which is "real" Itay when she sees both in her family overview.
- **סטטוס (עודכן 2026-05-16):** `code-complete-pending-verify` — fix landed in `pkg/childjoin-claim-orphans` (branch `claude/lucid-sinoussi-235144`, awaiting Adi's emulator verification + PR merge).
  - **Approach:** Atomic claim via two new `SECURITY DEFINER` RPCs — `preflight_claim_orphan` (anon-callable; pre-validates before auth.signUp to avoid orphan auth.users rows on block) and `claim_orphan_profile` (authenticated; UPDATE with `user_id IS NULL` race guard). Both live in production Supabase as migrations `20260516082239` + `20260516082341`. Repo SQL: `migrations/007_childjoin_claim_orphan_profile.sql`.
  - **Matching:** `lower(normalize(trim(display_name), NFC))` on both sides + case-insensitive on `families.short_code`. Robust for Hebrew diacritics and Latin casing; intentionally does NOT cross scripts. Adi's Hebrew-vs-Latin edge case ("איתי" parent-orphan + child types "Itay") falls through to `cross_script_candidate_exists` reason → blocking error UX in Hebrew copy ("בקש מההורה לוודא את השם") — forces parent confirmation, prevents one sibling from claiming another's orphan.
  - **Client wiring:** `AuthContext.signUp` calls preflight before `supabase.auth.signUp`; on `match_found` calls claim post-auth; on `no_orphan_match` falls back to today's INSERT; on `ambiguous_match`/`cross_script_candidate_exists` returns blocking error tagged `auth.orphanAmbiguous`; ChildJoinScreen surfaces it via new i18n key.
  - **Verification done at code/RPC level (CC):** 8/8 SQL assertions passed (no-orphan / exact / trim / case-insensitive-Latin / ambiguous / cross-script / family-not-found / null-input / no-auth); typecheck zero errors; both i18n files parse. End-to-end Android emulator verification (5 cases per `docs/sessions/childjoin-claim-orphans/TESTS.md § Phase 2`) **pending Adi**.
- **Cleanup (2026-05-17, executed):**
  - **Deleted:** `Itay` bug-residue profile (`3dd54491-...`) + its orphan auth.users row (`9760c8b9-...`) created by the bug on 2026-05-14. 0 user data; cascaded 1 `buddy_relationships` + 1 `buddy_daily_check` row.
  - **Deleted:** stale test orphan `עדי בדיקה` (`04920920-...`); cascaded 4 tasks + 2 rewards + 2 buddy rows. Name self-identified as test data.
  - **Kept:** legitimate orphan `איתי` (`0b702f2d-...`, created 2026-04-17 by Adi's onboarding) as the live target for Itay's emulator claim test.
  - **Authorized by:** Adi "תטפל איך שאתה חושב" 2026-05-17.
- **קשור ל:** Originally surfaced during `pkg/teen-ui-my-stats-lite`; resolved in `pkg/childjoin-claim-orphans` (see [docs/sessions/childjoin-claim-orphans/](sessions/childjoin-claim-orphans/)).

---

### IN-2026-05-16-01: preflight_claim_orphan blocked returning users + new siblings (regression caught in emulator test)

- **תאריך:** 2026-05-16
- **מקור:** Adi — first emulator test post-merge of `pkg/childjoin-claim-orphans`. Existing child user (`Itay` with auth.users row) tried to re-join the family and the app silently blocked them via `cross_script_candidate_exists` instead of falling through to the existing signUp→signIn flow.
- **תיאור:** The Phase 1 RPC `preflight_claim_orphan` (migration 007) had two regressions:
  1. **Returning users blocked.** preflight only looked at orphans (`user_id IS NULL`). For a family with orphans, any input that didn't NFC-match an orphan returned `cross_script_candidate_exists` — including existing users typing their own name (whose profile has `user_id IS NOT NULL` so it's invisible to preflight's orphan filter). Pre-fix flow's "auth.signUp → already registered → signIn" recovery was bypassed.
  2. **New siblings blocked.** Same root cause: any new child joining a family with orphans for OTHER children was blocked even though they're legitimately a new profile (NCFC matches no orphan).
- **השפעה:** Both regressions block legitimate flows. Returning user gets "ask your parent" alert instead of signing in. New sibling gets the same alert instead of getting a fresh profile.
- **תיקון (migration 008, `childjoin_preflight_returning_user_and_multi_orphan`):**
  - Added existing-profile pre-check at top of preflight. If a non-orphan profile in the family matches input (NFC + lower + trim), return new reason `existing_profile_match` → client falls through to signUp→signIn.
  - Constrained `cross_script_candidate_exists` to fire only when `orphan_total = 1`. With 2+ orphans and no NFC match, return `no_orphan_match` → INSERT. Tradeoff: rare real cross-script case in a multi-orphan family creates a duplicate; recovered via existing `useUnlinkedChildren.linkChild` parent banner (the original IN-2026-05-14-03 fallback mechanism).
- **Verification (CC):** 7/7 SQL scenarios pass on live family KWYEL5: existing users `Itay`/`Emmy` → `existing_profile_match`; orphan exact-match `איתי`/`עדי בדיקה` → `match_found`; new sibling `Yossi` → `no_orphan_match`; multi-orphan cross-script `Dani` → `no_orphan_match` (was blocking pre-fix); bad code `NONE99` → `family_not_found`.
- **Lesson:** Bug-fix RPCs need to model **all relevant profile states** (orphan + non-orphan), not just the new state being introduced. The original 8-case SQL test suite covered orphans + family lookup + auth but did NOT include a non-orphan returning user — a gap caught only by Adi's emulator test against real data.
- **קשור ל:** IN-2026-05-14-03 (the original bug); `pkg/childjoin-claim-orphans` hotfix.

---

### IN-2026-05-14-01: Stitch 5B shipped as "lite" — full design depends on Buddy V0.5 backend

- **תאריך:** 2026-05-14
- **מקור:** CC — during pkg/teen-ui-my-stats-lite SPEC review
- **תיאור:** The Stitch 5B "My Stats" design ([docs/teen-ui-design/me-and-buddy/5b-my-stats/design-notes.md](teen-ui-design/me-and-buddy/5b-my-stats/design-notes.md)) requires Buddy V0.5 backend infrastructure that does not exist:
  - `buddy_relationships.buddy_visible` column (the toggle for hiding the buddy character)
  - `LEVEL N ●●●●○` indicator (friendship-level system)
  - `YOUR BOOSTERS` carousel (boosters table + history)
  - "Progress to LEVEL N" bar (level XP curve)
- After surfacing this dependency, Adi chose to ship a **lite** version that shows only the 3 stats already exposed by `usePetState` / `useChildData` (BUFFs balance, successful days, current streak), deferring LEVEL/BOOSTERS/hero to a future package.
- **השפעה:** The implemented `GamerMyStatsScreen` is intentional spec drift from the 2026-05-02 Itay-approved 5B. When Buddy V0.5 backend ships (`pkg/buddy-v05-backend`), the screen will be extended to add the LEVEL pill, "Progress to LEVEL N" bar, hero image, and BOOSTERS carousel — at which point this becomes the "real" 5B.
- **סטטוס:** `resolved` for the lite scope; `deferred` for the full 5B (queued behind `pkg/buddy-v05-backend`).
- **קשור ל:** `pkg/teen-ui-my-stats-lite`, FLAG F-2026-05-03-05 (BUDDY_SYSTEM.md spec-only)

---

### IN-2026-05-17-01: Declarative notification copy convention (research-backed)

- **תאריך:** 2026-05-17
- **מקור:** CC + Adi — pkg/daily-vibe-check Phase 4 design review
- **תיאור:** During Phase 4 of pkg/daily-vibe-check, Adi pushed back on the original SPEC's copy ("[Kid] needs a moment") as too directive — implies rescuer mode. WebSearch surfaced a clear pattern from ADHD therapist sources (CHADD, ADDitude, Childhood Collective, NN/G, Toptal, PatternFly): **declarative "I noticed" framing** beats directive language for parent-child communication. Lands as a convention for ALL future parent-facing notification copies — not just SOS. Specifically: (a) frame around the kid's agency ("wanted to share / sent a signal"), (b) describe state observationally ("low energy day"), (c) avoid action verbs that put parent in rescuer mode ("needs / requires / urgent"), (d) preserve privacy — never expose the underlying score/data.
- **השפעה:** All future notification copy in `pkg/fcm-push-notifications`, `pkg/parent-notification-feed`, and any new parent-facing alerts. The Phase 4 copy in pkg/daily-vibe-check is the reference implementation (EN + HE). Future packages should reference this entry.
- **סטטוס:** `resolved` (locked as ongoing convention; not a problem to track)
- **קשור ל:** pkg/daily-vibe-check SPEC § Decisions EX-1, future pkg/fcm-push-notifications

### IN-2026-05-17-02: PRD §7.1 line 215 spec drift — Vibe Check falsely claimed "fully implemented"

- **תאריך:** 2026-05-17 (discovered 2026-05-16 in pkg/daily-vibe-check Phase 0)
- **מקור:** CC — Phase 0 spec verification of pkg/daily-vibe-check
- **תיאור:** BUFF_PRD.md §7.1 line 215 reads: *"Daily Vibe Check ... Already fully implemented in current codebase."* `grep` of `src/` for any vibe/SOS identifiers returned 0 matches before Phase 1 of this package. The claim was carried over from Lovable web, where Vibe Check WAS implemented; mobile codebase never had it. Now corrected by pkg/daily-vibe-check Phases 1-4. PRD line is stale.
- **השפעה:** PRD §7.1 line 215 needs editing to either remove the claim or replace with current state (Vibe Check shipped in mobile via pkg/daily-vibe-check beta-2026-06-01). CC does NOT touch PRD unilaterally per CLAUDE.md; Adi to apply.
- **סטטוס:** `open` (pending Adi PRD edit)
- **קשור ל:** pkg/daily-vibe-check, Decision NEW-1 in pkg SPEC, BUFF_GAP_ANALYSIS.md S-07

### IN-2026-05-17-03: 3-package sequencing for the parent notification surface

- **תאריך:** 2026-05-17
- **מקור:** Adi — Phase 4 design discussion in pkg/daily-vibe-check
- **תיאור:** During Phase 4 of pkg/daily-vibe-check, Adi raised two MVP-critical scope items that I had under-scoped: (1) **FCM push notifications** are MVP, not Phase 2 — Lovable churn root cause was parents/kids not knowing to return to the app, so push is essential. (2) **Bell icon + notification feed in parent UI** — Lovable parity gap; the mobile app today doesn't surface ANY of the 396 historical notifications. Both became sibling packages: `pkg/fcm-push-notifications` (already in CLAUDE.md FLAGs, MVP-critical S-01) and `pkg/parent-notification-feed` (new, MVP, Lovable parity). Both will read from the same `public.notifications` table that pkg/daily-vibe-check Phase 4a established as the source of truth. No rework when they land. Sequencing for beta-2026-06-01: (1) Vibe Check (this pkg, in progress); (2) FCM push; (3) bell + feed. All independent; FCM doesn't block bell+feed.
- **השפעה:** Two new packages need session folders + SPECs (CC may scaffold on Adi's signal). CLAUDE.md FLAGs needs updating to mark `pkg/parent-notification-feed` as proposed MVP (Adi to apply — CC does not touch CLAUDE.md unilaterally).
- **סטטוס:** `open` (pending: scaffold the 2 packages; update CLAUDE.md FLAGs)
- **קשור ל:** pkg/daily-vibe-check Phase 4, future `pkg/fcm-push-notifications` + `pkg/parent-notification-feed`

---

## FLAGs פתוחים

### F-2026-05-03-01: Onboarding fixes שעדיין לא ב-GAP_ANALYSIS

- **תאריך:** 3.5.2026 (התגלה ב-2.5.2026 בסקירה של הזיכרון של Claude.ai)
- **מקור:** Claude.ai (web) — בזיכרון של מסכמי שיחות עבר
- **תיאור:** רשימת תיקונים שסוכמו בשיחות עבר אבל לא הוכנסו ל-GAP_ANALYSIS:
  - החלפת text input ליום הולדת ב-`@react-native-community/datetimepicker` (פורמט "19 Oct 1998")
  - שינוי שם "Homework & grades" → "Homework & focus"
  - הוספת Section B ב-Step 3 (Challenges screen) עם multi-select checkboxes שמסתירות אופציות Section A
  - עטיפת Step 3 ב-ScrollView
  - פתרון אופציות זהות שמופיעות גם ב-Step 2 וגם ב-Step 3
- **השפעה:** ה-onboarding flow עלול להיות במצב לא רצוי בקוד. צריך אודיט מול הקוד הקיים.
- **סטטוס (עודכן 2026-05-16):** `partially-resolved` — אודיט קוד מול ה-flag (לקראת beta 2026-06-01) הראה שרוב הסעיפים כבר מומשו ב-refactor של ה-unified onboarding (`UStep1_ChildProfile.tsx`, `UStep2_Goal.tsx`, `UStep3_Challenges.tsx`). פירוט סטטוס לפי סעיף:
  - ✅ **datetimepicker** — dep מותקן (`package.json:18` @ 8.4.4); picker חי ב-`src/screens/onboarding/unified/UStep1_ChildProfile.tsx:4, :172-181, :198-206`; פורמט "19 Oct 1998" מיוצר ע"י `formatDate()` ב-`UStep1_ChildProfile.tsx:24-27`.
  - ✅ **"Homework & grades" → "Homework & focus"** — `Homework & grades` לא קיים בקוד. גיל 9-11 משתמש ב-`"Homework & school focus"` (`src/i18n/en.json:1316`); גיל 12-14 כבר משתמש ב-`"Homework & focus"` (`src/i18n/en.json:1320`). הסעיף N/A.
  - ✅ **Step 3 ScrollView** — חי ב-`src/screens/onboarding/unified/UStep3_Challenges.tsx:73-105` עם `keyboardShouldPersistTaps="handled"` ו-`paddingBottom: 110` ל-sticky footer.
  - ⚠️ **אופציות זהות Step 2 ↔ Step 3** — filter חלקי קיים ב-`UStep3_Challenges.tsx:31-33` (מסיר את ה-mainChallenge מ-Step 3). dedup מלא דורש Section B (סעיף הבא), שעדיין לא מומש. נשאר `open` כ-polish, לא חוסם beta.
  - 🚩 **Section B ב-Step 3** — עדיין לא מומש. נשאר `open` כ-polish (Adi דחתה במפורש מ-beta 2026-06-01 scope).
- **קשור ל:** Adi הורתה לא להוסיף ל-GAP_ANALYSIS חד-צדדית. ידון בסשן עתידי + יוסכם יחד מה להכניס. סגירת הסעיפים שתועדה כאן נעשתה ב-`pkg/close-f-2026-05-03-01` (docs-only).

---

### F-2026-05-03-02: Invite Link Option B (deep linking)

- **תאריך:** 3.5.2026 (התגלה ב-2.5.2026)
- **מקור:** Claude.ai — בזיכרון של תוכניות עתידיות
- **תיאור:** אחרי דדליין RevenueCat (1.5.2026), יישום Option B של invite link:
  - רישום `buff://join/:code` ב-`handleDeepLink`
  - Pre-fill של `SignupScreen` עם invite code
  - הוספת Universal Links לתמיכה ב-HTTPS domain
- **השפעה:** Invite flow המלא עוד לא ממומש. כרגע Option A (קוד-בלבד, ללא deep link) פעיל.
- **סטטוס:** `open`
- **קשור ל:** Adi הורתה לא להוסיף ל-GAP_ANALYSIS חד-צדדית. ידון בסשן עתידי.

---

### F-2026-05-03-03: קוד עוד ב-13-15 לאחר D-25 (הרחבה ל-13-18)

- **תאריך:** 3.5.2026
- **מקור:** D-2026-05-02-25 (תיעוד) + סשן ה-docs update
- **תיאור:** ה-docs עודכנו לטווח 13-18, אבל הקוד עוד מכיל auto-detection של mode לפי "13-15 = teen". מקומות ספציפיים לבדוק:
  - UI mode auto-detection logic
  - Hard-coded גיל ב-validation
  - Strings ב-onboarding screens אם יש מפורש "13-15"
- **השפעה:** מתבגר בן 16-18 שירשם עכשיו לא יקבל את Teen UI אוטומטית.
- **סטטוס (עודכן 2026-05-16):** `RESOLVED — CONFIRMED-NOT-APPLICABLE`.
  Re-audit during `pkg/childjoin-claim-orphans` planning (Plan Mode investigation, beta 2026-06-01 prep) confirmed once more: zero `13-15` references in code. Onboarding buckets are `'6-8' | '9-11' | '12-14' | '15-18'` ([src/screens/onboarding/unified/onboardingData.ts:14](../src/screens/onboarding/unified/onboardingData.ts)). Mode detection is role-based (`profile.role === 'child'` → Children/Gamer UI) at [src/contexts/ModeContext.tsx](../src/contexts/ModeContext.tsx) and [src/navigation/RootNavigator.tsx:102](../src/navigation/RootNavigator.tsx) — no age-to-mode mapping exists anywhere. Earlier `CLOSED — STALE` status (2026-05-08) is now upgraded to fully resolved with explicit confirmation from a second exhaustive search. When age-based teen detection lands (separate future package), it should centralize in `src/constants/ageRanges.ts` with `TEEN_MIN_AGE=13` / `TEEN_MAX_AGE=17` per Adi 2026-05-08 decision (18+ are legal adults in some jurisdictions). **FLAG removal from CLAUDE.md proposed to Adi separately — CC does not edit CLAUDE.md unilaterally.**
- **קשור ל:** D-2026-05-02-25; `pkg/childjoin-claim-orphans` (where the re-audit happened).

---

### F-2026-05-03-04: buffadhd.com — תוכן פומבי לא מסונכרן

- **תאריך:** 3.5.2026
- **מקור:** סשן בדיקה של terminology (Cog-Fun research)
- **תיאור:** ה-title של buffadhd.com עדיין: "BUFF — ADHD Routine App for Kids | Executive Function Training". לא בדקנו את שאר התוכן באתר. צריך:
  - לוודא שטווח גילאים (אם מצוין) מעודכן ל-6-18
  - לוודא שאין שימוש במונח "Cog Fun" / "קוגפאן" (D-29)
  - לבדוק תאימות לשפת BUFF_VALUES (Intrinsic Motivation, Positive Coaching, Independence-Building)
- **השפעה:** Marketing alignment. עלולה להציג את BUFF לא נכון.
- **סטטוס:** `open` — לפעולה בסשן Marketing/UI עתידי
- **קשור ל:** D-2026-05-02-25, D-2026-05-02-29

---

### F-2026-05-03-05: BUFF_BUDDY_SYSTEM.md הוא spec-only

- **תאריך:** 2.5.2026
- **מקור:** סשן ה-Spec Status header
- **תיאור:** ה-doc מתאר את BUDDY V0.5 (post-2.5.2026 redesign) עם 5 friendship levels, 6 boosters, EOD trigger. הקוד הקיים ממש *spec ישן יותר* — 4 evolution stages + skins, ללא friendship levels, ללא boosters, ללא EOD trigger.
- **השפעה:** כל מי שקורא את ה-doc חושב שהקוד ממש את ה-V0.5. **לא נכון.**
- **סטטוס (עודכן 2026-05-15):** `partially-resolved` — `pkg/buddy-v05-backend` שופח את התשתית של V0.5 (3 טבלאות, EOD pg_cron, ל-1 → ל-3 logic, hook). מה שעוד נשאר ל-spec מלא: levels 4-5 logic, booster use mechanics, ה-UI consumers (toast, tap-on-buddy, hide/show, full 5B עם LEVEL/BOOSTERS). הפער הזה ממופה ל-`pkg/teen-ui-with-buddy-bundle` ולחבילות עתידיות.
- **קשור ל:** Spec Status header ב-BUDDY_SYSTEM.md; pkg/buddy-v05-backend (PR #__)

---

### F-2026-05-03-07: שתי קולקציות עיצוב Buddy מקבילות

**מה:** ה-Pets הקיימים (capybara, panda, unicorn) ו-skins חדשים שתוכננו (Wolf STORMY, Dragon, +) משתייכים לשתי משפחות עיצוב שונות:
- **Pastel / Cute collection** — חמוד, רך, צבעים פסטליים
- **Gaming / Edgy collection** — ניאון, חזק, אסתטיקה גיימינג

**עיקרון:** כל קולקציה תיווצר באותה תוכנה ובאותו סגנון פרומפט, כדי לשמור על קו ויזואלי אחיד בתוך כל קולקציה. שתיהן ניטרליות מגדרית.

**השפעה:** קוסמטית, לא חוסם MVP. אבל ייראה לא מקצועי כשיש skin selector שמציג שני סגנונות שונים מאותה קולקציה.

**טיפול:**
1. בחירת תוכנה ליצירה (דיון עתידי — Stitch/Midjourney/DALL-E/אחר)
2. יצירת קולקציה Pastel חדשה (החלפת capybara/panda/unicorn הקיימים)
3. יצירת קולקציה Gaming (Wolf, Dragon, +)
4. הילד בוחר בקולקציה במהלך onboarding (חלק מ-Package B עתידי)

**סטטוס:** open — דרוש דיון תוכנה + סשן יצירת assets לפני pet-skin-picker.

---

### F-2026-05-03-08: סשן Stitch ל-Pastel UI alternative

**מה:** חלק מהילדים יעדיפו UI פסטלי על-פני neon הנוכחי (D-2026-05-02-24 רמז לכך כ-"theme alternative … לא כברירת מחדל").

**טיפול:** סשן Stitch עתידי עם Adi (אולי עם אמי כ-co-designer) — יוגדר כחבילה עצמאית כשנגיע אליה. מתחבר ל-F-2026-05-03-07 (שתי קולקציות).

**סטטוס:** open — לעתיד אחרי MVP.

---

### F-2026-05-05-01: Pre-existing expo-doctor failures in buff-mobile

- **תאריך:** 2026-05-05 (discovered during admin-dashboard-port Phase 2)
- **מקור:** CC — during Chunk 2 of pkg/admin-dashboard-port-phase-2
- **תיאור:** `npx expo-doctor` reports 4 failures in the root buff-mobile project. Verified as pre-existing on main (before workspace addition) by running expo-doctor on both main and the phase-2 branch — same failures on both:
  1. `app.json` schema: `android.supportsRTL` is an unknown field
  2. Missing peer dependency: `expo-font` (required by `@expo/vector-icons`)
  3. Duplicate `expo-font` (55.0.6 vs 14.0.11) + duplicate `expo-constants` (same version ×3, harmless)
  4. `babel-preset-expo` major mismatch (expected ~54, found 55.0.15) + 8 patch-version mismatches across Expo packages
- **השפעה:** Not blocking current work (Metro starts, app runs). May cause unexpected build errors in EAS Build. Patch mismatches are minor; babel-preset-expo major mismatch is more significant.
- **סטטוס:** `open` — to address in a dedicated "expo-health" Improvement Package before EAS Build submission.
- **קשור ל:** admin-dashboard-port Phase 2 (discovered), pkg/admin-dashboard-port-phase-2

---

### F-2026-05-05-02: admin-dashboard-port Phase 2 execution notes (deferred items)

- **תאריך:** 2026-05-05
- **מקור:** CC — pkg/admin-dashboard-port-phase-2 execution
- **תיאור:** Four in-flight decisions made during Phase 2 that deviate from SPEC/AUDIT or defer work:

  **React 19 (deviation from SPEC §3.1 / AUDIT §4):** SPEC and AUDIT referenced Lovable's React 18.3.1 stack. Root buff-mobile runs React 19.1.0. Decision (Adi, 2026-05-05): use React 19 in admin-web to match root and eliminate monorepo version drift. admin-web/package.json uses `react: ^19.1.0, react-dom: ^19.1.0`.

  **nohoist clarification 2026-05-05:** Phase 2 prompt specified nohoist for Expo packages, but nohoist is a Yarn workspaces feature, not npm. With React 19 matching root and admin-web having no RN/Expo dependencies, npm workspaces' default hoisting did not break Metro. CLAUDE.md § Tech Stack — Known Constraints will be updated in a plan-review-checklist package to reflect: monorepo isolation in npm workspaces relies on package.json deps separation, not nohoist.

  **`@types/node` addition (beyond AUDIT §4 list):** Required for `path.resolve(__dirname, ...)` in vite.config.ts. Pre-approved in chat 2026-05-05. Added as `@types/node: ^22.0.0` in admin-web devDependencies.

  **`@radix-ui/react-slot` deferred:** Phase 2 Button component omits asChild prop (requires @radix-ui/react-slot). Smoke test only — full Button functionality + other Radix-based shadcn primitives (Dialog, Dropdown, Portal, etc.) deferred to Phase 4 of admin-dashboard-port port work, where they will be added as a coordinated set.

- **סטטוס:** `deferred` — items noted, no action needed in Phase 2. Phase 4 picks up Radix deps; expo-health package picks up npm/expo issues.
- **קשור ל:** F-2026-05-05-01 (expo-doctor), admin-dashboard-port Phase 4

---

### F-2026-05-13-01: Marketing strategy session — open dependencies and strategic gates

- **תאריך:** 2026-05-13
- **מקור:** Claude Code — marketing strategy session with Adi
- **תיאור:** Strategic marketing session produced 3 new operational docs ([BUFF_MARKETING_BACKLOG.md](BUFF_MARKETING_BACKLOG.md), [BUFF_ADVISOR_OUTREACH_KIT.md](BUFF_ADVISOR_OUTREACH_KIT.md), [BUFF_BLOG_CONTENT_MAP.md](BUFF_BLOG_CONTENT_MAP.md)) and surfaced 4 dependencies that need resolution before execution scales:

  1. ✅ **`/philosophy` page on buffadhd.com** — **SHIPPED 2026-05-14** (PR `pkg/philosophy-pillars-and-meta-fixes` in `adielgarat-pm/buff`, awaits merge + deploy). 3-Principles hero added with WHY/WHAT-first framing. Pillar 3 (Independence-Building / outgrow) prominently articulated as the differentiator.

  2. **Israeli ADHD voices gap** — [BUFF_ADVISOR_OUTREACH_KIT.md §3 Bucket C](BUFF_ADVISOR_OUTREACH_KIT.md) needs 2–3 names from Adi. Israeli market is highest-trust + lowest-competition channel (96% of beta is IL per PRD §4.3) but currently underserved by target list.

  3. **In-app rating prompt** (Track B in [MARKETING_BACKLOG](BUFF_MARKETING_BACKLOG.md)) — needs SPEC + Values Check before engineering. Concern: Pillar 2 — does asking parent for review feel pressure-y? Defer until Play Store live AND first 50 users converted (Google permits 1 review ask per year per user — burning it early = no review ever).

  4. **Adina Maeir (Cog-Fun) outreach decision** — special case per D-2026-05-02-29. Pursuing her would unlock the Cog-Fun question. Pitch is fundamentally different from routine outreach — partnership conversation, not advisor email. Adi to decide separately.

  5. ✅ **Domain email setup** (`adi@buffadhd.com`) — **RESOLVED 2026-05-14**. Adi set up Google Workspace ($6/mo Business Starter) and has `adi@buffadhd.com` working. Additional addresses can be added if needed. All references in BUFF_ADVISOR_OUTREACH_KIT, BUFF_FOUNDING_100_KIT, and founding-100-payment session files reverted to canonical `adi@buffadhd.com`.

- **השפעה:** Marketing rollout depends on these. Wave 1 (`/philosophy` + meta data) ✅ shipped to PR; awaits merge to actually deploy. Wave 3 (blog) is independent but compounds slowly. Email infrastructure ✅ ready for Tier 1 outreach.
- **סטטוס:** `open` — items 2, 3, 4 still pending Adi prioritization; items 1 + 5 ✅ resolved
- **קשור ל:** [BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) Phase 2 / D-2026-05-02-29 / [BUFF_MARKETING_BACKLOG.md §7](BUFF_MARKETING_BACKLOG.md) / Wave 1 PR `pkg/philosophy-pillars-and-meta-fixes` in `adielgarat-pm/buff`

---

### F-2026-05-14-01: Web compatibility check before adding any native dep

- **תאריך:** 2026-05-14
- **מקור:** Claude Code — Lovable sunset + web strategy planning session with Adi
- **תיאור:** Architectural decision (D-2026-05-14, see [BUFF_PRD.md §9.4 Web Strategy](BUFF_PRD.md)) commits BUFF to a future where the app compiles to Web via Expo Web (= React Native Web). Many native modules do not support web builds. If we install a dep that doesn't support web, the future Web build will silently break — and we won't know until we try to ship it.
- **Concrete risk examples:** native vibration, deep camera access, parts of FCM (PWA push is limited), some `react-native-*` packages without web maintainers.
- **Operational requirement:** **Before installing any new native dep in `package.json`** — run `expo install <dep>` and confirm no "no web support" warning. Alternatively, check the package README for `react-native-web` (or "web") in the supported platforms list. Either way, **avoid silent native-only deps.**
- **השפעה:** Without this discipline, F-073 (Web build, Phase 2) will require a large cleanup pass instead of a clean compile.
- **סטטוס:** `open` — methodological framing for all future development
- **קשור ל:** D-2026-05-14 (Web Strategy & Lovable Sunset Plan), F-073 (Web build), F-074 (Static landing), F-075 (Sunset Lovable), `pkg/lovable-parity-and-backlog`

---

### F-2026-05-16-01: Birthday date format ignores Hebrew locale

- **תאריך:** 2026-05-16
- **מקור:** Claude Code — code audit during `pkg/close-f-2026-05-03-01` (closure of F-2026-05-03-01)
- **תיאור:** `formatDate()` ב-`src/screens/onboarding/unified/UStep1_ChildProfile.tsx:24-27` מקודד ידנית `'en-GB'` כ-locale ל-`toLocaleDateString`. משתמשים בעברית (קהל ראשי per CLAUDE.md "User-facing app strings: Hebrew") יראו תאריך לידה באנגלית ("19 Oct 1998") במקום ("19 אוק׳ 1998") או פורמט עברי תקני. הקוד היחיד הרלוונטי:
  ```ts
  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  ```
- **השפעה:** UX miss מינורי ב-onboarding לקהל ישראלי. לא חוסם beta (פונקציונליות עובדת; רק locale). תיקון מועמד: שורה אחת — להעביר את ה-locale מ-`i18n.language` (בדומה ל-`useTranslation()` שכבר זמין במסך).
- **סטטוס:** `open` — מועמד ל-quick-fix package נפרד או bundle עם תיקוני onboarding polish עתידיים (Section B, Step 3 dedup, etc.).
- **קשור ל:** F-2026-05-03-01 (sister flag — נחשף תוך כדי האודיט שלו), `pkg/close-f-2026-05-03-01`

---

## רשומות שנפתרו (Resolved)

### F-2026-05-14-02 (RESOLVED 2026-05-14): Extract Lovable reviews → BUFF_TESTIMONIALS

- **תאריך פתיחה:** 2026-05-14
- **תאריך סגירה:** 2026-05-14 (אותו יום)
- **תיאור מקורי:** Lovable has a `reviews` table with user-submitted, admin-approved reviews of BUFF. Existing reviews are valuable testimonials but blocked on Lovable data access.
- **ההשפעה שהייתה:** F-074 (Static landing) and marketing materials lacked social proof. Beta-period user words were unused.
- **איך נפתר:** Adi exported the `reviews` table from Lovable admin (3 approved entries — Shani, Noa Morag long-form, Kelly). All reviews already had English translations produced by Lovable's `translate-review` edge function (Gemini Flash Lite). CC imported as T002, T003, T004 in `BUFF_TESTIMONIALS.md §2A` (PR `pkg/lovable-testimonials-import`). Consent for paid ads / Play Store still pending — captured as new Open Action Item in `BUFF_TESTIMONIALS.md §8`.
- **עדכון 2026-05-15:** T004 (Kelly) הוסרה מ-BUFF_TESTIMONIALS — Adi disclosed it was a family review submitted under a pseudonym, not a real third-party testimonial. Per BUFF_TESTIMONIALS §6 anti-patterns ("don't fabricate quotes"), it doesn't qualify. **For any future sync from Lovable's `reviews` table: skip the Kelly entry.** Adi to delete the row from Lovable's reviews table separately so it stops appearing on buff.lovable.app Landing. T002 (Shani) and T003 (Noa long-form) remain valid.
- **קשור ל:** F-071 (in-app reviews — Out), F-074 (Static landing), F-075 (Sunset Lovable), [BUFF_TESTIMONIALS.md](BUFF_TESTIMONIALS.md), D-2026-05-14, `pkg/lovable-parity-and-backlog` → `pkg/lovable-testimonials-import`, `pkg/testimonials-remove-t004` (removal of T004 2026-05-15)

---

### F-2026-05-03-06 (RESOLVED 2026-05-03): `.claude/settings.local.json` — file noise

- **תאריך פתיחה:** 3.5.2026
- **תאריך סגירה:** 3.5.2026 (אותו יום)
- **מקור הגילוי:** sessions של 2.5.2026 ו-3.5.2026 (מופיע כ-modified בכל git status)
- **תיאור מקורי:** קובץ הגדרות מקומי של Claude Code Extension משתנה בכל סשן. יוצר רעש ב-`git status`.
- **ההשפעה שהייתה:** קוסמטי. עלול היה להיות מקומיט בטעות.
- **איך נפתר:** ב-PR `workflow-foundation` (commit 5d374b3 ב-main):
  1. הוספה של `.claude/settings.local.json` ל-`.gitignore`
  2. `git rm --cached .claude/settings.local.json` — ניתוק הקובץ מ-tracking (CC זיהה ש-`.gitignore` לבד לא מספיק לקבצים שכבר tracked)
- **קשור ל:** D-2026-05-02-28 (VS Code Extension), D-2026-05-03-30 (Workflow Foundation)
- **לקח להמשך:** קבצי הגדרות מקומיים של כלים שלא צריכים להיות בריפו — לוודא בכל הוספת dependency חדשה / כלי חדש שהם ב-`.gitignore` *לפני* commit ראשון.

---

## Lessons

### Lesson 2026-05-03 — Snapshot fabrication + recommendation cascade

**Symptom:** CC produced a 6-bullet snapshot containing *"RevenueCat: grace period expired May 1 — payment system needed urgently."* Claude.ai accepted the claim and built a pushback recommending RevenueCat go-live instead of the planned DevEx package.

**Root cause:** Three layers failed simultaneously.
1. **Loose prompt (Claude.ai):** "10-15 key points" invited synthesis instead of extraction.
2. **No anchor protocol (CC):** "grace period expired" + "needed urgently" had no source. Actual source `BUFF_DECISIONS_LOG.md` D-2026-05-01-05 says only "RevenueCat מוגדר ועובד" — no grace period, no urgency.
3. **No verification gate (Claude.ai):** Used unverified claim as basis for sequencing change. BUFF skill Rule 8 (verification, not memory) was bypassed.

**Mitigation (snapshot-protocol package, this commit series):**
- Read-only Snapshot Protocol → `CLAUDE.md`
- Snapshot Prompt Template + Verification Gate → `docs/WORKFLOW.md`
- This entry as canonical incident reference

**Pattern to watch:** When a CC-produced claim "sounds right" or fits a narrative, both CC and Claude.ai are tempted to skip anchoring. The verification gate makes the skip impossible.

**FLAGs opened:** None — process fix, not code FLAG.

---

### Lesson 2026-05-04 — Branch deleted before merge (data near-loss)

**Symptom:** Adi instructed CC "merged" on the morning-cleanup-2026-05-04 package without having actually created or merged a PR on GitHub. CC executed the standard cleanup sequence (`git checkout main && git pull origin main && git branch -d pkg/morning-cleanup-2026-05-04 && git push origin --delete pkg/morning-cleanup-2026-05-04`). The local `git pull` returned "Already up to date" (because nothing had been merged on GitHub). The `git branch -d` deleted the local branch despite it not being merged into main, and `git push origin --delete` removed it from origin. Result: 4 commits — F-2026-05-03-07, F-2026-05-03-08, EOD Protocol section, and the session folder — became orphaned. The branch existed nowhere as a named ref.

**Discovery:** Hours later, when Adi attempted to merge the next package (admin-dashboard-port), Claude.ai noticed that morning-cleanup content was missing from `main`. Diagnostic queries (`git log --all`, `grep` for FLAG IDs) confirmed the loss.

**Recovery:** Found 4 commits in `git reflog` and `git fsck --lost-found` as dangling commits. Created a new branch `pkg/morning-cleanup-2026-05-04-recovery` pointing to the tip SHA, pushed to origin, opened PR #3, merged. All content restored to main with no data loss.

**Root cause:** Three layers failed simultaneously.
1. **Adi's confirmation drift:** "merged" was said without actually performing the GitHub merge step. After many sessions, the verbal "merged" became habitual rather than tied to the actual GitHub action.
2. **CC trusted the verbal confirmation:** Standard cleanup ran without verifying that the merge had actually landed in `main`. The cleanup sequence assumed `git pull` would have brought down the merge — but if no merge happened, the pull is a no-op and the assumption fails silently.
3. **`git branch -d` did not protect us:** This command refuses to delete unmerged branches *only when comparing to the current HEAD*. Since `main` was checked out and the branch had never been merged anywhere, `-d` should have refused. The fact that it succeeded indicates either: (a) git considered the branch "merged" because of some intermediate state, or (b) the actual command used was `-D` (force). Either way, no safety net.

**Mitigation (this package):**
- Verify-Before-Delete Protocol → `CLAUDE.md` (binding rule for CC: never delete a branch until the merge content is verified in main)
- Cleanup Procedure section → `docs/WORKFLOW.md` (operational steps for the post-merge workflow, with verification gate)
- This entry as canonical incident reference

**Pattern to watch:** Verbal confirmations in long sessions drift from their original meaning. "merged" must be tied to a verifiable artifact (PR closed on GitHub, content present in `git log` of main), not to a verbal handshake.

**FLAGs opened:** None — process fix.

---

## איך למלא ערך חדש

CC, Claude.ai, או Adi — מי שמגלה את ההפתעה רושם. הפורמט:

```markdown
### F-{YYYY-MM-DD}-{##}: {כותרת קצרה}

- **תאריך:** YYYY-MM-DD
- **מקור:** [Adi / Claude.ai / CC] — בהקשר של {sessions/{slug}/ או description}
- **תיאור:** מה גילית / מה ההפתעה
- **השפעה:** על מה זה משפיע (קוד / docs / UX / וכו')
- **סטטוס:** `open` / `resolved` / `deferred`
- **קשור ל:** DECISION ID / package slug / FLAG אחר
```

**מתי להעביר ל-resolved:** כשFLAG נפתר (פיצ'ר ממומש, מסמך מסונכרן, baseline נסגר). מעבירים את הערך לסעיף "רשומות שנפתרו" עם תאריך resolution והפניה לcommit/session שסגר אותו.

**מתי NOT לרשום פה:**
- החלטות אסטרטגיות → DECISIONS_LOG
- עקרונות קבועים → BUFF_VALUES.md
- אפיון פיצ'ר → SPEC.md של חבילה
- bugs לתיקון מהיר → ישר ל-CC ב-Direct Fix
