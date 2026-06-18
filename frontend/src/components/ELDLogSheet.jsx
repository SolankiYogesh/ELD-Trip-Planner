import { useEffect, useRef } from 'react'

const STATUS_LABELS = ['1. Off Duty', '2. Sleeper Berth', '3. Driving', '4. On Duty Not Driving']
const STATUS_COLORS = {
  off_duty: '#6b7280',
  sleeper:  '#3b82f6',
  driving:  '#10b981',
  on_duty:  '#f59e0b',
}

function drawLog(canvas, log) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const DPR = window.devicePixelRatio || 1

  ctx.clearRect(0, 0, W, H)

  const marginLeft = 180 * DPR
  const marginRight = 16 * DPR
  const marginTop = 110 * DPR
  const gridWidth = W - marginLeft - marginRight
  const rowHeight = 36 * DPR
  const gridHeight = rowHeight * 4
  const hourWidth = gridWidth / 24

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1.5 * DPR
  ctx.strokeRect(10 * DPR, 10 * DPR, W - 20 * DPR, 90 * DPR)

  ctx.fillStyle = '#2563eb'
  ctx.fillRect(10 * DPR, 10 * DPR, W - 20 * DPR, 28 * DPR)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${13 * DPR}px Inter, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText("DRIVER'S DAILY LOG — HOURS OF SERVICE", W / 2, 28 * DPR)

  const hx = 20 * DPR
  const hy = 52 * DPR

  const field = (label, value, x, y) => {
    ctx.font = `bold ${9 * DPR}px Inter`
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'left'
    ctx.fillText(label, x, y)
    ctx.font = `${11 * DPR}px Inter`
    ctx.fillStyle = '#1e293b'
    ctx.fillText(value, x, y + 14 * DPR)
  }

  field('DATE', log.date_label, hx, hy)
  field('FROM', truncate(log.from_location, 20), hx + 100 * DPR, hy)
  field('TO', truncate(log.to_location, 20), hx + 280 * DPR, hy)

  ctx.font = `bold ${9 * DPR}px Inter`
  ctx.fillStyle = '#64748b'
  ctx.fillText('TOTAL MILES', W - 180 * DPR, hy)
  ctx.font = `bold ${14 * DPR}px Inter`
  ctx.fillStyle = '#2563eb'
  ctx.fillText(`${log.total_miles} mi`, W - 180 * DPR, hy + 16 * DPR)

  ctx.font = `bold ${9 * DPR}px Inter`
  ctx.fillStyle = '#64748b'
  ctx.fillText('DRIVING', W - 80 * DPR, hy)
  ctx.font = `bold ${13 * DPR}px Inter`
  ctx.fillStyle = '#10b981'
  ctx.fillText(`${log.total_driving}h`, W - 80 * DPR, hy + 16 * DPR)

  ctx.font = `bold ${9 * DPR}px Inter`
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'left'
  ctx.fillText('CARRIER: Property-Carrying Driver  |  CYCLE: 70hrs/8days  |  FMCSA §395.3', hx, 96 * DPR)

  // Hour labels
  ctx.textAlign = 'center'
  ctx.fillStyle = '#374151'
  ctx.font = `${8.5 * DPR}px Inter`
  const hourLabels = ['M', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'N', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'M']

  for (let h = 0; h <= 24; h++) {
    const x = marginLeft + h * hourWidth
    ctx.fillStyle = '#374151'
    ctx.fillText(String(hourLabels[h]), x, marginTop - 4 * DPR)
    ctx.strokeStyle = h === 0 || h === 24 ? '#1e293b' : h % 6 === 0 ? '#94a3b8' : '#e2e8f0'
    ctx.lineWidth = (h === 0 || h === 24 ? 1.5 : 0.5) * DPR
    ctx.beginPath(); ctx.moveTo(x, marginTop); ctx.lineTo(x, marginTop + gridHeight); ctx.stroke()
    if (h < 24) {
      const xh = marginLeft + (h + 0.5) * hourWidth
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.5 * DPR
      ctx.beginPath(); ctx.moveTo(xh, marginTop); ctx.lineTo(xh, marginTop + gridHeight); ctx.stroke()
    }
  }

  STATUS_LABELS.forEach((label, rowIdx) => {
    const y = marginTop + rowIdx * rowHeight
    ctx.textAlign = 'right'; ctx.fillStyle = '#374151'; ctx.font = `${9.5 * DPR}px Inter`
    ctx.fillText(label, marginLeft - 8 * DPR, y + rowHeight / 2 + 3 * DPR)
    ctx.fillStyle = rowIdx % 2 === 0 ? '#f8fafc' : '#f1f5f9'
    ctx.fillRect(marginLeft, y, gridWidth, rowHeight)
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.8 * DPR
    ctx.strokeRect(marginLeft, y, gridWidth, rowHeight)
  })

  const statusKey = { off_duty: 0, sleeper: 1, driving: 2, on_duty: 3 }
  log.entries.forEach(entry => {
    const rowIdx = statusKey[entry.status]
    if (rowIdx === undefined) return
    const startH = Math.max(0, entry.time)
    const endH = Math.min(24, entry.end_time <= entry.time && entry.duration > 0 ? entry.time + entry.duration : entry.end_time)
    if (endH <= startH) return
    const x = marginLeft + startH * hourWidth
    const w = (endH - startH) * hourWidth
    const y = marginTop + rowIdx * rowHeight
    const color = STATUS_COLORS[entry.status]

    ctx.fillStyle = color + '55'
    ctx.fillRect(x, y + 2 * DPR, w, rowHeight - 4 * DPR)
    ctx.strokeStyle = color; ctx.lineWidth = 3 * DPR
    ctx.beginPath(); ctx.moveTo(x, y + 4 * DPR); ctx.lineTo(x + w, y + 4 * DPR); ctx.stroke()
    ctx.lineWidth = 2 * DPR
    ctx.beginPath(); ctx.moveTo(x, y + 2 * DPR); ctx.lineTo(x, y + rowHeight - 2 * DPR); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + w, y + 2 * DPR); ctx.lineTo(x + w, y + rowHeight - 2 * DPR); ctx.stroke()

    if (w > 30 * DPR && entry.label) {
      ctx.fillStyle = color; ctx.font = `${7.5 * DPR}px Inter`; ctx.textAlign = 'left'
      ctx.fillText(entry.label.length > 20 ? entry.label.substring(0, 18) + '…' : entry.label, x + 3 * DPR, y + rowHeight / 2 + 3 * DPR)
    }
  })

  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5 * DPR
  ctx.strokeRect(marginLeft, marginTop, gridWidth, gridHeight)

  const summaryY = marginTop + gridHeight + 16 * DPR
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1 * DPR
  ctx.strokeRect(10 * DPR, summaryY, W - 20 * DPR, 68 * DPR)

  ctx.font = `bold ${9 * DPR}px Inter`; ctx.fillStyle = '#64748b'; ctx.textAlign = 'left'
  ctx.fillText('HOURS SUMMARY', 18 * DPR, summaryY + 14 * DPR)

  const cols = [
    { label: 'Off Duty', value: getStatusTotal(log.entries, 'off_duty'), color: STATUS_COLORS.off_duty },
    { label: 'Sleeper',  value: getStatusTotal(log.entries, 'sleeper'),  color: STATUS_COLORS.sleeper },
    { label: 'Driving',  value: getStatusTotal(log.entries, 'driving'),  color: STATUS_COLORS.driving },
    { label: 'On Duty',  value: getStatusTotal(log.entries, 'on_duty'),  color: STATUS_COLORS.on_duty },
    { label: 'Total',    value: 24.0,                                    color: '#1e293b' },
  ]
  cols.forEach((col, i) => {
    const cx = 18 * DPR + i * 120 * DPR
    ctx.fillStyle = col.color; ctx.font = `bold ${11 * DPR}px Inter`
    ctx.fillText(`${col.value.toFixed(2)}h`, cx, summaryY + 38 * DPR)
    ctx.fillStyle = '#64748b'; ctx.font = `${9 * DPR}px Inter`
    ctx.fillText(col.label, cx, summaryY + 52 * DPR)
  })

  if (log.remarks?.length > 0) {
    const remY = summaryY + 72 * DPR
    ctx.font = `bold ${9 * DPR}px Inter`; ctx.fillStyle = '#64748b'
    ctx.fillText('REMARKS', 18 * DPR, remY)
    ctx.font = `${9 * DPR}px Inter`; ctx.fillStyle = '#374151'
    log.remarks.slice(0, 4).forEach((r, i) => ctx.fillText(`• ${r}`, 18 * DPR, remY + (14 + i * 13) * DPR))
  }
}

