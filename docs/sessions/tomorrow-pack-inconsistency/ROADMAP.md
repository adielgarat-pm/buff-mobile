# tomorrow-pack-inconsistency — Roadmap

> Phases with explicit stop conditions. Each boundary is a testable gate.
> Phase 1 is independent of Adi's open questions; Phase 2's copy chunk waits on Q2.

## Phase 1 — `PackingCard`: today dominant, tomorrow collapsible (SPEC D2)

**Scope:** `src/components/PackingCard.tsx` only, plus a new `src/components/__tests__/PackingCard.test.tsx`.
- Split `renderSection` into a primary (today) and secondary (tomorrow) treatment per SPEC §3 D2 / §7.1 (accent bar in `T.accent`, a11y props on the header).
- Collapse state: `useState`, default per Q6 (SPEC default: expanded).
- Loading gate over both hooks (D4) — spinner instead of `camp.empty` while loading.
- `useFocusEffect` re-reading check-off state (D1 hard requirement, done here so Phase 2 inherits it).
- No new strings. No count anywhere on the collapsed header.

**Stop conditions:**
- Jest: new test file green (all cases in TESTS.md Phase 1); `GamerDashboardScreen.test.tsx` still green.
- `npm run typecheck` 0 errors.
- Web (`npm run web`) and Android render both themes, he + en, RTL accent bar on the reading-start side, no `camp.empty` flash.

**Exit deliverables:**
- [ ] code
- [ ] `STATUS.md` row
- [ ] `SPEC_SYNC.md` Phase-1 rows (none expected beyond STATUS)
- [ ] `INTEGRATION_LEARNINGS.md` if surprised
- [ ] Values Check re-verified against the running card (no digits on the collapsed header)

---

## Phase 2 — ציוד tab hosts `PackingCard` (SPEC D1, D3, D4)

**Scope:** `src/screens/child/ChildBagPrepScreen.tsx` becomes the shell described in SPEC §7.2. Delete the timetable-only logic, the `bagPrep:` storage, the counter / mark-all / bag-ready footer, the day-off branch. Keep `previewChildId ?? profile?.id` resolution. Spinner gated on `useTimetable(...).loading`.
- **Chunk 2a (structural):** shell + card, interim title = existing `tabs.child.gear` ("ציוד") — not "סידור תיק למחר" over a card that says "היום". Does **not** wait on Q2. No shell-side hooks besides `useAuth`/`useMode`.
- **Chunk 2b (copy):** title per Adi's Q2 answer (+ Q5 card copy if Adi changes it). Waits on Q2.

**Stop conditions:**
- Noa's scenario (TESTS.md Phase 2) passes end-to-end from the tab bar on Android **and** web, both themes.
- A tick on the tab is visible on the HQ card and vice-versa **without relaunch** (shared storage key + focus-reload).
- `npm run i18n:check` clean (no orphan usages).

**Exit deliverables:** as Phase 1, plus `INTEGRATION_LEARNINGS.md:78` open item marked resolved (SPEC_SYNC).

---

## Phase 3 — i18n hygiene + docs (SPEC D5, §14)

**Scope:** delete the dead `bagPrep.*` keys listed in SPEC D5 from `he.json` + `en.json` (if Q4 = delete); apply the `SPEC_SYNC.md` doc rows; propose (not apply) the DECISIONS_LOG / GAP_ANALYSIS lines.

**Stop conditions:** `npm run i18n:check` clean; `npm test` green; no drift between SPEC §4 Behavior Contract and the running app.

---

## Closeout

- [ ] All phases passed per TESTS.md
- [ ] Canonical docs synced per SPEC_SYNC.md
- [ ] Sentry pre/post-deploy check per TESTS.md convention
- [ ] STATUS.md closeout checklist complete
- [ ] PR to `main` (Adi merges), branch deleted per Verify-Before-Delete protocol
