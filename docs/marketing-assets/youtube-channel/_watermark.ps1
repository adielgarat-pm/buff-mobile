Add-Type -AssemblyName System.Drawing
$logo=[System.Drawing.Image]::FromFile("C:\Users\adiel\buff-mobile\assets\BUFF_LOGO.png")
$W=150
$bmp=New-Object System.Drawing.Bitmap($W,$W)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'
$g.Clear([System.Drawing.Color]::Transparent)
$s=142; $o=[int](($W-$s)/2)
$g.DrawImage($logo,$o,$o,$s,$s)
$bmp.Save("C:\Users\adiel\buff-mobile\docs\marketing-assets\youtube-channel\watermark-150x150.png",[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $logo.Dispose()
Write-Output "OK watermark-150x150.png"
