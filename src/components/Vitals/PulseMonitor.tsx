import { useId, useRef, useState } from 'react'
import { PULSE_MAX, PULSE_MIN, pulseWord } from './types'

const RAIL_X0 = 34
const RAIL_X1 = 306
const BEAT_W = 60
const BASE_Y = 76

const xAt = (v: number) => RAIL_X0 + ((v - PULSE_MIN) / (PULSE_MAX - PULSE_MIN)) * (RAIL_X1 - RAIL_X0)

/* One beat, drawn once and tiled: flat, P, QRS, T, flat. */
const BEAT = `M 0 ${BASE_Y} H 8 L 11 ${BASE_Y - 3} Q 14 ${BASE_Y + 1} 17 ${BASE_Y} H 20 L 23 ${BASE_Y + 3} L 26 ${BASE_Y - 32} L 29 ${BASE_Y + 14} L 32 ${BASE_Y} H 38 L 43 ${BASE_Y - 6} Q 47 ${BASE_Y + 2} 51 ${BASE_Y} H 60`

/* A bedside monitor with the trace scrolling at the rate on the fader. */
export function PulseMonitor({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [dragging, setDragging] = useState(false)
  const svg = useRef<SVGSVGElement>(null)

  const v = value ?? 72
  const x = xAt(v)
  const fast = value !== null && value >= 120
  const beat = 60 / v

  const fromPointer = (clientX: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const px = ((clientX - box.left) / box.width) * 340
    const p = Math.max(0, Math.min(1, (px - RAIL_X0) / (RAIL_X1 - RAIL_X0)))
    onChange(PULSE_MIN + p * (PULSE_MAX - PULSE_MIN))
  }

  const key = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }
    if (e.key in map) {
      e.preventDefault()
      onChange(v + map[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(PULSE_MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(PULSE_MAX)
    }
  }

  return (
    <div
      className="pulse"
      data-set={value !== null}
      data-fast={fast}
      data-dragging={dragging}
      role="slider"
      tabIndex={0}
      aria-label="Pulse in beats per minute"
      aria-valuemin={PULSE_MIN}
      aria-valuemax={PULSE_MAX}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'Not taken' : `${value} beats per minute, ${pulseWord(value)}`}
      onPointerDown={(e) => {
        const box = svg.current?.getBoundingClientRect()
        if (!box) return
        const py = ((e.clientY - box.top) / box.height) * 210
        if (py < 146) return
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
      <svg ref={svg} viewBox="0 0 340 210" className="pulse__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-case`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#93b1c2" />
            <stop offset="0.08" stopColor="#33495a" />
            <stop offset="0.3" stopColor="#0e1c26" />
            <stop offset="0.68" stopColor="#0a141c" />
            <stop offset="0.92" stopColor="#3d5a6c" />
            <stop offset="1" stopColor="#0b151d" />
          </linearGradient>

          <radialGradient id={`${raw}-screen`} cx="0.3" cy="0.18" r="0.9">
            <stop offset="0" stopColor="#0a2029" />
            <stop offset="0.55" stopColor="#061219" />
            <stop offset="1" stopColor="#03080c" />
          </radialGradient>

          <linearGradient id={`${raw}-trace`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="0.6" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#a5f3fc" />
          </linearGradient>

          <linearGradient id={`${raw}-warmTrace`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="0.6" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#fde68a" />
          </linearGradient>

          <linearGradient id={`${raw}-thumb`} x1="0.08" y1="0" x2="0.92" y2="1">
            <stop offset="0" stopColor="#d8eef8" />
            <stop offset="0.22" stopColor="#87a5b7" />
            <stop offset="0.54" stopColor="#2a3e4c" />
            <stop offset="0.88" stopColor="#101d26" />
            <stop offset="1" stopColor="#54717f" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={`${raw}-glow`} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          <pattern id={`${raw}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0.6" x2="4" y2="0.6" stroke="#000000" strokeOpacity="0.45" strokeWidth="1.2" />
          </pattern>

          <clipPath id={`${raw}-glass`}>
            <rect x="28" y="20" width="204" height="108" rx="6" />
          </clipPath>
        </defs>

        {/* shadow on the panel */}
        <ellipse cx="170" cy="196" rx="140" ry="9" fill="#000000" opacity="0.45" filter={`url(#${raw}-soft)`} />

        {/* case and screen */}
        <rect x="18" y="10" width="304" height="128" rx="12" fill={`url(#${raw}-case)`} />
        <rect x="18.7" y="10.7" width="302.6" height="126.6" rx="11.4" fill="none" stroke="#d4eef9" strokeOpacity="0.16" />
        <rect x="26" y="18" width="288" height="112" rx="7" fill="#040b10" />
        <rect x="28" y="20" width="204" height="108" rx="6" fill={`url(#${raw}-screen)`} />

        {/* ECG paper grid */}
        <g clipPath={`url(#${raw}-glass)`} opacity="0.5">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={28 + i * 12} y1="20" x2={28 + i * 12} y2="128" stroke="#0f3b46" strokeOpacity={i % 5 === 0 ? 0.55 : 0.26} strokeWidth="0.7" />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="28" y1={20 + i * 12} x2="232" y2={20 + i * 12} stroke="#0f3b46" strokeOpacity={i % 4 === 0 ? 0.55 : 0.26} strokeWidth="0.7" />
          ))}
        </g>

        {/* the scrolling trace */}
        <g clipPath={`url(#${raw}-glass)`}>
          <g
            className="pulse__trace"
            style={{ animationDuration: `${beat}s`, animationPlayState: value === null ? 'paused' : 'running' }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} transform={`translate(${i * BEAT_W - 40} 0)`}>
                <path d={BEAT} fill="none" stroke={fast ? `url(#${raw}-warmTrace)` : `url(#${raw}-trace)`} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
                <path d={BEAT} fill="none" stroke={fast ? '#fbbf24' : '#67e8f9'} strokeWidth="5" opacity="0.16" filter={`url(#${raw}-glow)`} />
              </g>
            ))}
          </g>

          {/* the beam */}
          <rect x="226" y="20" width="1.4" height="108" fill="#a5f3fc" opacity="0.18" />
          <rect x="28" y="20" width="204" height="108" fill={`url(#${raw}-scan)`} opacity="0.5" />
          <rect x="28" y="20" width="204" height="108" fill="none" stroke="#000000" strokeOpacity="0.55" />
          <path d="M 34 22 L 120 22 L 60 126 L 30 126 Z" fill="#ffffff" opacity="0.03" />
        </g>

        {/* the number panel */}
        <rect x="238" y="26" width="72" height="96" rx="5" fill="#02070b" stroke="#0b1f28" />
        <g className="pulse__heart" style={{ animationDuration: `${beat}s`, animationPlayState: value === null ? 'paused' : 'running' }}>
          <path
            d="M 274 44 c -4 -5 -11 -2.4 -11 2.6 c 0 4.6 6.4 8.4 11 11.4 c 4.6 -3 11 -6.8 11 -11.4 c 0 -5 -7 -7.6 -11 -2.6 Z"
            fill={fast ? '#fbbf24' : '#67e8f9'}
            opacity={value === null ? 0.35 : 0.9}
          />
        </g>
        <text
          x="274"
          y="86"
          textAnchor="middle"
          fill={fast ? '#fde68a' : '#dffaff'}
          fillOpacity={value === null ? 0.35 : 0.95}
          fontSize="27"
          fontWeight="500"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}
        >
          {value === null ? '--' : value}
        </text>
        <text x="274" y="103" textAnchor="middle" fill="#6f93a7" fillOpacity="0.8" fontSize="6.6" letterSpacing="1.4">
          BPM
        </text>
        <text x="274" y="114" textAnchor="middle" fill={fast ? '#fbbf24' : '#5d7c8e'} fontSize="6.4" letterSpacing="0.8">
          {value === null ? 'NOT TAKEN' : pulseWord(value).toUpperCase()}
        </text>

        {/* screws and glass */}
        {[
          [24, 15],
          [316, 15],
          [24, 133],
          [316, 133],
        ].map(([sx, sy], i) => (
          <g key={i}>
            <circle cx={sx} cy={sy} r="2.4" fill="#0a141c" stroke="#9dc4d6" strokeOpacity="0.2" />
            <line x1={sx - 1.4} y1={sy - 1.4} x2={sx + 1.4} y2={sy + 1.4} stroke="#9dc4d6" strokeOpacity="0.25" strokeWidth="0.6" />
          </g>
        ))}
        <path d="M 28 24 L 124 24 L 68 128 L 28 128 Z" fill="#ffffff" opacity="0.035" />

        {/* the fader */}
        <line x1={RAIL_X0} y1="168" x2={RAIL_X1} y2="168" stroke="#000000" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        <line x1={RAIL_X0} y1="167" x2={RAIL_X1} y2="167" stroke="#9dc4d6" strokeOpacity="0.18" strokeWidth="1" strokeLinecap="round" />
        <rect x={RAIL_X0} y="166" width={Math.max(0, x - RAIL_X0)} height="3" fill={fast ? '#fbbf24' : '#22d3ee'} opacity="0.5" style={{ transition: 'width 180ms ease' }} className="pulse__fill" />

        {Array.from({ length: 15 }, (_, i) => {
          const bpm = PULSE_MIN + i * 10
          const tx = xAt(bpm)
          const major = bpm % 20 === 0
          return (
            <g key={bpm}>
              <line x1={tx} y1="176" x2={tx} y2={major ? 184 : 180} stroke={major ? '#9dc4d6' : '#000000'} strokeOpacity={major ? 0.3 : 0.5} strokeWidth={major ? 1 : 0.7} />
              {major && (
                <text x={tx} y="194" textAnchor="middle" fill="#6f8a9c" fillOpacity="0.72" fontSize="7.4" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {bpm}
                </text>
              )}
            </g>
          )
        })}

        <g className="pulse__thumb" style={{ transform: `translateX(${x - RAIL_X0}px)`, transition: 'transform 180ms cubic-bezier(0.3,0.8,0.4,1)' }}>
          <ellipse cx={RAIL_X0 + 2} cy="172" rx="8" ry="6" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />
          <rect x={RAIL_X0 - 8} y="154" width="16" height="22" rx="5" fill={`url(#${raw}-thumb)`} />
          <rect x={RAIL_X0 - 8} y="154" width="16" height="22" rx="5" fill="none" stroke="#000000" strokeOpacity="0.5" />
          <rect x={RAIL_X0 - 6.4} y="155.6" width="1.4" height="18.8" rx="0.7" fill="#eafdff" opacity="0.5" />
          <line x1={RAIL_X0 - 3.6} y1="160" x2={RAIL_X0 + 3.6} y2="160" stroke="#0a141c" strokeOpacity="0.5" />
          <line x1={RAIL_X0 - 3.6} y1="164" x2={RAIL_X0 + 3.6} y2="164" stroke="#0a141c" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  )
}
