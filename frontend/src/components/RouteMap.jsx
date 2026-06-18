import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeMarker = (color, letter, shape = 'circle') => L.divIcon({
  className: '',
  html: `<div style="background:${color};color:#fff;border:2px solid rgba(255,255,255,0.9);border-radius:${shape === 'square' ? '4px' : '50%'};width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:Inter,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${letter}</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
})

const icons = {
  start:   makeMarker('#64748b', 'S'),
  pickup:  makeMarker('#2563eb', 'P'),
  dropoff: makeMarker('#059669', 'D', 'square'),
  fuel:    makeMarker('#d97706', 'F'),
  rest:    makeMarker('#7c3aed', 'R'),
}

function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords?.length > 1) map.fitBounds(L.latLngBounds(coords), { padding: [48, 48] })
  }, [coords, map])
  return null
}

export default function RouteMap({ tripData }) {
  const { locations, route_coordinates, stops, daily_logs, total_miles, total_driving_hours } = tripData
  const allCoords = route_coordinates?.length ? route_coordinates : []
  const center = allCoords.length ? allCoords[Math.floor(allCoords.length / 2)] : [39.5, -98.35]

  return (
    <div className="flex flex-col gap-3.5">

      {/* Stats strip */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-5 py-3.5">
        <Stat label="Total Distance" value={`${total_miles.toLocaleString()} mi`} color="text-blue-600" />
        <div className="w-px h-8 bg-slate-200 mx-0 shrink-0" />
        <Stat label="Driving Time" value={`${total_driving_hours.toFixed(1)} hrs`} color="text-emerald-600" />
        <div className="w-px h-8 bg-slate-200 shrink-0" />
        <Stat label="Days on Road" value={daily_logs?.length ?? 1} color="text-amber-600" />
        <div className="w-px h-8 bg-slate-200 shrink-0" />
        <Stat label="Total Stops" value={stops?.length ?? 0} color="text-violet-600" />
      </div>

      {/* Map */}
      <div className="h-[460px] rounded-[10px] overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {allCoords.length > 1 && (
            <Polyline positions={allCoords} pathOptions={{ color: '#2563eb', weight: 3.5, opacity: 0.8 }} />
          )}
          <FitBounds coords={allCoords} />

          <Marker position={locations.current.coordinates} icon={icons.start}>
            <Popup><PopupContent label="Origin" name={locations.current.name} /></Popup>
          </Marker>
          <Marker position={locations.pickup.coordinates} icon={icons.pickup}>
            <Popup><PopupContent label="Pickup" name={locations.pickup.name} /></Popup>
          </Marker>
          <Marker position={locations.dropoff.coordinates} icon={icons.dropoff}>
            <Popup><PopupContent label="Dropoff" name={locations.dropoff.name} /></Popup>
          </Marker>

          {stops?.filter(s => ['fuel', 'rest', 'break'].includes(s.stop_type)).map((stop, i) =>
            stop.coordinates ? (
              <Marker key={i} position={stop.coordinates} icon={icons[stop.stop_type] ?? icons.rest}>
                <Popup>
                  <PopupContent label={stop.stop_type.replace('_', ' ')} name={stop.location} meta={`Day ${stop.arrival_day} · ${stop.arrival_time} · ${stop.duration_hours}h`} />
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md">
        <LegendItem color="#64748b" label="Origin" />
        <LegendItem color="#2563eb" label="Pickup" />
        <LegendItem color="#059669" label="Dropoff" square />
        <LegendItem color="#d97706" label="Fuel Stop" />
        <LegendItem color="#7c3aed" label="Rest Stop" />
        <LegendItem color="#2563eb" label="Route" isLine />
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5 px-4 first:pl-0">
      <div className={`text-[1.1rem] font-bold tracking-tight tabular-nums ${color}`}>{value}</div>
      <div className="text-[0.7rem] text-slate-400 font-medium uppercase tracking-[0.04em]">{label}</div>
    </div>
  )
}

function LegendItem({ color, label, isLine, square }) {
  return (
    <div className="flex items-center gap-1.5 text-[0.75rem] text-slate-500 font-medium">
      {isLine
        ? <div className="w-4 h-[2.5px] rounded shrink-0" style={{ background: color }} />
        : <div className="w-2 h-2 shrink-0" style={{ background: color, borderRadius: square ? '3px' : '50%' }} />
      }
      <span>{label}</span>
    </div>
  )
}

function PopupContent({ label, name, meta }) {
  return (
    <div>
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-slate-400 mb-0.5">{label}</div>
      <div className="text-[0.85rem] font-semibold text-slate-900">{name}</div>
      {meta && <div className="text-[0.75rem] text-slate-400 mt-0.5">{meta}</div>}
    </div>
  )
}
