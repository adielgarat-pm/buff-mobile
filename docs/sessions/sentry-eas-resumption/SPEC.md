# Sentry + EAS Resumption — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**נוצר:** 2026-05-25
**מקור:** [linked-gliding-bear.md plan](../../../../../.claude/plans/linked-gliding-bear.md), approved by Adi 2026-05-25.
**הקשר היסטורי:** RESUMPTION_NOTES_2026-05-16.md (only in git history at b5c723e — not on main).

---

## Why this exists

ב-2026-05-16 שני packages עצרו mid-Phase-4 לפני merge:
- `pkg/expo-health-and-eas-android` (Phases 0-3 done, AAB v8 built)
- `pkg/sentry-crash-monitoring` (Phases 0-3 done, AAB v9 IN_PROGRESS)

בין 2026-05-16 ל-2026-05-25 ה-branches נמחקו בלי שmerge קרה ל-main. **כל הקוד והdocs אבדו.** ה-diagnosis ב-2026-05-25 אישר:

- `app.json`, `eas.json`, `App.tsx`, `package.json` על main בלי Sentry/EAS
- Session folders נעלמו
- `D-2026-05-16-01` + `D-2026-05-16-02` חסרים מ-DECISIONS_LOG
- `expo-doctor` עדיין 4 כשלים
- **Doc drift:** F-2026-05-05-01 ב-INTEGRATION_LEARNINGS מסומן **Resolved** אבל הקוד לא תוקן — תיקון doc drift נדרש

מה שכן שרד (ב-EAS/Sentry cloud, לא בקוד): EAS keystore `dG1dqozJHO`, EAS secret `SENTRY_AUTH_TOKEN` (id `da05ed42`), Sentry DSN, Play Console listing for `com.buffapp.mobile`. **CC יאמת ב-Phase 2.**

**Goal:** Ship a fresh production AAB (v10) with Sentry crash monitoring to Play Console Internal Testing for the 2026-06-01 beta launch (WhatsApp distribution).

---

## Capabilities & Bottlenecks

### מה Claude Code (CC) יעשה
- Stash WIP מ-pkg/timetable-review-day-select לפני branch
- Branch fresh from main
- Edit `app.json`, `package.json`, `eas.json`, `App.tsx`
- `npx expo install ...`, `npx expo-doctor`, `npx tsc --noEmit`
- `npx eas project:info`, `npx eas secret:list` (verification, read-only)
- `npx eas build --platform android --profile production` (trigger cloud build)
- Monitor build via `npx eas build:view`
- Update canonical docs at phase exits

### מה Adi חייבת בעצמה (account-bound)
- אישור באבן-דרך אחרי כל chunk (per CLAUDE.md)
- Sentry DSN — supply if Phase 2 verification reveals it's missing/rotated
- Play Console UI (Phase 5): create Internal Testing release, upload AAB, add testers, roll out
- Final install + smoke test on physical device

### צוואר בקבוק / נקודות עצירה צפויות
- **EAS secret may be missing** — Phase 2.1 verifies `SENTRY_AUTH_TOKEN` (id `da05ed42`). If missing → STOP, remediation list for Adi.
- **`babel-preset-expo` major mismatch** — main has ^55.0.15 but SDK 54. Downgrade is risky; CC surfaces before action (Chunk 1.3).
- **EAS keystore fingerprint mismatch** at Phase 5 upload — Play Console listing was set up against the EAS-managed keystore on 2026-05-16. If Play Console expects a different fingerprint → STOP, restore via "Upload existing keystore to EAS" path.
- **Source-map upload silent failure** — Sentry source maps require both the secret AND the eas.json `SENTRY_ORG`/`SENTRY_PROJECT` env vars. Phase 4.3 grep on build logs catches this.

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. Infrastructure work — no user-facing surface — but per WORKFLOW the questions get answers, not skips.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   N/A — invisible to child. Crash monitoring is a developer tool.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   N/A — no reward mechanic touched.
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?**
   N/A — no child-facing surface.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   No copy changes in this package.
2. **אם הילד נכשל — האם התגובה היא empathy או pressure?**
   N/A — no failure path created.
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?**
   No BUDDY change.

**Privacy concern (Pillar 2 indirect):** Sentry captures device info + breadcrumbs by default. BUFF is a children's app — we override defaults to scrub PII before any event leaves the device. `beforeSend` strips `event.user.email`, `event.user.username`, `event.user.ip_address`. `beforeBreadcrumb` regex-redacts emails from breadcrumb messages. Verified in Phase 5 by inspecting a real captured event.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   Neutral. Sentry is dev infrastructure.
2. **האם לילד יש קול בפיצ'ר?**
   N/A — not child-facing.
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?**
   **Yes — observability is permanent infrastructure.** Sentry vendor lock-in is low; swap to Crashlytics or GlitchTip is a 1-day project.

