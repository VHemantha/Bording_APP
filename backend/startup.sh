#!/bin/bash
# Azure App Service (Linux) startup command:  bash startup.sh
# Runs on every container start. Keep line endings LF (see .gitattributes).
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# 2 processes x 4 threads suits a B1 (1 vCPU). AI calls take several seconds, so the
# generous timeout keeps gunicorn from killing a slow-but-healthy request.
exec gunicorn zillow_clone.wsgi \
  --bind=0.0.0.0:8000 \
  --workers=2 --threads=4 \
  --timeout=120 \
  --access-logfile=- --error-logfile=-
