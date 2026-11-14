# Creates GateHub shortcuts with the GateHub icon.
#   powershell -ExecutionPolicy Bypass -File install-shortcut.ps1            -> Desktop + Start menu
#   powershell -ExecutionPolicy Bypass -File install-shortcut.ps1 -Startup   -> also start the local server at login
param([switch]$Startup)

$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$shell = New-Object -ComObject WScript.Shell
$icon  = Join-Path $here "assets\gatehub.ico"

function New-Shortcut($path, $target, $arguments, $desc) {
  $lnk = $shell.CreateShortcut($path)
  $lnk.TargetPath = $target
  $lnk.Arguments = $arguments
  $lnk.WorkingDirectory = $here
  $lnk.Description = $desc
  $lnk.IconLocation = "$icon,0"
  $lnk.Save()
  Write-Host "Created $path"
}

$wscript = "$env:SystemRoot\System32\wscript.exe"
$launch  = "`"$here\GateHub.vbs`""
New-Shortcut (Join-Path ([Environment]::GetFolderPath("Desktop")) "GateHub.lnk") $wscript $launch "GateHub - GATE CSE study hub"
$startMenu = Join-Path ([Environment]::GetFolderPath("Programs")) "GateHub.lnk"
New-Shortcut $startMenu $wscript $launch "GateHub - GATE CSE study hub"

if ($Startup) {
  $pyw = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\pythonw.exe"
  if (-not (Test-Path $pyw)) { $pyw = Join-Path $env:LOCALAPPDATA "Programs\Python\Launcher\pyw.exe" }
  New-Shortcut (Join-Path ([Environment]::GetFolderPath("Startup")) "GateHub Server.lnk") $pyw "`"$here\server.py`"" "GateHub local server (localhost only)"
}
