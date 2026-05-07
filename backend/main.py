from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import receipts, dashboard

app = FastAPI(title="Nourish", description="Grocery receipt nutrition tracker")

app.include_router(receipts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")


@app.get("/")
async def serve_home():
    return FileResponse("frontend/index.html")


@app.get("/review")
async def serve_review():
    return FileResponse("frontend/review.html")


@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse("frontend/dashboard.html")
