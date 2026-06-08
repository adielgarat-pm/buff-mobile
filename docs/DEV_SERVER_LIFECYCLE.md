# Dev Server Lifecycle — Emulator/Metro Resource Manager

**TL;DR:** There is **one** physical emulator (`Pixel_7` / `emulator-5554`), so **one** Metro on
**one** canonical port (**8083**), guarded by a **lease lock**. Every Claude Code session that needs
the emulator goes through the **buff-emulator skill**, which either hands it a clean connection
(reusing a running Metro) or tells it the emulator is **TAKEN** by another session — instead of each
session opening a new port and re-loading the app.

Engine: [`.claude/skills/buff-emulator/metro.sh`](../.claude/skills/buff-emulator/metro.sh) ·
Front door: [`.claude/skills/buff-emulator/SKILL.md`](../.claude/skills/buff-emulator/SKILL.md)
(auto-sourced by buff-testing's `helpers.sh`).

---

## Commands

```bash
source .claude/skills/buff-testing/helpers.sh   # pulls in the engine + the buff_* helpers

metro_status     # FREE or TAKEN? by whom? lease minutes left? Metro up? emulator attached?
metro_acquire    # take it for this session — or refuse (⛔ BUSY) if another session holds it
metro_wait [sec] # block-poll until free, then acquire (default 300s)  ["notify when it frees"]
metro_touch      # extend my lease during a long session
metro_release    # give it back (FREE) — leaves Metro running for the next session
metro_steal      # force-take even if another session holds a fresh lease
metro_down       # actually stop Metro (teardown)
```

In practice you type `metro_acquire` at the start and `metro_release` at the end. `buff_launch`
(and `buff_restart`) call `metro_acquire` for you, so they respect the lock and refresh your lease.

---

## The lease lock (what "TAKEN / FREE" means)

- **Acquiring** records `owner_id` (your worktree root) + an expiry (`METRO_LEASE_TTL`, default
  **10 min**). Active use (`buff_launch`/`metro_touch`) refreshes it.
- **Another session asking while your lease is fresh → `⛔ EMULATOR BUSY` (refused, exit 2).**
  That is the "emulator is taken" signal. The blocked session should `metro_wait`, retry, or — only
  if the holder is truly done — `metro_steal`.
- **Leases auto-expire.** A session that ended without `metro_release` can't block forever: after
  TTL the lease is stealable and the next `metro_acquire` simply takes it. No manual cleanup.
- **Override:** `metro_steal` ignores a fresh lease; `metro_down` stops Metro and clears the lock.

## Reuse decision (directory-aware)

Once you're allowed to take it, `metro_acquire` → `_metro_up`:

1. **Live health probe** `curl /status` on :8083 — the **source of truth** for "is Metro up".
   - **Healthy + serving THIS worktree (or unknown)** → reuse, zero restart (the fast path).
   - **Healthy + serving a DIFFERENT worktree** → restart Metro for the current worktree.
2. **Not healthy** → kill any stale/non-Metro squatter on :8083, start a fresh Metro **detached**,
   wait until healthy (~up to 50s).

The state file is only a hint — no code branches on it for health, so a stale file can't mislead.

---

## State file — `.claude/metro.state.json` (gitignored)

The lock record + human-readable status. Written *after* decisions; read by you / `metro_status`.

```json
{
  "port": 8083,
  "status": "taken",                 // taken | free | down
  "cwd": "C:/Users/adiel/buff-mobile/.claude/worktrees/<slug>",
  "owner_id": "C:/.../worktrees/<slug>",   // worktree root = session identity
  "owner_label": "<slug>",                 // or $CC_SESSION_LABEL
  "acquired_at_epoch": 1749272846,
  "expires_at_epoch": 1749274646,          // acquired + METRO_LEASE_TTL
  "pid": "27660",
  "updated_at": "2026-06-07T03:47:26Z",
  "healthy": true
}
```

Tune with env vars before sourcing: `METRO_LEASE_TTL` (lease seconds), `CC_SESSION_LABEL`
(owner name), `METRO_PORT` (canonical port).

---

## Why Metro is started detached

`metro.sh` spawns Metro with `nohup … < /dev/null > metro.log 2>&1 &` inside a `( … )` subshell plus
`disown`. That detaches it from the controlling terminal and the job table, so it **survives the
bash call returning AND the CC session ending** — which is what makes cross-session reuse possible.
Persistence does **not** depend on the Bash tool's `run_in_background`; a plain developer terminal or
the nightly PowerShell launcher gets the same durability. Logs go to `.claude/metro.log`.

---

## Troubleshooting

| Symptom | What happens / what to do |
|---|---|
| **`⛔ EMULATOR BUSY`** | Another session holds a fresh lease. `metro_wait` to block until free, or coordinate; `metro_steal` only if you're sure that session is done. |
| **Emulator not running** | `metro_status` shows `Emulator: NOT connected`; Metro still comes up. Start `Pixel_7` yourself (Android Studio / `emulator -avd Pixel_7`). The manager never auto-launches the AVD. |
| **Port 8083 held by a non-Metro process** | `/status` match fails → squatter PID found via `netstat` → killed → fresh start. |
| **App stuck on an old/dead bundle** | `buff_restart` → re-acquires (fast path) → re-deep-links the live bundle. |
| **Stuck lease after a crashed session** | Wait out the TTL (auto-stealable), or `metro_steal` / `metro_down` to reset now. |
| **Metro won't become healthy** | `metro_up` reports `FAILED … see .claude/metro.log`. Check that log. |

**Not built (by design):** a multi-port pool / per-worktree concurrent Metros. One physical emulator
⇒ one Metro on one port ⇒ a lease lock is the right model, not parallel servers.
