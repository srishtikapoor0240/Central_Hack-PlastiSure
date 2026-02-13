from contamination.contamination_detector import detect_contamination
from services.scoring_engine import (
    calculate_recyclability_score,
    get_recommendation
)


def evaluate_recyclability(input_data):

    plastic_type = input_data.get("plastic_type", "OTHER")
    image_path = input_data.get("image_path", None)

    # Step 1: contamination detection
    contamination, cleanliness_factor = detect_contamination(image_path)

    # Step 2: scoring
    score_data = calculate_recyclability_score(
        plastic_type,
        cleanliness_factor
    )

    score = score_data["score"]
    plastic_weight = score_data["plastic_weight"]
    local_factor = score_data["local_factor"]

    # Step 3: recommendation
    recommendation = get_recommendation(score)

    return {
        "plastic_type": plastic_type,
        "contamination": contamination,
        "cleanliness_factor": cleanliness_factor,
        "recyclability_score": score,
        "score_breakdown": {
            "plastic_weight": plastic_weight,
            "cleanliness_factor": cleanliness_factor,
            "local_factor": local_factor
        },
        "recommendation": recommendation
    }
