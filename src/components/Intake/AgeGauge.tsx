import { useId, useMemo, useState } from 'react'

const MAX = 110
const C = 170
const FACE = 141
const R_ARC = 135
/* The scale stops short of the top so zero and 110 never collide, and the gap
   reads as the physical end-stop of the mechanism. */
const START = 12
const SWEEP = 336
const DEG = SWEEP / MAX

const STAGE = (age: number) =>
  age < 2 ? 'Infant' : age < 13 ? 'Child' : age < 20 ? 'Teen' : age < 65 ? 'Adult' : 'Older adult'

const clamp = (v: number) => Math.max(0, Math.min(MAX, Math.round(v)))

/** Point on the dial, 0° at the top, clockwise. */
const at = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const
}

const arcPath = (from: number, to: number, r: number) => {
  const [x1, y1] = at(from, r)
  const [x2, y2] = at(to, r)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** A machined dial in an anodised case: chamfered bezel, turned face, engraved
 *  scale, a recessed light channel and a knurled thumb wheel on the rim. */
export function AgeGauge({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [dragging, setDragging] = useState(false)

  /* The needle sits at zero until there is an age; the keyboard starts a
     sensible 32 so a single arrow press is not "1 year old". */
  const rest = value ?? 0
  const base = value ?? 32
  const pct = rest / MAX
  const set = (v: number) => onChange(clamp(v))

  const angle = START + rest * DEG
  const [knobX, knobY] = at(angle, R_ARC)

  const fromPointer = (clientX: number, clientY: number, box: DOMRect) => {
    const dx = clientX - (box.left + box.width / 2)
    const dy = clientY - (box.top + box.height / 2)
    if (Math.hypot(dx, dy) < box.width * 0.3) return
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    deg = (deg + 360) % 360
    /* signed angle from the top: + clockwise on the right, − counter-clockwise on the left */
    const s = deg > 180 ? deg - 360 : deg
    if (s >= -START && s <= START) return set(s >= 0 ? 0 : MAX)
    const travelled = s >= 0 ? s - START : 360 + s - START
    set((travelled / SWEEP) * MAX)
  }

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    fromPointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    fromPointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())
  }

  const key = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -10,
      PageUp: 10,
    }
    if (e.key in map) {
      e.preventDefault()
      set(base + map[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      set(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      set(MAX)
    }
  }

  /* Everything except the channel, the arcs and the wheel is fixed, so the scale
     is built once and never rebuilt while dragging. */
  const scale = useMemo(
    () => (
      <g clipPath={`url(#${raw}-faceClip)`}>
        {/* the anodised body of the face, keyed from the upper left */}
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-face)`} />

        {/* directional sheen: one diagonal pass of light across the whole face */}
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-sheen)`} />

        {/* turned finish: fine concentric machining marks */}
        {Array.from({ length: 96 }, (_, i) => {
          const r = 5 + i * 1.4
          return (
            <circle
              key={`r${i}`}
              cx={C}
              cy={C}
              r={r}
              fill="none"
              stroke={i % 6 === 0 ? '#cfe8f5' : '#000000'}
              strokeOpacity={i % 6 === 0 ? 0.035 : 0.06}
              strokeWidth={i % 6 === 0 ? 0.55 : 0.4}
            />
          )
        })}

        {/* the window the glass is reflecting, low and broad across the upper left */}
        <ellipse
          cx={C - 36}
          cy={C - 52}
          rx="96"
          ry="52"
          fill="#ffffff"
          opacity="0.1"
          transform={`rotate(-24 ${C - 36} ${C - 52})`}
          filter={`url(#${raw}-blurMd)`}
        />
        <ellipse
          cx={C - 58}
          cy={C - 20}
          rx="40"
          ry="62"
          fill="#dff6ff"
          opacity="0.06"
          transform={`rotate(18 ${C - 58} ${C - 20})`}
          filter={`url(#${raw}-blurLg)`}
        />
        {/* the sharp leading edge of that reflection */}
        <path
          d={arcPath(START + 236, START + 300, 108)}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.11"
          strokeWidth="1.1"
          strokeLinecap="butt"
          filter={`url(#${raw}-blurSm)`}
        />
        {/* two harder edges: the pane's reflection is not a soft blob */}
        <path d={arcPath(START + 196, START + 268, 96)} fill="none" stroke="#eafcff" strokeOpacity="0.14" strokeWidth="1.6" strokeLinecap="butt" filter={`url(#${raw}-blurSm)`} />
        <path d={arcPath(START + 208, START + 256, 74)} fill="none" stroke="#eafcff" strokeOpacity="0.06" strokeWidth="1" strokeLinecap="butt" />

        {/* engraved scale: a groove for every year, a numeral every ten */}
        {Array.from({ length: MAX + 1 }, (_, v) => {
          const a = START + v * DEG
          const major = v % 10 === 0
          const mid = v % 5 === 0
          const r1 = major ? 112 : mid ? 118 : 122
          const [x1, y1] = at(a, r1)
          const [x2, y2] = at(a, 129.4)
          /* the groove's far wall catches the key light */
          const [x3, y3] = at(a + 0.42, r1)
          const [x4, y4] = at(a + 0.42, 129.4)
          return (
            <g key={v}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000000" strokeOpacity="0.75" strokeWidth={major ? 2 : 1.2} />
              <line
                x1={x3}
                y1={y3}
                x2={x4}
                y2={y4}
                stroke={major ? '#a8cddd' : '#7ba2b5'}
                strokeOpacity={major ? 0.38 : 0.18}
                strokeWidth={major ? 0.9 : 0.6}
              />
            </g>
          )
        })}

        {Array.from({ length: MAX / 10 + 1 }, (_, i) => {
          const v = i * 10
          const [x, y] = at(START + v * DEG, 99)
          return (
            <g key={`n${i}`}>
              <text
                x={x}
                y={y + 1}
                fill="#8fb6c8"
                fillOpacity="0.14"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {v}
              </text>
              <text
                x={x}
                y={y}
                fill="#7ea6ba"
                fillOpacity="0.85"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {v}
              </text>
            </g>
          )
        })}

        {/* printed centre of the dial, behind the readout */}
        <circle cx={C} cy={C} r="64" fill="none" stroke="#000000" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx={C} cy={C} r="63.2" fill="none" stroke="#a9cdde" strokeOpacity="0.06" strokeWidth="0.6" />

        {/* the recessed channel the light runs in */}
        <circle cx={C} cy={C} r={R_ARC} fill="none" stroke="#010508" strokeWidth="9.5" />
        <circle cx={C} cy={C} r={R_ARC + 4.2} fill="none" stroke="#000000" strokeOpacity="0.6" strokeWidth="1.2" />
        <circle cx={C} cy={C} r={R_ARC - 4.6} fill="none" stroke="#a5cbdd" strokeOpacity="0.09" strokeWidth="0.9" />

        {/* crystal: a horizon band, a rim catch, dust, then grain */}
        <rect x="26" y="52" width="288" height="34" fill={`url(#${raw}-band)`} opacity="0.55" />
        <path d={arcPath(START + 274, START + 344, 128)} fill="none" stroke="#eafcff" strokeOpacity="0.13" strokeWidth="1.6" strokeLinecap="butt" />
        <path d={arcPath(START + 96, START + 158, 120)} fill="none" stroke="#cfeefb" strokeOpacity="0.05" strokeWidth="3" strokeLinecap="butt" />

        <circle cx="112" cy="82" r="0.9" fill="#eafcff" opacity="0.2" />
        <circle cx="214" cy="118" r="0.7" fill="#eafcff" opacity="0.14" />
        <circle cx="148" cy="242" r="1.1" fill="#eafcff" opacity="0.1" />
        <rect x="0" y="0" width="340" height="340" filter={`url(#${raw}-grain)`} opacity="0.5" style={{ mixBlendMode: 'soft-light' }} />
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-vignette)`} />
      </g>
    ),
    [raw],
  )

  return (
    <div
      className="gauge"
      data-dragging={dragging}
      data-set={value !== null}
      role="slider"
      tabIndex={0}
      aria-label="Age in years"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? 'Not set' : `${value} years`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={key}
    >
      <div className="gauge__spot" aria-hidden="true" />

      <svg viewBox="0 0 340 340" className="gauge__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-wall`} x1="0.06" y1="0" x2="0.94" y2="1">
            <stop offset="0" stopColor="#c3dbe7" />
            <stop offset="0.07" stopColor="#6d8a9d" />
            <stop offset="0.17" stopColor="#263c4a" />
            <stop offset="0.34" stopColor="#0d1922" />
            <stop offset="0.52" stopColor="#060d13" />
            <stop offset="0.68" stopColor="#0a141c" />
            <stop offset="0.82" stopColor="#1d3140" />
            <stop offset="0.92" stopColor="#3f5f73" />
            <stop offset="1" stopColor="#0a141c" />
          </linearGradient>

          <linearGradient id={`${raw}-bevel`} x1="0.18" y1="0" x2="0.82" y2="1">
            <stop offset="0" stopColor="#e8fcff" stopOpacity="0.5" />
            <stop offset="0.28" stopColor="#e8fcff" stopOpacity="0.06" />
            <stop offset="0.52" stopColor="#000000" stopOpacity="0.42" />
            <stop offset="0.78" stopColor="#000000" stopOpacity="0.16" />
            <stop offset="1" stopColor="#a8d3e6" stopOpacity="0.16" />
          </linearGradient>

          <linearGradient id={`${raw}-innerWall`} x1="0.32" y1="0" x2="0.78" y2="1">
            <stop offset="0" stopColor="#000000" stopOpacity="0.95" />
            <stop offset="0.42" stopColor="#040c12" />
            <stop offset="0.74" stopColor="#162937" />
            <stop offset="1" stopColor="#58798c" stopOpacity="0.55" />
          </linearGradient>

          <radialGradient id={`${raw}-face`} cx="0.33" cy="0.21" r="0.95">
            <stop offset="0" stopColor="#31465a" />
            <stop offset="0.22" stopColor="#1e3140" />
            <stop offset="0.48" stopColor="#112130" />
            <stop offset="0.74" stopColor="#0a1620" />
            <stop offset="1" stopColor="#050b10" />
          </radialGradient>

          <linearGradient id={`${raw}-sheen`} x1="0.14" y1="0" x2="0.92" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="0.36" stopColor="#dff6ff" stopOpacity="0.03" />
            <stop offset="0.62" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.34" />
          </linearGradient>

          <radialGradient id={`${raw}-vignette`} cx="50%" cy="50%" r="50%">            <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
            <stop offset="0.88" stopColor="#000000" stopOpacity="0.22" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.6" />
          </radialGradient>

          <linearGradient id={`${raw}-band`} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#eafcff" stopOpacity="0" />
            <stop offset="0.45" stopColor="#eafcff" stopOpacity="0.075" />
            <stop offset="1" stopColor="#eafcff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${raw}-lit`} x1="0.1" y1="1" x2="0.9" y2="0">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="0.34" stopColor="#22d3ee" />
            <stop offset="0.72" stopColor="#8df0fd" />
            <stop offset="1" stopColor="#eafdff" />
          </linearGradient>

          <radialGradient id={`${raw}-wheel`} cx="0.3" cy="0.24" r="0.84">
            <stop offset="0" stopColor="#e2f3fa" />
            <stop offset="0.26" stopColor="#9db9c9" />
            <stop offset="0.56" stopColor="#3a5265" />
            <stop offset="0.82" stopColor="#162632" />
            <stop offset="1" stopColor="#0a131b" />
          </radialGradient>

          <filter id={`${raw}-blurSm`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={`${raw}-blurMd`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <filter id={`${raw}-blurLg`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id={`${raw}-glow`} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>

          {/* grain whose luminance becomes alpha, so it speckles instead of washing out the face */}
          <filter id={`${raw}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="17" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0" intercept="0.72" />
              <feFuncG type="linear" slope="0" intercept="0.85" />
              <feFuncB type="linear" slope="0" intercept="1" />
              <feFuncA type="linear" slope="1.6" intercept="-0.5" />
            </feComponentTransfer>
          </filter>

          <clipPath id={`${raw}-faceClip`}>
            <circle cx={C} cy={C} r={FACE} />
          </clipPath>
        </defs>

        {/* the object's shadow on the surface: a wide penumbra and a tight core */}
        <ellipse cx={C - 6} cy={C + 20} rx="152" ry="146" fill="#000000" opacity="0.5" filter={`url(#${raw}-blurLg)`} />
        <ellipse cx={C - 2} cy={C + 10} rx="128" ry="122" fill="#000000" opacity="0.42" filter={`url(#${raw}-blurSm)`} />

        {/* the case has a little height: a dark skirt under the lower edge */}
        <path
          d={`M ${at(150, 151)} A 151 151 0 0 1 ${at(30, 151)} L ${at(30, 156)} A 156 156 0 0 0 ${at(150, 156)} Z`}
          fill="#01050a"
          opacity="0.85"
        />

        {/* case: outer wall, chamfer, parting groove, inner wall */}
        <circle cx={C} cy={C} r="152" fill={`url(#${raw}-wall)`} />
        <circle cx={C} cy={C} r="152" fill="none" stroke="#d7f0fa" strokeOpacity="0.16" strokeWidth="0.9" />
        <circle cx={C} cy={C} r="149.4" fill="none" stroke={`url(#${raw}-bevel)`} strokeWidth="2.4" />
        {/* fine circular brushing on the bezel's top face */}
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={`b${i}`} cx={C} cy={C} r={143 + i * 1.35} fill="none" stroke="#dff4ff" strokeOpacity={0.05} strokeWidth="0.4" />
        ))}
        <circle cx={C} cy={C} r="146.6" fill="none" stroke="#000000" strokeOpacity="0.6" strokeWidth="1.8" />
        <circle cx={C} cy={C} r="145.4" fill="none" stroke="#a5cbdd" strokeOpacity="0.07" strokeWidth="0.7" />
        <circle cx={C} cy={C} r="144.6" fill="#050a10" />
        <circle cx={C} cy={C} r="143" fill="none" stroke={`url(#${raw}-innerWall)`} strokeWidth="2.8" />

        {scale}

        {/* the lit channel, sitting in its groove */}
        <g clipPath={`url(#${raw}-faceClip)`}>
          <path
            d={arcPath(START, START + SWEEP, R_ARC)}
            fill="none"
            stroke="#67e8f9"
            strokeWidth="12"
            strokeOpacity="0.3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - pct * 100}
            filter={`url(#${raw}-glow)`}
          />
          <path
            d={arcPath(START, START + SWEEP, R_ARC)}
            fill="none"
            stroke={`url(#${raw}-lit)`}
            strokeWidth="3.2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - pct * 100}
            className="gauge__arc"
          />
          <path
            d={arcPath(START, START + SWEEP, R_ARC)}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.72"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - pct * 100}
            className="gauge__arc"
          />
        </g>

        {/* crystal edge */}
        <circle cx={C} cy={C} r={FACE - 0.6} fill="none" stroke="#dff6ff" strokeOpacity="0.09" strokeWidth="1" />

        {/* polished catches on the case, lit from the upper left */}
        <path d={arcPath(START + 274, 358, 149.4)} fill="none" stroke="#eafdff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
        <path d={arcPath(START + 78, START + 142, 150.4)} fill="none" stroke="#a9d2e4" strokeOpacity="0.12" strokeWidth="1.2" strokeLinecap="round" />
        {/* a little warm bounce off the bone rail on the left */}
        <path d={arcPath(START + 184, START + 238, 151.2)} fill="none" stroke="#ffd9a8" strokeOpacity="0.14" strokeWidth="1.5" strokeLinecap="round" />

        {/* knurled thumb wheel riding the channel */}
        <g className="gauge__wheel">
          <ellipse cx={knobX + 1.6} cy={knobY + 3} rx="9.4" ry="7.6" fill="#000000" opacity="0.6" filter={`url(#${raw}-blurSm)`} />
          <circle cx={knobX} cy={knobY} r="8.4" fill={`url(#${raw}-wheel)`} />
          <circle cx={knobX} cy={knobY} r="8.4" fill="none" stroke="#000000" strokeOpacity="0.55" strokeWidth="0.9" />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2
            return (
              <line
                key={i}
                x1={knobX + Math.cos(a) * 4.5}
                y1={knobY + Math.sin(a) * 4.5}
                x2={knobX + Math.cos(a) * 7.6}
                y2={knobY + Math.sin(a) * 7.6}
                stroke={Math.cos(a) < 0 && Math.sin(a) < 0 ? '#d6eef9' : '#0a141c'}
                strokeOpacity={Math.cos(a) < 0 && Math.sin(a) < 0 ? 0.38 : 0.5}
                strokeWidth="0.8"
              />
            )
          })}
          <circle cx={knobX} cy={knobY} r="3.7" fill="none" stroke="#0a141c" strokeOpacity="0.5" strokeWidth="0.9" />
          <circle cx={knobX - 2.5} cy={knobY - 2.8} r="1.9" fill="#f4fdff" opacity="0.55" />
        </g>
      </svg>

      <div className="gauge__readout" aria-hidden="true">
        <span className="gauge__value">{value ?? ''}</span>
        <span className="gauge__unit">{value === null ? 'drag to set' : 'years'}</span>
        {value !== null && (
          <span className="gauge__stage" key={STAGE(rest)}>
            {STAGE(rest)}
          </span>
        )}
      </div>
    </div>
  )
}
