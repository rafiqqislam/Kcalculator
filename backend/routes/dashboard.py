from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from backend.services import supabase_service
from backend.services.nutrition_service import analyze_health

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def get_summary(days: int = Query(default=30, ge=7, le=365)):
    try:
        data = supabase_service.get_dashboard_data(days)
        nutrient_last_seen = supabase_service.get_nutrient_last_seen(days_back=90)
    except Exception as e:
        raise HTTPException(500, f"Couldn't load dashboard data: {e}")

    receipts = data["receipts"]
    items = data["items"]
    total_spent = data["total_spent"]

    spending_by_group = _aggregate_spending(items, total_spent)
    weekly_trend = _build_weekly_trend(receipts)

    # Health is based on the last 14 days regardless of dashboard period
    recent_cutoff = (date.today() - timedelta(days=14)).isoformat()
    recent_receipt_ids = {
        r["id"] for r in receipts if (r.get("purchased_at") or "") >= recent_cutoff
    }
    recent_tags = [
        tag
        for item in items
        if item["receipt_id"] in recent_receipt_ids
        for tag in (item.get("nutrient_tags") or [])
    ]

    health_report = analyze_health(recent_tags, nutrient_last_seen)

    return {
        "period_days": days,
        "total_receipts": len(receipts),
        "total_spent": round(total_spent, 2),
        "spending_by_group": spending_by_group,
        "weekly_trend": weekly_trend,
        "health_report": health_report.model_dump(),
        "recent_receipts": receipts[:5],
    }


def _aggregate_spending(items: list[dict], total_spent: float) -> list[dict]:
    groups: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0})

    for item in items:
        fg = item.get("food_group", "non_food")
        price = float(item.get("price") or 0)
        groups[fg]["total"] += price
        groups[fg]["count"] += 1

    return sorted(
        [
            {
                "food_group": fg,
                "total": round(d["total"], 2),
                "percentage": round(d["total"] / total_spent * 100, 1) if total_spent > 0 else 0,
                "item_count": d["count"],
            }
            for fg, d in groups.items()
        ],
        key=lambda x: x["total"],
        reverse=True,
    )


def _build_weekly_trend(receipts: list[dict]) -> list[dict]:
    weeks: dict[str, float] = defaultdict(float)

    for r in receipts:
        purchased = r.get("purchased_at")
        if not purchased:
            continue
        d = date.fromisoformat(purchased)
        # Week label = Monday of that week
        monday = d - timedelta(days=d.weekday())
        label = monday.strftime("%b %-d")
        weeks[label] += float(r.get("total_amount") or 0)

    # Return in chronological order, last 8 weeks max
    sorted_weeks = sorted(weeks.items())[-8:]
    return [{"week": label, "total": round(total, 2)} for label, total in sorted_weeks]
