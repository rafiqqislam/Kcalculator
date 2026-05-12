from backend.models.schemas import NutrientGap, BodySystemStatus, HealthReport

NUTRIENT_INFO: dict[str, dict] = {
    "omega3": {
        "label": "Omega-3",
        "body_parts": ["Brain", "Heart"],
        "health_benefits": "Supports brain function, reduces inflammation, and keeps your heart healthy",
        "food_sources": "salmon, sardines, walnuts, flaxseed, chia seeds",
    },
    "vitamin_c": {
        "label": "Vitamin C",
        "body_parts": ["Immune System", "Skin & Hair"],
        "health_benefits": "Boosts immunity, helps skin stay healthy, and aids iron absorption",
        "food_sources": "oranges, bell peppers, strawberries, broccoli, kiwi",
    },
    "calcium": {
        "label": "Calcium",
        "body_parts": ["Bones", "Muscles"],
        "health_benefits": "Keeps bones and teeth strong, and supports muscle contraction",
        "food_sources": "milk, yogurt, cheese, leafy greens, tofu",
    },
    "iron": {
        "label": "Iron",
        "body_parts": ["Energy", "Blood"],
        "health_benefits": "Carries oxygen through your blood and keeps energy levels steady",
        "food_sources": "red meat, spinach, lentils, tofu, fortified cereals",
    },
    "vitamin_a": {
        "label": "Vitamin A",
        "body_parts": ["Eyes", "Skin & Hair", "Immune System"],
        "health_benefits": "Protects your eyesight, keeps skin healthy, and supports immunity",
        "food_sources": "carrots, sweet potato, spinach, eggs, dairy",
    },
    "vitamin_d": {
        "label": "Vitamin D",
        "body_parts": ["Bones", "Immune System"],
        "health_benefits": "Helps absorb calcium for strong bones and supports immune health",
        "food_sources": "oily fish, eggs, fortified milk, mushrooms",
    },
    "fibre": {
        "label": "Fibre",
        "body_parts": ["Gut", "Heart"],
        "health_benefits": "Feeds good gut bacteria, lowers cholesterol, and keeps digestion smooth",
        "food_sources": "lentils, oats, apples, broccoli, whole grains",
    },
    "protein": {
        "label": "Protein",
        "body_parts": ["Muscles", "Skin & Hair"],
        "health_benefits": "Builds and repairs muscles, and keeps hair and skin strong",
        "food_sources": "meat, fish, eggs, dairy, legumes, tofu",
    },
    "magnesium": {
        "label": "Magnesium",
        "body_parts": ["Muscles", "Brain", "Heart"],
        "health_benefits": "Supports nerve function, muscle relaxation, and sleep quality",
        "food_sources": "nuts, seeds, dark chocolate, leafy greens, whole grains",
    },
    "potassium": {
        "label": "Potassium",
        "body_parts": ["Heart", "Muscles"],
        "health_benefits": "Regulates blood pressure and keeps your heart rhythm steady",
        "food_sources": "bananas, sweet potato, avocado, spinach, beans",
    },
    "zinc": {
        "label": "Zinc",
        "body_parts": ["Immune System", "Skin & Hair", "Eyes"],
        "health_benefits": "Fights off illness, heals wounds, and supports healthy vision",
        "food_sources": "meat, shellfish, pumpkin seeds, legumes, dairy",
    },
    "probiotics": {
        "label": "Probiotics",
        "body_parts": ["Gut", "Immune System"],
        "health_benefits": "Replenishes good gut bacteria, supports digestion and immunity",
        "food_sources": "yogurt, kefir, kimchi, sauerkraut, miso",
    },
    "vitamin_b12": {
        "label": "Vitamin B12",
        "body_parts": ["Brain", "Energy"],
        "health_benefits": "Keeps nerves healthy, helps make red blood cells, and boosts energy",
        "food_sources": "meat, fish, eggs, dairy, fortified cereals",
    },
    "folate": {
        "label": "Folate",
        "body_parts": ["Brain", "Energy"],
        "health_benefits": "Supports healthy blood cells, brain function, and cell repair",
        "food_sources": "leafy greens, lentils, chickpeas, avocado, oranges",
    },
    "antioxidants": {
        "label": "Antioxidants",
        "body_parts": ["Skin & Hair", "Brain", "Heart"],
        "health_benefits": "Protects cells from damage, slows aging, and reduces inflammation",
        "food_sources": "berries, dark chocolate, green tea, nuts, colourful vegetables",
    },
    "vitamin_e": {
        "label": "Vitamin E",
        "body_parts": ["Skin & Hair", "Immune System"],
        "health_benefits": "Protects skin from damage and supports immune function",
        "food_sources": "nuts, seeds, avocado, olive oil, spinach",
    },
    "selenium": {
        "label": "Selenium",
        "body_parts": ["Immune System"],
        "health_benefits": "Supports thyroid health and protects cells from damage",
        "food_sources": "Brazil nuts, seafood, eggs, sunflower seeds",
    },
    "vitamin_k": {
        "label": "Vitamin K",
        "body_parts": ["Bones"],
        "health_benefits": "Essential for blood clotting and maintaining bone density",
        "food_sources": "leafy greens, broccoli, fermented foods, olive oil",
    },
    "biotin": {
        "label": "Biotin",
        "body_parts": ["Skin & Hair", "Energy"],
        "health_benefits": "Keeps hair and nails strong, and helps convert food into energy",
        "food_sources": "eggs, nuts, seeds, sweet potato, salmon",
    },
    "prebiotics": {
        "label": "Prebiotics",
        "body_parts": ["Gut"],
        "health_benefits": "Feeds beneficial gut bacteria and improves digestive health",
        "food_sources": "garlic, onions, asparagus, bananas, oats",
    },
}

