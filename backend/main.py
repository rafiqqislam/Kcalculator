from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import receipts, dashboard, items

BASE_DIR = Path(__file__).parent.parent  # project root

app = FastAPI(title="Nourish", description="Grocery receipt nutrition tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(receipts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(items.router, prefix="/api")

app.mount("/static", StaticFiles(directory=BASE_DIR / "frontend" / "static"), name="static")


@app.get("/health")
async def health_check():
    return JSONResponse({"status": "ok"})


@app.get("/")
async def serve_home():
    return FileResponse(BASE_DIR / "frontend" / "index.html")


@app.get("/review")
async def serve_review():
    return FileResponse(BASE_DIR / "frontend" / "review.html")


@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse(BASE_DIR / "frontend" / "dashboard.html")


@app.get("/manual")
async def serve_manual():
    return FileResponse(BASE_DIR / "frontend" / "manual.html")
