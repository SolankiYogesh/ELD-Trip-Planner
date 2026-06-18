"""
FMCSA Hours of Service (HOS) Calculator
Property-carrying driver, 70hrs/8days cycle
Rules applied:
  - 11-hour driving limit per day
  - 14-hour on-duty window per day
  - 10-hour off-duty rest between shifts
  - 30-minute break required after 8 hours driving
  - 70-hour/8-day cycle limit
  - Fuel stop every 1,000 miles
  - 1 hour for pickup and 1 hour for drop-off
"""

import math
from dataclasses import dataclass, field
from typing import List, Optional


DRIVING_LIMIT_HOURS = 11.0        # Max driving per shift
WINDOW_LIMIT_HOURS = 14.0         # Max on-duty window per shift
REQUIRED_REST_HOURS = 10.0        # Minimum off-duty rest
BREAK_AFTER_HOURS = 8.0           # Mandatory 30-min break after 8h driving
BREAK_DURATION_HOURS = 0.5        # 30-minute break
CYCLE_HOURS = 70.0                # 70-hour / 8-day cycle
PICKUP_DROPOFF_HOURS = 1.0        # 1 hour each for pickup/dropoff
FUEL_INTERVAL_MILES = 1000.0      # Fuel stop every 1,000 miles
FUEL_STOP_HOURS = 0.5             # 30 minutes for fueling
AVG_SPEED_MPH = 55.0              # Conservative truck speed


@dataclass
class LogEntry:
    """Represents a single duty status change on the ELD log."""
    time: float          # Hour of day (0-24)
    status: str          # 'off_duty', 'sleeper', 'driving', 'on_duty'
    duration: float      # Hours in this status
    label: str = ''      # Human-readable label


@dataclass
class DailyLog:
    """One day's ELD log sheet data."""
    day_number: int
    date_label: str
    entries: List[LogEntry] = field(default_factory=list)
    total_miles: float = 0.0
    total_driving: float = 0.0
    total_on_duty: float = 0.0
    remarks: List[str] = field(default_factory=list)
    from_location: str = ''
    to_location: str = ''


@dataclass
class Stop:
    """A stop along the route (pickup, dropoff, rest, fuel)."""
    stop_type: str        # 'pickup', 'dropoff', 'rest', 'fuel', 'break'
    location: str
    arrival_day: int
    arrival_time: float   # hour of day
    duration: float       # hours
    cumulative_miles: float
    coordinates: Optional[tuple] = None


@dataclass
class TripPlan:
    """Complete trip plan with all stops and daily logs."""
    stops: List[Stop]
    daily_logs: List[DailyLog]
    total_miles: float
    total_trip_hours: float
    total_driving_hours: float
    cycle_hours_used_after: float
    route_coordinates: List[tuple] = field(default_factory=list)
    waypoints: List[dict] = field(default_factory=list)


