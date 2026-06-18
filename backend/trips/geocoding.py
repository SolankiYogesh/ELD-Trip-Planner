"""
Geocoding and routing using free OpenStreetMap / OSRM APIs.
No API key required.
"""
import requests
import math
from typing import Optional, Tuple, List

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

HEADERS = {
    'User-Agent': 'ELD-TripPlanner/1.0 (educational project)',
    'Accept-Language': 'en',
}


def geocode(location: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a location string to (lat, lon).
    Returns None if geocoding fails.
    """
    try:
        params = {
            'q': location,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'us',
        }
        resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        results = resp.json()
        if results:
            lat = float(results[0]['lat'])
            lon = float(results[0]['lon'])
            return (lat, lon)
        # Try without country restriction
        params.pop('countrycodes', None)
        resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        results = resp.json()
        if results:
            return (float(results[0]['lat']), float(results[0]['lon']))
    except Exception as e:
        print(f'Geocoding error for "{location}": {e}')
    return None


def get_route(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
) -> Optional[dict]:
    """
    Get driving route between two (lat, lon) points using OSRM.
    Returns dict with 'distance_miles', 'duration_hours', 'coordinates'.
    """
    try:
        # OSRM expects lon,lat
        coords = f'{origin[1]},{origin[0]};{destination[1]},{destination[0]}'
        url = f'{OSRM_URL}/{coords}'
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'false',
        }
        resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        if data.get('code') == 'Ok' and data.get('routes'):
            route = data['routes'][0]
            distance_m = route['distance']
            duration_s = route['duration']
            coordinates = route['geometry']['coordinates']  # [[lon, lat], ...]

            # Convert to [lat, lon] format for Leaflet
            coords_latlon = [[c[1], c[0]] for c in coordinates]

            return {
                'distance_miles': distance_m * 0.000621371,
                'duration_hours': duration_s / 3600,
                'coordinates': coords_latlon,
            }
    except Exception as e:
        print(f'Routing error: {e}')

    return None


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Fallback distance calculation using Haversine formula."""
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))
