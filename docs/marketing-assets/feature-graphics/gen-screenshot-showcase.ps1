<#
  gen-screenshot-showcase.ps1 — BUFF Play Store "showcase" screenshots (1080x1920, 9:16)
  Brand-purple gradient bg + big two-tone benefit headline + device screenshot
  (rounded corners + soft shadow). Per-screen top/bottom crop removes the OS status
  bar, the "Viewing as parent" banner (child screens), and the debug toast (vibe-check).
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 1080; $H = 1920
$rawDir = "C:\Users\adiel\buff-mobile\docs\marketing-screenshots\v1.6.2\raw"
$outDir = "C:\Users\adiel\buff-mobile\docs\marketing-assets\feature-graphics\showcase"
New-Item -ItemType Directory -Force $outDir | Out-Null

# raw, l1(white), l2(lime), topCrop, bottomCrop (source px @1080x2400), output name
$shots = @(
  @{ raw = "01-parent-dashboard.png";    l1 = "Every kid's day,";      l2 = "one calm view.";     top = 92;  bot = 0;   name = "1-dashboard" },
  @{ raw = "05-parent-tasks.png";        l1 = "Their whole routine,";  l2 = "in one place.";      top = 92;  bot = 0;   name = "2-routine" },
  @{ raw = "02-child-dashboard-buddy.png"; l1 = "A buddy that";         l2 = "grows with them.";   top = 210; bot = 0;   name = "3-buddy" },
  @{ raw = "03-child-rewards.png";       l1 = "Rewards they";          l2 = "actually want.";     top = 210; bot = 0;   name = "4-rewards" },
  @{ raw = "04-vibe-check.png";          l1 = "A check-in,";           l2 = "not a report card."; top = 92;  bot = 245; name = "5-vibe" },
  @{ raw = "06-manage-children.png";     l1 = "Grows with every kid,"; l2 = "every age.";         top = 92;  bot = 0;   name = "6-children" }
)

$deep   = [System.Drawing.Color]::FromArgb(38, 28, 78)
$violet = [System.Drawing.Color]::FromArgb(139, 92, 246)
$lime   = [System.Drawing.Color]::FromArgb(168, 230, 62)
$white  = [System.Drawing.Color]::White

function New-RoundedPath($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

foreach ($s in $shots) {
  $rawPath = Join-Path $rawDir $s.raw
  $src = [System.Drawing.Image]::FromFile($rawPath)
  $srcW = $src.Width
  $cropH = $src.Height - $s.top - $s.bot

  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # background gradient
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $deep, $violet, 70.0)
  $g.FillRectangle($lg, $rect)

  # headline (two lines, centered, auto-fit)
  $pad = 70; $tw = $W - (2 * $pad)
  $size = 80
  $f = $null
  do {
    if ($f) { $f.Dispose() }
    $f = New-Object System.Drawing.Font("Segoe UI", $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $m1 = $g.MeasureString($s.l1, $f); $m2 = $g.MeasureString($s.l2, $f)
    $size -= 2
  } while ((($m1.Width -gt $tw) -or ($m2.Width -gt $tw)) -and ($size -gt 34))
  $lineH = $f.GetHeight($g)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $bWhite = New-Object System.Drawing.SolidBrush($white)
  $bLime  = New-Object System.Drawing.SolidBrush($lime)
  $hy = 92
  $rH1 = New-Object System.Drawing.RectangleF($pad, $hy, $tw, $lineH)
  $rH2 = New-Object System.Drawing.RectangleF($pad, ($hy + $lineH), $tw, $lineH)
  $g.DrawString($s.l1, $f, $bWhite, $rH1, $sf)
  $g.DrawString($s.l2, $f, $bLime,  $rH2, $sf)

  # device: rounded + shadow, fit cropped screenshot into lower area
  $topArea = $hy + ($lineH * 2) + 44
  $availH  = $H - $topArea - 70
  $availW  = $W - 240
  $aspect  = $srcW / $cropH
  $dh = $availH; $dw = [int]($dh * $aspect)
  if ($dw -gt $availW) { $dw = $availW; $dh = [int]($dw / $aspect) }
  $dx = [int](($W - $dw) / 2); $dy = [int]($topArea + (($availH - $dh) / 2))
  $rad = 44

  $shPath = New-RoundedPath ($dx + 10) ($dy + 16) $dw $dh $rad
  $shBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, 10, 6, 30))
  $g.FillPath($shBrush, $shPath)

  $clip = New-RoundedPath $dx $dy $dw $dh $rad
  $g.SetClip($clip)
  $destRect = New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)
  $g.DrawImage($src, $destRect, 0, $s.top, $srcW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
  $g.ResetClip()
  $penB = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 2)
  $g.DrawPath($penB, $clip)

  $out = Join-Path $outDir ("showcase-" + $s.name + "-1080x1920.png")
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("OK  {0}  headline={1}px  device={2}x{3}" -f $s.name, ($size + 2), $dw, $dh)

  $shPath.Dispose(); $clip.Dispose(); $shBrush.Dispose(); $penB.Dispose()
  $bWhite.Dispose(); $bLime.Dispose(); $sf.Dispose(); $f.Dispose(); $lg.Dispose()
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}
Write-Output "DONE"
