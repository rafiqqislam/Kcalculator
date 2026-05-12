from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import claude_service, supabase_service

router = APIRouter()


class ClassifyRequest(BaseModel):
    name: str


@router.post("/items/classify")
async def classify_item(req: ClassifyRequest):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Item name is required.")

    cached = supabase_service.lookup_item_cache(name)
    if cached:
        return {**cached, "cached": True}

    try:
        result = claude_service.classify_item(name)
    except Exception:
        raise HTTPException(status_code=500, detail="Couldn't classify item — please try again.")
    return {**result, "cached": False}
