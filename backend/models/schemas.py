from typing import Optional
from pydantic import BaseModel


class ReceiptItem(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    price: float
    food_group: str
    nutrient_tags: list[str] = []
    confidence: str = "high"


class ParsedReceipt(BaseModel):
    store_name: Optional[str] = None
    purchased_at: Optional[str] = None
    total_amount: Optional[float] = None
    items: list[ReceiptItem]


class ConfirmReceiptRequest(BaseModel):
    store_name: Optional[str] = None
    purchased_at: Optional[str] = None
    total_amount: Optional[float] = None
    image_url: Optional[str] = None
    items: list[ReceiptItem]


class NutrientGap(BaseModel):
    nutrient: str
    label: str
    body_parts: list[str]
    health_benefits: str
    food_sources: str
    last_seen_days_ago: Optional[int] = None


class BodySystemStatus(BaseModel):
    name: str
    emoji: str
    status: str  # "good" | "partial" | "missing"
    covered_nutrients: list[str]
    missing_nutrients: list[str]


class HealthReport(BaseModel):
    body_systems: list[BodySystemStatus]
    nutrient_gaps: list[NutrientGap]
    overall_score: int
    summary_message: str
