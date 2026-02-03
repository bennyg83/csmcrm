#!/bin/bash
# Creates a full backup of the current project as CRM-V2.3.x (excluding node_modules)
# Run from repo root: bash create-backup-CRM-V2.3.x.sh

set -e
SOURCE="$(cd "$(dirname "$0")" && pwd)"
PARENT="$(dirname "$SOURCE")"
BACKUP="$PARENT/CRM-V2.3.x"

echo "Creating backup at $BACKUP (excluding node_modules) ..."
rm -rf "$BACKUP"
mkdir -p "$BACKUP"

rsync -a --exclude=node_modules --exclude=.git/objects --exclude=CRM-V2.3.x "$SOURCE/" "$BACKUP/" 2>/dev/null || {
  for f in "$SOURCE"/*; do
    [ -e "$f" ] || continue
    n=$(basename "$f")
    [ "$n" = "node_modules" ] && continue
    if [ -d "$f" ]; then
      cp -r "$f" "$BACKUP/"
      rm -rf "$BACKUP/$n/node_modules" 2>/dev/null || true
    else
      cp "$f" "$BACKUP/"
    fi
  done
}

echo "Backup created at: $BACKUP"
echo "To use it: cd into backend and frontend and run 'npm install'."
