$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $Root 'backups' }
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Target = Join-Path $BackupDir $Stamp
$MongoUri = if ($env:MONGO_URI) { $env:MONGO_URI } else { 'mongodb://localhost:27017/codecrafters' }

New-Item -ItemType Directory -Force -Path $Target | Out-Null
Write-Host "Backing up MongoDB to $Target\mongo"
mongodump --uri=$MongoUri --out=(Join-Path $Target 'mongo')

$Uploads = Join-Path $Root 'server\uploads'
if (Test-Path $Uploads) {
  Write-Host 'Backing up uploads'
  Copy-Item -Recurse -Force $Uploads (Join-Path $Target 'uploads')
}

$Archive = Join-Path $BackupDir "codecrafters-$Stamp.zip"
Compress-Archive -Path $Target -DestinationPath $Archive -Force
Remove-Item -Recurse -Force $Target
Write-Host "Backup complete: $Archive"
