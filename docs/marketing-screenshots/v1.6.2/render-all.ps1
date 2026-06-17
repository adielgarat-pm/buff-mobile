# render-all.ps1 — render every EN + HE Play Store final for v1.6.2
# Reads overlay strings from overlay-strings.json with explicit UTF-8 decoding so Hebrew is intact.
$ErrorActionPreference = 'Stop'
$base = 'C:\Users\adiel\buff-mobile\docs\marketing-screenshots\v1.6.2'
[Environment]::CurrentDirectory = $base
$render = Join-Path $base 'render-overlay.ps1'
$raw = Join-Path $base 'raw'
$en  = Join-Path $base 'final\EN'
$he  = Join-Path $base 'final\HE'

# --- pre-crop the View-as-Child preview banner off shot 02 (top 210px) ---
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Join-Path $raw '02-child-dashboard-buddy.png'))
$crop = 210
$bmp = New-Object System.Drawing.Bitmap($src.Width, ($src.Height - $crop))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0,0,$bmp.Width,$bmp.Height)), 0, $crop, $src.Width, ($src.Height-$crop), [System.Drawing.GraphicsUnit]::Pixel)
$tmpDir = Join-Path $raw '_tmp'
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory $tmpDir | Out-Null }
$bmp.Save((Join-Path $tmpDir '02-cropped.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
"pre-cropped 02 ($crop px)"

# --- read overlay strings (explicit UTF-8 so Hebrew survives on PS 5.1) ---
$json = [System.IO.File]::ReadAllText((Join-Path $base 'overlay-strings.json'), [System.Text.Encoding]::UTF8)
$shots = $json | ConvertFrom-Json

foreach ($s in $shots) {
  $inPath = Join-Path $raw ($s.src -replace '/', '\')
  $enOut = Join-Path $en ($s.f + '.png')
  $heOut = Join-Path $he ($s.f + '.png')
  if ($s.key) {
    & $render -In $inPath -Out $enOut -Text $s.en -Placement $s.place -KeyFeature
    & $render -In $inPath -Out $heOut -Text $s.he -Placement $s.place -KeyFeature -Rtl
  } else {
    & $render -In $inPath -Out $enOut -Text $s.en -Placement $s.place
    & $render -In $inPath -Out $heOut -Text $s.he -Placement $s.place -Rtl
  }
}
"DONE"
