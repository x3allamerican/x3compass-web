"""
Gunicorn config · X3 Compass WeasyPrint service

Tuning notes:
  · 2 sync workers on Render.com's free / starter tier (0.5 vCPU, 512 MB)
    is the sweet spot · WeasyPrint is memory-heavy but single-threaded per
    request, so more workers = more concurrency at the cost of RAM.
  · `preload_app = True` imports WeasyPrint once at master-process start
    and forks · saves ~3 seconds per cold worker boot (Pango/Cairo are
    expensive to import).
  · 60-second timeout matches the docstring contract in app.py. Long
    audit packets (20+ page CFR-cited docs) can take 8-15s; we leave
    headroom for cold renders.
  · `--max-requests 250` recycles workers periodically to dodge any
    long-running memory leaks in Pango/Cairo's native code.
"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
worker_class = "sync"
timeout = 60
graceful_timeout = 30
keepalive = 5

preload_app = True
max_requests = 250
max_requests_jitter = 50

accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")

# Don't expose server tokens
forwarded_allow_ips = "*"
proxy_protocol = False
