#!/usr/bin/env bash
set -euo pipefail
ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 <backup-archive.tar.gz>"
  exit 1
fi
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/codecrafters}"
tar -xzf "$ARCHIVE" -C "$TMP"
DUMP_DIR="$(find "$TMP" -type d -name codecrafters | head -n 1)"
if [ -z "$DUMP_DIR" ]; then
  echo "Mongo dump folder not found in archive"
  exit 1
fi
echo "Restoring MongoDB from $DUMP_DIR"
mongorestore --uri="$MONGO_URI" --drop "$DUMP_DIR"
UPLOADS_SRC="$(dirname "$DUMP_DIR")/../uploads"
if [ -d "$UPLOADS_SRC" ]; then
  mkdir -p "$ROOT_DIR/server/uploads"
  cp -R "$UPLOADS_SRC/." "$ROOT_DIR/server/uploads/"
fi
rm -rf "$TMP"
echo "Restore complete"
