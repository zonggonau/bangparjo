#!/bin/bash
# BangParjo DB Backup Script
# Run via cron: every 6 hours, keep 7 days of backups

set -e

DB_NAME="cjdropshiping"
DB_USER="postgres"
DB_PASS="Z0ngg0n4U"
BACKUP_DIR="/root/backups/bangparjo-db"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/latest.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump and compress
PGPASSWORD="$DB_PASS" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$FILENAME"

# Update latest symlink
ln -sf "$FILENAME" "$LATEST_LINK"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: $FILENAME ($(du -h "$FILENAME" | cut -f1))"
