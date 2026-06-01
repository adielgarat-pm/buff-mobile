# STATUS — `pkg/per-child-language`

Branch: `pkg/per-child-language` (off `main` @ `afddc9d`, which contains PR #120).

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| Phase 1 — per-child language | ✅ code complete, pending review/merge + Hat-4 | 2026-05-29 | _(this commit)_ | tsc ✓ · jest 271/271 ✓ · i18n:check ✓ · check:i18n-access ✓ | [IN-2026-05-29-07](../../INTEGRATION_LEARNINGS.md) |

## What shipped (Phase 1, per SPEC §7)

1. **`resolveChildLang(child, deviceLang)`** helper in `src/lib/i18nString.ts` (stored `pro_settings.language` → name-script → device). Unit-tested.
2. **Onboarding** (`UStep5_Preview.tsx`) writes `pro_settings.language` at profile insert and bakes task titles from the stored value (via `resolveChildLang`), not `i18n.language`.
3. **EditChild** language toggle (עברית / English) writing `pro_settings.language`, with a neutral Phase-1 note (`editChild.language*`, en+he).
4. **Child's own device** — `ChildLanguageBinder` in `App.tsx` hydrates language from the child profile (role==='child'), restart-once on RTL direction change. Parent/device path untouched.
5. **View-as-Child** — `ModeContext` switches i18n strings to the previewed child's language on enter (strings-only, no `forceRTL`/restart — OQ-1), restores device language on exit.
6. **ChildSettings** language picker hidden for child viewers (OQ-2a).

## Deferred / not done

- **Backfill (SPEC §7.6 / OQ-3):** SKIPPED by Adi (2026-05-29). Dry-run found Itay/Emi/Leia have English-only task titles → title-inference would mis-set them `en`, contradicting SPEC §6.3's "Itay→he" expectation. No DB write made; existing children resolve via name-script/device at render. See IN-2026-05-29-07.
- **Phase 2 — `pkg/bilingual-tasks`:** make `tasks.title` bilingual so a language flip retro-updates existing task names. Separate, optional (SPEC §7).

## Values Check (verified against implemented behavior)

- **Pillar 1 (Intrinsic):** language is a comprehension/accessibility setting, no reward mechanic. ✅
- **Pillar 2 (Positive coaching):** EditChild toggle + note copy is neutral/informative (no "fix the language"); child-mode picker hidden without shaming. ✅
- **Pillar 3 (Independence):** MVP keeps language parent-controlled (OQ-2a); child-self-control revisit logged as a follow-up. ✅

## Hat-4 for Adi (real device)

The RTL restart on a child's OWN ChildJoin device (persistent child session) — the one flow the emulator can't fully exercise.
