# ================================================================
# Cerea backend (FastAPI) container image
# Build context: the backend/ folder.
#
# On start it runs seed.py (creates tables + the admin account; safe to
# repeat) and then Uvicorn on $PORT. Set SEED_DEMO=true to also load
# the demo departments, users, apps and announcements.
# ================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Uploaded app icons are written here; mount a persistent volume at /app/uploads
RUN mkdir -p /app/uploads/icons

EXPOSE 8000

CMD ["sh", "-c", "if [ \"$SEED_DEMO\" = \"true\" ]; then python seed.py --demo; else python seed.py; fi && exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
