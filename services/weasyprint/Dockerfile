# X3 Compass · WeasyPrint render service
# Multi-stage build · keeps the final image lean (~ 420 MB)
#
# Why not the official Python slim image alone?
#   WeasyPrint 65 requires Pango 1.50+ and Cairo 1.18 · Debian Bookworm has
#   exactly that combo. We pin to bookworm-slim so the cgo deps Just Work.
#
# Local test:
#   docker build -t x3-weasyprint .
#   docker run --rm -p 8000:8000 -e WEASYPRINT_TOKEN=test x3-weasyprint
#   curl http://localhost:8000/health
#
# Production: this Dockerfile is what Render.com builds via render.yaml

FROM python:3.12-slim-bookworm

# WeasyPrint runtime deps · pinned to what Bookworm ships
RUN apt-get update && apt-get install --no-install-recommends -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi8 \
    fonts-dejavu-core \
    fonts-liberation \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps in a separate layer so source changes don't bust the cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app + gunicorn config
COPY app.py .
COPY gunicorn.conf.py .

# Non-root user · Render expects this; also good practice
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

ENV PORT=8000
EXPOSE 8000

# Gunicorn config tunes workers, timeout, and preloads WeasyPrint so the
# first request doesn't pay the import cost (Pango/Cairo are ~3s to import).
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]

# Health check used by Render + most orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/health || exit 1
