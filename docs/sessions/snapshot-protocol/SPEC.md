# snapshot-protocol — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

---

## Capabilities & Bottlenecks

> Capability Check — authored by Claude.ai at package start.

### מה Claude.ai (אני) יכולה
- Authored all content verbatim: CLAUDE.md section, WORKFLOW.md section, INTEGRATION_LEARNINGS.md lesson

### מה Claude Code (CC) יעשה
- Precise insertion of verbatim content into 3 target files (no authorship — exact copy)
- Scaffold session folder from `_template/`
- Run grep verification gates before each commit
- Fill STATUS.md at closeout

### מה Adi חייבת לעשות בעצמה
- Review each phase diff before approving next phase
- Confirm merge on GitHub after push
- Run local cleanup (branch delete) after merge confirmation

### צוואר בקבוק / נקודות עצירה צפויות
- CC must not paraphrase — all content is given verbatim in the task prompt
- Verify gates must pass before every commit — stop on failure, surface to Adi

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. חייבים לעבור על כולן לפני שCC כותב קוד.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   N/A — docs-only methodology change, no child-facing feature.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   N/A — docs-only methodology change.
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?**
   N/A — docs-only methodology change.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   N/A — docs-only methodology change.
2. **אם הילד נכשל — האם התגובה היא empathy או pressure?**
   N/A — docs-only methodology change.
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?**
   N/A — docs-only methodology change.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   Indirect pass — a tighter snapshot protocol makes the dev process more self-correcting, reducing dependence on Adi's manual oversight each session.
2. **האם לילד יש קול בפיצ'ר?**
   N/A — docs-only methodology change.
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?**
   The protocol should become habit and eventually implicit — which is the goal of any good process rule.

**Values Check Pass:** [x] כן — Pillars 1 & 2 N/A (docs-only), Pillar 3 indirect pass.

---

## Goals
- Add Read-only Snapshot Protocol to `CLAUDE.md`
- Add Snapshot Template + Verification Gate to `docs/WORKFLOW.md`
- Record 2026-05-03 incident in `docs/INTEGRATION_LEARNINGS.md` under new `## Lessons` section
- Zero changes to `src/`, `app/`, or any code file

## Non-goals
- No code changes
- No DB schema changes
- No UI changes
- No new npm dependencies

## Behavior Contract

After this package closes:
- Any CC reading `CLAUDE.md` will encounter the Snapshot Protocol before taking any snapshot task
- Any Claude.ai using `WORKFLOW.md` will have a formal Snapshot Prompt Template and a binding Verification Gate
- The 2026-05-03 incident is canonically recorded as a reference for future process decisions

## Out of Scope
- Enforcing the protocol in code (future consideration)
- Modifying any existing WORKFLOW.md sections
- Adding new FLAGs to INTEGRATION_LEARNINGS.md (the lesson is not a FLAG)
