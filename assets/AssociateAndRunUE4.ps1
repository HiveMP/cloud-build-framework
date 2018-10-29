param()

$VersionInfo = "HEAD"
if (Test-Path $PSScriptRoot\Version.txt) {
  $VersionInfo = (Get-Content -Raw $PSScriptRoot\Version.txt).Trim()
}

if (!(Test-Path 'HKCU:\Software\Epic Games\Unreal Engine\Builds')) {
  mkdir 'HKCU:\Software\Epic Games\Unreal Engine\Builds'
}
Push-Location 'HKCU:\Software\Epic Games\Unreal Engine\Builds'
try {
  Get-Item . | `
  Select-Object -ExpandProperty property | `
  ForEach-Object { 
    if ((Get-ItemProperty -Path . -Name $_).$_.StartsWith($PSScriptRoot.Replace("\", "/"))) { 
      Remove-ItemProperty -Path . -Name $_ 
    }
  }
  New-ItemProperty -Path (Get-Location) -Name "Redpoint-UE4-$VersionInfo" -Value ($PSScriptRoot.Replace("\", "/")) -PropertyType String -Force
} finally {
  Pop-Location
}

Start-Process -FilePath $PSScriptRoot\Engine\Binaries\Win64\UE4Editor.exe -WorkingDirectory $PSScriptRoot\Engine\Binaries\Win64\