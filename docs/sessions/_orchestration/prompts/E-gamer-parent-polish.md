# Session E — `fix/gamer-parent-polish`

> Open a fresh CC session and paste the block below. Covers IN-2026-05-29-07 + IN-2026-05-29-09.
> No dependency on other sessions. Smallest of the set — two quick UI fixes.

```
Branch: fix/gamer-parent-polish. Start in Plan Mode. Two small, unrelated UI fixes.

Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-07 and -09 first.

1. (IN-07) Parent Tasks view false-affordance: ParentTasksScreen.tsx:157-160 renders an empty
   round checkbox (styles.checkCircle :192) inside a non-pressable View — looks tappable, isn't
   (the parent can't complete tasks). Change it to a status-only glyph: show the filled ✓ only
   when task.completed, and a neutral non-checkbox indicator (or nothing) otherwise. Leave the
   live checkbox in the CHILD interface / view-as-child untouched (GamerTasksScreen check-circle
   :285 and PhaseTaskCard :81 are correctly interactive there).

2. (IN-09) View-as-child greeting reads "היי תצוגה": GamerDashboardScreen.tsx:241 shows
   gamerDashboard.previewName ("תצוגה") when isChildPreview. Adi wants the child's REAL name in
   preview too (the "Parent Preview — tap to exit" banner already signals preview) AND a smaller
   greetingName font (:439 is fontSize 28). NOTE: this reverses the intentional preview-name swap
   logged in IN-2026-05-27-01 — Adi confirmed she wants it (2026-05-29). Propose a one-line
   DECISIONS_LOG entry for her rather than flipping silently. Use the previewed child's name
   (ModeContext.previewChildId) if available, else profile.display_name.

Verify via npm run web + screenshots. Branch + PR, no direct main.
```
