from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .geocoding import geocode, get_route, haversine_miles
from .hos_calculator import calculate_trip, serialize_trip_plan


@api_view(['POST'])
def plan_trip(request):
    """
    Main trip planning endpoint.
    
    Expected JSON body:
    {
        "current_location": "Chicago, IL",
        "pickup_location": "Detroit, MI",
        "dropoff_location": "New York, NY",
        "current_cycle_used": 20.5
    }
    """
    data = request.data

    current_location = data.get('current_location', '').strip()
    pickup_location = data.get('pickup_location', '').strip()
    dropoff_location = data.get('dropoff_location', '').strip()

    try:
        current_cycle_used = float(data.get('current_cycle_used', 0))
    except (ValueError, TypeError):
        current_cycle_used = 0.0

    # Validation
    if not current_location or not pickup_location or not dropoff_location:
        return Response(
            {'error': 'current_location, pickup_location, and dropoff_location are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if current_cycle_used < 0 or current_cycle_used > 70:
        return Response(
            {'error': 'current_cycle_used must be between 0 and 70 hours.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Step 1: Geocode all locations
    current_coords = geocode(current_location)
    pickup_coords = geocode(pickup_location)
    dropoff_coords = geocode(dropoff_location)

    if not current_coords:
        return Response(
            {'error': f'Could not geocode current location: "{current_location}". Please use a more specific address.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not pickup_coords:
        return Response(
            {'error': f'Could not geocode pickup location: "{pickup_location}". Please use a more specific address.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not dropoff_coords:
        return Response(
            {'error': f'Could not geocode dropoff location: "{dropoff_location}". Please use a more specific address.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Step 2: Get routes
    route_to_pickup = get_route(current_coords, pickup_coords)
    route_to_dropoff = get_route(pickup_coords, dropoff_coords)

    # Fallback to haversine if OSRM fails
    if route_to_pickup:
        dist_to_pickup = route_to_pickup['distance_miles']
        coords_to_pickup = route_to_pickup['coordinates']
    else:
        dist_to_pickup = haversine_miles(*current_coords, *pickup_coords)
        coords_to_pickup = [list(current_coords), list(pickup_coords)]

    if route_to_dropoff:
        dist_to_dropoff = route_to_dropoff['distance_miles']
        coords_to_dropoff = route_to_dropoff['coordinates']
    else:
        dist_to_dropoff = haversine_miles(*pickup_coords, *dropoff_coords)
        coords_to_dropoff = [list(pickup_coords), list(dropoff_coords)]

    # Step 3: Calculate trip plan with HOS rules
    trip_plan = calculate_trip(
        current_location=current_location,
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        current_cycle_used=current_cycle_used,
        distance_to_pickup_miles=dist_to_pickup,
        distance_pickup_to_dropoff_miles=dist_to_dropoff,
        route_coords_to_pickup=coords_to_pickup,
        route_coords_to_dropoff=coords_to_dropoff,
        pickup_coords=pickup_coords,
        dropoff_coords=dropoff_coords,
        current_coords=current_coords,
    )

    # Step 4: Serialize and return
    result = serialize_trip_plan(trip_plan)
    result['locations'] = {
        'current': {
            'name': current_location,
            'coordinates': list(current_coords),
        },
        'pickup': {
            'name': pickup_location,
            'coordinates': list(pickup_coords),
        },
        'dropoff': {
            'name': dropoff_location,
            'coordinates': list(dropoff_coords),
        },
    }

    return Response(result)


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({'status': 'ok', 'message': 'ELD Trip Planner API is running'})
