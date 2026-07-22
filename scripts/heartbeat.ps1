# Heartbeat writer for BUFF automations (Retro 2026-07-22 dead-man's-switch).
# Every scheduled/background run writes START as its FIRST action and END (or FAIL)
# as its LAST. The heartbeat-watchdog scheduled task reads this log daily and
# pushes an alert for any run that started without ending, or never started.
#
# Log lives OUTSIDE the repo (shared across worktrees): C:\Users\adiel\.buff\heartbeat.log
#
# Usage:
#   powershell -File scripts/heartbeat.ps1 -Task buff-marketing-daily -Phase START
#   powershell -File scripts/heartbeat.ps1 -Task buff-marketing-daily -Phase END -Note "3 drafts queued"
#   powershell -File scripts/heartbeat.ps1 -Task buff-marketing-daily -Phase FAIL -Note "Chrome not connected"
param(
  [Parameter(Mandatory = $true)][string]$Task,
  [Parameter(Mandatory = $true)][ValidateSet('START', 'END', 'FAIL')][string]$Phase,
  [string]$Note = ''
)

$dir = Join-Path $env:USERPROFILE '.buff'
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$line = '{0} {1} {2} {3}' -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'), $Phase, $Task, $Note
Add-Content -Path (Join-Path $dir 'heartbeat.log') -Value $line.TrimEnd() -Encoding utf8
Write-Output $line.TrimEnd()
