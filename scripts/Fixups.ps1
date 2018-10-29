Write-Output "Fix up for VS version..."
if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio")) {
  Set-Location "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio"
  mklink /J v12.0 v14.0
}

Write-Output "Fix up for VS APPX..."
if (!(Test-Path "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\PDBCopy.exe")) {
  mkdir "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\"
  Copy-Item 'C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\pdbcopy.exe'  'C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v12.0\AppxPackage\'
}