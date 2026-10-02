# syntax=docker/dockerfile:1
#
# One image serves everything: gunicorn runs the Django API, and WhiteNoise serves the
# built React app from the same origin (no CORS, one URL). Build from the repo root:
#
#   docker build -t nestwell .
#   docker build --build-arg VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com -t nestwell .

# ---- Stage 1: build the React app -----------------------------------------------------
FROM node:22-slim AS frontend
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Vite bakes VITE_* values into the JavaScript at build time. It is a public OAuth client
# ID, not a secret. VITE_API_BASE_URL=/api comes from frontend/.env.production.
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
# Google Maps browser key for the search page's map. Also public (every visitor's browser
# sees it), so restrict it to your domain in Google Cloud. Blank = OpenStreetMap is used.
ARG VITE_GOOGLE_MAPS_API_KEY=""
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build


# ---- Stage 2: Django + gunicorn runtime -----------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    # Production by default; settings.py reads this. Secrets/config arrive as env vars at runtime.
    DJANGO_DEBUG=false \
    # 2 processes x 4 threads suits 0.5-1 vCPU. AI calls take several seconds, so the generous
    # timeout keeps gunicorn from killing a slow-but-healthy request (the ALB idle timeout is
    # raised to match in infra/nestwell.yaml). /dev/shm avoids gunicorn heartbeat I/O stalls.
    GUNICORN_CMD_ARGS="--bind=0.0.0.0:8000 --workers=2 --threads=4 --timeout=120 --worker-tmp-dir=/dev/shm --access-logfile=- --error-logfile=-"

WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend/ ./
COPY --from=frontend /frontend/dist ./frontend_dist

# Bake the hashed static files (Django admin CSS/JS) into the image. The key below exists
# only for this one command; the real SECRET_KEY is injected at runtime by ECS.
RUN DJANGO_SECRET_KEY=build-time-only python manage.py collectstatic --noinput

RUN useradd --system --no-create-home --uid 10001 app && chown -R app /app
USER app

EXPOSE 8000
CMD ["gunicorn", "zillow_clone.wsgi"]
