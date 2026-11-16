import { useId } from 'react'
import { ONSET_LABELS, type Onset } from './types'

const ORDER: Onset[] = ['today', 'days', 'week', 'longer']
const X0 = 30
const X1 = 310
const STEP = (X1 - X0) / (ORDER.length - 1)
const BAR_Y = 26
const BAR_H = 28

/* A milled rule with four stops; the carrier glides between them. */
export function OnsetRule({ value, onChange }: { value: Onset | null; onChange: (v: Onset) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const index = value ? ORDER.indexOf(value) : 0
  const x = X0 + index * STEP
  const p = index / (ORDER.length - 1)

  const key = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const nextIndex = Math.max(0, Math.min(ORDER.length - 1, index + (e.key === 'ArrowRight' ? 1 : -1)))
    onChange(ORDER[nextIndex])
  }

  /* Equal hit bands between the stops, so the ends are as easy to reach as the middle. */
  const bounds = [0, ...ORDER.slice(0, -1).map((_, i) => X0 + (i + 0.5) * STEP), 340]

  return (
    <div
      className="rule"
      data-set={value !== null}
      role="radiogroup"
      aria-label="When the symptoms started"
      tabIndex={0}
      onKeyDown={key}
    >
      <svg viewBox="0 0 340 100" className="rule__svg">
        <defs>
          <linearGradient id={`${raw}-bar`} x1="0.04" y1="0" x2="0.96" y2="1">
            <stop offset="0" stopColor="#4a6577" />
            <stop offset="0.12" stopColor="#1b2c37" />
            <stop offset="0.5" stopColor="#0b1620" />
            <stop offset="0.86" stopColor="#172833" />
            <stop offset="1" stopColor="#42606f" />
          </linearGradient>

          <linearGradient id={`${raw}-grip`} x1="0.08" y1="0" x2="0.92" y2="1">
            <stop offset="0" stopColor="#d8eef8" />
            <stop offset="0.2" stopColor="#87a5b7" />
            <stop offset="0.52" stopColor="#2a3e4c" />
            <stop offset="0.86" stopColor="#101d26" />
            <stop offset="1" stopColor="#54717f" />
          </linearGradient>

          <linearGradient id={`${raw}-flow`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0e7490" />
            <stop offset="0.55" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a5f3fc" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          <clipPath id={`${raw}-railClip`}>
            <rect x="24" y={BAR_Y} width="292" height={BAR_H} rx="14" />
          </clipPath>
        </defs>

        {/* the shadow the rule casts on the panel */}
        <ellipse cx="170" cy="66" rx="148" ry="14" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />

        {/* milled bar */}
        <rect x="22" y={BAR_Y} width="296" height={BAR_H} rx="14" fill={`url(#${raw}-bar)`} />
        <rect x="22.6" y={BAR_Y + 0.6} width="294.8" height={BAR_H - 1.2} rx="13.4" fill="none" stroke="#d9f2fd" strokeOpacity="0.18" />
        <rect x="25" y={BAR_Y + 2} width="290" height="8" rx="4" fill="#ffffff" opacity="0.05" />

        {/* the groove the carrier runs in */}
        <rect x="24" y={BAR_Y + 9} width="292" height="6" rx="3" fill="#000000" opacity="0.4" />

        {/* engraved ticks under the bar */}
        {Array.from({ length: 39 }, (_, i) => {
          const tx = 22 + i * 7.79
          const major = i % 13 === 0 || i === 38
          return (
            <line
              key={i}
              x1={tx}
              y1="60"
              x2={tx}
              y2={major ? 69 : 65}
              stroke={major ? '#9dc4d6' : '#000000'}
              strokeOpacity={major ? 0.32 : 0.55}
              strokeWidth={major ? 1 : 0.7}
            />
          )
        })}

        {/* the light that has run to the carrier */}
        <g clipPath={`url(#${raw}-railClip)`}>
          <rect
            x="24"
            y={BAR_Y}
            width="292"
            height={BAR_H}
            fill={`url(#${raw}-flow)`}
            opacity="0.18"
            style={{ transform: `scaleX(${p})`, transformOrigin: '24px 0px', transition: 'transform 460ms cubic-bezier(0.22,0.9,0.28,1)' }}
          />
          <rect
            x="24"
            y={BAR_Y + BAR_H - 5}
            width="292"
            height="2.4"
            fill="#eafdff"
            opacity="0.6"
            style={{ transform: `scaleX(${p})`, transformOrigin: '24px 0px', transition: 'transform 460ms cubic-bezier(0.22,0.9,0.28,1)' }}
          />
        </g>

        {/* stops */}
        {ORDER.map((o, i) => {
          const ox = X0 + i * STEP
          const on = value === o
          return (
            <g key={o}>
              <line
                x1={ox}
                y1={BAR_Y - 4}
                x2={ox}
                y2="68"
                stroke={on ? '#a5f3fc' : '#6c8b9d'}
                strokeOpacity={on ? 0.75 : 0.26}
                strokeWidth="1"
              />
              <text
                x={ox}
                y="84"
                fill={on ? '#dff6ff' : '#6f8a9c'}
                fontSize="9.5"
                fontWeight="500"
                letterSpacing="1.6"
                textAnchor="middle"
              >
                {ONSET_LABELS[o].toUpperCase()}
              </text>
              {on && <circle cx={ox} cy="17" r="2.2" fill="#67e8f9" />}
            </g>
          )
        })}

        {/* the carrier */}
        <ellipse cx={x + 2} cy="62" rx="16" ry="6" fill="#000000" opacity="0.55" filter={`url(#${raw}-soft)`} />
        <g
          className="rule__carrier"
          style={{ transform: `translateX(${x - X0}px)`, transition: 'transform 460ms cubic-bezier(0.22,0.9,0.28,1)' }}
        >
          <rect x={X0 - 13} y="4" width="26" height="54" rx="6" fill={`url(#${raw}-grip)`} />
          <rect x={X0 - 13} y="4" width="26" height="54" rx="6" fill="none" stroke="#000000" strokeOpacity="0.5" />
          <rect x={X0 - 11.4} y="5.6" width="1.6" height="50.8" rx="0.8" fill="#eafdff" opacity="0.55" />
          <rect x={X0 + 10} y="6.6" width="1.2" height="48.8" rx="0.6" fill="#0a141c" opacity="0.5" />
          {[-5, 0, 5].map((dy) => (
            <line key={dy} x1={X0 - 6} y1={33 + dy} x2={X0 + 6} y2={33 + dy} stroke="#0a141c" strokeOpacity="0.55" strokeWidth="1.1" />
          ))}
          <path d={`M ${X0 - 5} 52 L ${X0 + 5} 52 L ${X0} 60 Z`} fill="#0a141c" opacity="0.7" />
          <path d={`M ${X0 - 4} 51.4 L ${X0 + 4} 51.4`} stroke="#a5f3fc" strokeOpacity="0.55" strokeWidth="1" />
        </g>

        {/* hit bands */}
        {ORDER.map((o, i) => (
          <rect
            key={`h${o}`}
            x={bounds[i]}
            y="0"
            width={bounds[i + 1] - bounds[i]}
            height="94"
            fill="transparent"
            role="radio"
            aria-checked={value === o}
            aria-label={ONSET_LABELS[o]}
            onClick={() => onChange(o)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
    </div>
  )
}
