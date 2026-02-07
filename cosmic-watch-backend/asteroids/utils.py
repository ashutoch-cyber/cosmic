def calculate_risk(asteroid):
    diameter = asteroid['estimated_diameter']['kilometers']['estimated_diameter_max']
    hazardous = asteroid['is_potentially_hazardous_asteroid']

    score = 0
    if diameter > 0.5:
        score += 50
    if hazardous:
        score += 50

    return {
        "risk_score": score,
        "level": "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW"
    }
def calculate_risk(diameter, miss_distance, hazardous):
    score = 0

    if diameter > 0.5:
        score += 40
    if hazardous:
        score += 40
    if float(miss_distance) < 750000:
        score += 20

    level = "LOW"
    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"

    return score, level

