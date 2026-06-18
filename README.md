# ELD Trip Planner

FMCSA Hours of Service compliant trip planning tool built with Django + React.

## Features
- 🗺️ Interactive route map (OpenStreetMap/OSRM — no API key needed)
- 📋 Auto-generated ELD daily log sheets drawn on canvas
- ⏱️ Full HOS compliance: 11h driving, 14h window, 10h rest, 30-min break, 70h/8-day cycle
- ⛽ Fuel stops every 1,000 miles
- 📦 1-hour pickup and 1-hour dropoff time

## Quick Start

### Backend (Django)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## HOS Rules Applied (70hrs/8days — Property Carrier)
- Max 11 hours driving per shift
- 14-hour on-duty window
- 10-hour mandatory off-duty rest
- 30-minute break required after 8 hours driving
- 70-hour / 8-day cycle limit
- Fuel stop every 1,000 miles
- 1 hour for pickup and dropoff each

## Tech Stack
- **Backend**: Django, Django REST Framework, OSRM (routing), Nominatim (geocoding)
- **Frontend**: React 19, Vite, Leaflet.js, Canvas API for ELD logs
