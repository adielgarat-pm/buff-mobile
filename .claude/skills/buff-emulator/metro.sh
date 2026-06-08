# BUFF emulator/Metro resource manager — the engine behind the buff-emulator skill.
# Source it (buff-testing/helpers.sh sources it for you), then use the public API below.
#
#   metro_status      # is it FREE or TAKEN? by whom? lease remaining? emulator attached?
#   metro_acquire     # take the emulator+Metro for THIS session — or refuse if another holds it
#   metro_wait [sec]  # block-poll until free, then acquire (default 300s)  ["notify when it changes"]
#   metro_touch       # extend my lease (call during long sessions to keep the hold)
#   metro_release     # give it back (mark FREE) — leaves Metro running for the next session
#   metro_steal       # force-take even if another session holds a fresh lease
#   metro_down        # actually kill Metro (teardown)
#
# Model: ONE emulator -> ONE Metro -> ONE canonical port (8083), guarded by a LEASE LOCK.
# A session acquires a lease; another session that asks while the lease is fresh is told BUSY.
# Leases auto-expire (TTL) so a session that ended without releasing can't block forever.
# The live `curl /status` probe is the SOURCE OF TRUTH for "is Metro up"; metro.state.json
# is the lock record + human-readable hint. See docs/DEV_SERVER_LIFECYCLE.md.

# --- canonical constants ------------------------------------------------------

export METRO_PORT="${METRO_PORT:-8083}"                  # canonical, overridable, never drifts
export METRO_HOST_URL="http://10.0.2.2:${METRO_PORT}"    # what the EMULATOR uses (gateway IP)
export METRO_LOCAL_URL="http://localhost:${METRO_PORT}"  # what the HOST uses for health checks
export METRO_STATE="C:/Users/adiel/buff-mobile/.claude/metro.state.json"
export METRO_LOG="C:/Users/adiel/buff-mobile/.claude/metro.log"
export METRO_LEASE_TTL="${METRO_LEASE_TTL:-600}"         # seconds a lease stays valid w/o a touch (10m)

# --- low-level helpers (internal) ---------------------------------------------

# Worktree root of the current session = this session's identity. Falls back to PWD.
_metro_serve_dir() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

# A short human label for the current session (override with CC_SESSION_LABEL).
_metro_label() {
  echo "${CC_SESSION_LABEL:-$(basename "$(_metro_serve_dir)")}"
}

# 0 if a REAL Metro answers on the canonical port (string match, not just any listener).
metro_healthy() {
  curl -s -m 2 "${METRO_LOCAL_URL}/status" 2>/dev/null | grep -q "packager-status:running"
}

# Echo the LISTENING pid holding the canonical port (empty if none).
metro_pid_on_port() {
  netstat -ano 2>/dev/null \
    | grep -E "[:.]${METRO_PORT}[[:space:]]" \
    | grep -i "LISTENING" \
    | awk '{print $NF}' | head -1
}

# Kill whatever holds the canonical port (stale Metro or non-Metro squatter).
metro_kill_port() {
  local pid; pid="$(metro_pid_on_port)"
  if [ -n "$pid" ]; then
    MSYS_NO_PATHCONV=1 taskkill /PID "$pid" /F >/dev/null 2>&1 || true
  fi
}

# Read a field from the state file (string or number; empty if missing).
_metro_field() {
  [ -f "${METRO_STATE}" ] || return 0
  grep -oE "\"$1\"[[:space:]]*:[[:space:]]*[^,}]*" "${METRO_STATE}" \
    | head -1 \
    | sed -E "s/\"$1\"[[:space:]]*:[[:space:]]*//; s/^\"//; s/\"[[:space:]]*$//; s/[[:space:]]*$//"
}

# Start Metro DETACHED from $1 so it survives this call AND the CC session
# (nohup + redirected stdio + subshell + disown = no SIGHUP, off the job table).
_metro_spawn() {
  local serve_dir="$1"
  ( cd "$serve_dir" && nohup npx expo start --port "${METRO_PORT}" --dev-client \
      > "${METRO_LOG}" 2>&1 < /dev/null & ) && disown 2>/dev/null || true
}

