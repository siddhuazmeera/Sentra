import uvicorn
import os
import sys

# Ensure current directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[*] Starting Sentra API Server on http://localhost:{port}")
    print(f"[*] Interactive Swagger Docs: http://localhost:{port}/docs")
    print(f"[*] Alternative Redoc:        http://localhost:{port}/redoc")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
