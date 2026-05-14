# hide-paywall-from-child — SPEC

> Target state for this package. Authoritative until superseded.
> Wins over canonical docs during the package; canonical docs update at exit per SPEC_SYNC.md.

**Slug:** `pkg/hide-paywall-from-child`
**Branch:** `pkg/hide-paywall-from-child`
**Origin:** [INTEGRATION_LEARNINGS.md IN-2026-05-14-02](../../INTEGRATION_LEARNINGS.md) — Adi discovered while testing pkg/teen-ui-my-stats-lite as Itay.
**Depends on:** nothing.
**Unblocks:** nothing immediate. Removes a UX rough edge that hurts every non-paying family.

---

## Capabilities & Bottlenecks

### What Claude.ai (web) does
- Final approves the child-facing replacement copy ("ask your parent to unlock" wording).
- Reviews the four touched screens once implemented.

### What Claude Code (CC) does
- Adds a `viewMode === 'child'` gate next to every existing `isSubscribed` check that produces a payment CTA in `src/screens/child/`.
- Replaces those CTAs with a calm "ask your parent to unlock" message (i18n EN + HE).
- Updates Jest tests where they touch a gated path.
- Updates STATUS / TESTS per workflow.

### What Adi must do herself
- Approve final copy.
- Verify on physical device (or emulator) that the child no longer sees "Unlock ✨" / Paywall content; parent flow is unchanged.

