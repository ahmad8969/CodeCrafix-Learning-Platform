# Backup & Recovery

## What is backed up

- MongoDB dump (`mongodump`)
- `server/uploads` files

## Create backup

```bash
# Linux/macOS
BACKUP_DIR=./backups MONGO_URI=mongodb://localhost:27017/codecrafters bash scripts/backup.sh

# Windows
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
```

## Restore

```bash
bash scripts/restore.sh backups/codecrafters-YYYYMMDD-HHMMSS.tar.gz
# or
powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -Archive backups\codecrafters-....zip
```

## Scheduling

- Cron / Task Scheduler daily
- Retain at least 7 daily + 4 weekly copies
- Future: push archives to S3/GCS/Azure Blob
