# Parent Capture — DECISION (strategy + market)

**Status:** `exploratory — strategy locked, build NOT approved. Awaiting Adi's now-vs-V-next call + Gemini-dependency approval.`
**Slug:** `pkg/parent-capture`
**Origin:** PM brainstorm with Adi, 2026-06-05 (senior-PM thinking-partner session).
**Companion:** `SPEC.md` (detailed target state, same folder).
**Memory:** `project_smart_capture_idea.md`.

> This doc captures the *why* and the *market*. The SPEC captures the *what*. Read this first.

---

## 1. The one-liner

A parent-facing **capture layer inside BUFF**: the parent shares a message / email / **photo of a school handout** into BUFF; AI turns it into structured tasks, events, and reference; the parent confirms; and some items are **transferred to the child's ownership** — so the child remembers them, not the parent.

The product's soul is **not** the capture (that's commoditized). It's the **transfer** — capture exists *in order to* graduate logistics out of the parent's head and into the child's autonomy. That makes it the parent-half of BUFF, on-pillar with "until they don't need us."

---

## 2. The trigger & the job

**Trigger (real):** A mom in Emi's class asked, for the millionth time, what the girls need to bring / wear to the performance. The information existed — the teacher had sent it — it was just buried in the stream.

**Job-to-be-done (parent):**
> "When a teacher / organizer dumps logistics into a chat or sends a photo, I want to not have to hold it in my head and not drop it, so I can know for certain what my kid needs today — without being *the parent who asks for the millionth time*."

Emotional/social job: **not being the non-functioning parent.** This is fear-driven and far stronger than "manage my tasks."

---

## 3. Four product principles (discovered in the brainstorm)

1. **Capture layer, not an app.** The product lives where the chaos lands (share sheet / paste), not in a destination you "open." → Android share-target + in-app paste, **not** a separate app.
2. **A calm pull destination.** Adi's words: *"a place I choose to enter, to update, to remember, and know it's always there waiting for me."* Anti-nagging — extended from the child to the **parent**. Notifications = opt-in per item, never the default. This is *the* differentiator vs. the notification-spam family-OS camp.
3. **Two object types: "to-do" and "to-know."** Tasks (do) AND schedules/reference (know). Most of the value is in *to-know* ("what does my kid need today"). The calendar is the surface of *to-know*, not the core.
4. **Ownership-transfer = independence.** Adi: *"I want her to remember the workbook, not me for her."* The same engine that relieves the parent **builds the child's executive function**. This dissolves the Pillar-3/anti-nagging risk: capture is the parent's training wheels, and they fade as items graduate to the child.

---

## 4. Why it lives INSIDE BUFF (decided on evidence, not gut)

In a live Gemini test (2026-06-05) the extraction quality was a **direct function of BUFF's family context**:
- With the child roster injected ("Emi, 9, grade ד; Itai, 15, grade ט"), `"שכבת ד"` auto-assigned to **Emi** with zero "which child?" friction.
- Items for other grades (`ה-ו`, `ח׳`) were correctly filtered as `no_match` — **noise removed.**
- Without the roster, *every single item* carried `missing: "which child?"` — the friction tax.

**Conclusion:** a standalone app re-asks "which kid?" every time; BUFF's family graph (grade→child) resolves it automatically. The integration isn't cosmetic — **it is the source of the magic.** Adi's initial gut ("independent complementary capability") was inverted by the data: it's the parent-half of one product.

---

## 5. Market scan (2026-06-05, 3 independent web agents converged)

### The headline finding
**The specific combination does not exist in the market.** The space is cleanly split into two non-overlapping camps, and the bridge is white space (verified independently by two separate research passes; honest caveat: "not found" ≠ "proven globally absent," and search skewed US/English).

### Camp A — Kid ADHD / EF engines (have the kid, miss the capture)
Joon, Goally, Brili, Tiimo, DragonFamily. Real motivation engines for the child. **None ingest parent logistics** (school email / photo / message). The parent types everything in by hand.
- **Joon** = BUFF's closest kid-side twin; even frames parent→child responsibility transfer. **No capture layer at all.**
- **DragonFamily** = the only one pairing a kid pet/reward loop with an AI parent copilot — but the AI is a chore/parenting advisor, **not a school-logistics ingester.** *Watch-item:* if they add ingestion, they're first into this exact space.

### Camp B — Parent mental-load AI capture (have the capture, miss the kid)
Ohai.ai, Maple, Sense, Nori, Jam, Hearth, FamilyHero, Skylight. These DO ingest email / photo / message → tasks/events. **But their "kid" is a row on a shared list** — no EF engine, no body-double, no autonomy-building, no transfer mechanic.
- **Skylight** is the only product combining capture (Sidekick/Magic Import) AND a kid chore screen — but it's a $160+ wall device, the two features are unconnected, and there's no parent→child handoff.

### School-comms apps (the pipe, not the parser)
ClassDojo, Remind, Seesaw, ParentSquare, Bloomz, TalkingPoints. They own the school→parent pipe but **stop at "notify"** — events are staff-authored, not parsed from message text. Auto-conversion only via external glue (Zapier). They are **not** BUFF's competitor on capture; the AI family-organizer camp is.

### The white space (BUFF's wedge)
Three things co-occur **nowhere**:
1. Ingest → structure the parent's school/activity chaos (Camp B owns this).
2. A motivating, ADHD-designed kid EF engine — BUDDY/body-double, real rewards, autonomy (Camp A owns this).
3. A deliberate **parent→child handoff** that moves a captured item into the child's own motivating system *to build independence* — **owned by no one.**

