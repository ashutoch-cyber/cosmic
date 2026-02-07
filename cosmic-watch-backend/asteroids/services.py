import requests
import os
import time

NASA_API_KEY = os.getenv("NASA_API_KEY")

CACHE = {
    "data": None,
    "timestamp": 0
}

CACHE_TTL = 60 * 10  # 10 minutes

def fetch_asteroids():
    now = time.time()

    if CACHE["data"] and now - CACHE["timestamp"] < CACHE_TTL:
        return CACHE["data"]

    url = f"https://api.nasa.gov/neo/rest/v1/feed?api_key={NASA_API_KEY}"
    response = requests.get(url).json()

    CACHE["data"] = response
    CACHE["timestamp"] = now
    return response
