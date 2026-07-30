#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/$STAMP"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/codecrafters}"

mkdir -p "$TARGET"
echo "Backing up MongoDB to $TARGET/mongo"
mongodump --uri="$MONGO_URI" --out="$TARGET/mongo"

if [ -d "$ROOT_DIR/server/uploads" ]; then
  echo "Backing up uploads"
  mkdir -p "$TARGET/uploads"
  cp -R "$ROOT_DIR/server/uploads/." "$TARGET/uploads/" || true
fi

tar -czf "$BACKUP_DIR/codecrafters-$STAMP.tar.gz" -C "$BACKUP_DIR" "$STAMP"
rm -rf "$TARGET"
echo "Backup complete: $BACKUP_DIR/codecrafters-$STAMP.tar.gz"
