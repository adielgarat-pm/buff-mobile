#!/usr/bin/env bash
#
# BUFF onboarding — Android E2E (Hat-3, adb-driven).
#
# Walks the parent onboarding flow (UStep1 → UStep8) on the emulator by tapping
# elements via their resource-id. React Native maps `testID` → Android
# `resource-id`, so the SAME ids used by the web Playwright suite work here
# (onb1-child-name, onb4-continue, …). Language-independent.
#
# PRECONDITIONS (see e2e/README.md + buff-emulator / buff-testing skills):
#   1. Emulator up + Metro serving the app:
#        source .claude/skills/buff-testing/helpers.sh && metro_acquire
#   2. App showing onboarding Step 1 as a FRESH, never-onboarded parent
#      (per MASTER_TEST_PLAYBOOK §"never reuse parent-fresh-N"). Onboarding
#      writes to Supabase — the emulator needs network to the backend.
#
# USAGE:  bash e2e/android/onboarding.android.sh
# ENV:    ADB_SERIAL (optional) — target a specific device (default: only device).
set -euo pipefail

ADB=(adb)
[[ -n "${ADB_SERIAL:-}" ]] && ADB=(adb -s "$ADB_SERIAL")

DUMP=/sdcard/window_dump.xml
LOCAL_DUMP="$(mktemp)"
trap 'rm -f "$LOCAL_DUMP"' EXIT

log() { printf '\n[onboarding-android] %s\n' "$*"; }

# Refresh the UI hierarchy XML to a local file.
refresh_ui() {
  "${ADB[@]}" shell uiautomator dump "$DUMP" >/dev/null 2>&1 || true
  "${ADB[@]}" pull "$DUMP" "$LOCAL_DUMP" >/dev/null 2>&1
}

# Echo "cx cy" (tap center) for a node whose resource-id ends with the given id,
# or nothing if absent. Parses bounds="[x1,y1][x2,y2]" from the dumped XML.
center_of() {
  local rid="$1"
  python3 - "$LOCAL_DUMP" "$rid" <<'PY'
import sys, re
xml = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
rid = sys.argv[2]
# Match any node whose resource-id equals or ends with the testID.
for m in re.finditer(r'<node[^>]*resource-id="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
    val, x1, y1, x2, y2 = m.group(1), *map(int, m.groups()[1:])
    if val == rid or val.endswith('/' + rid) or val.endswith(rid):
        print((x1 + x2) // 2, (y1 + y2) // 2)
        break
PY
}

# Poll for a resource-id (up to ~20s).
wait_id() {
  local rid="$1" tries="${2:-40}"
  for ((i=0; i<tries; i++)); do
    refresh_ui
    if [[ -n "$(center_of "$rid")" ]]; then return 0; fi
    sleep 0.5
  done
  log "TIMEOUT waiting for '$rid'"; "${ADB[@]}" exec-out screencap -p > "e2e/android/fail-$rid.png" 2>/dev/null || true
  return 1
}

tap_id() {
  local rid="$1"
  wait_id "$rid" || exit 1
  read -r cx cy < <(center_of "$rid")
  log "tap $rid @ $cx,$cy"
  "${ADB[@]}" shell input tap "$cx" "$cy"
  sleep 0.6
}

type_into() {
  local rid="$1" text="$2"
  tap_id "$rid"
  "${ADB[@]}" shell input text "${text// /%s}"
  "${ADB[@]}" shell input keyevent 111   # ESC — dismiss keyboard
  sleep 0.3
}

# ── Flow ────────────────────────────────────────────────────────────────────
AGE="9-11"; GOAL="morning_routine"; CHALLENGE="homework_focus"

log "Step 1 — child profile"
wait_id onb1-child-name || { log "Not on Step 1 — ensure a fresh parent on UStep1"; exit 1; }
type_into onb1-child-name "Gal"
# Parent name field only appears when display_name is missing/email-like.
if [[ -n "$(center_of onb1-parent-name)" ]]; then type_into onb1-parent-name "TestParent"; fi
tap_id "onb1-age-${AGE}"
tap_id onb1-next

log "Step 2 — goal"
tap_id "onb2-goal-${GOAL}"

log "Step 3 — extra challenges (optional)"
tap_id "onb3-challenge-${CHALLENGE}"
tap_id onb3-next

log "Step 4 — motivators (max 2)"
tap_id onb4-motivator-gaming
tap_id onb4-motivator-social
tap_id onb4-continue

log "Step 5 — preview/save (must NOT bounce back to Step 1)"
wait_id onb5-continue || { log "FAIL: never reached Step 5"; exit 1; }
if [[ -n "$(center_of onb5-retry)" ]]; then log "FAIL: save errored (retry card shown)"; exit 1; fi
if [[ -n "$(center_of onb1-child-name)" ]]; then log "FAIL: bounced back to Step 1"; exit 1; fi
tap_id onb5-continue

log "Step 7 — phone"
tap_id onb7-none

log "Step 8 — complete"
wait_id onb8-cta || { log "FAIL: never reached Step 8"; exit 1; }
log "✅ Onboarding completed end-to-end on Android."