### Bottlenecks
- Copy choice (5-min decision, see Open Question 1).
- The `ChildSettingsScreen` Pet Skin grid is partly cosmetic — children currently see locked skins and tapping any of them opens Paywall. Decision: do we still let them *see* locked skins (so they know what's possible) or hide the whole grid? See Open Question 2.

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`. Must pass all before CC writes code.

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?**
   ✅ Yes — this *removes* an extrinsic ask from the child. The child wasn't asking for the paywall; we just stop showing it.
2. **Does this bring the child closer to a self-chosen reward?**
   ✅ Neutral-positive — by removing the "spend money" CTA, the child can focus on the actual reward path (parent-set rewards in the shop, BUFF currency they earn).
3. **Does success feel like "I want to" or "I have to"?**
   ✅ Removes a "you have to ask your parent for money" implicit framing. Net win.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / display failure?**
   ✅ No. Replacement copy is explicitly supportive ("Ask your parent to unlock 🔒" or similar — exact wording in Open Question 1).
2. **If the child fails — is the response empathy or pressure?**
   ✅ Empathy. The child sees a gentle locked state, not a CTA they can't act on.
3. **Is there a "suffering / loss / anger" mechanic for BUDDY?**
   ✅ N/A — this is purely about hiding paywall UI from child viewers.

### Pillar 3 — Independence-Building
1. **Does this make the child more capable *without* the app?**
   🟡 Neutral. Removes friction, doesn't add a skill.
2. **Does the child have a voice in this feature?**
   ✅ Yes — the principle behind this package (children should never be asked to subscribe) protects the child's role as user, not buyer.
3. **In 6 months, is this still necessary or did it do its job?**
   ✅ Necessary as long as non-paying families exist, which will be ongoing — but the fix itself is "set and forget."

**Values Check Pass:** ✅ Yes.

---

## Goals
- A logged-in child (role='child', or parent-in-preview-as-child) viewing any of the four currently-paywalled child screens sees a child-appropriate locked state instead of "Unlock ✨" / `PaywallContent`.
- The parent flow (role='parent', not in preview mode) is **unchanged** — they keep seeing the existing Paywall CTA when not subscribed.

## Non-goals
- Removing the paywall entirely. Parents still see and can action it.
- Rewriting `PaywallContent` itself — it stays as-is for parent surfaces.
- Adding any new functional capabilities for children (e.g. "request unlock" button that sends a parent notification). Display-layer changes only.
- Changing subscription logic in `useSubscription` or anywhere else. Pure UI conditional.

---

## Behavior Contract

For each of the four offending spots:

### 1. ChildDashboardScreen.tsx — Pastel locked-pet card
**Currently** (line 182):
- Subscribed → shows `<PetDisplay>` with the actual pet
- Not subscribed → shows "🥚 Buddy locked 🔒 / Unlock BUFF Premium to hatch your pet / [Unlock ✨ button → Paywall]"

**After:**
- Subscribed → shows `<PetDisplay>` (unchanged)
- Not subscribed AND parent view → unchanged (the locked-pet card with the "Unlock ✨" CTA)
- Not subscribed AND child view → shows the egg with a softer message: "🥚 Your buddy is sleeping / Ask your parent to wake it up 💤". **No tappable CTA.**

### 2. ChildRewardsScreen.tsx — Pastel Rewards tab (full PaywallContent)
**Currently** (line 78-79): not subscribed → returns `<PaywallContent>` instead of the shop.

**After:**
- Subscribed → shop (unchanged)
- Not subscribed AND parent view → `<PaywallContent>` (unchanged)
- Not subscribed AND child view → child-friendly empty state: "🎁 The shop opens when your parent unlocks BUFF Premium / Ask them to take a look!" (no button)

### 3. GamerRewardsScreen.tsx — Gamer Rewards tab (full PaywallContent)
**Same change as #2** — gamer-styled empty state instead of `PaywallContent` for child viewers. Visual palette matches GamerDashboard.

### 4. ChildSettingsScreen.tsx — Pet Skin grid (locked overlays + Paywall nav on tap)
**Currently** (line 130 + 145-153): non-subscribed users see locked skin grid; tap → opens Paywall.

**After:**
- Subscribed → unchanged
- Not subscribed AND parent view → unchanged (locked skins + Paywall nav on tap)
- Not subscribed AND child view → **two sub-options, see Open Question 2.** Default: locked skins still visible (so child knows the aspiration) but tap is inert (no Paywall nav). The "✨ Premium" header label is hidden for children.

---

## Schema Changes

**None.**

## Prompts Changes

**None.**

## API / Route Changes

- No new routes. No nav changes. Just conditional rendering inside the existing 4 screens.
- New i18n keys (EN + HE):
  - `childLockedState.buddyTitle` → "Your buddy is sleeping"
  - `childLockedState.buddySub` → "Ask your parent to wake it up 💤"
  - `childLockedState.shopTitle` → "The shop opens when your parent unlocks BUFF Premium"
  - `childLockedState.shopSub` → "Ask them to take a look!"
  - (Gamer version uses the same copy or a more on-brand variant — see Open Question 1.)

## UI Changes

- 4 conditional branches added, all inside the existing files. No new components.
- Detection: inline `viewMode === 'child'` from `useMode()` — already imported in 3 of 4 screens.

## Open Questions

> CC resolves these in Plan Mode. Defaults below; flag for change before code.

1. **Replacement copy** — exact strings for the locked states. CC defaults:
   - Dashboard: "🥚 Your buddy is sleeping / Ask your parent to wake it up 💤"
   - Shop (both themes): "🎁 The shop opens when your parent unlocks BUFF Premium / Ask them to take a look!"
   - Gamer-tone variant (Shop): "🎁 LOCKED ZONE / Your parent has the key 🔑" — slightly more on-brand for the teen audience.
   - **CC will use the defaults unless Adi specifies otherwise.**

2. **Pet Skin grid for child viewers** — three sub-options:
   - (a) Keep visual (locked skins shown, tap is inert) — child knows what they could have
   - (b) Hide entire grid for child viewers — clean, but child has no idea Pet Skins exist
   - (c) Show skins but with a child message replacing the "✨ Premium" header: "Skins unlock with BUFF Premium"
   - **CC default: (a)** — preserves the aspirational view without the broken CTA.

3. **`useIsChildViewer()` helper vs inline check** — clean to extract but adds a file. **CC default: inline `viewMode === 'child'` from `useMode()`** — only 4 call sites.

## Out of Scope

- Changing the subscription model.
- Adding any "request unlock" buttons or parent notifications.
- Touching `PaywallScreen.tsx` itself.
- The cleanup of orphan profiles in KWYEL5 (IN-2026-05-14-03) — separate package.
