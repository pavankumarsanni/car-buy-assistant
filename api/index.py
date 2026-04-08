import sys
import os

# Add the backend directory to sys.path so `app` is importable directly
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

try:
    from app.main import app
except Exception as e:
    # Surface import errors as a plain ASGI app so Vercel shows the real error
    async def app(scope, receive, send):
        if scope["type"] == "http":
            body = f"Import error: {e}".encode()
            await send({"type": "http.response.start", "status": 500, "headers": [(b"content-type", b"text/plain")]})
            await send({"type": "http.response.body", "body": body})