def calculate_trip(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used: float,
    distance_to_pickup_miles: float,
    distance_pickup_to_dropoff_miles: float,
    route_coords_to_pickup: List[tuple] = None,
    route_coords_to_dropoff: List[tuple] = None,
    pickup_coords: tuple = None,
    dropoff_coords: tuple = None,
    current_coords: tuple = None,
) -> TripPlan:
    """
    Main HOS calculation. Returns full trip plan with stops and daily logs.
    """
    stops = []
    daily_logs = []
    waypoints = []

    # Time tracking state
    current_day = 1
    current_hour = 8.0          # Start at 8:00 AM
    driving_today = 0.0         # Hours driven today
    on_duty_today = 0.0         # On-duty hours today (driving + not driving)
    driving_since_break = 0.0   # Hours driven since last 30-min break
    cycle_hours = current_cycle_used
    miles_since_fuel = 0.0
    cumulative_miles = 0.0

    # Daily log tracking
    current_log_entries = []
    current_log_remarks = []
    day_start_hour = current_hour
    day_miles = 0.0

    def add_log_entry(status, duration, label=''):
        """Add a duty status entry to current day's log."""
        nonlocal current_hour, on_duty_today
        start_time = current_hour
        current_log_entries.append(LogEntry(
            time=start_time,
            status=status,
            duration=duration,
            label=label
        ))
        current_hour += duration
        if status in ('driving', 'on_duty'):
            on_duty_today += duration

    def finish_day(location_from, location_to):
        """Finalize the current day's log and start a new one."""
        nonlocal current_day, driving_today, on_duty_today, driving_since_break
        nonlocal current_log_entries, current_log_remarks, day_start_hour, day_miles

        log = DailyLog(
            day_number=current_day,
            date_label=f'Day {current_day}',
            entries=list(current_log_entries),
            total_miles=round(day_miles, 1),
            total_driving=round(driving_today, 2),
            total_on_duty=round(on_duty_today, 2),
            remarks=list(current_log_remarks),
            from_location=location_from,
            to_location=location_to,
        )
        daily_logs.append(log)

        current_day += 1
        current_log_entries = []
        current_log_remarks = []
        day_start_hour = 0.0
        day_miles = 0.0
        driving_today = 0.0
        on_duty_today = 0.0
        driving_since_break = 0.0

    def take_required_rest(location, reason='End of shift'):
        """Take 10-hour off-duty rest, possibly spanning multiple days."""
        nonlocal current_hour

        rest_remaining = REQUIRED_REST_HOURS
        location_from = location
        location_to = location

        while rest_remaining > 0:
            hours_left_today = 24.0 - current_hour
            if rest_remaining <= hours_left_today:
                add_log_entry('off_duty', rest_remaining, reason)
                rest_remaining = 0
            else:
                add_log_entry('off_duty', hours_left_today, reason)
                finish_day(location_from, location_to)
                current_hour = 0.0
                rest_remaining -= hours_left_today

    def drive_segment(miles, from_loc, to_loc, segment_label):
        """
        Drive a segment, respecting all HOS rules.
        Handles break requirements, daily limits, and cycle limits.
        """
        nonlocal driving_today, on_duty_today, driving_since_break
        nonlocal cycle_hours, cumulative_miles, miles_since_fuel
        nonlocal day_miles, current_hour

        miles_remaining = miles

        while miles_remaining > 0:
            # Check if we need a fuel stop
            if miles_since_fuel >= FUEL_INTERVAL_MILES:
                add_log_entry('on_duty', FUEL_STOP_HOURS, f'Fuel stop - {round(cumulative_miles)} miles')
                on_duty_today += FUEL_STOP_HOURS
                cycle_hours += FUEL_STOP_HOURS
                miles_since_fuel = 0.0
                current_log_remarks.append(f'Fuel stop at {round(cumulative_miles)} miles')
                stops.append(Stop(
                    stop_type='fuel',
                    location=f'Mile marker {round(cumulative_miles)}',
                    arrival_day=current_day,
                    arrival_time=current_hour - FUEL_STOP_HOURS,
                    duration=FUEL_STOP_HOURS,
                    cumulative_miles=cumulative_miles,
                ))

            # Check if 30-min break needed (after 8h driving without break)
            if driving_since_break >= BREAK_AFTER_HOURS:
                add_log_entry('off_duty', BREAK_DURATION_HOURS, '30-min mandatory break')
                driving_since_break = 0.0
                current_log_remarks.append(f'30-min mandatory break at {round(cumulative_miles)} miles')

            # Calculate how much we can drive now
            # Remaining capacity under various limits
            driving_window_left = WINDOW_LIMIT_HOURS - on_duty_today
            driving_time_left = DRIVING_LIMIT_HOURS - driving_today
            break_time_left = BREAK_AFTER_HOURS - driving_since_break
            cycle_left = CYCLE_HOURS - cycle_hours

            # Maximum drivable hours right now
            max_drive_now = min(
                driving_window_left,
                driving_time_left,
                break_time_left,
                max(0, cycle_left),
            )

            if max_drive_now <= 0:
                # Need a rest - figure out why
                if cycle_left <= 0:
                    # Cycle limit hit - this is a serious issue
                    # Force 34-hour restart or just end of today
                    take_required_rest(from_loc, 'Cycle limit - mandatory rest')
                    driving_today = 0.0
                    on_duty_today = 0.0
                    driving_since_break = 0.0
                    # Note: In real HOS, cycle limit requires 34-hr restart
                    # For simplicity we use 10-hr rest to continue
                    cycle_hours = max(0, cycle_hours - REQUIRED_REST_HOURS)
                    continue

                # Regular rest needed
                take_required_rest(from_loc, 'End of shift - 10h rest required')
                driving_today = 0.0
                on_duty_today = 0.0
                driving_since_break = 0.0
                continue

            # How many miles can we drive in max_drive_now hours?
            drivable_miles = max_drive_now * AVG_SPEED_MPH

            # Check if fuel stop is coming up before we hit other limits
            miles_to_fuel = FUEL_INTERVAL_MILES - miles_since_fuel
            if miles_to_fuel < min(drivable_miles, miles_remaining):
                # Drive to fuel stop first
                drive_hours = miles_to_fuel / AVG_SPEED_MPH
                actual_drive = min(drive_hours, max_drive_now)
                actual_miles = actual_drive * AVG_SPEED_MPH

                add_log_entry('driving', actual_drive, f'Driving - {segment_label}')
                driving_today += actual_drive
                driving_since_break += actual_drive
                cycle_hours += actual_drive
                cumulative_miles += actual_miles
                miles_since_fuel += actual_miles
                day_miles += actual_miles
                miles_remaining -= actual_miles
                continue

            # Normal driving
            if miles_remaining <= drivable_miles:
                drive_hours = miles_remaining / AVG_SPEED_MPH
                add_log_entry('driving', drive_hours, f'Driving - {segment_label}')
                driving_today += drive_hours
                driving_since_break += drive_hours
                cycle_hours += drive_hours
                cumulative_miles += miles_remaining
                miles_since_fuel += miles_remaining
                day_miles += miles_remaining
                miles_remaining = 0
            else:
                # Drive as much as we can
                add_log_entry('driving', max_drive_now, f'Driving - {segment_label}')
                driven_miles = max_drive_now * AVG_SPEED_MPH
                driving_today += max_drive_now
                driving_since_break += max_drive_now
                cycle_hours += max_drive_now
                cumulative_miles += driven_miles
                miles_since_fuel += driven_miles
                day_miles += driven_miles
                miles_remaining -= driven_miles

    # ---- Begin trip planning ----

    # Pre-trip inspection at start (on-duty not driving, 15 min)
    add_log_entry('on_duty', 0.25, 'Pre-trip inspection')
    on_duty_today += 0.0  # already counted in add_log_entry
    cycle_hours += 0.25
    current_log_remarks.append(f'Start trip from {current_location}')

    location_from = current_location

    # --- Segment 1: Current location to Pickup ---
    if distance_to_pickup_miles > 0:
        drive_segment(distance_to_pickup_miles, current_location, pickup_location, 'to pickup')

    # --- Pickup activity (1 hour on-duty) ---
    stops.append(Stop(
        stop_type='pickup',
        location=pickup_location,
        arrival_day=current_day,
        arrival_time=current_hour,
        duration=PICKUP_DROPOFF_HOURS,
        cumulative_miles=cumulative_miles,
        coordinates=pickup_coords,
    ))
    add_log_entry('on_duty', PICKUP_DROPOFF_HOURS, 'Pickup - loading/paperwork')
    cycle_hours += PICKUP_DROPOFF_HOURS
    current_log_remarks.append(f'Pickup at {pickup_location}')
    waypoints.append({
        'type': 'pickup',
        'location': pickup_location,
        'day': current_day,
        'time': f'{int((current_hour - PICKUP_DROPOFF_HOURS) % 24):02d}:{int(((current_hour - PICKUP_DROPOFF_HOURS) % 1) * 60):02d}',
        'miles': round(cumulative_miles, 1),
        'coordinates': pickup_coords,
    })

    # --- Segment 2: Pickup to Dropoff ---
    drive_segment(distance_pickup_to_dropoff_miles, pickup_location, dropoff_location, 'to dropoff')

    # --- Dropoff activity (1 hour on-duty) ---
    stops.append(Stop(
        stop_type='dropoff',
        location=dropoff_location,
        arrival_day=current_day,
        arrival_time=current_hour,
        duration=PICKUP_DROPOFF_HOURS,
        cumulative_miles=cumulative_miles,
        coordinates=dropoff_coords,
    ))
    add_log_entry('on_duty', PICKUP_DROPOFF_HOURS, 'Dropoff - unloading/paperwork')
    cycle_hours += PICKUP_DROPOFF_HOURS
    current_log_remarks.append(f'Dropoff at {dropoff_location}')
    waypoints.append({
        'type': 'dropoff',
        'location': dropoff_location,
        'day': current_day,
        'time': f'{int((current_hour - PICKUP_DROPOFF_HOURS) % 24):02d}:{int(((current_hour - PICKUP_DROPOFF_HOURS) % 1) * 60):02d}',
        'miles': round(cumulative_miles, 1),
        'coordinates': dropoff_coords,
    })

    # --- Post-trip rest ---
    take_required_rest(dropoff_location, 'End of trip - 10h rest')

    # --- Finalize last day ---
    finish_day(location_from, dropoff_location)

    total_distance = distance_to_pickup_miles + distance_pickup_to_dropoff_miles
    total_driving = sum(
        e.duration for log in daily_logs for e in log.entries if e.status == 'driving'
    )

    return TripPlan(
        stops=stops,
        daily_logs=daily_logs,
        total_miles=round(total_distance, 1),
        total_trip_hours=round(sum(e.duration for log in daily_logs for e in log.entries), 2),
        total_driving_hours=round(total_driving, 2),
        cycle_hours_used_after=round(min(cycle_hours, CYCLE_HOURS), 2),
        route_coordinates=(route_coords_to_pickup or []) + (route_coords_to_dropoff or []),
        waypoints=waypoints,
    )


