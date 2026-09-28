#!/usr/bin/env bash
# Deploy the latest code on the server. Run over SSH from this directory:  ./deploy.sh
#   git pull -> rebuild the image -> restart what changed -> wait until the app is healthy.
# Migrations run automatically when the web container starts. Expect a few seconds of downtime
# while the web container restarts (the database and its data are never touched).
#
# Roll back: `git -C ../.. checkout <older-commit>` and run this script again
# (DEPLOY_CLOUDZY.md explains how). Use SKIP_PULL=1 to deploy exactly what is checked out now.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "No .env yet. Run ./init-env.sh first." >&2; exit 1; }

if [ -z "${SKIP_PULL:-}" ]; then
  echo "==> Pulling the latest code"
  git -C ../.. pull --ff-only
fi
if git -C ../.. rev-parse --git-dir >/dev/null 2>&1; then
  echo "==> Deploying commit $(git -C ../.. rev-parse --short HEAD): $(git -C ../.. log -1 --format=%s)"
else
  echo "==> Deploying the files in $(cd ../.. && pwd) (not a git checkout)"
fi

echo "==> Building and starting (the first build takes several minutes)"
docker compose up -d --build --remove-orphans

echo "==> Waiting for the app to become healthy"
web=$(docker compose ps -q web)
for _ in $(seq 1 60); do
  status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$web")
  [ "$status" = healthy ] && break
  if [ "$(docker inspect -f '{{.State.Status}}' "$web")" = exited ]; then status=exited; break; fi
  sleep 5
done

if [ "$status" != healthy ]; then
  echo "ERROR: the web container is '$status'. Last log lines:" >&2
  docker compose logs --tail=40 web >&2
  exit 1
fi

docker image prune -f >/dev/null   # old, untagged build layers pile up otherwise
echo
docker compose ps
echo
echo "Deployed. Check it:  curl -s http://localhost/healthz   (or open your site in a browser)"
