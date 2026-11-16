import { useId, useState } from 'react'
import { DIA_MAX, DIA_MIN, SYS_MAX, SYS_MIN, pressureWord } from './types'

const BOX = 340
const TOP = 58
const FLOOR = 250
const SYS_X = 118
const DIA_X = 222
const CASE_Y = 10
const CASE_H = 254

const yAt = (v: number, lo: number, hi: number) => FLOOR - ((v - lo) / (hi - lo)) * (FLOOR - TOP)
const pct = (n: number) => `${(n / BOX) * 100}%`

type Column = 'sys' | 'dia'

/* A cuff read off a twin mercury column: two glass bores in one steel case,
   each bead dragged to its own number. */
export function PressureColumn({
  systolic,
  diastolic,
  onSystolic,
  onDiastolic,
}: {
  systolic: number | null
  diastolic: number | null
  onSystolic: (v: number) => void
  onDiastolic: (v: number) => void
}) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [drag, setDrag] = useState<Column | null>(null)

  const flag =
    (systolic !== null && (systolic >= 160 || systolic <= 95)) ||
    (diastolic !== null && diastolic >= 100)

  const setFrom = (which: Column, e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (box.bottom - e.clientY) / box.height))
    if (which === 'sys') onSystolic(SYS_MIN + p * (SYS_MAX - SYS_MIN))
    else onDiastolic(DIA_MIN + p * (DIA_MAX - DIA_MIN))
  }

  const key = (which: Column, e: React.KeyboardEvent) => {
    const isSys = which === 'sys'
    const lo = isSys ? SYS_MIN : DIA_MIN
    const hi = isSys ? SYS_MAX : DIA_MAX
    const cur = (isSys ? systolic : diastolic) ?? Math.round((lo + hi) / 2)
    const set = isSys ? onSystolic : onDiastolic
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
    if (e.key in map) {
      e.preventDefault()
      set(Math.max(lo, Math.min(hi, cur + map[e.key])))
    } else if (e.key === 'Home') {
      e.preventDefault()
      set(lo)
    } else if (e.key === 'End') {
      e.preventDefault()
      set(hi)
    }
  }

  const column = (which: Column, x: number, lo: number, hi: number, value: number | null) => {
    const outer = which === 'sys' ? -1 : 1
    const v = value ?? lo
    const y = yAt(v, lo, hi)
    const lit = value !== null
    const mine = which === 'sys' ? flag && systolic !== null && (systolic >= 160 || systolic <= 95) : flag && diastolic !== null && diastolic >= 100
    const tone = mine ? '#fbbf24' : '#22d3ee'
    const ticks: number[] = []
    for (let t = lo; t <= hi; t += 5) ticks.push(t)

    return (
      <g key={which}>
        {/* the engraved scale, on the outside edge */}
        {ticks.map((t) => {
          const ty = yAt(t, lo, hi)
          const major = t % 20 === 0
          const mid = t % 10 === 0
          return (
            <g key={t}>
              <line
                x1={x + outer * 12}
                y1={ty}
                x2={x + outer * (12 + (major ? 11 : mid ? 8 : 5))}
                y2={ty}
                stroke={major ? '#9dc4d6' : '#000000'}
                strokeOpacity={major ? 0.34 : 0.5}
                strokeWidth={major ? 1 : 0.7}
              />
              <line
                x1={x}
                y1={ty}
                x2={x + outer * 10}
                y2={ty}
                stroke="#000000"
                strokeOpacity={0.38}
                strokeWidth="0.6"
              />
              {major && (
                <text
                  x={x + outer * 27}
                  y={ty}
                  textAnchor={which === 'sys' ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill="#6f8a9c"
                  fillOpacity="0.76"
                  fontSize="7.4"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {t}
                </text>
              )}
            </g>
          )
        })}

        {/* the bore */}
        <rect x={x - 10} y={TOP - 8} width="20" height={FLOOR - TOP + 16} rx="10" fill="#02070b" />
        <rect x={x - 10} y={TOP - 8} width="20" height={FLOOR - TOP + 16} rx="10" fill="none" stroke="#000000" strokeOpacity="0.72" />
        <rect x={x - 9} y={TOP - 7} width="18" height={FLOOR - TOP + 14} rx="9" fill="none" stroke="#9dc4d6" strokeOpacity="0.1" />

        {/* the mercury */}
        <g clipPath={`url(#${raw}-bore)`}>
          <rect
            x={x - 7}
            y={lit ? y : FLOOR}
            width="14"
            height={lit ? FLOOR - y : 0}
            rx="7"
            fill={mine ? `url(#${raw}-amber)` : `url(#${raw}-mercury)`}
            style={{ transition: 'y 200ms cubic-bezier(0.3,0.8,0.4,1), height 200ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          <rect
            x={x - 4.6}
            y={lit ? y + 4 : FLOOR}
            width="2"
            height={lit ? Math.max(0, FLOOR - y - 8) : 0}
            rx="1"
            fill="#ffffff"
            opacity="0.32"
            style={{ transition: 'y 200ms cubic-bezier(0.3,0.8,0.4,1), height 200ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          {lit && (
            <ellipse
              cx={x}
              cy={y}
              rx="6.4"
              ry="3"
              fill={mine ? '#fde68a' : '#dff6ff'}
              opacity="0.8"
              style={{ transition: 'cy 200ms cubic-bezier(0.3,0.8,0.4,1)' }}
            />
          )}
        </g>

        {/* the bead */}
        <g style={{ transform: `translateY(${y - TOP}px)`, transition: 'transform 200ms cubic-bezier(0.3,0.8,0.4,1)' }}>
          <ellipse cx={x + 3} cy={TOP + 8} rx="17" ry="7" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />
          <rect x={x - 15} y={TOP - 8} width="30" height="16" rx="5" fill={`url(#${raw}-bead)`} />
          <rect x={x - 15} y={TOP - 8} width="30" height="16" rx="5" fill="none" stroke="#000000" strokeOpacity="0.55" />
          <rect x={x - 13} y={TOP - 6.6} width="26" height="1.5" rx="0.75" fill="#eafdff" opacity="0.45" />
          <line x1={x - 6} y1={TOP} x2={x + 6} y2={TOP} stroke="#0a141c" strokeOpacity="0.55" />
          <line x1={x - 6} y1={TOP + 3.4} x2={x + 6} y2={TOP + 3.4} stroke="#0a141c" strokeOpacity="0.4" />
          <path d={`M ${x - 3} ${TOP + 9} L ${x + 3} ${TOP + 9} L ${x} ${TOP + 14} Z`} fill="#0a141c" opacity="0.55" />
        </g>

        {lit && <line x1={x} y1={y} x2={x + outer * 18} y2={y} stroke={tone} strokeOpacity="0.24" strokeWidth="0.9" />}
      </g>
    )
  }

  const head = (which: Column, x: number) => (
    <g key={`head-${which}`}>
      <text x={x} y="32" textAnchor="middle" fill="#7d95a6" fontSize="7.4" letterSpacing="2.2">
        {which === 'sys' ? 'SYS' : 'DIA'}
      </text>
      <line x1={x - 10} y1="38" x2={x + 10} y2="38" stroke="#9dc4d6" strokeOpacity="0.2" />
    </g>
  )

  return (
    <div className="bpres" data-set={systolic !== null || diastolic !== null} data-flag={flag}>
      <div className="bpres__frame">
        <svg viewBox="0 0 340 310" className="bpres__svg" aria-hidden="true">
          <defs>
            <linearGradient id={`${raw}-case`} x1="0.04" y1="0" x2="0.96" y2="1">
              <stop offset="0" stopColor="#9ab7c8" />
              <stop offset="0.07" stopColor="#3a5263" />
              <stop offset="0.26" stopColor="#101f29" />
              <stop offset="0.66" stopColor="#0a141c" />
              <stop offset="0.94" stopColor="#435f70" />
              <stop offset="1" stopColor="#0b151d" />
            </linearGradient>

            <linearGradient id={`${raw}-mercury`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2f4b5b" />
              <stop offset="0.22" stopColor="#cfeefb" />
              <stop offset="0.46" stopColor="#f4feff" />
              <stop offset="0.7" stopColor="#7fb4c8" />
              <stop offset="1" stopColor="#1c3543" />
            </linearGradient>

            <linearGradient id={`${raw}-amber`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8a4b06" />
              <stop offset="0.24" stopColor="#fde68a" />
              <stop offset="0.48" stopColor="#fff7dc" />
              <stop offset="0.72" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#6b3a05" />
            </linearGradient>

            <linearGradient id={`${raw}-bead`} x1="0.08" y1="0" x2="0.92" y2="1">
              <stop offset="0" stopColor="#e4f5fc" />
              <stop offset="0.24" stopColor="#8facbe" />
              <stop offset="0.56" stopColor="#2a3f4e" />
              <stop offset="0.9" stopColor="#101d26" />
              <stop offset="1" stopColor="#587586" />
            </linearGradient>

            <filter id={`${raw}-soft`} x="-80%" y="-160%" width="260%" height="420%">
              <feGaussianBlur stdDeviation="4.4" />
            </filter>

            <clipPath id={`${raw}-bore`}>
              <rect x={SYS_X - 10} y={TOP - 8} width="20" height={FLOOR - TOP + 16} rx="10" />
              <rect x={DIA_X - 10} y={TOP - 8} width="20" height={FLOOR - TOP + 16} rx="10" />
            </clipPath>
          </defs>

          {/* cast shadow on the panel */}
          <ellipse cx="170" cy="276" rx="132" ry="11" fill="#000000" opacity="0.48" filter={`url(#${raw}-soft)`} />

          {/* the case */}
          <rect x="18" y={CASE_Y} width="304" height={CASE_H} rx="14" fill={`url(#${raw}-case)`} />
          <rect x="18.7" y={CASE_Y + 0.7} width="302.6" height={CASE_H - 1.4} rx="13.4" fill="none" stroke="#d4eef9" strokeOpacity="0.15" />
          <rect x="27" y={CASE_Y + 9} width="286" height={CASE_H - 18} rx="8" fill="#040c12" />
          <rect x="27" y={CASE_Y + 9} width="286" height={CASE_H - 18} rx="8" fill="none" stroke="#000000" strokeOpacity="0.7" />

          {/* a turned groove around the wells */}
          <rect x="79" y="42" width="182" height="222" rx="16" fill="none" stroke="#000000" strokeOpacity="0.5" />
          <rect x="80" y="43" width="180" height="220" rx="15" fill="none" stroke="#ffffff" strokeOpacity="0.035" />

          {head('sys', SYS_X)}
          {head('dia', DIA_X)}

          {column('sys', SYS_X, SYS_MIN, SYS_MAX, systolic)}
          {column('dia', DIA_X, DIA_MIN, DIA_MAX, diastolic)}

          <text x="170" y="247" textAnchor="middle" fill="#4c6374" fontSize="7" letterSpacing="2.4">
            mmHg
          </text>

          {/* screws at the corners */}
          {[
            [28, 20],
            [312, 20],
            [28, 254],
            [312, 254],
          ].map(([sx, sy], i) => (
            <g key={i}>
              <circle cx={sx} cy={sy} r="2.6" fill="#0a141c" stroke="#9dc4d6" strokeOpacity="0.22" />
              <line x1={sx - 1.4} y1={sy - 1.4} x2={sx + 1.4} y2={sy + 1.4} stroke="#9dc4d6" strokeOpacity="0.26" strokeWidth="0.6" />
            </g>
          ))}

          {/* a long hard reflection across the glass face */}
          <path d="M 32 18 L 104 18 L 54 256 L 32 256 Z" fill="#ffffff" opacity="0.028" />
          <path d="M 312 18 L 318 18 L 268 256 L 262 256 Z" fill="#ffffff" opacity="0.02" />
        </svg>

        <div
          className="bpres__grip"
          style={{ left: pct(SYS_X - 26), width: pct(52) }}
          role="slider"
          tabIndex={0}
          aria-label="Upper blood pressure, systolic"
          aria-valuemin={SYS_MIN}
          aria-valuemax={SYS_MAX}
          aria-valuenow={systolic ?? undefined}
          aria-valuetext={systolic === null ? 'Not set' : `${systolic} millimetres of mercury`}
          data-armed={drag === 'sys'}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setDrag('sys')
            setFrom('sys', e)
          }}
          onPointerMove={(e) => {
            if (drag === 'sys') setFrom('sys', e)
          }}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          onKeyDown={(e) => key('sys', e)}
        />

        <div
          className="bpres__grip"
          style={{ left: pct(DIA_X - 26), width: pct(52) }}
          role="slider"
          tabIndex={0}
          aria-label="Lower blood pressure, diastolic"
          aria-valuemin={DIA_MIN}
          aria-valuemax={DIA_MAX}
          aria-valuenow={diastolic ?? undefined}
          aria-valuetext={diastolic === null ? 'Not set' : `${diastolic} millimetres of mercury`}
          data-armed={drag === 'dia'}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setDrag('dia')
            setFrom('dia', e)
          }}
          onPointerMove={(e) => {
            if (drag === 'dia') setFrom('dia', e)
          }}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          onKeyDown={(e) => key('dia', e)}
        />
      </div>

      <div className="bpres__read" aria-hidden="true">
        <span className="bpres__num">
          {systolic ?? '—'}
          <span className="bpres__slash">/</span>
          {diastolic ?? '—'}
        </span>
        <span className="bpres__unit">mmHg</span>
        {systolic !== null && diastolic !== null && (
          <span className="bpres__word" key={pressureWord(systolic, diastolic)}>
            {pressureWord(systolic, diastolic)}
          </span>
        )}
      </div>
    </div>
  )
}