**Values Check Pass:** [x] כן / [ ] לא — no question fails. Proceed.

---

## Goals

1. Any unhandled error / crash in BUFF on a tester device produces a Sentry event within 60s.
2. The event's stack trace is symbolicated to original TypeScript source line numbers (source maps uploaded as part of EAS Build).
3. Breadcrumbs leading to the crash are visible — navigation events, console.error, last few user actions.
4. No PII (emails, child names, IP addresses) appears in any event field — verified manually by inspecting a real captured event.
5. Email alert to `adi@buffadhd.com` fires on the first occurrence of any new crash signature.
6. `expo-doctor` returns 17/17 ✓ on main (closes F-2026-05-05-01 properly + corrects doc drift).
7. A fresh production AAB (v10) is in Play Console Internal Testing for `com.buffapp.mobile`, installable by testers via the internal-testing link.
8. Adi installs v10 and reaches the dashboard.

## Non-goals (out of scope)

- iOS Sentry config (no iOS profile yet)
- iOS build profile or App Store submission
- EAS Submit automation (Google Play service account JSON) — deferred to future package
- Sentry Session Replay (paid feature)
- Performance monitoring tuning (defaults are fine)
- Migrating existing `console.error` paths to explicit `Sentry.captureException` (per-feature work)
- Server-side Sentry for Supabase Edge Functions
- Replacing Play Console Android Vitals (Sentry sits alongside)
- Adding Sentry to dev builds (intentionally DSN-less in dev)
- Closed Testing track (defer to post-1/6 package)
- Resuming pkg/timetable-review-day-select WIP (stashed; separate concern)
- Resuming anchor-recovery WIP (AnchorRecoveryToast/useAnchorRecoveryActions — stashed; separate concern)

---

## Behavior Contract

After this package closes:

- `npx expo-doctor` on main returns 17/17 ✓
- `npx tsc --noEmit` on main is clean
- `@sentry/react-native` is initialized at app startup in production builds; init is a no-op in dev (no DSN set)
- Source maps for production builds are uploaded to Sentry as part of EAS Build
- `App.tsx` is wrapped with `Sentry.wrap()` for component error boundary
- `beforeSend` and `beforeBreadcrumb` hooks scrub PII before any event leaves the device
- `eas.json` has `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` set for `preview` + `production` profiles (NOT dev)
- EAS project secret `SENTRY_AUTH_TOKEN` is set for source-map upload
- v10 (or higher) AAB is live in Play Console Internal Testing for `com.buffapp.mobile`
- A test crash triggered by Adi on v10 appears in Sentry within 60s with readable stack trace
- F-2026-05-05-01 in INTEGRATION_LEARNINGS is accurately marked Resolved with the 2026-05-25 commit reference

## Schema Changes

None. This package does not touch Supabase.

## Prompts Changes

None.

## API / Route Changes

None — no `src/` code changes beyond App.tsx Sentry wrap.

## UI Changes

None visible to users. Optional hidden dev-only "force crash" affordance for Phase 5 verification, removed before package close.

---

## Open Questions

> CC will surface these at chunk time; none are blocking SPEC approval.

1. **`babel-preset-expo` major version handling** — main has ^55.0.15; SDK 54 expects ~54.0.10. Downgrade vs SDK-upgrade decision at Chunk 1.3.
2. **Sentry account / DSN / token freshness** — verified in Phase 2.1 via EAS CLI. If anything missing/rotated, remediation surfaces to Adi.
3. **Play Console listing fingerprint** — confirmed by 2026-05-16 v8 attempt. Phase 5 upload will validate.

## Out of Scope (explicit re-statement)

- iOS Sentry / iOS build / Apple Developer account
- EAS Submit
- Any code under `src/` (except App.tsx Sentry wrap)
- Any schema changes under `supabase/migrations`
- New Play Console tracks (closed/open/production)
- Touching pkg/timetable-review-day-select or anchor-recovery WIP

---

## Branch hygiene (already done in Phase 0)

- WIP on `pkg/timetable-review-day-select` was stashed: `stash@{0}: On pkg/timetable-review-day-select: WIP: AnchorRecoveryToast + parser changes on pkg/timetable-split-groups (2026-05-25)`
- This branch (`pkg/sentry-eas-resumption`) is fresh from main commit `2d701cb` (post-PR #79 merge)
- To resume the stashed WIP later: `git stash pop stash@{0}` after this package merges
