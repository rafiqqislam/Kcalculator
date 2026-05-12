import uuid
from datetime import date, timedelta

from supabase import create_client, Client

from backend.config import get_settings
from backend.models.schemas import ConfirmReceiptRequest, ReceiptItem


def get_supabase() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)


# ── Images ────────────────────────────────────────────────────────────────────

def upload_receipt_image(image_bytes: bytes, content_type: str) -> str:
    supabase = get_supabase()
    filename = f"{uuid.uuid4()}.jpg"
    path = f"receipts/{filename}"
    supabase.storage.from_("receipts").upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": content_type},
    )
    return supabase.storage.from_("receipts").get_public_url(path)


# ── Receipts ──────────────────────────────────────────────────────────────────

def save_receipt(data: ConfirmReceiptRequest) -> dict:
    supabase = get_supabase()

    receipt_result = (
        supabase.table("receipts")
        .insert({
            "store_name": data.store_name,
            "purchased_at": data.purchased_at,
            "total_amount": data.total_amount,
            "image_url": data.image_url,
        })
        .execute()
    )
    receipt_id = receipt_result.data[0]["id"]

    food_items = [i for i in data.items if i.food_group != "non_food"]
    if food_items:
        supabase.table("receipt_items").insert([
            {
                "receipt_id": receipt_id,
                "name": item.name,
                "quantity": item.quantity,
                "unit": item.unit,
                "price": item.price,
                "food_group": item.food_group,
                "nutrient_tags": item.nutrient_tags,
            }
            for item in food_items
        ]).execute()

    _update_item_cache(supabase, data.items)
    return receipt_result.data[0]


def _update_item_cache(supabase: Client, items: list[ReceiptItem]) -> None:
    for item in items:
        supabase.table("item_cache").upsert(
            {
                "name_normalized": item.name.lower().strip(),
                "food_group": item.food_group,
                "nutrient_tags": item.nutrient_tags,
            },
            on_conflict="name_normalized",
        ).execute()


def lookup_item_cache(name: str) -> dict | None:
    """Check if an item name has been classified before. Returns {food_group, nutrient_tags} or None."""
    supabase = get_supabase()
    result = (
        supabase.table("item_cache")
        .select("food_group, nutrient_tags")
        .eq("name_normalized", name.lower().strip())
        .limit(1)
        .execute()
    )
    if result.data:
        return {"food_group": result.data[0]["food_group"], "nutrient_tags": result.data[0]["nutrient_tags"] or []}
    return None


def get_receipts(limit: int = 20) -> list[dict]:
    supabase = get_supabase()
    return (
        supabase.table("receipts")
        .select("id, store_name, purchased_at, total_amount, image_url, created_at")
        .order("purchased_at", desc=True)
        .limit(limit)
        .execute()
    ).data


def get_receipt_with_items(receipt_id: str) -> dict:
    supabase = get_supabase()
    return (
        supabase.table("receipts")
        .select("*, receipt_items(*)")
        .eq("id", receipt_id)
        .single()
        .execute()
    ).data


# ── Dashboard data ────────────────────────────────────────────────────────────

def get_dashboard_data(days: int = 30) -> dict:
    supabase = get_supabase()
    from_date = (date.today() - timedelta(days=days)).isoformat()

    receipts = (
        supabase.table("receipts")
        .select("id, store_name, purchased_at, total_amount, image_url, created_at")
        .gte("purchased_at", from_date)
        .order("purchased_at", desc=True)
        .execute()
    ).data

    if not receipts:
        return {
            "receipts": [],
            "items": [],
            "total_spent": 0.0,
        }

    receipt_ids = [r["id"] for r in receipts]
    items = (
        supabase.table("receipt_items")
        .select("*")
        .in_("receipt_id", receipt_ids)
        .execute()
    ).data

    return {"receipts": receipts, "items": items, "total_spent": sum(
        float(r.get("total_amount") or 0) for r in receipts
    )}


def get_nutrient_last_seen(days_back: int = 90) -> dict[str, int]:
    """Returns {nutrient_tag: days_since_last_seen} for all nutrients seen in the past N days."""
    supabase = get_supabase()
    from_date = (date.today() - timedelta(days=days_back)).isoformat()

    receipts = (
        supabase.table("receipts")
        .select("id, purchased_at")
        .gte("purchased_at", from_date)
        .execute()
    ).data

    if not receipts:
        return {}

    receipt_map = {r["id"]: r["purchased_at"] for r in receipts}
    items = (
        supabase.table("receipt_items")
        .select("receipt_id, nutrient_tags")
        .in_("receipt_id", list(receipt_map.keys()))
        .execute()
    ).data

    today = date.today()
    nutrient_latest: dict[str, date] = {}

    for item in items:
        receipt_date_str = receipt_map.get(item["receipt_id"])
        if not receipt_date_str:
            continue
        receipt_date = date.fromisoformat(receipt_date_str)
        for tag in item.get("nutrient_tags") or []:
            if tag not in nutrient_latest or receipt_date > nutrient_latest[tag]:
                nutrient_latest[tag] = receipt_date

    return {tag: (today - d).days for tag, d in nutrient_latest.items()}