BODY_SYSTEMS: dict[str, dict] = {
    "Brain": {
        "emoji": "🧠",
        "nutrients_needed": ["omega3", "vitamin_b12", "magnesium", "folate", "antioxidants"],
        "min_coverage": 2,
    },
    "Heart": {
        "emoji": "❤️",
        "nutrients_needed": ["omega3", "potassium", "fibre", "magnesium", "antioxidants"],
        "min_coverage": 2,
    },
    "Bones": {
        "emoji": "🦴",
        "nutrients_needed": ["calcium", "vitamin_d", "vitamin_k", "magnesium"],
        "min_coverage": 2,
    },
    "Muscles": {
        "emoji": "💪",
        "nutrients_needed": ["protein", "iron", "magnesium", "potassium", "calcium"],
        "min_coverage": 2,
    },
    "Eyes": {
        "emoji": "👁️",
        "nutrients_needed": ["vitamin_a", "zinc", "antioxidants"],
        "min_coverage": 1,
    },
    "Immune System": {
        "emoji": "🛡️",
        "nutrients_needed": ["vitamin_c", "vitamin_d", "zinc", "selenium", "vitamin_a"],
        "min_coverage": 2,
    },
    "Energy": {
        "emoji": "⚡",
        "nutrients_needed": ["iron", "vitamin_b12", "folate", "protein", "biotin"],
        "min_coverage": 2,
    },
    "Gut": {
        "emoji": "🫁",
        "nutrients_needed": ["fibre", "probiotics", "prebiotics"],
        "min_coverage": 1,
    },
    "Skin & Hair": {
        "emoji": "✨",
        "nutrients_needed": ["biotin", "vitamin_e", "zinc", "vitamin_a", "omega3", "vitamin_c"],
        "min_coverage": 2,
    },
}


def analyze_health(
    present_nutrient_tags: list[str],
    nutrient_last_seen: dict[str, int],
) -> HealthReport:
    present = set(present_nutrient_tags)
    body_systems = []

    for system_name, system_data in BODY_SYSTEMS.items():
        needed = system_data["nutrients_needed"]
        covered = [n for n in needed if n in present]
        missing = [n for n in needed if n not in present]

        if len(covered) >= system_data["min_coverage"]:
            status = "good"
        elif len(covered) > 0:
            status = "partial"
        else:
            status = "missing"

        body_systems.append(
            BodySystemStatus(
                name=system_name,
                emoji=system_data["emoji"],
                status=status,
                covered_nutrients=covered,
                missing_nutrients=missing,
            )
        )

    all_needed = {n for s in BODY_SYSTEMS.values() for n in s["nutrients_needed"]}
    nutrient_gaps = [
        NutrientGap(
            nutrient=nutrient,
            label=NUTRIENT_INFO[nutrient]["label"],
            body_parts=NUTRIENT_INFO[nutrient]["body_parts"],
            health_benefits=NUTRIENT_INFO[nutrient]["health_benefits"],
            food_sources=NUTRIENT_INFO[nutrient]["food_sources"],
            last_seen_days_ago=nutrient_last_seen.get(nutrient),
        )
        for nutrient in all_needed
        if nutrient not in present and nutrient in NUTRIENT_INFO
    ]

    good = sum(1 for s in body_systems if s.status == "good")
    partial = sum(1 for s in body_systems if s.status == "partial")
    total = len(body_systems)
    score = int((good + partial * 0.5) / total * 100)

    if score >= 80:
        summary = f"Your groceries are covering {good} out of {total} health areas well. Strong shop!"
    elif score >= 50:
        summary = f"You're covering {good} health areas well, with {partial} that could use a little more attention."
    else:
        missing_count = sum(1 for s in body_systems if s.status == "missing")
        summary = f"{missing_count} health areas aren't getting enough attention — a few simple additions next shop would make a real difference."

    return HealthReport(
        body_systems=body_systems,
        nutrient_gaps=nutrient_gaps,
        overall_score=score,
        summary_message=summary,
    )
