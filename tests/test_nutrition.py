"""Unit tests for the nutrition analysis service — no external dependencies."""
import pytest

from backend.services.nutrition_service import analyze_health, BODY_SYSTEMS, NUTRIENT_INFO


ALL_NUTRIENTS = list({n for s in BODY_SYSTEMS.values() for n in s["nutrients_needed"]})


# ── Coverage & scoring ─────────────────────────────────────────────────────

def test_perfect_coverage_scores_100():
    report = analyze_health(ALL_NUTRIENTS, {})
    assert report.overall_score == 100


def test_zero_coverage_scores_0():
    report = analyze_health([], {})
    assert report.overall_score == 0


def test_score_is_between_0_and_100():
    report = analyze_health(["protein", "calcium", "iron"], {})
    assert 0 <= report.overall_score <= 100


def test_more_nutrients_gives_higher_score():
    low  = analyze_health(["protein"], {}).overall_score
    high = analyze_health(["protein", "calcium", "iron", "fibre", "omega3"], {}).overall_score
    assert high >= low


# ── Body system statuses ───────────────────────────────────────────────────

def test_all_systems_good_when_fully_covered():
    report = analyze_health(ALL_NUTRIENTS, {})
    assert all(s.status == "good" for s in report.body_systems)


def test_all_systems_missing_when_no_nutrients():
    report = analyze_health([], {})
    assert all(s.status == "missing" for s in report.body_systems)


def test_muscles_good_with_sufficient_nutrients():
    # Muscles needs protein, iron, magnesium, potassium, calcium (min 2)
    report = analyze_health(["protein", "iron"], {})
    muscles = next(s for s in report.body_systems if s.name == "Muscles")
    assert muscles.status == "good"


def test_muscles_partial_with_one_nutrient():
    report = analyze_health(["protein"], {})
    muscles = next(s for s in report.body_systems if s.name == "Muscles")
    assert muscles.status == "partial"


def test_eyes_good_with_one_nutrient():
    # Eyes has min_coverage=1
    report = analyze_health(["vitamin_a"], {})
    eyes = next(s for s in report.body_systems if s.name == "Eyes")
    assert eyes.status == "good"


def test_all_nine_body_systems_present():
    report = analyze_health([], {})
    names = {s.name for s in report.body_systems}
    expected = {"Brain", "Heart", "Bones", "Muscles", "Eyes", "Immune System", "Energy", "Gut", "Skin & Hair"}
    assert names == expected


def test_covered_and_missing_nutrients_are_disjoint():
    report = analyze_health(["protein", "calcium"], {})
    for system in report.body_systems:
        assert set(system.covered_nutrients).isdisjoint(set(system.missing_nutrients))


def test_covered_nutrients_are_subset_of_input():
    nutrients = ["protein", "calcium"]
    report = analyze_health(nutrients, {})
    for system in report.body_systems:
        assert all(n in nutrients for n in system.covered_nutrients)


# ── Nutrient gaps ──────────────────────────────────────────────────────────

def test_no_gaps_when_fully_covered():
    report = analyze_health(ALL_NUTRIENTS, {})
    assert report.nutrient_gaps == []


def test_gaps_present_when_nutrients_missing():
    report = analyze_health([], {})
    assert len(report.nutrient_gaps) > 0


def test_gaps_have_required_fields():
    report = analyze_health([], {})
    for gap in report.nutrient_gaps:
        assert gap.label
        assert gap.body_parts
        assert gap.health_benefits
        assert gap.food_sources


def test_gap_last_seen_populated_from_dict():
    report = analyze_health([], {"omega3": 7, "vitamin_c": 14})
    omega3_gap = next((g for g in report.nutrient_gaps if g.nutrient == "omega3"), None)
    assert omega3_gap is not None
    assert omega3_gap.last_seen_days_ago == 7


def test_gap_last_seen_none_when_not_in_dict():
    report = analyze_health([], {})
    for gap in report.nutrient_gaps:
        assert gap.last_seen_days_ago is None


def test_present_nutrient_not_in_gaps():
    report = analyze_health(["omega3"], {})
    gap_nutrients = {g.nutrient for g in report.nutrient_gaps}
    assert "omega3" not in gap_nutrients


# ── Summary messages ───────────────────────────────────────────────────────

def test_summary_message_positive_when_high_score():
    report = analyze_health(ALL_NUTRIENTS, {})
    assert report.summary_message  # not empty
    assert "!" in report.summary_message or "well" in report.summary_message.lower()


def test_summary_message_exists_for_any_input():
    for nutrients in [[], ["protein"], ALL_NUTRIENTS]:
        report = analyze_health(nutrients, {})
        assert isinstance(report.summary_message, str)
        assert len(report.summary_message) > 0


# ── Nutrient info completeness ─────────────────────────────────────────────

def test_all_required_nutrients_have_info():
    for nutrient in ALL_NUTRIENTS:
        assert nutrient in NUTRIENT_INFO, f"Missing NUTRIENT_INFO entry for: {nutrient}"
        info = NUTRIENT_INFO[nutrient]
        assert info["label"]
        assert info["body_parts"]
        assert info["health_benefits"]
        assert info["food_sources"]
