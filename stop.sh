#!/usr/bin/env sh
# Stop portable CRM – Mac, Linux, or Windows (Git Bash)
cd "$(dirname "$0")"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null
echo "CRM stopped. Data is kept in Docker volumes on this drive."
