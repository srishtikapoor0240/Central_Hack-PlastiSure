from services.scoring_config import (
    PLASTIC_TYPE_WEIGHT,
    LOCAL_RECYCLABILITY_MATRIX
)

def calculate_recyclability_score(plastic_type, cleanliness_factor):

    plastic_weight = PLASTIC_TYPE_WEIGHT.get(plastic_type, 0.2)
    local_factor = LOCAL_RECYCLABILITY_MATRIX.get(plastic_type, 0.2)

    score = plastic_weight * cleanliness_factor * local_factor

    return {
        "score": round(score, 2),
        "plastic_weight": plastic_weight,
        "local_factor": local_factor
    }



def get_recommendation(score):

    if score >= 0.75:
        return "Accepted"
    elif score >= 0.4:
        return "Needs cleaning"
    else:
        return "Rejected"
