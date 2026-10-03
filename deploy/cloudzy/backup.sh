#!/usr/bin/env bash
# Dump the database (and archive the uploaded listing photos) and delete backups older than KEEP_DAYS.
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

# Listing photos live in the "media" volume, not the database.
media="$BACKUP_DIR/nestwell-media-$(date +%Y%m%d-%H%M%S).tar.gz"
trap 'rm -f "$out.partial" "$media.partial"' EXIT
docker compose exec -T web tar -czf - -C /app media >"$media.partial"
mv "$media.partial" "$media"

find "$BACKUP_DIR" -name 'nestwell-*.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup written: $out ($(du -h "$out" | cut -f1)) and $media ($(du -h "$media" | cut -f1))"