> BUFF is the only thesis that treats the parent-capture layer and the kid EF engine as **one pipeline whose purpose is to shrink the parent's mental load by graduating items into the child's autonomy.**

### The most important strategic signal: Milo died
**Milo** (joinmilo, Avni Patel Thompson) — OpenAI- and YC-backed, *the exact same pitch* (dump screenshots/voice → AI → reminders/calendar) — **shut down ~Jan 2026**, founder citing the tech as "too early to be reliable."

Lessons (load-bearing for BUFF):
- **The AI parse is a commodity.** Photo2Calendar does "photo → event" for **$7.99 one-time**; a dozen apps do email→calendar. Positioning as "AI that reads your messages" walks straight into a price war and Milo's graveyard.
- **The moat is trust + the surrounding workflow**, not the parse. Milo died on reliability/trust, not on features.
- **The defensible ingestion vector is messaging (WhatsApp/SMS forward → task)** — only Ohai partial, nobody owns it as a position. And it's exactly the stream Adi lives in.

---

## 6. Marketing / brand impact

### It *validates* the existing positioning
BUFF's competitive tagline is already *"Joon is for kids. BUFF is for your family."* (`BUFF_BRAND.md §3.2`). Until now that was a promise without proof — BUFF is effectively a kid app with a parent dashboard. **The capture layer is the first real proof of "for your family"**, and fills the "Family as a system" territory BUFF already claims (`BUFF_COMPETITORS.md §2`).

### The brand tension — and its resolution
BUFF's soul is *"Until they don't need us"* + Pillar 3 (the app you outgrow). A tool that reduces the parent's load risks making the **parent dependent** — the exact trap the whole Camp B falls into ("we manage your life forever").
**Resolution (already in the design):** in BUFF the capture **exists in order to transfer** to the child. It's the parent's training wheels, and they fade as items graduate to the kid. → not a deviation from Pillar 3; **Pillar 3 extended to the parent.**

### Three explicit brand guardrails (BUFF forbids these)
- ❌ **Surveillance/monitoring framing** (`BUFF_BRAND.md §6`). Capture must be *"your stream, in your control"*, never *"we scan everything for you."*
- ❌ **"Secretary" tone.** Not *"BUFF manages your life."* Yes: *"BUFF turns you from the family's secretary into its coach."*
- ❌ **Privacy drift.** This is a **children's app** with aggressive PII scrubbing (Pillar 2). Ingesting parent WhatsApp/photos = a new PII surface. Inverted: BUFF's trust posture is an *advantage* over Milo (who died on trust) — *"your data stays yours"* is a hook, if handled right.

### Pitch impact
All 7 current hooks are child-outcome ("How many times did you say 'just get ready'"). The capture layer opens a **new hook territory: the parent's own mental load** — i.e., Adi's "millionth time" anecdote, speaking straight to persona **P1 (Exhausted Morning)**.
**But per the WHY/WHAT rule (`feedback_marketing_why_what`): do not sell the HOW (the AI).** Sell the outcome and the belief. Raw directions (NOT final — must pass through Adi + Claude.ai; CC does not finalize user-facing copy):
- *"Stop being the family's secretary. Start being its coach."*
- *"What the teacher sent — Emi already remembers herself."* (transfer = proof, on-Pillar-3)
- Tagline extension: *"Until they don't need us — and neither do you."*

---

## 7. Recommendation

1. **Build it — but as a small, time-boxed parent-anchor experiment, NOT a second product.** The cheapest valid slice: **share-to-parse → confirm card → optional transfer-to-kid → a calm "This Week" card in BUFF.** No always-on monitoring, no network, no calendar grid, no default notifications, no iOS.
2. **Position as the family pipeline (transfer), not AI capture.** The story is hand-off (parent→child→independence). That's the only differentiator *and* the only defense against Milo's graveyard.
3. **The category to own:** not "another family organizer," not "another kid chore app" — **"the family brain that hands itself down to the kid."**
4. **Don't touch the 3 pillars** — this is an extension, not a rewrite.

### The one open decision (Adi's call — CC cannot decide)
**Now, or V-next?** BUFF is pre-public-Play-Store with few signups, still in testing, and kid-side retention is fragile (79% non-return after the war). Two inputs:
- If kid-side retention is starting to hold → this is the perfect time to add the parent anchor (the parent is the churner; this gives them daily value independent of the kid).
- If the kid side is still bleeding → stabilize first.
- **Discipline is the cut:** as long as v1 stays "share→transfer→This-Week card," focus risk is low. The moment it grows toward inbox monitoring, it becomes a quarter-eating bet — defer that.

### The dependency that needs explicit approval
**Gemini API is a new external dependency + a new PII surface** (sending family messages/photos to Google). Per CLAUDE.md this is an Improvement-Package decision requiring Adi's sign-off — vendor, API key, per-capture cost, and children's-app privacy posture. See SPEC §Privacy and §Dependencies.

---

## 8. Cheapest validation already done (2026-06-05)

Feasibility is **proven** without writing build code: Gemini Flash extracted structured items from Hebrew **text**, from a **WhatsApp photo** (Hebrew OCR), with **roster-based auto-assignment** and **noise filtering**, correct **type classification** (task/event/schedule/reference) and **confidence calibration**. The validated prompt + schema are embedded in `SPEC.md §Extraction Contract`. Remaining unknowns are refinements (channel→child mapping, stale-item filter, messy-image robustness), not blockers.
