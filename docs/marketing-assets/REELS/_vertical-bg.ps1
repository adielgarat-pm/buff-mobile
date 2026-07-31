<#  Brand vertical canvas (1080x1920) for reframing a landscape reel to 9:16.
    Gradient + BUFF logo (top) + tagline (bottom). Video is overlaid centered by ffmpeg. #>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$W=1080; $H=1920
$logoPath = "C:\Users\adiel\buff-mobile\assets\BUFF_LOGO.png"
$out = "C:\Users\adiel\buff-mobile\docs\marketing-assets\REELS\_routines-vertical-bg.png"

$deep=[System.Drawing.Color]::FromArgb(38,28,78); $violet=[System.Drawing.Color]::FromArgb(139,92,246)
$lime=[System.Drawing.Color]::FromArgb(168,230,62); $white=[System.Drawing.Color]::White
$soft=[System.Drawing.Color]::FromArgb(215,255,255,255)

$bmp=New-Object System.Drawing.Bitmap($W,$H); $g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.TextRenderingHint='AntiAliasGridFit'
$rect=New-Object System.Drawing.Rectangle(0,0,$W,$H)
$lg=New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect,$deep,$violet,70.0); $g.FillRectangle($lg,$rect)

# BUFF logo, top-centre
$logo=[System.Drawing.Image]::FromFile($logoPath)
$ls=250; $g.DrawImage($logo, [int](($W-$ls)/2), 150, $ls, $ls)

# "BUFF" wordmark under logo
$sf=New-Object System.Drawing.StringFormat; $sf.Alignment='Center'
$wf=New-Object System.Drawing.Font("Segoe UI",72,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$bWhite=New-Object System.Drawing.SolidBrush($white)
$g.DrawString("BUFF",$wf,$bWhite,(New-Object System.Drawing.RectangleF(0,410,$W,90)),$sf)

# tagline + CTA near bottom
$tf=New-Object System.Drawing.Font("Segoe UI",56,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$bLime=New-Object System.Drawing.SolidBrush($lime)
$g.DrawString("a coach, not a cop.",$tf,$bLime,(New-Object System.Drawing.RectangleF(0,1560,$W,80)),$sf)
$cf=New-Object System.Drawing.Font("Segoe UI",40,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$bSoft=New-Object System.Drawing.SolidBrush($soft)
$g.DrawString("Download free  |  buffadhd.com",$cf,$bSoft,(New-Object System.Drawing.RectangleF(0,1650,$W,60)),$sf)

$bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "OK $out"
$g.Dispose(); $bmp.Dispose(); $logo.Dispose()
