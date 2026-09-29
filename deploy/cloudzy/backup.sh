#!/usr/bin/env bash
# Dump the database to a compressed file and delete dumps older than KEEP_DAYS.
#   ./backup.sh                    (default: ~/backups, keep 14 days)
# Schedule it daily with cron - see DEPLOY_CLOUDZY.md. Restore steps are there too.
# A dump on the same server does NOT survive losing the server: copy some off-box (scp).
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

out="$BACKUP_DIR/nestwell-$(date +%Y%m%d-%H%M%S).sql.gz"
trap 'rm -f "$out.partial"' EXIT   # never leave a half-written dump that looks like a real one

docker compose exec -T db pg_dump -U nestwell --no-owner nestwell | gzip >"$out.partial"
mv "$out.partial" "$out"

find "$BACKUP_DIR" -name 'nestwell-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup written: $out ($(du -h "$out" | cut -f1))"
