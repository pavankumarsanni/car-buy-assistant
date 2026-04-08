import sys
import os
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

# Add the backend directory to sys.path so `app` is importable directly
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

try:
    from app.main import app
except Exception as _import_error:
    # Surface import errors as a minimal FastAPI app so Vercel returns the real error
    app = FastAPI()
    _msg = str(_import_error)

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def _error(path: str = ""):
        return PlainTextResponse(f"Startup error: {_msg}", status_code=500)
