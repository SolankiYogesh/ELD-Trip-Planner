import { useState } from 'react'

const EXAMPLES = [
  {
    current: 'Chicago, IL',
    pickup: 'Indianapolis, IN',
    dropoff: 'Nashville, TN',
    cycle: '12',
    miles: '468 mi',
    drive: '8.5 hrs',
    days: 1,
    region: 'Midwest → South',
  },
  {
    current: 'Los Angeles, CA',
    pickup: 'Phoenix, AZ',
    dropoff: 'Dallas, TX',
    cycle: '20',
    miles: '1,421 mi',
    drive: '25.8 hrs',
    days: 3,
    region: 'Southwest → Texas',
  },
  {
    current: 'New York, NY',
    pickup: 'Philadelphia, PA',
    dropoff: 'Washington, DC',
    cycle: '5',
    miles: '184 mi',
    drive: '3.4 hrs',
    days: 1,
    region: 'Northeast Corridor',
  },
]

const HOS_RULES = [
  '11-hr driving limit',
  '14-hr on-duty window',
  '10-hr off-duty rest',
  '30-min break after 8 hrs',
  '70-hr / 8-day cycle',
  'Fuel every 1,000 miles',
  '1-hr pickup & dropoff',
]

const SectionLabel = ({ children }) => (
  <div className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-slate-500 px-5 pt-4 pb-2">
    {children}
  </div>
)

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: '',
  })

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.currentLocation || !form.pickupLocation || !form.dropoffLocation) return
    onSubmit(form)
  }

  const loadExample = (ex) => setForm({
    currentLocation: ex.current,
    pickupLocation: ex.pickup,
    dropoffLocation: ex.dropoff,
    currentCycleUsed: ex.cycle,
  })

  return (
    <div className="flex flex-col min-h-full">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-[38px] h-[38px] bg-blue-600/15 border border-blue-500/30 rounded-[10px] flex items-center justify-center text-blue-400 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
            <rect x="1" y="4" width="14" height="11" rx="1.5"/>
            <path d="M15 8h4l3 3.5V15h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2"/>
            <circle cx="18.5" cy="18.5" r="2"/>
          </svg>
        </div>
        <div>
          <div className="text-[0.92rem] font-bold text-slate-50 tracking-tight leading-tight">ELD Trip Planner</div>
          <div className="text-[0.68rem] text-slate-500 mt-0.5">Property Carrier · 70 hrs / 8 days</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4 border-b border-white/[0.06]">
        <SectionLabel>Trip Details</SectionLabel>

        {/* Route stack with visual connector */}
        <div className="flex flex-col">

          {/* Origin */}
          <div className="flex gap-2.5 items-stretch">
            <div className="flex flex-col items-center pt-[22px] w-4 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-slate-900 ring-2 ring-slate-500 shrink-0" />
              <div className="flex-1 w-0.5 bg-white/[0.07] my-1 rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 pb-3.5">
              <label className="text-[0.72rem] font-semibold text-slate-400 tracking-[0.01em]">Current Location</label>
              <input
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-md text-slate-100 text-[0.85rem] placeholder-slate-700 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-600/10 font-[inherit]"
                type="text" name="currentLocation" value={form.currentLocation}
                onChange={handleChange} placeholder="e.g. Chicago, IL" required autoComplete="off"
              />
            </div>
          </div>

          {/* Pickup */}
          <div className="flex gap-2.5 items-stretch">
            <div className="flex flex-col items-center pt-[22px] w-4 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-slate-900 ring-2 ring-blue-600 shrink-0" />
              <div className="flex-1 w-0.5 bg-white/[0.07] my-1 rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 pb-3.5">
              <label className="text-[0.72rem] font-semibold text-slate-400 tracking-[0.01em]">Pickup Location</label>
              <input
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-md text-slate-100 text-[0.85rem] placeholder-slate-700 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-600/10 font-[inherit]"
                type="text" name="pickupLocation" value={form.pickupLocation}
                onChange={handleChange} placeholder="e.g. Detroit, MI" required autoComplete="off"
              />
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex gap-2.5 items-stretch">
            <div className="flex flex-col items-center pt-[22px] w-4 shrink-0">
              <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 border-2 border-slate-900 ring-2 ring-emerald-600 shrink-0" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 pb-1">
              <label className="text-[0.72rem] font-semibold text-slate-400 tracking-[0.01em]">Dropoff Location</label>
              <input
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-md text-slate-100 text-[0.85rem] placeholder-slate-700 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-600/10 font-[inherit]"
                type="text" name="dropoffLocation" value={form.dropoffLocation}
                onChange={handleChange} placeholder="e.g. New York, NY" required autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Cycle hours */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-400 tracking-[0.01em]">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-slate-500">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2.5 1.5" strokeLinecap="round"/>
            </svg>
            Cycle Hours Used
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full pr-16 px-3 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-md text-slate-100 text-[0.85rem] placeholder-slate-700 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-600/10 font-[inherit]"
              type="number" name="currentCycleUsed" value={form.currentCycleUsed}
              onChange={handleChange} placeholder="0" min="0" max="70" step="0.5"
            />
            <span className="absolute right-3 text-[0.72rem] font-medium text-slate-500 pointer-events-none font-mono">/ 70 hrs</span>
          </div>
          <span className="text-[0.68rem] text-slate-600">Hours used in your current 8-day cycle</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-0.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed text-white text-[0.85rem] font-semibold rounded-md transition-all cursor-pointer font-[inherit]"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin-fast shrink-0" />
              Calculating...
            </>
          ) : (
            <>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M3 9h12M10 4l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Trip Plan
            </>
          )}
        </button>
      </form>

      {/* Sample Routes */}
      <div className="border-b border-white/[0.06] pb-2">
        <SectionLabel>Sample Routes</SectionLabel>
        <div className="flex flex-col gap-1.5 px-5 pb-4">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadExample(ex)}
              className="group flex flex-col gap-2.5 p-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-blue-500/35 rounded-md text-left w-full transition-all cursor-pointer font-[inherit]"
            >
              {/* Region */}
              <span className="text-[0.62rem] font-bold tracking-[0.08em] uppercase text-slate-500">{ex.region}</span>

              {/* Stops */}
              <div className="flex flex-col">
                {/* Origin row */}
                <div className="grid grid-cols-[12px_auto_1fr] items-center gap-1.5 min-h-[22px]">
                  <div className="w-2 h-2 rounded-full bg-slate-500 border border-white/15 justify-self-center" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap">Origin</span>
                  <span className="text-[0.76rem] font-semibold text-slate-400 truncate">{ex.current}</span>
                </div>
                {/* Pickup row */}
                <div className="grid grid-cols-[12px_auto_1fr] items-center gap-1.5 min-h-[22px] relative">
                  <div className="absolute left-[5px] top-[-10px] h-[10px] w-0.5 bg-white/[0.07]" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 border border-white/15 justify-self-center" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap">Pickup</span>
                  <span className="text-[0.76rem] font-semibold text-slate-400 truncate">{ex.pickup}</span>
                </div>
                {/* Dropoff row */}
                <div className="grid grid-cols-[12px_auto_1fr] items-center gap-1.5 min-h-[22px] relative">
                  <div className="absolute left-[5px] top-[-10px] h-[10px] w-0.5 bg-white/[0.07]" />
                  <div className="w-2 h-2 rounded-[2px] bg-emerald-600 border border-white/15 justify-self-center" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap">Dropoff</span>
                  <span className="text-[0.76rem] font-semibold text-slate-400 truncate">{ex.dropoff}</span>
                </div>
              </div>

              {/* Stats + action */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.05]">
                <StatChip icon={<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="9" height="9"><path d="M1 6h10M6 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>}>{ex.miles}</StatChip>
                <div className="w-px h-2.5 bg-white/[0.07] shrink-0" />
                <StatChip icon={<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="9" height="9"><circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l2 1.5" strokeLinecap="round"/></svg>}>{ex.drive}</StatChip>
                <div className="w-px h-2.5 bg-white/[0.07] shrink-0" />
                <StatChip icon={<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="9" height="9"><rect x="1" y="2" width="10" height="9" rx="1"/><path d="M4 1v2M8 1v2M1 5h10" strokeLinecap="round"/></svg>}>{ex.days}d</StatChip>
                <span className="ml-auto text-[0.65rem] font-semibold text-slate-600 font-mono bg-white/[0.05] px-1.5 py-0.5 rounded">{ex.cycle}h used</span>
                <span className="flex items-center gap-1 text-[0.68rem] font-semibold text-slate-600 group-hover:text-blue-400 transition-colors ml-1">
                  Load
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width="9" height="9">
                    <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* HOS Rules */}
      <div className="border-b border-white/[0.06] pb-2">
        <SectionLabel>Applied HOS Rules</SectionLabel>
        <ul className="flex flex-col gap-1 px-5 pb-4">
          {HOS_RULES.map((rule, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[0.75rem] text-slate-500">
              <svg viewBox="0 0 12 12" fill="none" width="10" height="10" className="text-emerald-600 shrink-0">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 py-3.5 text-[0.65rem] text-slate-800 font-medium tracking-wide">
        FMCSA 49 CFR Part 395 · Property-carrying driver
      </div>
    </div>
  )
}

function StatChip({ icon, children }) {
  return (
    <span className="flex items-center gap-1 text-[0.68rem] text-slate-500 font-medium font-mono">
      <span className="text-slate-600">{icon}</span>
      {children}
    </span>
  )
}
