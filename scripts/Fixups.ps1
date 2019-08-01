$ErrorActionPreference = "Stop"

Write-Output "Fix up for VS version..."
if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio")) {
  mkdir "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio"
}
if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0")) {
  if (Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v14.0") {
    Set-Location "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio"
    cmd /C mklink /J v12.0 v14.0
  }
  elseif (Test-Path "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\Microsoft\VisualStudio\v15.0") {
    Set-Location "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio"
    cmd /C mklink /J v12.0 "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\Microsoft\VisualStudio\v15.0"
  }
}

Write-Output "Fix up for VS APPX..."
if (Test-Path 'C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\pdbcopy.exe') {
  if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\PDBCopy.exe")) {
    if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\")) {
      mkdir "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\"
    }
    Copy-Item 'C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\pdbcopy.exe'  'C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\'
  }
}
