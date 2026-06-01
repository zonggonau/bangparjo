#!/bin/bash
# BangParjo Healthcheck — checks site + dumps recent errors
# Run via cron every 15 minutes

SITE_URL="https://bangparjo.shop"
ERROR_LOG="/root/.pm2/logs/bangparjo-shop-error-0.log"
HEALTH_LOG="/root/backups/bangparjo-db/health.log"
RECENT_ERRORS="/tmp/bangparjo-recent-errors.txt"

# Check site up
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$SITE_URL" 2>/dev/null)

if [ "$HTTP_CODE" != "200" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  Site returned HTTP $HTTP_CODE" >> "$HEALTH_LOG"
fi

# Check recent errors (last 5 min)
if [ -f "$ERROR_LOG" ]; then
  find "$(dirname "$ERROR_LOG")" -name "bangparjo-shop-error-*.log" -newer /tmp/bangparjo-health-timestamp 2>/dev/null | while read log; do
    ERRORS=$(grep -c "Error\|error\|FAIL\|fail" "$log" 2>/dev/null || echo 0)
    if [ "$ERRORS" -gt 50 ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  High error rate: $ERRORS errors in $(basename $log)" >> "$HEALTH_LOG"
    fi
  done
fi

touch /tmp/bangparjo-health-timestamp