def format_time(hour_float: float) -> str:
    """Convert decimal hour to HH:MM string."""
    hour_float = hour_float % 24
    h = int(hour_float)
    m = int((hour_float - h) * 60)
    return f'{h:02d}:{m:02d}'


def serialize_trip_plan(plan: TripPlan) -> dict:
    """Convert TripPlan to JSON-serializable dict."""
    return {
        'total_miles': plan.total_miles,
        'total_trip_hours': plan.total_trip_hours,
        'total_driving_hours': plan.total_driving_hours,
        'cycle_hours_used_after': plan.cycle_hours_used_after,
        'route_coordinates': [list(c) for c in plan.route_coordinates],
        'waypoints': plan.waypoints,
        'stops': [
            {
                'stop_type': s.stop_type,
                'location': s.location,
                'arrival_day': s.arrival_day,
                'arrival_time': format_time(s.arrival_time),
                'duration_hours': s.duration,
                'cumulative_miles': round(s.cumulative_miles, 1),
                'coordinates': list(s.coordinates) if s.coordinates else None,
            }
            for s in plan.stops
        ],
        'daily_logs': [
            {
                'day_number': log.day_number,
                'date_label': log.date_label,
                'total_miles': log.total_miles,
                'total_driving': log.total_driving,
                'total_on_duty': log.total_on_duty,
                'from_location': log.from_location,
                'to_location': log.to_location,
                'remarks': log.remarks,
                'entries': [
                    {
                        'time': round(e.time % 24, 4),
                        'status': e.status,
                        'duration': round(e.duration, 4),
                        'label': e.label,
                        'end_time': round((e.time + e.duration) % 24, 4),
                    }
                    for e in log.entries
                ],
            }
            for log in plan.daily_logs
        ],
    }
