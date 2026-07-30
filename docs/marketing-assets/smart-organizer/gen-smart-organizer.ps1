<#
  gen-smart-organizer.ps1 — BUFF Smart Organizer before/after showcase (1080x1920)
  Two phones (message -> organized tasks) + lime arrow + two-tone benefit headline.
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 1080; $H = 1920
$leftImg  = "C:\Users\adiel\Downloads\261b6aa4-e16b-4d98-a0d0-9c0d3ad8597d.jpeg"   # input / message
$rightImg = "C:\Users\adiel\Downloads\1f588d67-bd09-4afb-8e39-7c577dfc588c.jpeg"   # confirm / organized
$outDir   = "C:\Users\adiel\buff-mobile\docs\marketing-assets\smart-organizer"
$out      = Join-Path $outDir "smart-organizer-1080x1920.png"

$L1 = "Paste the mess."
$L2 = "Get a plan."
$labelL = "A message you got"
$labelR = "Organized & assigned"
$topCrop = 96; $botCrop = 150      # strip status bar + Samsung nav bar

$deep   = [System.Drawing.Color]::FromArgb(38, 28, 78)
$violet = [System.Drawing.Color]::FromArgb(139, 92, 246)
$lime   = [System.Drawing.Color]::FromArgb(168, 230, 62)
$white  = [System.Drawing.Color]::White
$soft   = [System.Drawing.Color]::FromArgb(225, 255, 255, 255)

function New-RoundedPath($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); return $p
}

$srcL = [System.Drawing.Image]::FromFile($leftImg)
$srcR = [System.Drawing.Image]::FromFile($rightImg)

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# background
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $deep, $violet, 70.0)
$g.FillRectangle($lg, $rect)

# headline (centered, two lines)
$pad = 70; $tw = $W - (2 * $pad)
$hf = New-Object System.Drawing.Font("Segoe UI", 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$lineH = $hf.GetHeight($g)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$bWhite = New-Object System.Drawing.SolidBrush($white)
$bLime  = New-Object System.Drawing.SolidBrush($lime)
$bSoft  = New-Object System.Drawing.SolidBrush($soft)
$hy = 96
$g.DrawString($L1, $hf, $bWhite, (New-Object System.Drawing.RectangleF($pad, $hy, $tw, $lineH)), $sf)
$g.DrawString($L2, $hf, $bLime,  (New-Object System.Drawing.RectangleF($pad, ($hy + $lineH), $tw, $lineH)), $sf)

# ---- phones ----
$margin = 36; $arrowGap = 112
$pw = [int](($W - (2 * $margin) - $arrowGap) / 2)
$cropH = $srcL.Height - $topCrop - $botCrop
$aspect = $srcL.Width / $cropH
$ph = [int]($pw / $aspect)

$labelFont = New-Object System.Drawing.Font("Segoe UI", 33, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$labelH = $labelFont.GetHeight($g)

$areaTop = $hy + ($lineH * 2) + 40
$areaBot = $H - 60
$groupH = $ph + 20 + $labelH
$py = [int]($areaTop + ((($areaBot - $areaTop) - $groupH) / 2))

$lx = $margin
$rx = $W - $margin - $pw
$rad = 40

foreach ($item in @(@{img=$srcL; x=$lx; lbl=$labelL}, @{img=$srcR; x=$rx; lbl=$labelR})) {
  $x = $item.x
  # shadow
  $shp = New-RoundedPath ($x + 8) ($py + 12) $pw $ph $rad
  $shb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 10, 6, 30))
  $g.FillPath($shb, $shp)
  # clipped rounded image
  $clip = New-RoundedPath $x $py $pw $ph $rad
  $g.SetClip($clip)
  $g.DrawImage($item.img, (New-Object System.Drawing.Rectangle($x, $py, $pw, $ph)), 0, $topCrop, $item.img.Width, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
  $g.ResetClip()
  $penB = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), 2)
  $g.DrawPath($penB, $clip)
  # label under phone
  $g.DrawString($item.lbl, $labelFont, $bSoft, (New-Object System.Drawing.RectangleF($x, ($py + $ph + 12), $pw, $labelH)), $sf)
  $shp.Dispose(); $clip.Dispose(); $shb.Dispose(); $penB.Dispose()
}

# ---- arrow in the gap (lime circle + white right-arrow) ----
$acx = [int]($lx + $pw + ($arrowGap / 2))
$acy = [int]($py + ($ph / 2))
$ar = 50
$g.FillEllipse($bLime, ($acx - $ar), ($acy - $ar), ($ar * 2), ($ar * 2))
$aw = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 28, 78))
# shaft
$g.FillRectangle($aw, ($acx - 22), ($acy - 6), 26, 12)
# head (triangle)
$head = New-Object 'System.Drawing.Point[]' 3
$head[0] = New-Object System.Drawing.Point(($acx + 2), ($acy - 20))
$head[1] = New-Object System.Drawing.Point(($acx + 26), $acy)
$head[2] = New-Object System.Drawing.Point(($acx + 2), ($acy + 20))
$g.FillPolygon($aw, $head)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("OK  {0}  phones={1}x{2}" -f $out, $pw, $ph)

$g.Dispose(); $bmp.Dispose(); $srcL.Dispose(); $srcR.Dispose()
