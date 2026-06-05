# Phase Prompts — child-login-stable-identity

Paste into Claude Code in VS Code. Branch `pkg/child-login-stable-identity` must exist first (CC creates it, don't push to main).

---

## Phase 0 — Investigation (plan only)

```
Read the following before doing anything:
1. /CLAUDE.md (repo root — project rules)
2. /docs/WORKFLOW.md (three-party loop, modes, Plan Mode rules)
3. /docs/BUFF_VALUES.md (three pillars + 9-question checklist — mandatory)
4. /docs/sessions/child-login-stable-identity/SPEC.md (target state for this package)
5. /docs/sessions/child-login-stable-identity/SPEC_SYNC.md (which canonical docs to update per phase)
6. /docs/BUFF_DECISIONS_LOG.md (recent decisions — top of file = most recent)
7. /docs/INTEGRATION_LEARNINGS.md (open FLAGs that may be relevant)
8. Relevant docs from /docs/ based on the task

You are in PLAN MODE. Do NOT make any code changes until I (Adi) explicitly say "approved, proceed".

Critical rules:
- No self-approved decisions. Surface ambiguity, wait for me.
- No architecture beyond scope. Flag refactor temptations and stop.
- Inspect actual code AND platform configs (app.json, eas.json, package.json, metro.config.js) before proposing.
- Plan ships chunk by chunk. Show diff, wait for approval, continue.
- Values Check: every feature passes the 9 questions in BUFF_VALUES.md before code is written.

Exit deliverables for every phase (same commit as the code):
- Update relevant canonical docs per SPEC_SYNC.md (this phase's row)
- Update STATUS.md with the phase row (state, date, commit, tests, learnings link)
- Append to /docs/INTEGRATION_LEARNINGS.md anything surprising
- Verify Values Check still passes against implemented behavior

NEVER unilaterally update:
- /docs/BUFF_DECISIONS_LOG.md
- /docs/BUFF_GAP_ANALYSIS.md
- /docs/BUFF_VALUES.md
If you think one needs updating, surface it as a question.

Commit messages: feat(child-login-stable-identity): description / fix(child-login-stable-identity): description / docs: description
Branch: pkg/child-login-stable-identity (create it — don't push to main)
Verification: use grep, not memory.

Now read the task below and produce a detailed plan.

TASK (Phase 0 — Investigation, NO code):
This is a bug. Child login creates a NEW auth user + NEW profile on every login instead of
reusing the child's existing profile. Confirmed in production (see SPEC.md → Evidence:
synthetic emails {random}@buff.app, real child profiles had user_id = NULL).

Investigate and report (do not fix yet):
1. grep for "@buff.app" and the auth call in the child-login path. Cite file:line.
   Is it a Supabase signUp with a generated email?
2. How does a device identify WHICH child is logging in? (PIN / family short_code / avatar pick /
   stored session). Cite the code.
3. Is profiles.user_id the canonical child↔auth link, or is something else used?
4. Answer SPEC.md "Open questions" 1-5 where the code makes it clear; escalate the rest to me.
5. Propose a fix approach for Phase 1 (resolve-existing-then-reuse). Note any schema change you
   think is needed and why — but do not write migrations yet.

Stop after the written finding + proposed approach. Wait for my "approved, proceed".
```

---

## Phase 1 — Fix login resolution

> Use the same preamble block as above (swap the TASK). Only run after Phase 0 approved.

```
TASK (Phase 1): Implement the approved fix so child login resolves to the existing child
profile and reuses its linked auth user. A child profile with user_id = NULL gets exactly ONE
auth user linked on first login, reused thereafter. Never create a new auth user / profile on
re-login of an existing child.

Stop condition (must demonstrate): on the emulator, logging in as the same test child twice does
NOT change `count(*) from auth.users` or `count(*) from profiles` for the test family, and the
child lands on the same data both times. Update PRD §auth + STATUS.md + INTEGRATION_LEARNINGS in
the same commit. Surface (do not write) any DECISIONS_LOG / GAP_ANALYSIS suggestion.
```

---

## Phase 2 — Guardrail

```
TASK (Phase 2): Add an idempotency guard (app-level and/or DB constraint, your proposal in plan)
so the old failure path cannot recreate a duplicate. Stop condition: re-running the original
repro path creates 0 new auth.users and 0 new profiles, and any blocked attempt is handled
gracefully (no crash). Update docs per SPEC_SYNC + STATUS.md.
```
