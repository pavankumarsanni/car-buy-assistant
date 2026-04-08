import sys
import os

# Add the backend directory to sys.path so `app` is importable directly
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app  # noqa: E402 — Vercel requires `app` at module level
