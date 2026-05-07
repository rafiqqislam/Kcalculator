from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from backend.models.schemas import ConfirmReceiptRequest
from backend.services import claude_service, supabase_service

router = APIRouter(prefix="/receipts", tags=["receipts"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Please upload a JPEG, PNG, or WebP image.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(400, "Image is too large — please use a photo under 10 MB.")

    try:
        parsed = claude_service.parse_receipt(image_bytes, file.content_type or "image/jpeg")
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception:
        raise HTTPException(500, "We couldn't read this receipt. Try a photo with more light and less blur.")

    try:
        image_url = supabase_service.upload_receipt_image(image_bytes, file.content_type or "image/jpeg")
    except Exception:
        image_url = None

    return {
        "store_name": parsed.store_name,
        "purchased_at": parsed.purchased_at,
        "total_amount": parsed.total_amount,
        "image_url": image_url,
        "items": [i.model_dump() for i in parsed.items],
    }


@router.post("/confirm")
async def confirm_receipt(data: ConfirmReceiptRequest):
    try:
        saved = supabase_service.save_receipt(data)
    except Exception as e:
        raise HTTPException(500, f"Couldn't save receipt: {e}")
    return {"id": saved["id"], "message": "Receipt saved!"}


@router.get("")
async def list_receipts():
    try:
        receipts = supabase_service.get_receipts()
    except Exception as e:
        raise HTTPException(500, f"Couldn't load receipts: {e}")
    return receipts


@router.get("/{receipt_id}")
async def get_receipt(receipt_id: str):
    try:
        receipt = supabase_service.get_receipt_with_items(receipt_id)
    except Exception as e:
        raise HTTPException(404, f"Receipt not found: {e}")
    return receipt
