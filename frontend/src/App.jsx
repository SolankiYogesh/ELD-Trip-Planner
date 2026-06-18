import { useState } from 'react'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import ELDLogSheet from './components/ELDLogSheet'
import TripSummary from './components/TripSummary'
import { planTrip } from './api/tripApi'

const TABS = [
  {
    id: 'map',
    label: 'Route Map',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
        <path d="M9 3L3 6v11l6-3 6 3V6L9 3z" strokeLinejoin="round"/>
        <path d="M9 3v14M15 6v11M3 6v11" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'logs',
    label: 'ELD Log Sheets',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
        <rect x="3" y="2" width="14" height="16" rx="2"/>
        <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Trip Summary',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
        <rect x="2" y="12" width="4" height="6" rx="1"/>
        <rect x="8" y="7" width="4" height="11" rx="1"/>
        <rect x="14" y="3" width="4" height="15" rx="1"/>
      </svg>
    ),
  },
]

export default function App() {
  const [tripData, setTripData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('map')

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setTripData(null)
    try {
      const data = await planTrip(formData)
      setTripData(data)
      setActiveTab('map')
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to plan trip. Please check your locations and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Sidebar ── */}
      <aside className="w-[345px] shrink-0 bg-slate-900 min-h-screen sticky top-0 max-h-screen overflow-y-auto overflow-x-hidden border-r border-white/[0.06]">
        <TripForm onSubmit={handleSubmit} loading={loading} />
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="h-[52px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-blue-600">
              <rect x="1" y="4" width="14" height="11" rx="1.5"/>
              <path d="M15 8h4l3 3.5V15h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2"/>
              <circle cx="18.5" cy="18.5" r="2"/>
            </svg>
            <span className="text-[0.9rem] font-bold text-slate-900 tracking-tight">ELD Trip Planner</span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="text-[0.78rem] text-slate-400 hidden sm:block">FMCSA Hours of Service · 70 hrs / 8-day cycle</span>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 flex flex-col gap-5">

          {/* Render cold-start notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-[0.82rem] leading-snug">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 shrink-0 mt-0.5 text-amber-500">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 13.5v.5" strokeLinecap="round"/>
            </svg>
            <span>
              <span className="font-semibold">Hosted on Render free tier — </span>
              the first request may take <span className="font-semibold">30–60 seconds</span> to wake the backend instance. Subsequent requests are fast.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-[0.85rem] font-medium leading-snug">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 13.5v.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Empty state */}
          {!tripData && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16 px-6 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center gap-0">
                <svg viewBox="0 0 80 48" fill="none" className="w-24 h-14">
                  <rect x="2" y="14" width="44" height="28" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <path d="M46 20h14l8 10v12H46V20z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <circle cx="14" cy="42" r="5" fill="#94a3b8"/>
                  <circle cx="14" cy="42" r="2.5" fill="#f1f5f9"/>
                  <circle cx="60" cy="42" r="5" fill="#94a3b8"/>
                  <circle cx="60" cy="42" r="2.5" fill="#f1f5f9"/>
                  <rect x="20" y="20" width="18" height="10" rx="1.5" fill="#cbd5e1"/>
                  <rect x="48" y="22" width="10" height="8" rx="1.5" fill="#cbd5e1"/>
                </svg>
                <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded mt-[-2px]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enter trip details to begin</h2>
              <p className="text-[0.88rem] text-slate-500 max-w-md leading-relaxed">
                The planner calculates your route, applies all FMCSA Hours of Service rules,
                and generates completed ELD daily log sheets.
              </p>
              <div className="grid grid-cols-2 gap-2.5 text-left w-full max-w-md mt-1">
                <FeatureItem icon={<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M9 2a5 5 0 110 10A5 5 0 019 2z"/><path d="M9 16v-4" strokeLinecap="round"/></svg>} text="Real routing via OpenStreetMap" />
                <FeatureItem icon={<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><rect x="3" y="2" width="12" height="14" rx="1.5"/><path d="M6 6h6M6 9h6M6 12h4" strokeLinecap="round"/></svg>} text="Auto-generated ELD log sheets" />
                <FeatureItem icon={<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 2" strokeLinecap="round"/></svg>} text="11h driving · 14h window · 10h rest" />
                <FeatureItem icon={<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M9 2v4M9 12v4M2 9h4M12 9h4" strokeLinecap="round"/><circle cx="9" cy="9" r="3"/></svg>} text="Fuel stops every 1,000 miles" />
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 bg-white rounded-xl border border-slate-200">
              <div className="w-60 h-[3px] bg-slate-200 rounded overflow-hidden">
                <div className="w-3/5 h-full bg-blue-600 rounded animate-loadslide" />
              </div>
              <p className="text-[0.95rem] font-semibold text-slate-800 mt-1">Calculating route</p>
              <p className="text-[0.8rem] text-slate-400">Geocoding locations and applying HOS regulations</p>
              <p className="text-[0.75rem] text-amber-500 mt-1">If this is the first request, the backend may need 30–60 s to start</p>
            </div>
          )}

          {/* Results */}
          {tripData && (
            <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

              {/* Tabs */}
              <div role="tablist" className="flex border-b border-slate-200 bg-slate-50 px-1 gap-0.5">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'flex items-center gap-1.5 px-4 py-3 text-[0.82rem] font-medium border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap tracking-[0.01em]',
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600 font-semibold bg-white'
                        : 'text-slate-400 border-transparent hover:text-slate-700'
                    ].join(' ')}
                  >
                    <span className="flex items-center">{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'logs' && (
                      <span className="text-[0.68rem] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {tripData.daily_logs.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6 flex-1">
                {activeTab === 'map' && <RouteMap tripData={tripData} />}

                {activeTab === 'logs' && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1 pb-4 border-b border-slate-200">
                      <h2 className="text-[1rem] font-bold text-slate-900 tracking-tight">
                        {tripData.daily_logs.length} Daily Log Sheet{tripData.daily_logs.length !== 1 ? 's' : ''}
                      </h2>
                      <p className="text-[0.78rem] text-slate-400">Duty status records per FMCSA §395.8 — printable</p>
                    </div>
                    {tripData.daily_logs.map((log, i) => (
                      <ELDLogSheet key={i} log={log} dayIndex={i} />
                    ))}
                  </div>
                )}

                {activeTab === 'summary' && <TripSummary tripData={tripData} />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-[0.8rem] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5">
      <span className="text-blue-600 flex shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
