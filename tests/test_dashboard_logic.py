"""Unit tests for pure dashboard aggregation functions — no external dependencies."""
from datetime import date, timedelta

import pytest

from backend.routes.dashboard import _aggregate_spending, _build_weekly_trend


# ── _aggregate_spending ────────────────────────────────────────────────────

def test_aggregate_empty_items():
    assert _aggregate_spending([], 0) == []


def test_aggregate_single_group():
    items = [
        {"food_group": "produce", "price": "5.00"},
        {"food_group": "produce", "price": "3.00"},
    ]
    result = _aggregate_spending(items, 8.00)
    assert len(result) == 1
    assert result[0]["food_group"] == "produce"
    assert result[0]["total"] == 8.00
    assert result[0]["percentage"] == 100.0
    assert result[0]["item_count"] == 2


def test_aggregate_multiple_groups():
    items = [
        {"food_group": "produce", "price": "10.00"},
        {"food_group": "protein", "price": "30.00"},
    ]
    result = _aggregate_spending(items, 40.00)
    assert len(result) == 2
    protein = next(r for r in result if r["food_group"] == "protein")
    produce = next(r for r in result if r["food_group"] == "produce")
    assert protein["total"] == 30.00
    assert produce["total"] == 10.00
    assert abs(protein["percentage"] - 75.0) < 0.1
    assert abs(produce["percentage"] - 25.0) < 0.1


def test_aggregate_sorted_by_total_descending():
    items = [
        {"food_group": "produce", "price": "5.00"},
        {"food_group": "protein", "price": "20.00"},
        {"food_group": "dairy",   "price": "10.00"},
    ]
    result = _aggregate_spending(items, 35.00)
    totals = [r["total"] for r in result]
    assert totals == sorted(totals, reverse=True)


def test_aggregate_handles_none_price():
    items = [{"food_group": "produce", "price": None}]
    result = _aggregate_spending(items, 0)
    assert result[0]["total"] == 0.0


def test_aggregate_percentage_zero_when_total_zero():
    items = [{"food_group": "produce", "price": "0.00"}]
    result = _aggregate_spending(items, 0)
    assert result[0]["percentage"] == 0


def test_aggregate_counts_items_per_group():
    items = [{"food_group": "produce", "price": str(i)} for i in range(5)]
    result = _aggregate_spending(items, 10.00)
    assert result[0]["item_count"] == 5


# ── _build_weekly_trend ────────────────────────────────────────────────────

def test_trend_empty_receipts():
    assert _build_weekly_trend([]) == []


def test_trend_single_receipt():
    today = date.today()
    result = _build_weekly_trend([{"purchased_at": today.isoformat(), "total_amount": "50.00"}])
    assert len(result) == 1
    assert result[0]["total"] == 50.00


def test_trend_two_receipts_same_week_summed():
    monday = date.today() - timedelta(days=date.today().weekday())
    tuesday = monday + timedelta(days=1)
    receipts = [
        {"purchased_at": monday.isoformat(),  "total_amount": "40.00"},
        {"purchased_at": tuesday.isoformat(), "total_amount": "35.00"},
    ]
    result = _build_weekly_trend(receipts)
    assert len(result) == 1
    assert result[0]["total"] == 75.00


def test_trend_different_weeks_separate_entries():
    week1 = date.today() - timedelta(weeks=2)
    week2 = date.today() - timedelta(weeks=1)
    receipts = [
        {"purchased_at": week1.isoformat(), "total_amount": "60.00"},
        {"purchased_at": week2.isoformat(), "total_amount": "80.00"},
    ]
    result = _build_weekly_trend(receipts)
    assert len(result) == 2


def test_trend_max_8_weeks():
    receipts = [
        {"purchased_at": (date.today() - timedelta(weeks=i)).isoformat(), "total_amount": "50.00"}
        for i in range(12)
    ]
    result = _build_weekly_trend(receipts)
    assert len(result) <= 8


def test_trend_chronological_order():
    receipts = [
        {"purchased_at": (date.today() - timedelta(weeks=i)).isoformat(), "total_amount": "50.00"}
        for i in range(4)
    ]
    result = _build_weekly_trend(receipts)
    # Weeks should be in ascending order (oldest first)
    assert result == sorted(result, key=lambda r: r["week"])


def test_trend_skips_receipts_without_date():
    receipts = [
        {"purchased_at": None, "total_amount": "50.00"},
        {"purchased_at": date.today().isoformat(), "total_amount": "30.00"},
    ]
    result = _build_weekly_trend(receipts)
    assert len(result) == 1
    assert result[0]["total"] == 30.00


def test_trend_handles_none_total():
    result = _build_weekly_trend([
        {"purchased_at": date.today().isoformat(), "total_amount": None}
    ])
    assert result[0]["total"] == 0.00
