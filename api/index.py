import sys
import os

# Add the backend directory to sys.path so `app` is importable directly
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

from app.main import app
