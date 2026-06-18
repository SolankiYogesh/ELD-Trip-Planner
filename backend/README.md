# ELD Trip Planner - Backend

FMCSA-compliant trip planning API for truck drivers. Calculates routes, required rest stops, fuel stops, and generates daily ELD log sheets based on Hours of Service (HOS) regulations.

## Prerequisites

- Python 3.10+

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
```

## Run

```bash
python manage.py runserver
```

Starts the dev server at `http://127.0.0.1:8000/`.

## API Endpoints

### `GET /api/health/`

Health check.

### `POST /api/plan-trip/`

Plan a trip with HOS-compliant stops and ELD logs.

**Request body:**

```json
{
    "current_location": "Chicago, IL",
    "pickup_location": "Detroit, MI",
    "dropoff_location": "New York, NY",
    "current_cycle_used": 20.5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_location` | string | yes | Driver's current location |
| `pickup_location` | string | yes | Cargo pickup address |
| `dropoff_location` | string | yes | Delivery address |
| `current_cycle_used` | float | no (0-70) | Hours already used in current 70hr/8day cycle |

## HOS Rules Applied

- 11-hour daily driving limit
- 14-hour on-duty window
- 10-hour off-duty rest between shifts
- 30-minute break after 8 hours of continuous driving
- 70-hour / 8-day cycle limit
- Fuel stops every 1,000 miles
- 1-hour pickup/dropoff activities

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── trip_planner/          # Django project (settings, urls, wsgi)
└── trips/                 # Main app
    ├── views.py           # API endpoints
    ├── geocoding.py       # Nominatim geocoding + OSRM routing
    ├── hos_calculator.py  # HOS rule engine
    └── urls.py            # App URL routing
```
