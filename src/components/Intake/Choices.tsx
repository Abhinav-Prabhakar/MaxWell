import { useId, type ReactNode } from 'react'
import type { SexAtBirth } from './types'

/** A polished bone disc set in a steel bezel, glyph cut into it like a seal.
 *  Choosing one inks the cut and lights a cyan inlay at the rim. */
export function Medallion({
  selected,
  label,
  glyph,
  wide,
  checked,
  tabIndex,
  onSelect,
}: {
  selected: boolean
  label: string
  glyph: ReactNode
  wide?: boolean
  checked: boolean
  tabIndex: number
  onSelect: () => void
}) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const S = wide ? 200 : 172
  const face = S / 2 - 14

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      className="med"
      data-selected={selected}
      data-wide={wide ? 'true' : 'false'}
      onClick={onSelect}
    >
      <svg viewBox={`0 0 ${S} ${S}`} className="med__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${raw}-bezel`} x1="0.12" y1="0" x2="0.88" y2="1">
            <stop offset="0" stopColor="#7b95aa" />
            <stop offset="0.16" stopColor="#3a5367" />
            <stop offset="0.42" stopColor="#101d27" />
            <stop offset="0.68" stopColor="#25404f" />
            <stop offset="0.86" stopColor="#5d7c92" />
            <stop offset="1" stopColor="#0e1a23" />
          </linearGradient>

          <radialGradient id={`${raw}-face`} cx="0.36" cy="0.28" r="0.86">
            <stop offset="0" stopColor="#fdf8ee" />
            <stop offset="0.3" stopColor="#efe2cb" />
            <stop offset="0.58" stopColor="#d8c5a5" />
            <stop offset="0.8" stopColor="#b9a381" />
            <stop offset="1" stopColor="#8a755a" />
          </radialGradient>

          <radialGradient id={`${raw}-edge`} cx="50%" cy="50%" r="50%">
            <stop offset="0.6" stopColor="#6b5c45" stopOpacity="0" />
            <stop offset="0.9" stopColor="#5a4c37" stopOpacity="0.26" />
            <stop offset="1" stopColor="#332a1c" stopOpacity="0.55" />
          </radialGradient>

          <radialGradient id={`${raw}-bloom`} cx="0.44" cy="0.34" r="0.7">
            <stop offset="0" stopColor="#a5f3fc" stopOpacity="0.5" />
            <stop offset="0.55" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="1" stopColor="#0e7490" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`${raw}-glare`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${raw}-bloomBlur`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={`${raw}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <filter id={`${raw}-grainFine`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="31" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
          </filter>
          <filter id={`${raw}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="9" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
          </filter>

          <clipPath id={`${raw}-clip`}>
            <circle cx={S / 2} cy={S / 2} r={face} />
          </clipPath>
        </defs>

        {/* contact shadow */}
        <ellipse
          cx={S / 2}
          cy={S - 4}
          rx={S * 0.33}
          ry={S * 0.05}
          fill="#000000"
          opacity="0.55"
          filter={`url(#${raw}-soft)`}
        />

        {/* steel bezel */}
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 10} fill={`url(#${raw}-bezel)`} />
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 10} fill="none" stroke="#cbe8f5" strokeOpacity="0.22" strokeWidth="0.9" />
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 12.5} fill="none" stroke="#000000" strokeOpacity="0.6" strokeWidth="2" />
        <circle cx={S / 2} cy={S / 2} r={face} fill={`url(#${raw}-face)`} />

        <g clipPath={`url(#${raw}-clip)`}>
          <circle cx={S / 2} cy={S / 2} r={face} fill={`url(#${raw}-edge)`} />

          {/* the cyan bloom that rises through the bone */}
          <circle
            className="med__bloom"
            cx={S / 2}
            cy={S / 2}
            r={face}
            fill={`url(#${raw}-bloom)`}
            filter={`url(#${raw}-bloomBlur)`}
          />

          {/* carved glyph: shadow above the cut, light below it */}
          <g fill="none" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
            <g className="med__cut" transform="translate(0 -1.5)">
              {glyph}
            </g>
            <g className="med__lip" transform="translate(0 1.5)">
              {glyph}
            </g>
          </g>

          {/* inlay ring, lit only when chosen */}
          <circle
            className="med__ring"
            cx={S / 2}
            cy={S / 2}
            r={face - 5}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.6"
            filter={`url(#${raw}-glow)`}
          />

          {/* glassy glaze over the bone */}
          <ellipse
            cx={S * 0.35}
            cy={S * 0.22}
            rx={S * 0.3}
            ry={S * 0.17}
            fill={`url(#${raw}-glare)`}
            transform={`rotate(-28 ${S * 0.35} ${S * 0.22})`}
            filter={`url(#${raw}-soft)`}
          />
          <path
            d={`M ${S * 0.24} ${S * 0.4} A ${S * 0.3} ${S * 0.3} 0 0 1 ${S * 0.39} ${S * 0.13}`}
            fill="none"
            stroke="#fffaf0"
            strokeOpacity="0.55"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx={S * 0.64} cy={S * 0.27} r="1.4" fill="#fffdf6" opacity="0.6" />

          <rect
            x="0"
            y="0"
            width={S}
            height={S}
            filter={`url(#${raw}-grain)`}
            opacity="0.22"
            style={{ mixBlendMode: 'multiply' }}
          />
          <rect
            x="0"
            y="0"
            width={S}
            height={S}
            filter={`url(#${raw}-grainFine)`}
            opacity="0.12"
            style={{ mixBlendMode: 'multiply' }}
          />
        </g>

        {/* rim light along the top of the steel */}
        <path
          d={`M ${S * 0.18} ${S * 0.34} A ${S * 0.36} ${S * 0.36} 0 0 1 ${S * 0.62} ${S * 0.09}`}
          fill="none"
          stroke="#e6fbff"
          strokeOpacity="0.42"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>

      <span className="med__label">{label}</span>
    </button>
  )
}

