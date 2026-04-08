from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(path: str = ""):
    import sys
    import os
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
    try:
        sys.path.insert(0, backend_dir)
        from app.main import app as real_app  # noqa
        return JSONResponse({"status": "import ok", "path": path})
    except Exception as e:
        return JSONResponse({"status": "import error", "error": str(e), "backend_dir": backend_dir, "sys_path": sys.path[:5]}, status_code=500)
