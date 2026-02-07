from rest_framework.views import APIView
from rest_framework.response import Response
from .services import fetch_asteroids
from .utils import calculate_risk


class AsteroidFeedView(APIView):
    def get(self, request):
        raw_data = fetch_asteroids()
        result = []

        for date in raw_data["near_earth_objects"]:
            for a in raw_data["near_earth_objects"][date]:
                close = a["close_approach_data"][0]

                diameter = a["estimated_diameter"]["kilometers"]["estimated_diameter_max"]
                miss_distance = close["miss_distance"]["kilometers"]
                hazardous = a["is_potentially_hazardous_asteroid"]

                risk_score, risk_level = calculate_risk(
                    diameter,
                    miss_distance,
                    hazardous
                )

                result.append({
                    "id": a["id"],
                    "name": a["name"],
                    "date": close["close_approach_date"],
                    "velocity_km_s": close["relative_velocity"]["kilometers_per_second"],
                    "miss_distance_km": miss_distance,
                    "diameter_km": diameter,
                    "hazardous": hazardous,
                    "risk_score": risk_score,
                    "risk_level": risk_level
                })

        return Response(result)
