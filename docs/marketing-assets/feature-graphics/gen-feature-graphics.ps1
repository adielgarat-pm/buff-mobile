<#
  gen-feature-graphics.ps1 — BUFF Play Store feature-graphic variants (1024x500)
  Brand-purple diagonal gradient + BUFF logo (left) + two-tone headline + sub-line.
  Palette: violet-deep #2a1f57 -> violet-primary #8b5cf6, lime-bolt #A8E63E accent.
  No "morning" anchor. English (GTM market).
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 1024; $H = 500
$logoPath = "C:\Users\adiel\buff-mobile\assets\BUFF_LOGO.png"
$outDir   = "C:\Users\adiel\buff-mobile\docs\marketing-assets\feature-graphics"
New-Item -ItemType Directory -Force $outDir | Out-Null

$variants = @(
  @{ name = "A-outgrow"; l1 = "Built so they";      l2 = "outgrow it.";      sub = "ADHD routine coaching  |  ages 6-18" },
  @{ name = "B-lead";    l1 = "Kids who";           l2 = "lead themselves.";  sub = "ADHD routine coaching  |  ages 6-18" },
  @{ name = "C-wins";    l1 = "From daily battles"; l2 = "to daily wins.";    sub = "ADHD routine coaching  |  ages 6-18" }
)

$deep   = [System.Drawing.Color]::FromArgb(42, 31, 87)     # #2a1f57
$violet = [System.Drawing.Color]::FromArgb(139, 92, 246)   # #8b5cf6
$lime   = [System.Drawing.Color]::FromArgb(168, 230, 62)   # #A8E63E
$white  = [System.Drawing.Color]::White
$soft   = [System.Drawing.Color]::FromArgb(220, 255, 255, 255)  # semi-white sub

$logo = [System.Drawing.Image]::FromFile($logoPath)

foreach ($v in $variants) {
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # --- diagonal brand gradient background ---
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $deep, $violet, 22.0)
  $g.FillRectangle($lg, $rect)

  # --- logo on the left, slightly softened ---
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix33 = 0.94
  $ia.SetColorMatrix($cm)
  $ls = 360; $lx = 55; $ly = [int](($H - $ls) / 2)
  $dest = New-Object System.Drawing.Rectangle($lx, $ly, $ls, $ls)
  $g.DrawImage($logo, $dest, 0, 0, $logo.Width, $logo.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)

  # --- headline auto-fit (both lines must fit width) ---
  $tx = 440; $tw = $W - $tx - 48
  $size = 74
  $f = $null
  do {
    if ($f) { $f.Dispose() }
    $f = New-Object System.Drawing.Font("Segoe UI", $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $m1 = $g.MeasureString($v.l1, $f); $m2 = $g.MeasureString($v.l2, $f)
    $size -= 2
  } while ((($m1.Width -gt $tw) -or ($m2.Width -gt $tw)) -and ($size -gt 30))

  $lineH   = $f.GetHeight($g)
  $subSize = [int]($size * 0.40)
  $fsub    = New-Object System.Drawing.Font("Segoe UI", $subSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $subH    = $fsub.GetHeight($g)
  $gap = 12
  $totalH = ($lineH * 2) + $gap + $subH + 8
  $startY = [int](($H - $totalH) / 2)

  $bWhite = New-Object System.Drawing.SolidBrush($white)
  $bLime  = New-Object System.Drawing.SolidBrush($lime)
  $bSoft  = New-Object System.Drawing.SolidBrush($soft)

  $g.DrawString($v.l1, $f, $bWhite, [single]$tx, [single]$startY)
  $g.DrawString($v.l2, $f, $bLime,  [single]$tx, [single]($startY + $lineH))
  $g.DrawString($v.sub, $fsub, $bSoft, [single]$tx, [single]($startY + ($lineH * 2) + $gap + 6))

  $out = Join-Path $outDir ("feature-" + $v.name + "-1024x500.png")
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("OK  {0}  ({1}x{2})  headline={3}px" -f $out, $bmp.Width, $bmp.Height, ($size + 2))

  $bWhite.Dispose(); $bLime.Dispose(); $bSoft.Dispose()
  $f.Dispose(); $fsub.Dispose(); $lg.Dispose(); $g.Dispose(); $bmp.Dispose()
}
$logo.Dispose()
Write-Output "DONE"
