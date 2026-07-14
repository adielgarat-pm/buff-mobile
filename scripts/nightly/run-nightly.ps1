# run-nightly.ps1 — BUFF nightly test + report launcher
# Invoked by Windows Task Scheduler (~03:00 daily). Boots emulator if needed,
# refreshes a dedicated worktree pinned to origin/main, then runs headless Claude
# against scripts/nightly/nightly-runbook.md. Writes a report to docs/nightly/<date>.md.
#
# Safety: Claude runs with a deny-list blocking git push / eas / apply_migration.
# Its only product is a report file. See nightly-runbook.md for the boundaries.

$ErrorActionPreference = 'Continue'

$repo   = 'C:\Users\adiel\buff-mobile'
$wt     = Join-Path $repo '.claude\worktrees\nightly'
$adb    = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$emu    = Join-Path $env:LOCALAPPDATA 'Android\Sdk\emulator\emulator.exe'
$avd    = 'Pixel_7'
$date   = Get-Date -Format 'yyyy-MM-dd'

$logDir = Join-Path $repo 'scripts\nightly\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
$log = Join-Path $logDir "run-$date.log"

function Log($m) {
  $line = ('[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $m)
  Add-Content -Path $log -Value $line
  Write-Output $line
}

Log '=== BUFF nightly run START ==='

# --- 1. Refresh main ------------------------------------------------------
Set-Location $repo
git fetch origin main 2>&1 | Out-Null
Log 'Fetched origin/main'

# --- 2. Ensure dedicated nightly worktree pinned to origin/main -----------
if (-not (Test-Path $wt)) {
  Log "Creating nightly worktree at $wt"
  git worktree add $wt origin/main 2>&1 | Add-Content $log
}
Set-Location $wt
git reset --hard origin/main 2>&1 | Add-Content $log
$sha = (git rev-parse --short HEAD).Trim()
Log "Worktree at main @ $sha"

# --- 3. Ensure emulator booted -------------------------------------------
$dev = & $adb devices | Select-String 'emulator-\d+\s+device'
if (-not $dev) {
  Log "No emulator running — booting $avd"
  Start-Process -FilePath $emu -ArgumentList "-avd $avd -no-snapshot-load -no-boot-anim" -WindowStyle Hidden
  & $adb wait-for-device
  $tries = 0
  do {
    Start-Sleep -Seconds 5
    $boot = (& $adb shell getprop sys.boot_completed 2>$null)
    $tries++
  } until (($boot -match '1') -or ($tries -ge 36))
  Log "Emulator boot_completed=$boot after $tries checks"
} else {
  Log "Emulator already up: $dev"
}

# --- 4. Headless Claude run ----------------------------------------------
# Runbook is read from the MAIN tree by absolute path so it works even before it
# is merged to main (the worktree is a clean origin/main checkout).
$runbook = Join-Path $repo 'scripts\nightly\nightly-runbook.md'
$prompt = "Run the BUFF nightly test routine. Read and follow the runbook at $runbook EXACTLY, step by step. Your current working directory is a clean checkout of origin/main. Today's date is $date - write the report to C:\Users\adiel\buff-mobile\docs\nightly\$date.md. Hard rules: do NOT git push, do NOT git commit, do NOT build (eas), do NOT run schema DDL. Your only output is the report file."

Log 'Launching headless Claude...'
& claude -p $prompt `
  --add-dir $repo `
  --model opus `
  --dangerously-skip-permissions `
  --disallowedTools 'Bash(git push *)' 'Bash(git commit *)' 'Bash(eas *)' 'Bash(npx eas *)' 'mcp__supabase__apply_migration' `
  --output-format text `
  --max-budget-usd 15 2>&1 | Add-Content $log

Log "Exit code: $LASTEXITCODE"
Log '=== BUFF nightly run END ==='
