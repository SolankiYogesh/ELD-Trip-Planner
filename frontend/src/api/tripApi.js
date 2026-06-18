import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export async function planTrip({ currentLocation, pickupLocation, dropoffLocation, currentCycleUsed }) {
  const resp = await api.post('/plan-trip/', {
    current_location: currentLocation,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    current_cycle_used: parseFloat(currentCycleUsed) || 0,
  })
  return resp.data
}
