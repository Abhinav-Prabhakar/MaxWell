import { useId, useRef, useState } from 'react'
import { severityWord } from './types'

const TOP = 24
const BOTTOM = 270
const SPAN = BOTTOM - TOP

const band = (v: number | null) => (v === null ? 0 : v <= 3 ? 1 : v <= 6 ? 2 : v <= 8 ? 3 : 4)

/* A lit column in a steel tube. Pull the grip up to make it worse. */
export function Severity({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [dragging, setDragging] = useState(false)
  const svg = useRef<SVGSVGElement>(null)

  const v = value ?? 0
  const level = BOTTOM - (v / 10) * SPAN

  const fromPointer = (clientY: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const y = ((clientY - box.top) / box.height) * 300
    onChange(Math.max(0, Math.min(10, Math.round(((BOTTOM - y) / SPAN) * 10))))
  }

  const key = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 2, PageDown: -2 }
    if (e.key in map) {
      e.preventDefault()
      onChange(Math.max(0, Math.min(10, v + map[e.key])))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(10)
    }
  }

  return (
    <div
      className="sev"
      data-set={value !== null}
      data-band={band(value)}
      data-dragging={dragging}
      role="slider"
      tabIndex={0}
      aria-label="How bad it feels, zero to ten"
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'Not set' : `${value} out of 10, ${severityWord(value)}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        fromPointer(e.clientY)
      }}
      onPointerMove={(e) => {
        if (dragging) fromPointer(e.clientY)
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={key}
    >
      <svg ref={svg} viewBox="0 0 132 300" className="sev__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-case`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#93b1c2" />
            <stop offset="0.1" stopColor="#33495a" />
            <stop offset="0.34" stopColor="#0e1c26" />
            <stop offset="0.66" stopColor="#0a141c" />
            <stop offset="0.9" stopColor="#3d5a6c" />
            <stop offset="1" stopColor="#0b151d" />
          </linearGradient>

          <linearGradient id={`${raw}-ramp`} x1="0" y1={BOTTOM} x2="0" y2={TOP} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0e7490" />
            <stop offset="0.24" stopColor="#2dd4bf" />
            <stop offset="0.46" stopColor="#67e8f9" />
            <stop offset="0.66" stopColor="#fbbf24" />
            <stop offset="0.84" stopColor="#fb923c" />
            <stop offset="1" stopColor="#fb7185" />
          </linearGradient>

          <linearGradient id={`${raw}-grip`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#e2f4fb" />
            <stop offset="0.22" stopColor="#93b0c1" />
            <stop offset="0.55" stopColor="#2a3f4e" />
            <stop offset="0.88" stopColor="#101d26" />
            <stop offset="1" stopColor="#4d6b7d" />
          </linearGradient>

          <filter id={`${raw}-glow`} x="-90%" y="-20%" width="280%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${raw}-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={`${raw}-tight`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>

          <clipPath id={`${raw}-bore`}>
            <rect x="38" y={TOP + 2} width="30" height={SPAN - 4} rx="15" />
          </clipPath>
        </defs>

        {/* cast shadow */}
        <ellipse cx="55" cy="288" rx="34" ry="7" fill="#000000" opacity="0.45" filter={`url(#${raw}-soft)`} />

        {/* ticks and numerals beside the tube */}
        {Array.from({ length: 11 }, (_, i) => {
          const y = BOTTOM - (i / 10) * SPAN
          const major = i % 5 === 0
          return (
            <g key={i}>
              <line
                x1={major ? 80 : 85}
                y1={y}
                x2="92"
                y2={y}
                stroke={i <= v ? '#7fc8dd' : '#5d7c8e'}
                strokeOpacity={i <= v ? (major ? 0.6 : 0.4) : 0.2}
                strokeWidth={major ? 1.2 : 0.8}
              />
              {major && (
                <text
                  x="97"
                  y={y + 1}
                  fill="#7d9cad"
                  fillOpacity={i <= v && value !== null ? 0.95 : 0.5}
                  fontSize="9"
                  fontWeight="500"
                  dominantBaseline="middle"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {i}
                </text>
              )}
            </g>
          )
        })}

        {/* the case */}
        <rect x="30" y="16" width="46" height="262" rx="23" fill={`url(#${raw}-case)`} />
        <rect x="30.6" y="16.6" width="44.8" height="260.8" rx="22.4" fill="none" stroke="#d4eef9" strokeOpacity="0.14" />
        <rect x="34" y="20" width="38" height="254" rx="19" fill="#050a0f" />
        <rect x="38" y="24" width="30" height="246" rx="15" fill="#02060a" />
        <rect x="38" y="24" width="30" height="246" rx="15" fill="none" stroke="#000000" strokeOpacity="0.7" />

        {/* the column of light */}
        <g clipPath={`url(#${raw}-bore)`}>
          <rect
            x="38"
            y={level}
            width="30"
            height={Math.max(0, BOTTOM - level)}
            fill={`url(#${raw}-ramp)`}
            opacity="0.9"
            style={{ transition: 'y 220ms cubic-bezier(0.3,0.8,0.4,1), height 220ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          <rect
            x="38"
            y={level}
            width="30"
            height={Math.max(0, BOTTOM - level)}
            fill={`url(#${raw}-ramp)`}
            opacity="0.5"
            filter={`url(#${raw}-tight)`}
          />
          {/* the tube's own reflection over the liquid */}
          <rect x="41" y={TOP} width="4" height={SPAN} fill="#ffffff" opacity="0.08" />
          <rect x="61" y={TOP} width="3" height={SPAN} fill="#ffffff" opacity="0.04" />
        </g>

        {/* meniscus */}
        <g style={{ transition: 'transform 220ms cubic-bezier(0.3,0.8,0.4,1)' }} transform={`translate(0 ${level - BOTTOM})`}>
          <ellipse cx="53" cy={BOTTOM} rx="15" ry="4" fill="#eafdff" opacity="0.22" filter={`url(#${raw}-tight)`} />
          <path d={`M 39 ${BOTTOM} A 14 4 0 0 1 67 ${BOTTOM}`} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" />
        </g>

        {/* glass over the bore */}
        <rect x="38" y="24" width="30" height="246" rx="15" fill="none" stroke="#bdf1ff" strokeOpacity="0.1" />
        <rect x="44" y="30" width="6" height="232" rx="3" fill="#ffffff" opacity="0.045" />

        {/* grip */}
        <g style={{ transition: 'transform 220ms cubic-bezier(0.3,0.8,0.4,1)' }} transform={`translate(0 ${level - BOTTOM})`}>
          <rect x="18" y={BOTTOM - 9} width="70" height="18" rx="9" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />
          <rect x="18" y={BOTTOM - 8} width="70" height="16" rx="8" fill={`url(#${raw}-grip)`} />
          <rect x="18" y={BOTTOM - 8} width="70" height="16" rx="8" fill="none" stroke="#000000" strokeOpacity="0.5" />
          <rect x="20" y={BOTTOM - 6.6} width="66" height="1.2" rx="0.6" fill="#f2fdff" opacity="0.45" />
          {[30, 38, 46, 54, 62, 70].map((gx) => (
            <line key={gx} x1={gx} y1={BOTTOM - 4} x2={gx} y2={BOTTOM + 3} stroke="#0a141c" strokeOpacity="0.45" strokeWidth="1" />
          ))}
        </g>
      </svg>

      <div className="sev__read" aria-hidden="true">
        <span className="sev__num">{value === null ? '—' : value}</span>
        <span className="sev__word">{value === null ? 'drag up' : severityWord(value)}</span>
      </div>
    </div>
  )
}
