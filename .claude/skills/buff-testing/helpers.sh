# BUFF testing helpers — source this file at the top of any testing bash session.
#
# Usage:
#   source .claude/skills/buff-testing/helpers.sh
#   buff_check
#
# These wrappers all delegate to adb at the canonical Windows path.
# All helpers assume Pixel_7 ratio (1080x2400 native).

export ADB="/c/Users/adiel/AppData/Local/Android/Sdk/platform-tools/adb.exe"
export PKG="com.buffapp.mobile"
export METRO_URL="http://10.0.2.2:8083"
export TMP_DIR="C:/Users/adiel/buff-mobile/.claude/tmp"
mkdir -p "$TMP_DIR"

# --- emulator + app lifecycle -------------------------------------------------

# Sanity: list connected devices
buff_check() {
  "$ADB" devices
}

# Force-stop the app
buff_stop() {
  "$ADB" shell am force-stop "$PKG"
}

# Launch via dev-client deep link (connects to Metro)
buff_launch() {
  local encoded_url
  encoded_url=$(printf '%s' "$METRO_URL" | sed 's/:/%3A/g; s|/|%2F|g')
  "$ADB" shell am start \
    -a android.intent.action.VIEW \
    -d "exp+buff-mobile://expo-development-client/?url=$encoded_url" \
    -n "$PKG/expo.modules.devlauncher.launcher.DevLauncherActivity"
}

# Hard-restart (stop + launch + wait for bundle)
buff_restart() {
  buff_stop
  sleep 2
  buff_launch
  sleep 12
}

# Check current foreground activity
buff_focus() {
  "$ADB" shell dumpsys window | grep mCurrentFocus | head -1
}

# --- screenshot + UI dump -----------------------------------------------------

# Take a screenshot to $TMP_DIR/<name>.png — defaults to timestamp
buff_screenshot() {
  local name="${1:-$(date +%s)}"
  MSYS_NO_PATHCONV=1 "$ADB" shell "screencap -p /sdcard/_s.png" > /dev/null
  MSYS_NO_PATHCONV=1 "$ADB" pull /sdcard/_s.png "$TMP_DIR/$name.png" > /dev/null
  echo "$TMP_DIR/$name.png"
}

# Dump UI hierarchy to $TMP_DIR/_ui.xml
buff_dump() {
  MSYS_NO_PATHCONV=1 "$ADB" shell "uiautomator dump /sdcard/_ui.xml" > /dev/null
  MSYS_NO_PATHCONV=1 "$ADB" pull /sdcard/_ui.xml "$TMP_DIR/_ui.xml" > /dev/null
}

# --- input --------------------------------------------------------------------

# Tap at native coordinates (NOT screenshot coordinates — emulator native is 1080x2400)
buff_tap() {
  "$ADB" shell input tap "$1" "$2"
}

# Find element by text or content-desc, tap its center. Returns 0 if found.
buff_tap_text() {
  local text="$1"
  buff_dump
  local bounds
  bounds=$(grep -oE "<node[^>]*(text|content-desc)=\"[^\"]*$text[^\"]*\"[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" "$TMP_DIR/_ui.xml" \
    | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' \
    | head -1)
  if [ -z "$bounds" ]; then
    echo "NOT FOUND: $text"
    return 1
  fi
  local nums
  nums=$(echo "$bounds" | grep -oE '[0-9]+')
  local x1 y1 x2 y2 cx cy
  x1=$(echo "$nums" | sed -n '1p')
  y1=$(echo "$nums" | sed -n '2p')
  x2=$(echo "$nums" | sed -n '3p')
  y2=$(echo "$nums" | sed -n '4p')
  cx=$(( (x1+x2)/2 ))
  cy=$(( (y1+y2)/2 ))
  "$ADB" shell input tap "$cx" "$cy"
  echo "TAPPED: $text @ ($cx,$cy)"
}

# Type alphanumeric text into focused field
# (Hebrew via adb shell input text is unreliable — use only ASCII)
buff_type() {
  "$ADB" shell input text "$1"
}

# Send keyevent (BACK, ENTER, TAB, HOME, MENU)
buff_key() {
  "$ADB" shell input keyevent "KEYCODE_$1"
}

# Swipe gestures
buff_scroll_down() {
  "$ADB" shell input swipe 540 1800 540 800 500
}
buff_scroll_up() {
  "$ADB" shell input swipe 540 800 540 1800 500
}

# --- assertions ---------------------------------------------------------------

# Assert text present in current UI dump. Returns 0 (pass) or 1 (fail).
buff_assert_text() {
  local needle="$1"
  buff_dump
  if grep -q "$needle" "$TMP_DIR/_ui.xml"; then
    echo "✅ present: $needle"
    return 0
  else
    echo "❌ missing: $needle"
    return 1
  fi
}

# Assert text NOT present
buff_assert_no_text() {
  local needle="$1"
  buff_dump
  if grep -q "$needle" "$TMP_DIR/_ui.xml"; then
    echo "❌ unexpectedly present: $needle"
    return 1
  else
    echo "✅ absent: $needle"
    return 0
  fi
}

# --- logs ---------------------------------------------------------------------

# Recent RN JS logs (default 20 lines)
buff_logs() {
  "$ADB" logcat -d ReactNativeJS:V "*:S" | tail -"${1:-20}"
}

# Clear logcat before an action you want to grep
buff_logs_reset() {
  "$ADB" logcat -c
}

# Filter logs by keyword (case-insensitive)
buff_logs_grep() {
  "$ADB" logcat -d ReactNativeJS:V "*:S" | grep -i "$1" | tail -"${2:-20}"
}

# --- network simulation -------------------------------------------------------

# Toggle wifi off (test offline)
buff_offline() {
  "$ADB" shell svc wifi disable
  "$ADB" shell svc data disable
}

# Toggle wifi on
buff_online() {
  "$ADB" shell svc wifi enable
  "$ADB" shell svc data enable
}

# --- misc ---------------------------------------------------------------------

# Print first few lines from UI dump matching pattern (debugging aid)
buff_grep_ui() {
  grep -E "$1" "$TMP_DIR/_ui.xml" | head -"${2:-5}"
}

echo "BUFF testing helpers loaded. Run buff_check to verify emulator."
