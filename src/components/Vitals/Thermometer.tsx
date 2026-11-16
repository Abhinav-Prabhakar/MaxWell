import { useId, useRef, useState } from 'react'
import { TEMP_MAX, TEMP_MIN, tempWord } from './types'

const X0 = 96
const X1 = 284
const Y = 96
const BULB_X = 62
const BULB_R = 21

const xAt = (v: number) => X0 + ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * (X1 - X0)

/* A clinical thermometer lying across the panel: glass tube, silver thread,
   a reader carriage on a rail above it. */
export function Thermometer({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [dragging, setDragging] = useState(false)
  const svg = useRef<SVGSVGElement>(null)

  const v = value ?? TEMP_MIN
  const x = xAt(v)
  const warm = v >= 37.5

  const fromPointer = (clientX: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const px = ((clientX - box.left) / box.width) * 340
    const p = Math.max(0, Math.min(1, (px - X0) / (X1 - X0)))
    onChange(TEMP_MIN + p * (TEMP_MAX - TEMP_MIN))
  }

  const key = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowLeft: -0.1,
      ArrowDown: -0.1,
      ArrowRight: 0.1,
      ArrowUp: 0.1,
      PageDown: -0.5,
      PageUp: 0.5,
    }
    if (e.key in map) {
      e.preventDefault()
      onChange(v + map[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(TEMP_MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(TEMP_MAX)
    }
  }

  return (
    <div
      className="therm"
      data-set={value !== null}
      data-warm={warm && value !== null}
      data-dragging={dragging}
      role="slider"
      tabIndex={0}
      aria-label="Temperature in degrees Celsius"
      aria-valuemin={TEMP_MIN}
      aria-valuemax={TEMP_MAX}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'Not taken' : `${value.toFixed(1)} degrees, ${tempWord(value)}`}
      onPointerDown={(e) => {
        const box = svg.current?.getBoundingClientRect()
        if (!box) return
        const py = ((e.clientY - box.top) / box.height) * 150
        if (py < 18 || py > 132) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        fromPointer(e.clientX)
      }}
      onPointerMove={(e) => {
        if (dragging) fromPointer(e.clientX)
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={key}
    >
      <svg ref={svg} viewBox="0 0 340 150" className="therm__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-glass`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#cde6f2" stopOpacity="0.26" />
            <stop offset="0.28" stopColor="#dff6ff" stopOpacity="0.08" />
            <stop offset="0.62" stopColor="#0b1a24" stopOpacity="0.35" />
            <stop offset="1" stopColor="#7fa7b8" stopOpacity="0.16" />
          </linearGradient>

          <linearGradient id={`${raw}-thread`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4feff" />
            <stop offset="0.42" stopColor="#bfe3ef" />
            <stop offset="0.72" stopColor="#5d8494" />
            <stop offset="1" stopColor="#20323c" />
          </linearGradient>

          <linearGradient id={`${raw}-warm`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1d0" />
            <stop offset="0.4" stopColor="#fcd34d" />
            <stop offset="0.78" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#8a4b06" />
          </linearGradient>

          <linearGradient id={`${raw}-carriage`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#e2f4fb" />
            <stop offset="0.24" stopColor="#93b0c1" />
            <stop offset="0.58" stopColor="#2a3f4e" />
            <stop offset="0.9" stopColor="#101d26" />
            <stop offset="1" stopColor="#4d6b7d" />
          </linearGradient>

          <linearGradient id={`${raw}-zone`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="0.7" stopColor="#fbbf24" stopOpacity="0.2" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0.42" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={`${raw}-tight`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={`${raw}-glow`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>

          <clipPath id={`${raw}-bore`}>
            <rect x="84" y="88" width="202" height="16" rx="8" />
          </clipPath>
        </defs>

        {/* shadow on the panel */}
        <ellipse cx="170" cy="120" rx="132" ry="12" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />

        {/* the scale under the tube */}
        <rect
          x={xAt(36)}
          y="110"
          width={xAt(37.5) - xAt(36)}
          height="2.4"
          fill="#22d3ee"
          opacity="0.22"
        />
        <rect x={xAt(37.5)} y="110" width={X1 - xAt(37.5)} height="2.4" fill="#fbbf24" opacity="0.4" />

        {Array.from({ length: 71 }, (_, i) => {
          const deg = 35 + i * 0.1
          const tx = xAt(deg)
          const major = Math.abs(deg - Math.round(deg)) < 0.001
          const mid = Math.abs((deg * 10) % 5) < 0.001
          return (
            <line
              key={i}
              x1={tx}
              y1="114"
              x2={tx}
              y2={major ? 122 : mid ? 119 : 117}
              stroke={major ? '#9dc4d6' : '#000000'}
              strokeOpacity={major ? 0.38 : mid ? 0.5 : 0.5}
              strokeWidth={major ? 1 : 0.7}
            />
          )
        })}

        {Array.from({ length: 8 }, (_, i) => {
          const deg = 35 + i
          return (
            <text
              key={deg}
              x={xAt(deg)}
              y="132"
              fill="#6f8a9c"
              fillOpacity="0.78"
              fontSize="8"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {deg}
            </text>
          )
        })}
        <text x="292" y="132" fill="#5d7687" fontSize="7.5" dominantBaseline="middle">
          °C
        </text>

        {/* the rail the reader runs on */}
        <line x1={X0} y1="52" x2={X1} y2="52" stroke="#000000" strokeOpacity="0.55" strokeWidth="3.4" strokeLinecap="round" />
        <line x1={X0} y1="51" x2={X1} y2="51" stroke="#9dc4d6" strokeOpacity="0.16" strokeWidth="1" strokeLinecap="round" />

        {/* the tube: bulb, bore, glass */}
        <circle cx={BULB_X} cy={Y} r={BULB_R + 3} fill="#000000" opacity="0.28" filter={`url(#${raw}-tight)`} />
        <rect x="78" y={Y - 14} width="214" height="28" rx="14" fill={`url(#${raw}-glass)`} />
        <circle cx={BULB_X} cy={Y} r={BULB_R} fill={`url(#${raw}-glass)`} />
        <circle cx={BULB_X} cy={Y} r={BULB_R} fill="none" stroke="#d7f0fa" strokeOpacity="0.22" />
        <rect x="84" y={Y - 8} width="202" height="16" rx="8" fill="#02070b" fillOpacity="0.75" />
        <rect x="84" y={Y - 8} width="202" height="16" rx="8" fill="none" stroke="#000000" strokeOpacity="0.6" />

        {/* the temperature zones, printed inside the bore */}
        <rect x={xAt(36)} y={Y - 8} width={xAt(37.5) - xAt(36)} height="16" fill="#22d3ee" opacity="0.08" />
        <rect x={xAt(37.5)} y={Y - 8} width={X1 - xAt(37.5)} height="16" fill="#fbbf24" opacity="0.1" />

        {/* the thread of liquid */}
        <g clipPath={`url(#${raw}-bore)`}>
          <rect
            x={X0}
            y={Y - 2.6}
            width={value === null ? 0 : x - X0}
            height="5.2"
            fill={warm && value !== null ? `url(#${raw}-warm)` : `url(#${raw}-thread)`}
            style={{ transition: 'width 260ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          <rect
            x={X0}
            y={Y - 2.6}
            width={value === null ? 0 : x - X0}
            height="1.6"
            fill="#ffffff"
            opacity="0.45"
            style={{ transition: 'width 260ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
        </g>

        {/* the bulb's liquid */}
        <circle cx={BULB_X} cy={Y} r={BULB_R - 5} fill={warm && value !== null ? `url(#${raw}-warm)` : `url(#${raw}-thread)`} opacity="0.9" />
        <circle cx={BULB_X - 6} cy={Y - 7} r="5" fill="#ffffff" opacity="0.4" filter={`url(#${raw}-tight)`} />

        {/* glass sheen over the tube */}
        <rect x="90" y={Y - 6} width="190" height="2" rx="1" fill="#ffffff" opacity="0.14" />
        <rect x="90" y={Y + 2} width="190" height="1.4" rx="0.7" fill="#ffffff" opacity="0.06" />
        <circle cx={BULB_X - 7} cy={Y - 8} r="4.4" fill="#ffffff" opacity="0.22" filter={`url(#${raw}-tight)`} />

        {/* meniscus at the head of the thread */}
        {value !== null && (
          <g style={{ transform: `translateX(${x - X0}px)`, transition: 'transform 260ms cubic-bezier(0.3,0.8,0.4,1)' }}>
            <ellipse cx={X0} cy={Y} rx="3.4" ry="4" fill={warm ? '#fbbf24' : '#dff6ff'} opacity="0.85" />
            <ellipse cx={X0} cy={Y} rx="1.6" ry="2.2" fill="#ffffff" opacity="0.6" />
          </g>
        )}

        {/* the reader carriage */}
        {value !== null && (
          <g style={{ transform: `translateX(${x - X0}px)`, transition: 'transform 260ms cubic-bezier(0.3,0.8,0.4,1)' }}>
            <ellipse cx={X0 + 2} cy="62" rx="10" ry="8" fill="#000000" opacity="0.45" filter={`url(#${raw}-soft)`} />
            <rect x={X0 - 9} y="42" width="18" height="21" rx="5" fill={`url(#${raw}-carriage)`} />
            <rect x={X0 - 9} y="42" width="18" height="21" rx="5" fill="none" stroke="#000000" strokeOpacity="0.5" />
            <rect x={X0 - 7.4} y="43.6" width="1.4" height="17.8" rx="0.7" fill="#eafdff" opacity="0.5" />
            <line x1={X0 - 4} y1="48" x2={X0 + 4} y2="48" stroke="#0a141c" strokeOpacity="0.5" />
            <line x1={X0 - 4} y1="52" x2={X0 + 4} y2="52" stroke="#0a141c" strokeOpacity="0.5" />
            <path d={`M ${X0 - 3} 63 L ${X0 + 3} 63 L ${X0} 70 Z`} fill="#0a141c" opacity="0.62" />
            <path d={`M ${X0 - 2.4} 62.4 L ${X0 + 2.4} 62.4`} stroke={warm ? '#fbbf24' : '#a5f3fc'} strokeOpacity="0.6" strokeWidth="1" />
            <line x1={X0} y1="70" x2={X0} y2="82" stroke={warm ? '#fbbf24' : '#a5f3fc'} strokeOpacity="0.2" strokeWidth="0.8" />
          </g>
        )}

        {warm && value !== null && (
          <circle cx={x} cy={Y} r="15" fill="#f59e0b" opacity="0.18" filter={`url(#${raw}-glow)`} />
        )}
      </svg>

      <div className="therm__read" aria-hidden="true">
        <span className="therm__num">{value === null ? '—' : value.toFixed(1)}</span>
        <span className="therm__unit">{value === null ? 'drag to set' : '°C'}</span>
        {value !== null && (
          <span className="therm__word" key={tempWord(value)}>
            {tempWord(value)}
          </span>
        )}
      </div>
    </div>
  )
}
