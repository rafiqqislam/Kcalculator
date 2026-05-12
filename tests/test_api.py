"""Integration tests for the FastAPI routes using TestClient with mocked services."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.schemas import ParsedReceipt, ReceiptItem

client = TestClient(app)

FAKE_ITEM = ReceiptItem(name="Organic Apples", price=3.99, food_group="produce", nutrient_tags=["vitamin_c", "fibre"])
FAKE_RECEIPT = ParsedReceipt(store_name="Tesco", purchased_at="2026-05-07", total_amount=94.50, items=[FAKE_ITEM])


# ── Health check ───────────────────────────────────────────────────────────

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── Upload: validation ─────────────────────────────────────────────────────

def test_upload_rejects_wrong_file_type():
    res = client.post(
        "/api/receipts/upload",
        files={"file": ("doc.pdf", b"fake-pdf", "application/pdf")},
    )
    assert res.status_code == 400
    assert "JPEG" in res.json()["detail"]


def test_upload_rejects_no_content_type():
    res = client.post(
        "/api/receipts/upload",
        files={"file": ("image.bin", b"bytes", None)},
    )
    assert res.status_code == 400


def test_upload_rejects_file_over_10mb():
    large = b"x" * (10 * 1024 * 1024 + 1)
    res = client.post(
        "/api/receipts/upload",
        files={"file": ("big.jpg", large, "image/jpeg")},
    )
    assert res.status_code == 400
    assert "10 MB" in res.json()["detail"]


def test_upload_accepts_heif():
    with (
        patch("backend.routes.receipts.claude_service.parse_receipt", return_value=FAKE_RECEIPT),
        patch("backend.routes.receipts.supabase_service.upload_receipt_image", return_value="https://example.com/img.jpg"),
    ):
        res = client.post(
            "/api/receipts/upload",
            files={"file": ("photo.heif", b"fake-heif", "image/heif")},
        )
    assert res.status_code == 200


# ── Upload: success path ───────────────────────────────────────────────────

def test_upload_success_returns_parsed_receipt():
    with (
        patch("backend.routes.receipts.claude_service.parse_receipt", return_value=FAKE_RECEIPT),
        patch("backend.routes.receipts.supabase_service.upload_receipt_image", return_value="https://example.com/img.jpg"),
    ):
        res = client.post(
            "/api/receipts/upload",
            files={"file": ("receipt.jpg", b"fake-jpeg", "image/jpeg")},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["store_name"] == "Tesco"
    assert data["total_amount"] == 94.50
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Organic Apples"
    assert data["image_url"] == "https://example.com/img.jpg"


def test_upload_still_succeeds_when_image_storage_fails():
    with (
        patch("backend.routes.receipts.claude_service.parse_receipt", return_value=FAKE_RECEIPT),
        patch("backend.routes.receipts.supabase_service.upload_receipt_image", side_effect=Exception("storage down")),
    ):
        res = client.post(
            "/api/receipts/upload",
            files={"file": ("receipt.jpg", b"fake-jpeg", "image/jpeg")},
        )
    assert res.status_code == 200
    assert res.json()["image_url"] is None


def test_upload_returns_500_when_claude_fails():
    with patch("backend.routes.receipts.claude_service.parse_receipt", side_effect=Exception("API error")):
        res = client.post(
            "/api/receipts/upload",
            files={"file": ("receipt.jpg", b"fake-jpeg", "image/jpeg")},
        )
    assert res.status_code == 500
    assert "receipt" in res.json()["detail"].lower()


def test_upload_returns_422_when_claude_cant_read_receipt():
    with patch("backend.routes.receipts.claude_service.parse_receipt", side_effect=ValueError("no JSON")):
        res = client.post(
            "/api/receipts/upload",
            files={"file": ("receipt.jpg", b"fake-jpeg", "image/jpeg")},
        )
    assert res.status_code == 422


# ── Confirm receipt ────────────────────────────────────────────────────────

def test_confirm_saves_and_returns_id():
    with patch("backend.routes.receipts.supabase_service.save_receipt", return_value={"id": "abc-123"}):
        res = client.post("/api/receipts/confirm", json={
            "store_name": "Tesco",
            "purchased_at": "2026-05-07",
            "total_amount": 94.50,
            "items": [{"name": "Apples", "price": 3.99, "food_group": "produce", "nutrient_tags": []}],
        })
    assert res.status_code == 200
    assert res.json()["id"] == "abc-123"


def test_confirm_returns_500_on_db_failure():
    with patch("backend.routes.receipts.supabase_service.save_receipt", side_effect=Exception("db down")):
        res = client.post("/api/receipts/confirm", json={
            "store_name": "Tesco",
            "purchased_at": "2026-05-07",
            "total_amount": 50.00,
            "items": [],
        })
    assert res.status_code == 500


# ── List receipts ──────────────────────────────────────────────────────────

def test_list_receipts_returns_data():
    fake_receipts = [{"id": "1", "store_name": "Tesco", "purchased_at": "2026-05-07", "total_amount": 94.50}]
    with patch("backend.routes.receipts.supabase_service.get_receipts", return_value=fake_receipts):
        res = client.get("/api/receipts")
    assert res.status_code == 200
    assert res.json()[0]["store_name"] == "Tesco"


def test_list_receipts_returns_empty_list():
    with patch("backend.routes.receipts.supabase_service.get_receipts", return_value=[]):
        res = client.get("/api/receipts")
    assert res.status_code == 200
    assert res.json() == []


# ── Dashboard ──────────────────────────────────────────────────────────────

FAKE_DASHBOARD_DATA = {
    "receipts": [{"id": "1", "purchased_at": "2026-05-07", "total_amount": "94.50", "store_name": "Tesco", "image_url": None, "created_at": "2026-05-07T10:00:00Z"}],
    "items": [{"id": "a", "receipt_id": "1", "food_group": "produce", "price": "3.99", "nutrient_tags": ["vitamin_c", "fibre"]}],
    "total_spent": 94.50,
}


def test_dashboard_summary_returns_expected_shape():
    with (
        patch("backend.routes.dashboard.supabase_service.get_dashboard_data", return_value=FAKE_DASHBOARD_DATA),
        patch("backend.routes.dashboard.supabase_service.get_nutrient_last_seen", return_value={}),
    ):
        res = client.get("/api/dashboard/summary?days=30")
    assert res.status_code == 200
    data = res.json()
    assert "total_spent" in data
    assert "spending_by_group" in data
    assert "health_report" in data
    assert "weekly_trend" in data
    assert "recent_receipts" in data


def test_dashboard_empty_when_no_receipts():
    empty = {"receipts": [], "items": [], "total_spent": 0.0}
    with (
        patch("backend.routes.dashboard.supabase_service.get_dashboard_data", return_value=empty),
        patch("backend.routes.dashboard.supabase_service.get_nutrient_last_seen", return_value={}),
    ):
        res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    assert res.json()["total_receipts"] == 0


def test_dashboard_rejects_invalid_days_param():
    res = client.get("/api/dashboard/summary?days=3")
    assert res.status_code == 422


def test_dashboard_total_spent_matches_input():
    with (
        patch("backend.routes.dashboard.supabase_service.get_dashboard_data", return_value=FAKE_DASHBOARD_DATA),
        patch("backend.routes.dashboard.supabase_service.get_nutrient_last_seen", return_value={}),
    ):
        res = client.get("/api/dashboard/summary?days=30")
    assert res.json()["total_spent"] == 94.50


# ── Classify item ─────────────────────────────────────────────────────────

FAKE_CLASSIFY = {"food_group": "produce", "nutrient_tags": ["vitamin_c", "fibre"]}


def test_classify_returns_classification_from_cache():
    with patch("backend.routes.items.supabase_service.lookup_item_cache", return_value=FAKE_CLASSIFY):
        res = client.post("/api/items/classify", json={"name": "Apple"})
    assert res.status_code == 200
    data = res.json()
    assert data["food_group"] == "produce"
    assert "vitamin_c" in data["nutrient_tags"]
    assert data["cached"] is True


def test_classify_calls_claude_when_cache_misses():
    with (
        patch("backend.routes.items.supabase_service.lookup_item_cache", return_value=None),
        patch("backend.routes.items.claude_service.classify_item", return_value=FAKE_CLASSIFY),
    ):
        res = client.post("/api/items/classify", json={"name": "Fresh spinach"})
    assert res.status_code == 200
    data = res.json()
    assert data["food_group"] == "produce"
    assert data["cached"] is False


def test_classify_rejects_empty_name():
    res = client.post("/api/items/classify", json={"name": "   "})
    assert res.status_code == 400


def test_classify_returns_500_when_claude_fails():
    with (
        patch("backend.routes.items.supabase_service.lookup_item_cache", return_value=None),
        patch("backend.routes.items.claude_service.classify_item", side_effect=Exception("API error")),
    ):
        res = client.post("/api/items/classify", json={"name": "Mystery item"})
    assert res.status_code == 500


# ── Pages served ──────────────────────────────────────────────────────────

def test_home_page_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]


def test_review_page_served():
    res = client.get("/review")
    assert res.status_code == 200


def test_dashboard_page_served():
    res = client.get("/dashboard")
    assert res.status_code == 200


def test_manual_page_served():
    res = client.get("/manual")
    assert res.status_code == 200