function getStatusTotal(entries, status) {
  return entries.filter(e => e.status === status).reduce((s, e) => s + e.duration, 0)
}

function truncate(str, maxLen) {
  if (!str) return ''
  return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str
}

export default function ELDLogSheet({ log }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !log) return
    const DPR = window.devicePixelRatio || 1
    canvas.width = 900 * DPR
    canvas.height = 400 * DPR
    canvas.style.width = '900px'
    canvas.style.height = '400px'
    drawLog(canvas, log)
  }, [log])

  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>ELD Log Day ${log.day_number}</title><style>body{margin:0}img{max-width:100%}</style></head><body onload="window.print()"><img src="${canvas.toDataURL('image/png')}" /></body></html>`)
    win.document.close()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.07em] bg-blue-600 text-white px-2.5 py-1 rounded whitespace-nowrap">
          Day {log.day_number}
        </span>
        <div className="flex gap-4 flex-wrap flex-1">
          <MetaItem dotColor={STATUS_COLORS.driving}>{log.total_driving}h driving</MetaItem>
          <MetaItem dotColor={STATUS_COLORS.on_duty}>{log.total_on_duty}h on-duty</MetaItem>
          <MetaItem>{log.total_miles} mi</MetaItem>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-md text-[0.75rem] font-medium transition-all cursor-pointer font-[inherit] whitespace-nowrap"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13">
            <polyline points="4 6 4 1 12 1 12 6"/>
            <path d="M4 12H2a1 1 0 01-1-1V8a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1h-2"/>
            <rect x="4" y="9" width="8" height="6" rx="0.5"/>
          </svg>
          Print
        </button>
      </div>
      {/* Canvas */}
      <div className="overflow-x-auto p-4 bg-white">
        <canvas ref={canvasRef} className="block max-w-full" />
      </div>
    </div>
  )
}

function MetaItem({ dotColor, children }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.75rem] text-slate-500 font-medium tabular-nums">
      {dotColor && <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: dotColor }} />}
      {children}
    </span>
  )
}
