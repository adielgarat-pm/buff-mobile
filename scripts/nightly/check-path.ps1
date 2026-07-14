$gc = Get-Command git -ErrorAction SilentlyContinue
$cc = Get-Command claude -ErrorAction SilentlyContinue
$nc = Get-Command node -ErrorAction SilentlyContinue
Write-Output ("git: "    + $(if($gc){$gc.Source}else{'NOT FOUND'}))
Write-Output ("claude: " + $(if($cc){$cc.Source}else{'NOT FOUND'}))
Write-Output ("node: "   + $(if($nc){$nc.Source}else{'NOT FOUND'}))
$paths = ($env:PATH -split ';') | Select-Object -First 10
Write-Output ("PATH (first 10): " + ($paths -join ' | '))
