# Automation Heartbeat (dead-man's switch)

**Origin:** Retro 2026-07-22. On 7/20–7/21, all four scheduled marketing runs died
silently at the Chrome-connection step — no post, no report, no push. Adi had zero
signal for two days. Rule extracted: *an automation that doesn't report its own
completion must be assumed dead; absence of a report must itself raise an alert.*

## The contract

Every scheduled / background automation (marketing runs, nightly tests, any future job):

1. **FIRST action** — before reading playbooks, before any browser/network dependency:
   ```powershell
   powershell -File scripts/heartbeat.ps1 -Task <task-id> -Phase START
   ```
2. **LAST action** — after the report/push was sent:
   ```powershell
   powershell -File scripts/heartbeat.ps1 -Task <task-id> -Phase END -Note "<one-line outcome>"
   ```
3. On a known failure path (e.g. Chrome unavailable): write `-Phase FAIL -Note "<reason>"`
   **and** send the failure PushNotification before stopping.

The log lives at `%USERPROFILE%\.buff\heartbeat.log` — outside the repo on purpose,
so it is shared across worktrees and never creates git noise. Format:
`<local ISO timestamp> <START|END|FAIL> <task-id> <note>`.

## The watchdog

Scheduled task `heartbeat-watchdog` (daily, 19:00) reads the log and pushes a Hebrew
alert if any enabled automation today has a START without END/FAIL, or no START at all.
The watchdog writes its own heartbeat too.

Known limitation (v1): if the watchdog itself doesn't run (computer off, app closed),
there is no alert. Scheduled tasks run when the Claude app is open; a day with no
watchdog line in the log is itself a signal worth checking.

## Adding a new automation

1. Add the START/END/FAIL lines to its prompt per the contract above.
2. Add its task-id to the expected list in the `heartbeat-watchdog` task prompt.
