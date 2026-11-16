import { useId, useRef, useState } from 'react'
import { SPO2_MAX, SPO2_MIN, spo2Word } from './types'

const BOX_W = 340
const BOX_H = 300
const CAP_X = 128
const CAP_Y = 30
const CAP_W = 84
const CAP_H = 214
const BORE_TOP = 46
const BORE_FLOOR = 236
const NOTCH = 92

const yAt = (v: number) => BORE_FLOOR - ((v - SPO2_MIN) / (SPO2_MAX - SPO2_MIN)) * (BORE_FLOOR - BORE_TOP)

/* A glass cell of oxygen, filled to the number on the oximeter. Below 92 the
   fill turns amber: that is the line where a clinic starts worrying. */
export function OxygenCell({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)

  const v = value ?? SPO2_MIN
  const low = value !== null && value < NOTCH
  const y = yAt(v)
  const notchY = yAt(NOTCH)

  const fromPointer = (clientY: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const py = ((clientY - box.top) / box.height) * BOX_H
    const p = Math.max(0, Math.min(1, (BORE_FLOOR - py) / (BORE_FLOOR - BORE_TOP)))
    onChange(SPO2_MIN + p * (SPO2_MAX - SPO2_MIN))
  }

  const overCell = (clientX: number, clientY: number) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return false
    const px = ((clientX - box.left) / box.width) * BOX_W
    const py = ((clientY - box.top) / box.height) * BOX_H
    return px >= 102 && px <= 248 && py >= CAP_Y && py <= CAP_Y + CAP_H + 12
  }

  const key = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }
    if (e.key in map) {
      e.preventDefault()
      onChange(v + map[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(SPO2_MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(SPO2_MAX)
    }
  }

  return (
    <div
      className="oxy"
      data-set={value !== null}
      data-low={low}
      data-dragging={dragging}
      role="slider"
      tabIndex={0}
      aria-label="Oxygen saturation percent"
      aria-valuemin={SPO2_MIN}
      aria-valuemax={SPO2_MAX}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'Not taken' : `${value} percent, ${spo2Word(value)}`}
      onPointerDown={(e) => {
        if (!overCell(e.clientX, e.clientY)) return
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
      <svg ref={svg} viewBox={`0 0 ${BOX_W} ${BOX_H}`} className="oxy__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-glass`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#d5eef9" stopOpacity="0.22" />
            <stop offset="0.3" stopColor="#dff6ff" stopOpacity="0.05" />
            <stop offset="0.66" stopColor="#0b1a24" stopOpacity="0.34" />
            <stop offset="1" stopColor="#7fa7b8" stopOpacity="0.14" />
          </linearGradient>

          <linearGradient id={`${raw}-fill`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0b5f75" />
            <stop offset="0.45" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="0.85" stopColor="#a5f3fc" />
            <stop offset="1" stopColor="#e6feff" />
          </linearGradient>

          <linearGradient id={`${raw}-amber`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#7c3f05" />
            <stop offset="0.42" stopColor="#f59e0b" stopOpacity="0.92" />
            <stop offset="0.84" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#fff7dc" />
          </linearGradient>

          <linearGradient id={`${raw}-steel`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#b8d3e0" />
            <stop offset="0.16" stopColor="#52697a" />
            <stop offset="0.44" stopColor="#152530" />
            <stop offset="0.8" stopColor="#0a141c" />
            <stop offset="1" stopColor="#4b6677" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={`${raw}-tight`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={`${raw}-glow`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          <clipPath id={`${raw}-bore`}>
            <rect x="136" y="38" width="68" height="198" rx="34" />
          </clipPath>
        </defs>

        {/* cast shadow */}
        <ellipse cx="170" cy="280" rx="98" ry="12" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />

        {/* the plinth */}
        <rect x="100" y="244" width="140" height="30" rx="9" fill={`url(#${raw}-steel)`} />
        <rect x="100.7" y="244.7" width="138.6" height="28.6" rx="8.4" fill="none" stroke="#d4eef9" strokeOpacity="0.15" />
        <ellipse cx="170" cy="259" rx="54" ry="9" fill="#000000" opacity="0.32" filter={`url(#${raw}-tight)`} />
        {[
          [110, 259],
          [230, 259],
        ].map(([sx, sy], i) => (
          <g key={i}>
            <circle cx={sx} cy={sy} r="2.6" fill="#0a141c" stroke="#9dc4d6" strokeOpacity="0.22" />
            <line x1={sx - 1.4} y1={sy - 1.4} x2={sx + 1.4} y2={sy + 1.4} stroke="#9dc4d6" strokeOpacity="0.26" strokeWidth="0.6" />
          </g>
        ))}

        {/* the glass cell */}
        <rect x={CAP_X} y={CAP_Y} width={CAP_W} height={CAP_H} rx="42" fill="#050e14" />
        <rect x={CAP_X + 1} y={CAP_Y + 1} width={CAP_W - 2} height={CAP_H - 2} rx="41" fill={`url(#${raw}-glass)`} />
        <rect x="136" y="38" width="68" height="198" rx="34" fill="#02070b" fillOpacity="0.82" />

        {/* the fill */}
        <g clipPath={`url(#${raw}-bore)`}>
          <rect
            x="136"
            y={value === null ? BORE_FLOOR : y}
            width="68"
            height={value === null ? 0 : BORE_FLOOR - y}
            fill={low ? `url(#${raw}-amber)` : `url(#${raw}-fill)`}
            style={{ transition: 'y 260ms cubic-bezier(0.3,0.8,0.4,1), height 260ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          <rect
            x="146"
            y={value === null ? BORE_FLOOR : y + 8}
            width="9"
            height={value === null ? 0 : Math.max(0, BORE_FLOOR - y - 20)}
            rx="4.5"
            fill="#ffffff"
            opacity="0.26"
            style={{ transition: 'y 260ms cubic-bezier(0.3,0.8,0.4,1), height 260ms cubic-bezier(0.3,0.8,0.4,1)' }}
          />
          {value !== null && (
            <>
              <ellipse
                cx="170"
                cy={y}
                rx="32"
                ry="4.4"
                fill={low ? '#fde68a' : '#dffcff'}
                opacity="0.72"
                style={{ transition: 'cy 260ms cubic-bezier(0.3,0.8,0.4,1)' }}
              />
              <circle className="oxy__bubble oxy__bubble--a" cx="156" cy={BORE_FLOOR - 12} r="2.4" fill="#eafdff" opacity="0.45" />
              <circle className="oxy__bubble oxy__bubble--b" cx="178" cy={BORE_FLOOR - 30} r="1.8" fill="#eafdff" opacity="0.35" />
              <circle className="oxy__bubble oxy__bubble--c" cx="166" cy={BORE_FLOOR - 52} r="1.4" fill="#eafdff" opacity="0.3" />
            </>
          )}

          {/* the 92 line, cut into the glass */}
          <line x1="136" y1={notchY} x2="204" y2={notchY} stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        {/* glass sheen */}
        <rect x="144" y="52" width="9" height="176" rx="4.5" fill="#ffffff" opacity="0.1" />
        <rect x="190" y="56" width="3" height="160" rx="1.5" fill="#ffffff" opacity="0.05" />
        <rect x={CAP_X + 1} y={CAP_Y + 1} width={CAP_W - 2} height={CAP_H - 2} rx="41" fill="none" stroke="#d7f0fa" strokeOpacity="0.18" />

        {/* the collar around the neck */}
        <rect x="118" y="22" width="104" height="18" rx="9" fill={`url(#${raw}-steel)`} />
        <rect x="118.7" y="22.7" width="102.6" height="16.6" rx="8.3" fill="none" stroke="#d4eef9" strokeOpacity="0.16" />
        <line x1="136" y1="26" x2="190" y2="26" stroke="#ffffff" strokeOpacity="0.08" />

        {/* engraved names */}
        <text x="96" y="150" transform="rotate(-90 96 150)" textAnchor="middle" fill="#5d7687" fontSize="8" letterSpacing="2.6">
          SpO₂
        </text>
        <text x="96" y="196" transform="rotate(-90 96 196)" textAnchor="middle" fill="#3f5768" fontSize="7" letterSpacing="2">
          percent
        </text>

        {/* the scale */}
        {Array.from({ length: 16 }, (_, i) => 70 + i * 2).map((t) => {
          const ty = yAt(t)
          const major = t % 10 === 0
          const mid = t === NOTCH
          return (
            <g key={t}>
              <line
                x1="208"
                y1={ty}
                x2={major ? 226 : mid ? 224 : 218}
                y2={ty}
                stroke={mid ? '#fbbf24' : major ? '#9dc4d6' : '#000000'}
                strokeOpacity={mid ? 0.6 : major ? 0.34 : 0.5}
                strokeWidth={major || mid ? 1 : 0.7}
              />
              {major && (
                <text
                  x="232"
                  y={ty}
                  dominantBaseline="middle"
                  fill="#6f8a9c"
                  fillOpacity="0.78"
                  fontSize="7.4"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {t}
                </text>
              )}
            </g>
          )
        })}
        <text x="232" y={notchY} dominantBaseline="middle" fill="#fbbf24" fillOpacity="0.85" fontSize="7.4">
          92
        </text>
        <path d={`M 210 ${notchY - 4} l 5 4 l -5 4 Z`} fill="#fbbf24" opacity="0.8" />

        {low && <circle cx="170" cy={y} r="26" fill="#f59e0b" opacity="0.16" filter={`url(#${raw}-glow)`} />}
      </svg>

      <div className="oxy__read" aria-hidden="true">
        <span className="oxy__num">{value === null ? '—' : value}</span>
        <span className="oxy__unit">%</span>
        {value !== null && (
          <span className="oxy__word" key={spo2Word(value)}>
            {spo2Word(value)}
          </span>
        )}
      </div>
    </div>
  )
}
