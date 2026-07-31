<#  YouTube channel art for BUFFADHD:
    - avatar 800x800 (renders as circle)
    - banner 2560x1440 (safe text area 1546x423, centred)
    Brand palette + BUFF logo. #>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$logoPath = "C:\Users\adiel\buff-mobile\assets\BUFF_LOGO.png"
$outDir   = "C:\Users\adiel\buff-mobile\docs\marketing-assets\youtube-channel"
New-Item -ItemType Directory -Force $outDir | Out-Null

$deep=[System.Drawing.Color]::FromArgb(38,28,78); $violet=[System.Drawing.Color]::FromArgb(139,92,246)
$lime=[System.Drawing.Color]::FromArgb(168,230,62); $white=[System.Drawing.Color]::White
$soft=[System.Drawing.Color]::FromArgb(220,255,255,255)
$logo=[System.Drawing.Image]::FromFile($logoPath)
$sf=New-Object System.Drawing.StringFormat; $sf.Alignment='Center'; $sf.LineAlignment='Center'

# ── Avatar 800x800 ──────────────────────────────────────────────────────────
$A=800; $ab=New-Object System.Drawing.Bitmap($A,$A); $ag=[System.Drawing.Graphics]::FromImage($ab)
$ag.SmoothingMode='AntiAlias'; $ag.InterpolationMode='HighQualityBicubic'
$arect=New-Object System.Drawing.Rectangle(0,0,$A,$A)
$alg=New-Object System.Drawing.Drawing2D.LinearGradientBrush($arect,$deep,$violet,45.0); $ag.FillRectangle($alg,$arect)
$als=520; $ag.DrawImage($logo,[int](($A-$als)/2),[int](($A-$als)/2),$als,$als)
$ab.Save((Join-Path $outDir "avatar-800x800.png"),[System.Drawing.Imaging.ImageFormat]::Png)
$ag.Dispose(); $ab.Dispose()

# ── Banner 2560x1440 (safe area 1546x423 centred) ───────────────────────────
$BW=2560; $BH=1440; $bb=New-Object System.Drawing.Bitmap($BW,$BH); $bg=[System.Drawing.Graphics]::FromImage($bb)
$bg.SmoothingMode='AntiAlias'; $bg.InterpolationMode='HighQualityBicubic'; $bg.TextRenderingHint='AntiAliasGridFit'
$brect=New-Object System.Drawing.Rectangle(0,0,$BW,$BH)
$blg=New-Object System.Drawing.Drawing2D.LinearGradientBrush($brect,$deep,$violet,30.0); $bg.FillRectangle($blg,$brect)

$cx=[int]($BW/2); $cy=[int]($BH/2)
# All text kept INSIDE YouTube's 1546x423 all-devices safe area (y ~509..931).
$ls=160; $wf=New-Object System.Drawing.Font("Segoe UI",120,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$wsize=$bg.MeasureString("BUFF",$wf)
$rowW=$ls+28+$wsize.Width; $rowX=[int]($cx-$rowW/2); $rowY=[int]($cy-185)
$bg.DrawImage($logo,$rowX,$rowY,$ls,$ls)
$bWhite=New-Object System.Drawing.SolidBrush($white)
$sfL=New-Object System.Drawing.StringFormat; $sfL.Alignment='Near'; $sfL.LineAlignment='Center'
$bg.DrawString("BUFF",$wf,$bWhite,[single]($rowX+$ls+28),[single]($rowY+$ls/2-8),$sfL)
# tagline
$tf=New-Object System.Drawing.Font("Segoe UI",56,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$bLime=New-Object System.Drawing.SolidBrush($lime)
$bg.DrawString("ADHD routine coaching for kids & teens",$tf,$bLime,(New-Object System.Drawing.RectangleF(0,($cy+15),$BW,70)),$sf)
$cf=New-Object System.Drawing.Font("Segoe UI",38,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$bSoft=New-Object System.Drawing.SolidBrush($soft)
$bg.DrawString("Built to be outgrown  |  buffadhd.com",$cf,$bSoft,(New-Object System.Drawing.RectangleF(0,($cy+95),$BW,55)),$sf)

$bb.Save((Join-Path $outDir "banner-2560x1440.png"),[System.Drawing.Imaging.ImageFormat]::Png)
$bg.Dispose(); $bb.Dispose(); $logo.Dispose()
Write-Output "OK avatar + banner -> $outDir"
