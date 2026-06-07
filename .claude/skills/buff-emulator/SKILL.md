---
name: buff-emulator
description: Acquire/check/release the single shared Android emulator + Metro dev server for BUFF. Use this skill BEFORE any session connects to the emulator, loads the app, runs the dev server, or deep-links the dev client — and whenever the user asks "is the emulator free", "connect to the emulator", "start Metro", "why is a new port opening every time", or to load/reload the app. It hands out a lease on the one emulator (one Metro, canonical port 8083), tells you if another session already holds it (BUSY), and frees it when you're done. The testing/release skills depend on it.
---

# BUFF Emulator Skill — the one front door to the shared emulator

> There is **one** physical emulator (`Pixel_7` / `emulator-5554`), so **one** Metro on **one**
> canonical port (**8083**). Every session that needs the emulator goes through this skill so it
> either gets a clean connection or is told the emulator is **TAKEN** by another session — instead
> of each session opening a new port and re-loading the app. See `docs/DEV_SERVER_LIFECYCLE.md`.

## When this skill applies

Activate at the **start of any turn that needs the emulator**, including before buff-testing /
buff-release device steps. Triggers:
- "connect to the emulator" / "load the app" / "reload the app on the emulator"
- "start Metro" / "is Metro up" / "why does a new port open every session"
- "is the emulator free / busy" / "release the emulator"
- any UI verification, regression run, or screenshot capture on the device

If the turn doesn't touch the emulator (pure code/docs work), **don't activate** — just answer.

## How to use it (always source first)

```bash
source .claude/skills/buff-testing/helpers.sh   # auto-sources the emulator engine + buff_* helpers
```

Then one of:

| Command | What it does |
|---|---|
| `metro_status` | FREE or TAKEN? by whom? lease minutes left? Metro up? emulator attached? |
| `metro_acquire` | **Take it for this session.** Reuses a healthy Metro for this worktree, or starts one (detached, port 8083, waits healthy). **Refuses (exit 2) if another session holds a fresh lease.** |
| `metro_wait [sec]` | Block-poll until free, then acquire (default 300s). This is "tell me when it frees up." |
| `metro_touch` | Extend your lease during a long session (active `buff_launch`/`buff_restart` calls also refresh it). |
| `metro_release` | Hand it back → **FREE** for the next session. Leaves Metro running (keep-alive). |
| `metro_steal` | Force-take even if another session holds it — only when you know that session is done. |
| `metro_down` | Actually stop Metro (teardown). |

## The protocol every session follows

1. **Acquire before touching the emulator:** `metro_acquire`.
2. **If it prints `⛔ EMULATOR BUSY`** → another session holds the lease. Do **not** stomp on it.
   - Tell the user it's busy (who holds it, minutes left).
   - Offer to `metro_wait` (block until free) or, only with the user's OK, `metro_steal`.
3. **Work** — `buff_launch` / `buff_restart` / `buff_*` helpers. These call `metro_acquire`
   internally, so they respect the lock and refresh your lease as you go.
4. **Release when done:** `metro_release` (marks FREE; Metro stays up so the next session reuses it fast).

## How the lock behaves (so you can explain it)

- **Lease, not a hard mutex.** Acquiring records `owner_id` (your worktree root) + an expiry
  (`METRO_LEASE_TTL`, default **10 min**). Active use refreshes it.
- **Another session asking while the lease is fresh → BUSY (refused).** That's the "emulator is
  taken" signal the user wanted.
- **Lease auto-expires.** A session that ended without `metro_release` can't block forever — after
  TTL the lease is stealable, so the next `metro_acquire` just takes it (no manual cleanup).
- **Source of truth:** the live `curl /status` probe decides "is Metro up"; the lock lives in the
  gitignored `.claude/metro.state.json` (human-readable; never branched on for health).
- **Directory-aware:** if a healthy Metro is serving a *different* worktree, acquiring restarts it
  for yours. Same worktree → instant reuse, zero restart.

## Edge cases

- **Emulator not running:** `metro_status` shows `Emulator: NOT connected`. Metro still comes up
  (host-side). Ask the user to start `Pixel_7` (Android Studio / `emulator -avd Pixel_7`) — this
  skill never auto-launches the AVD.
- **Port 8083 held by a non-Metro process:** the health string-match fails → the squatter is killed → fresh start.
- **App stuck on an old bundle:** `buff_restart` re-acquires (fast path) and re-deep-links the live bundle.
- **Two parallel worktree sessions:** the lease blocks the second one (BUSY); use `metro_wait` or coordinate.

Engine: `.claude/skills/buff-emulator/metro.sh`. Full reference: `docs/DEV_SERVER_LIFECYCLE.md`.