const SEX: { value: SexAtBirth; label: string; glyph: ReactNode }[] = [
  {
    value: 'female',
    label: 'Female',
    glyph: (
      <>
        <circle cx="86" cy="69" r="23" />
        <path d="M86 92v31M74 108h24" />
      </>
    ),
  },
  {
    value: 'male',
    label: 'Male',
    glyph: (
      <>
        <circle cx="78" cy="94" r="23" />
        <path d="M94.5 77.5l18-18M103.5 59.5h9v9" />
      </>
    ),
  },
  {
    value: 'intersex',
    label: 'Intersex',
    glyph: (
      <>
        <circle cx="84" cy="89" r="21" />
        <path d="M84 110v20M74 119h20" />
        <path d="M98 75l15-15M104.5 60h8.5v8.5" />
      </>
    ),
  },
]

export function SexPicker({
  value,
  onChange,
}: {
  value: SexAtBirth | null
  onChange: (v: SexAtBirth) => void
}) {
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const at = SEX.findIndex((o) => o.value === value)
    onChange(SEX[(at + dir + SEX.length) % SEX.length].value)
  }

  return (
    <div className="meds" role="radiogroup" aria-label="Sex registered at birth" onKeyDown={onKey}>
      {SEX.map((option) => (
        <Medallion
          key={option.value}
          selected={value === option.value}
          checked={value === option.value}
          tabIndex={value === option.value || (value === null && option.value === 'female') ? 0 : -1}
          label={option.label}
          glyph={option.glyph}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  )
}

export function PregnancyPicker({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  const options = [
    {
      v: true,
      label: 'Yes, possibly',
      glyph: (
        <>
          <circle cx="100" cy="100" r="36" opacity="0.3" />
          <ellipse cx="100" cy="100" rx="16.5" ry="23" transform="rotate(24 100 100)" />
          <circle cx="100" cy="100" r="4.2" />
        </>
      ),
    },
    {
      v: false,
      label: 'No',
      glyph: (
        <>
          <circle cx="100" cy="100" r="36" opacity="0.45" />
          <path d="M81 100h38" />
          <path d="M100 54v-9M100 146v9" opacity="0.5" />
        </>
      ),
    },
  ]

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    onChange(dir > 0 ? !(value ?? true) : (value ?? false))
  }

  return (
    <div className="meds meds--pair" role="radiogroup" aria-label="Could you be pregnant right now" onKeyDown={onKey}>
      {options.map((option) => (
        <Medallion
          key={String(option.v)}
          wide
          selected={value === option.v}
          checked={value === option.v}
          tabIndex={value === option.v || value === null ? 0 : -1}
          label={option.label}
          glyph={option.glyph}
          onSelect={() => onChange(option.v)}
        />
      ))}
    </div>
  )
}