# Poll until healthy (~2s * tries; default 25 ≈ 50s).
_metro_wait_healthy() {
  local tries="${1:-25}"
  while [ "$tries" -gt 0 ]; do
    metro_healthy && return 0
    sleep 2; tries=$((tries-1))
  done
  return 1
}

# Write the lock record / hint. Args: status [serve_dir]
#   status=taken -> records owner = current session + a fresh lease (now .. now+TTL)
#   status=free|down -> clears owner + lease
_metro_write_state() {
  local status="$1" serve_dir="${2:-$(_metro_serve_dir)}"
  local now_epoch now_iso pid label owner_id acquired expires
  now_epoch="$(date +%s)"; now_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  pid="$(metro_pid_on_port)"
  if [ "$status" = "taken" ]; then
    label="$(_metro_label)"; owner_id="$serve_dir"
    acquired="$now_epoch"; expires="$((now_epoch + METRO_LEASE_TTL))"
  else
    label=""; owner_id=""; acquired=0; expires=0
  fi
  local healthy; metro_healthy && healthy=true || healthy=false
  cat > "${METRO_STATE}" <<EOF
{
  "port": ${METRO_PORT},
  "status": "${status}",
  "cwd": "${serve_dir}",
  "owner_id": "${owner_id}",
  "owner_label": "${label}",
  "acquired_at_epoch": ${acquired},
  "expires_at_epoch": ${expires},
  "pid": "${pid}",
  "updated_at": "${now_iso}",
  "healthy": ${healthy}
}
EOF
}

# Is the current lease held by SOMEONE ELSE and still fresh? 0 = yes (blocked).
# Echoes nothing; sets globals _LOCK_OWNER / _LOCK_REMAIN for callers.
_metro_lock_blocks_me() {
  _LOCK_OWNER=""; _LOCK_REMAIN=0
  local status owner_id expires now me
  status="$(_metro_field status)"
  [ "$status" = "taken" ] || return 1                 # free/down/absent -> not blocked
  owner_id="$(_metro_field owner_id)"
  me="$(_metro_serve_dir)"
  [ "$owner_id" = "$me" ] && return 1                  # it's mine -> not blocked
  expires="$(_metro_field expires_at_epoch)"; expires="${expires:-0}"
  now="$(date +%s)"
  if [ "$now" -lt "$expires" ]; then
    _LOCK_OWNER="$(_metro_field owner_label) [$owner_id]"
    _LOCK_REMAIN="$(( (expires - now + 59) / 60 ))"    # minutes, rounded up
    return 0                                           # blocked
  fi
  return 1                                             # lease expired -> stealable
}

# Ensure a healthy Metro for the CURRENT worktree (fast path = reuse). Internal.
_metro_up() {
  local serve_dir; serve_dir="$(_metro_serve_dir)"
  if metro_healthy; then
    local running_dir; running_dir="$(_metro_field cwd)"
    if [ -z "$running_dir" ] || [ "$running_dir" = "$serve_dir" ]; then
      echo "metro: reusing healthy instance on :${METRO_PORT} (fast path) — ${serve_dir}"
      return 0
    fi
    echo "metro: healthy Metro serves a different dir (${running_dir}); restarting for ${serve_dir}…"
    metro_kill_port; sleep 1
  else
    local pid; pid="$(metro_pid_on_port)"
    if [ -n "$pid" ]; then echo "metro: stale/non-Metro pid $pid on :${METRO_PORT} — killing"; metro_kill_port; sleep 1; fi
  fi
  echo "metro: starting fresh (detached) from ${serve_dir} …"
  export METRO_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  _metro_spawn "$serve_dir"
  if _metro_wait_healthy 25; then echo "metro: healthy on :${METRO_PORT}"; return 0; fi
  echo "metro: FAILED to become healthy — see ${METRO_LOG}"; return 1
}

# --- public API ---------------------------------------------------------------

