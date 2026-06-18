const STOP_META = {
  pickup:  { label: 'Pickup',    color: '#2563eb' },
  dropoff: { label: 'Dropoff',   color: '#059669' },
  fuel:    { label: 'Fuel Stop', color: '#d97706' },
  rest:    { label: 'Rest',      color: '#7c3aed' },
  break:   { label: 'Break',     color: '#64748b' },
}

const STATUS_COLORS = {
  off_duty: '#64748b',
  sleeper:  '#6366f1',
  driving:  '#059669',
  on_duty:  '#d97706',
}

export default function TripSummary({ tripData }) {
  const { stops, daily_logs, total_miles, total_driving_hours, cycle_hours_used_after, locations } = tripData
  const cyclePercent = Math.min(100, (cycle_hours_used_after / 70) * 100)
  const cycleStatus = cyclePercent > 85 ? 'critical' : cyclePercent > 60 ? 'warning' : 'good'
  const cycleColor = { critical: '#dc2626', warning: '#d97706', good: '#059669' }[cycleStatus]
  const cycleTagStyle = { color: cycleColor, background: cycleColor + '14' }

  return (
    <div className="flex flex-col gap-6">

      {/* Route flow */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded-md px-5 py-4">
        <RouteNode color="#64748b" role="Origin" name={locations.current.name} />
        <svg viewBox="0 0 40 10" fill="none" className="w-8 shrink-0">
          <path d="M0 5h32M26 2l6 3-6 3" stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <RouteNode color="#2563eb" role="Pickup" name={locations.pickup.name} />
        <svg viewBox="0 0 40 10" fill="none" className="w-8 shrink-0">
          <path d="M0 5h32M26 2l6 3-6 3" stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <RouteNode color="#059669" role="Dropoff" name={locations.dropoff.name} square />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: 'Total Distance', value: `${total_miles.toLocaleString()} mi` },
          { label: 'Driving Hours',  value: `${total_driving_hours.toFixed(1)} hrs` },
          { label: 'Days Required',  value: daily_logs.length },
          { label: 'Total Stops',    value: stops.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-md px-4 py-3.5">
            <div className="text-[1.25rem] font-bold text-slate-900 tracking-tight tabular-nums leading-tight">{value}</div>
            <div className="text-[0.7rem] font-medium text-slate-400 uppercase tracking-[0.04em] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Cycle gauge */}
      <div className="bg-white border border-slate-200 rounded-md px-5 py-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[0.88rem] font-semibold text-slate-900 leading-tight">70-Hour Cycle Usage</div>
            <div className="text-[0.72rem] text-slate-400 mt-0.5">After completion of this trip</div>
          </div>
          <div className="flex items-baseline">
            <span className="text-[1.3rem] font-bold tabular-nums" style={{ color: cycleColor }}>{cycle_hours_used_after}h</span>
            <span className="text-[0.8rem] text-slate-400 font-medium">&nbsp;/ 70h</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cyclePercent}%`, background: cycleColor }} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded" style={cycleTagStyle}>
            {cycleStatus === 'critical' ? 'Near cycle limit' : cycleStatus === 'warning' ? 'Moderate usage' : 'Cycle available'}
          </span>
          <span className="text-[0.72rem] text-slate-400 tabular-nums">{(70 - cycle_hours_used_after).toFixed(1)}h remaining</span>
        </div>
      </div>

      {/* Stop timeline */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.06em] text-slate-500">Stop Sequence</span>
          <span className="text-[0.72rem] text-slate-400 tabular-nums">{stops.length} stops</span>
        </div>
        <div className="flex flex-col">
          {stops.map((stop, i) => {
            const meta = STOP_META[stop.stop_type] ?? STOP_META.break
            return (
              <div key={i} className="flex gap-3.5 relative">
                <div className="flex flex-col items-center w-3.5 shrink-0 pt-0.5">
                  <div
                    className="w-3 h-3 shrink-0 relative z-10"
                    style={{
                      background: meta.color,
                      borderRadius: stop.stop_type === 'dropoff' ? '3px' : '50%',
                      boxShadow: `0 0 0 3px #fff, 0 0 0 4px #e2e8f0`,
                    }}
                  />
                  {i < stops.length - 1 && <div className="flex-1 w-0.5 bg-slate-200 my-1 min-h-[20px]" />}
                </div>
                <div className="flex-1 pb-5 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded" style={{ color: meta.color, background: meta.color + '14' }}>
                      {meta.label}
                    </span>
                    <span className="text-[0.72rem] text-slate-400">Day {stop.arrival_day} · {stop.arrival_time}</span>
                  </div>
                  <div className="text-[0.88rem] font-semibold text-slate-900">{stop.location}</div>
                  <div className="text-[0.72rem] text-slate-400 tabular-nums">{stop.duration_hours}h duration · {stop.cumulative_miles.toLocaleString()} mi into trip</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.06em] text-slate-500">Daily Breakdown</span>
          <span className="text-[0.72rem] text-slate-400 tabular-nums">{daily_logs.length} days</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {daily_logs.map(log => (
            <div key={log.day_number} className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.07em] text-blue-600">Day {log.day_number}</span>
                <span className="text-[0.72rem] text-slate-400 tabular-nums">{log.total_miles} mi</span>
              </div>
              <div className="flex gap-6">
                {[
                  { label: 'Driving',  value: `${log.total_driving}h`,              color: STATUS_COLORS.driving },
                  { label: 'On Duty',  value: `${log.total_on_duty}h`,              color: STATUS_COLORS.on_duty },
                  { label: 'Off Duty', value: `${(24 - log.total_on_duty).toFixed(1)}h`, color: STATUS_COLORS.off_duty },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col gap-px">
                    <span className="text-[1.05rem] font-bold tracking-tight tabular-nums" style={{ color }}>{value}</span>
                    <span className="text-[0.68rem] text-slate-400 font-medium uppercase tracking-[0.04em]">{label}</span>
                  </div>
                ))}
              </div>
              {/* Duty bar */}
              <div className="h-2 bg-slate-200 rounded-full relative overflow-hidden">
                {log.entries.map((e, i) => {
                  const start = Math.max(0, e.time)
                  const end = Math.min(24, e.end_time > e.time ? e.end_time : e.time + e.duration)
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full"
                      style={{
                        left: `${(start / 24) * 100}%`,
                        width: `${Math.max(0.4, ((end - start) / 24) * 100)}%`,
                        background: STATUS_COLORS[e.status] ?? '#e2e8f0',
                      }}
                      title={`${e.label} (${e.duration.toFixed(2)}h)`}
                    />
                  )
                })}
              </div>
              <div className="flex gap-3.5 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([k, c]) => (
                  <span key={k} className="flex items-center gap-1 text-[0.68rem] text-slate-400 font-medium capitalize">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                    {k.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RouteNode({ color, role, name, square }) {
  return (
    <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-md px-3.5 py-2">
      <div className="w-2.5 h-2.5 shrink-0" style={{ background: color, borderRadius: square ? '4px' : '50%' }} />
      <div>
        <div className="text-[0.65rem] font-bold uppercase tracking-[0.07em] text-slate-400 leading-none mb-0.5">{role}</div>
        <div className="text-[0.84rem] font-semibold text-slate-900">{name}</div>
      </div>
    </div>
  )
}
