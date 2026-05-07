import base64
import json
import re

from anthropic import Anthropic

from backend.config import get_settings
from backend.models.schemas import ParsedReceipt, ReceiptItem

# This prompt is the core IP of the app.
# It handles OCR, parsing, categorisation, and nutrient tagging in one call.
RECEIPT_PARSE_PROMPT = """You are analysing a grocery receipt image.

Extract all purchased items and return a single JSON object with this exact structure:
{
  "store_name": "store name or null",
  "purchased_at": "YYYY-MM-DD or null",
  "total_amount": 0.00,
  "items": [
    {
      "name": "clean readable item name",
      "quantity": 1.0,
      "unit": "kg/g/L/ml/pcs/pack or null",
      "price": 0.00,
      "food_group": "produce|protein|dairy|grains|snacks|beverages|condiments|non_food",
      "nutrient_tags": ["relevant nutrients from the allowed list"],
      "confidence": "high|medium|low"
    }
  ]
}

Food group definitions:
- produce: fresh/frozen fruits, vegetables, herbs, salads
- protein: meat, fish, seafood, eggs, legumes, tofu, nuts, seeds
- dairy: milk, cheese, yogurt, butter, cream, dairy alternatives
- grains: bread, rice, pasta, cereals, flour, oats, crackers, wraps
- snacks: chips, cookies, candy, chocolate, processed snacks, desserts
- beverages: juice, water, coffee, tea, fizzy drinks, alcohol
- condiments: sauces, oils, spices, seasonings, spreads, vinegar, stock
- non_food: cleaning products, personal care, household items, bags, batteries

Allowed nutrient tags (use only from this list, pick all that apply):
vitamin_a, vitamin_b12, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
calcium, iron, magnesium, potassium, zinc, selenium,
omega3, fibre, protein, probiotics, prebiotics, folate, biotin, antioxidants

Rules:
- Skip tax lines, bag fees, loyalty discounts, subtotals, and receipt headers
- Normalise item names: remove store codes, PLU numbers, abbreviations
  Example: "Org Gala Apples 4pk" → name: "Organic Gala Apples"
- Assign nutrient tags based on the food, not the brand
  Example: "Organic Gala Apples" → ["vitamin_c", "fibre", "antioxidants"]
- If uncertain about an item, still include it with confidence: "low"
- Return ONLY valid JSON. No explanation, no markdown fences."""


def parse_receipt(image_bytes: bytes, content_type: str) -> ParsedReceipt:
    client = Anthropic(api_key=get_settings().anthropic_api_key)
    encoded = base64.standard_b64encode(image_bytes).decode("utf-8")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": content_type,
                            "data": encoded,
                        },
                    },
                    {"type": "text", "text": RECEIPT_PARSE_PROMPT},
                ],
            }
        ],
    )

    response_text = message.content[0].text

    # Extract JSON even if Claude wraps it in markdown code fences
    json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if not json_match:
        raise ValueError("Could not read the receipt — please try a clearer photo")

    raw = json.loads(json_match.group())

    items = [
        ReceiptItem(
            name=item.get("name", "Unknown item"),
            quantity=item.get("quantity"),
            unit=item.get("unit"),
            price=float(item.get("price") or 0),
            food_group=item.get("food_group", "non_food"),
            nutrient_tags=item.get("nutrient_tags") or [],
            confidence=item.get("confidence", "high"),
        )
        for item in raw.get("items", [])
    ]

    return ParsedReceipt(
        store_name=raw.get("store_name"),
        purchased_at=raw.get("purchased_at"),
        total_amount=raw.get("total_amount"),
        items=items,
    )