# Take the emulator+Metro for THIS session. Refuses (exit 2) if another session
# holds a fresh lease — prints who and for how long, plus how to wait or steal.
metro_acquire() {
  if _metro_lock_blocks_me; then
    echo "⛔ EMULATOR BUSY — held by ${_LOCK_OWNER}, lease ~${_LOCK_REMAIN} min left."
    echo "   • wait for it:  metro_wait        (blocks until free, then takes it)"
    echo "   • check again:  metro_status"
    echo "   • override:     metro_steal       (only if you're sure that session is done)"
    return 2
  fi
  _metro_up || return 1
  _metro_write_state "taken"
  echo "✅ emulator acquired by $(_metro_label) — lease ${METRO_LEASE_TTL}s (metro_touch to extend)"
}

# Block-poll until the emulator is free (or already mine), then acquire.
# This is the "update me when it changes" path. Arg: timeout seconds (default 300).
metro_wait() {
  local timeout="${1:-300}" waited=0
  while _metro_lock_blocks_me; do
    if [ "$waited" -ge "$timeout" ]; then
      echo "⛔ still BUSY after ${timeout}s — held by ${_LOCK_OWNER}. Try later or metro_steal."
      return 2
    fi
    echo "… emulator busy (${_LOCK_OWNER}); waiting ${waited}/${timeout}s"
    sleep 10; waited=$((waited + 10))
  done
  metro_acquire
}

# Extend my lease (keeps the hold during a long session).
metro_touch() {
  local owner_id me; owner_id="$(_metro_field owner_id)"; me="$(_metro_serve_dir)"
  if [ "$(_metro_field status)" = "taken" ] && [ "$owner_id" != "$me" ] && [ -n "$owner_id" ]; then
    echo "metro_touch: lease is held by another session ($(_metro_field owner_label)) — not extending. Use metro_steal to take over."
    return 2
  fi
  _metro_write_state "taken"
  echo "metro: lease extended ${METRO_LEASE_TTL}s for $(_metro_label)"
}

# Give the emulator back (mark FREE) — leaves Metro running for the next session.
metro_release() {
  _metro_write_state "free"
  echo "metro: released — FREE for the next session (Metro left running; metro_down to stop it)"
}

# Force-take even if another session holds a fresh lease.
metro_steal() {
  echo "metro: stealing the lease (override)…"
  _metro_up || return 1
  _metro_write_state "taken"
  echo "✅ emulator force-acquired by $(_metro_label)"
}

# Actually stop Metro (teardown) and clear the lock.
metro_down() {
  metro_kill_port
  _metro_write_state "down"
  echo "metro: stopped on :${METRO_PORT}"
}

# Print: lock status (FREE/TAKEN + owner + remaining), Metro up/down, emulator line.
metro_status() {
  local status owner expires now remain
  status="$(_metro_field status)"; status="${status:-none}"
  if [ "$status" = "taken" ]; then
    expires="$(_metro_field expires_at_epoch)"; expires="${expires:-0}"; now="$(date +%s)"
    if [ "$now" -lt "$expires" ]; then
      remain="$(( (expires - now + 59) / 60 ))"
      echo "Lock:     TAKEN by $(_metro_field owner_label) [$(_metro_field owner_id)] — ~${remain} min left"
    else
      echo "Lock:     TAKEN (lease EXPIRED — stealable) by $(_metro_field owner_label)"
    fi
  elif [ "$status" = "free" ]; then
    echo "Lock:     FREE"
  else
    echo "Lock:     ${status} (no active lease)"
  fi
  if metro_healthy; then
    echo "Metro:    UP on :${METRO_PORT}  (${METRO_HOST_URL})"
  else
    echo "Metro:    DOWN on :${METRO_PORT}"
  fi
  local emu
  emu="$("${ADB:-adb}" devices 2>/dev/null | grep -E "emulator-[0-9]+[[:space:]]+device")"
  if [ -n "$emu" ]; then
    echo "Emulator: ${emu}"
  else
    echo "Emulator: NOT connected (start Pixel_7 manually / via Android Studio)"
  fi
}
