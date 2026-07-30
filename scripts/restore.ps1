param(
  [Parameter(Mandatory = $true)]
  [string]$Archive
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Tmp = Join-Path $env:TEMP ("cc-restore-" + [guid]::NewGuid())
$MongoUri = if ($env:MONGO_URI) { $env:MONGO_URI } else { 'mongodb://localhost:27017/codecrafters' }
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
Expand-Archive -Path $Archive -DestinationPath $Tmp -Force
$Dump = Get-ChildItem -Path $Tmp -Recurse -Directory -Filter 'codecrafters' | Select-Object -First 1
if (-not $Dump) { throw 'Mongo dump folder not found in archive' }
Write-Host "Restoring MongoDB from $($Dump.FullName)"
mongorestore --uri=$MongoUri --drop $Dump.FullName
$UploadsSrc = Join-Path $Dump.Parent.FullName 'uploads'
if (Test-Path $UploadsSrc) {
  $UploadsDest = Join-Path $Root 'server\uploads'
  New-Item -ItemType Directory -Force -Path $UploadsDest | Out-Null
  Copy-Item -Recurse -Force (Join-Path $UploadsSrc '*') $UploadsDest
}
Remove-Item -Recurse -Force $Tmp
Write-Host 'Restore complete'
