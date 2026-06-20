<#
.SYNOPSIS
  READ-ONLY validator for v21 Play Store finals. Covers the machine-checkable
  gates: dimensions/format/alpha (check 1) and EN<->HE pairing (check 2).
  Never modifies an image. Checks 3,4,6,7,8 still need a human visual pass.

.PARAMETER Root
  The 'final' directory containing EN and HE subfolders.
  Default: the 'final' dir next to this script.

.EXAMPLE
  pwsh docs/marketing-screenshots/v21/check-finals.ps1
  pwsh docs/marketing-screenshots/v21/check-finals.ps1 -Root C:\path\to\v21\final
#>
[CmdletBinding()]
param(
  [string]$Root = (Join-Path $PSScriptRoot 'final')
)

Add-Type -AssemblyName System.Drawing

$EXPECTED_W = 1080
$EXPECTED_H = 1920

function Read-PngInfo {
  param([string]$Path)
  # Read fully into memory so the file is never locked and never written.
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $isPng = ($bytes.Length -ge 8 -and $bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47)
  $ms = New-Object System.IO.MemoryStream(,$bytes)
  try {
    $img = [System.Drawing.Image]::FromStream($ms)
    try {
      $hasAlpha = ($img.PixelFormat.ToString() -match 'Argb|Alpha')
      [pscustomobject]@{
        Width    = $img.Width
        Height   = $img.Height
        IsPng    = $isPng
        HasAlpha = $hasAlpha
      }
    } finally { $img.Dispose() }
  } finally { $ms.Dispose() }
}

if (-not (Test-Path $Root)) {
  Write-Output "FATAL: Root not found: $Root"
  exit 2
}

$enDir = Join-Path $Root 'EN'
$heDir = Join-Path $Root 'HE'
$enFiles = @(Get-ChildItem -Path $enDir -Filter '*.png' -File -ErrorAction SilentlyContinue | Sort-Object Name)
$heFiles = @(Get-ChildItem -Path $heDir -Filter '*.png' -File -ErrorAction SilentlyContinue | Sort-Object Name)

Write-Output "=== v21 finals - READ-ONLY check ==="
Write-Output "Root: $Root"
Write-Output "EN finals: $($enFiles.Count)   HE finals: $($heFiles.Count)"
Write-Output ""

if ($enFiles.Count -eq 0 -and $heFiles.Count -eq 0) {
  Write-Output "NO FINALS PRESENT - nothing to validate. Verdict stays NO-GO (blocked upstream)."
  exit 1
}

$fail = 0

# --- Check 1: per-file dims / format / alpha ---
Write-Output "--- Check 1: dimensions / PNG / alpha ---"
foreach ($f in @($enFiles + $heFiles)) {
  $info = Read-PngInfo -Path $f.FullName
  $dimsOk = ($info.Width -eq $EXPECTED_W -and $info.Height -eq $EXPECTED_H)
  $ok = ($dimsOk -and $info.IsPng)
  if (-not $ok) { $fail++ }
  $status = if ($ok) { 'OK  ' } else { 'FAIL' }
  $alphaNote = if ($info.HasAlpha) { ' [alpha channel present - verify no transparent pixels render black]' } else { '' }
  Write-Output ("  [{0}] {1}  {2}x{3}  png={4}{5}" -f $status, $f.Name, $info.Width, $info.Height, $info.IsPng, $alphaNote)
}
Write-Output ""

# --- Check 2: EN <-> HE pairing by filename ---
Write-Output "--- Check 2: EN<->HE pairing ---"
$enNames = $enFiles.Name
$heNames = $heFiles.Name
$enOnly = @($enNames | Where-Object { $_ -notin $heNames })
$heOnly = @($heNames | Where-Object { $_ -notin $enNames })
if ($enOnly.Count -eq 0 -and $heOnly.Count -eq 0 -and $enFiles.Count -gt 0) {
  Write-Output "  OK  all EN finals have a HE counterpart and vice versa ($($enFiles.Count) pairs)"
} else {
  if ($enOnly.Count) { Write-Output "  FAIL  EN with no HE pair: $($enOnly -join ', ')"; $fail++ }
  if ($heOnly.Count) { Write-Output "  FAIL  HE with no EN pair: $($heOnly -join ', ')"; $fail++ }
}
Write-Output ""

Write-Output "=== SUMMARY ==="
if ($fail -eq 0) {
  Write-Output "Machine checks (1,2) PASS. Now do the human passes: checks 3 (dev artifacts), 4 (PII), 6 (HE RTL), 7 (DFF), 8 (status bar). Update VALIDATION.md."
  exit 0
} else {
  Write-Output "Machine checks found $fail problem(s). Verdict NO-GO until fixed. See rows above."
  exit 1
}
