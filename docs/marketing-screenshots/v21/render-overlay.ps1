<#
  render-overlay.ps1 — BUFF v1.1.0 Play Store screenshot overlay renderer
  PowerShell + System.Drawing (GDI+). PNG in -> PNG out, lossless. No stretching.

  Produces a 1080x1920 (9:16) Play Store phone screenshot from a raw capture,
  with a solid brand-purple band + one-line white Segoe UI Bold overlay.
  Hebrew is rendered RTL (right reading edge) via GDI+ DirectionRightToLeft.

  Brand palette (docs/BUFF_BRAND.md):
    violet-primary #8b5cf6  -> band + letterbox bars ("brand purple")
    lime-bolt      #A8E63E  -> sparing key-feature accent dot
    text           white

  Usage:
    .\render-overlay.ps1 -In raw\01.png -Out final\EN\01-parent-dashboard.png `
        -Text "Mornings that run themselves" -Placement top
    .\render-overlay.ps1 -In raw\01.png -Out final\HE\01-parent-dashboard.png `
        -Text "בקרים שמתנהלים לבד" -Placement top -Rtl -KeyFeature
#>
param(
  [Parameter(Mandatory)][string]$In,
  [Parameter(Mandatory)][string]$Out,
  [Parameter(Mandatory)][string]$Text,
  [ValidateSet('top','bottom')][string]$Placement = 'top',
  [ValidateSet('top','center','bottom')][string]$CropAnchor = 'top',
  [int]$TopInset = 0,          # px to drop a TOP band below the status bar (tune per raw)
  [switch]$Rtl,
  [switch]$KeyFeature
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# ---- constants -------------------------------------------------------------
$TW = 1080; $TH = 1920                      # Play Store phone 9:16
$bandH = [int]($TH * 0.15)                  # ~15% of frame height
$pad   = 56                                 # text inset from band edge
$purple = [System.Drawing.Color]::FromArgb(139, 92, 246)   # #8b5cf6
$lime   = [System.Drawing.Color]::FromArgb(168, 230, 62)   # #A8E63E
$white  = [System.Drawing.Color]::White

$inPath  = (Resolve-Path $In).Path
$outDir  = Split-Path -Parent $Out
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }

$src = [System.Drawing.Image]::FromFile($inPath)
try {
  $canvas = New-Object System.Drawing.Bitmap($TW, $TH)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # fill canvas brand-purple first so any letterbox gap is brand purple
    $g.Clear($purple)

    $srcAspect = $src.Width / $src.Height
    $tgtAspect = $TW / $TH

    if ($srcAspect -lt $tgtAspect) {
      # source is TALLER than 9:16 -> scale to width, crop top/bottom
      $scale = $TW / $src.Width
      $sh = [int]($src.Height * $scale)
      switch ($CropAnchor) {
        'top'    { $y = 0 }
        'bottom' { $y = $TH - $sh }
        default  { $y = [int](($TH - $sh) / 2) }   # center
      }
      $g.DrawImage($src, 0, $y, $TW, $sh)
    }
    elseif ($srcAspect -gt $tgtAspect) {
      # source is WIDER than 9:16 -> scale to width, letterbox top/bottom (purple)
      $scale = $TW / $src.Width
      $sh = [int]($src.Height * $scale)
      $y  = [int](($TH - $sh) / 2)
      $g.DrawImage($src, 0, $y, $TW, $sh)
    }
    else {
      $g.DrawImage($src, 0, 0, $TW, $TH)
    }

    # ---- overlay band ------------------------------------------------------
    $bandY = if ($Placement -eq 'top') { $TopInset } else { $TH - $bandH }
    $brush = New-Object System.Drawing.SolidBrush($purple)
    $g.FillRectangle($brush, 0, $bandY, $TW, $bandH)
    $brush.Dispose()

    # lime key-feature accent dot, on the text's leading edge
    $dotR = 0
    if ($KeyFeature) {
      $dotR = 18
      $dotCY = $bandY + $bandH / 2
      $limeBrush = New-Object System.Drawing.SolidBrush($lime)
      if ($Rtl) {
        $dotCX = $TW - $pad - $dotR        # leading edge = right for RTL
      } else {
        $dotCX = $pad + $dotR              # leading edge = left for LTR
      }
      $g.FillEllipse($limeBrush, $dotCX - $dotR, $dotCY - $dotR, $dotR*2, $dotR*2)
      $limeBrush.Dispose()
    }

    # ---- text (auto-fit to ONE line) --------------------------------------
    $dotGap = if ($KeyFeature) { ($dotR * 2) + 24 } else { 0 }
    $textW  = $TW - (2 * $pad) - $dotGap
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Near      # leading edge
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $sf.FormatFlags   = [System.Drawing.StringFormatFlags]::NoWrap
    if ($Rtl) {
      $sf.FormatFlags = $sf.FormatFlags -bor [System.Drawing.StringFormatFlags]::DirectionRightToLeft
    }

    # measure UNCONSTRAINED (a bounded MeasureString clamps width to the rect and
    # would falsely report a fit) — shrink until the true single-line width fits.
    $size = 88
    do {
      if ($font) { $font.Dispose() }
      $font = New-Object System.Drawing.Font("Segoe UI", $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $meas = $g.MeasureString($Text, $font)
      $size -= 2
    } while (($meas.Width -gt $textW) -and ($size -gt 24))

    # text rect: leave room for the dot on the leading side
    if ($Rtl) {
      $rect = New-Object System.Drawing.RectangleF($pad, $bandY, ($textW), $bandH)
    } else {
      $rect = New-Object System.Drawing.RectangleF(($pad + $dotGap), $bandY, ($textW), $bandH)
    }
    $tb = New-Object System.Drawing.SolidBrush($white)
    $g.DrawString($Text, $font, $tb, $rect, $sf)
    $tb.Dispose(); $font.Dispose(); $sf.Dispose()

    # ---- save PNG (lossless) ----------------------------------------------
    $canvas.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    "OK  $Out  ($($canvas.Width)x$($canvas.Height))  band=$Placement rtl=$($Rtl.IsPresent) key=$($KeyFeature.IsPresent)"
  }
  finally { $g.Dispose(); $canvas.Dispose() }
}
finally { $src.Dispose() }
