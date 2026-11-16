import { useId } from 'react'
import { IconEar, IconEye, IconMinus, IconSpeech, IconWheelchair } from '../Station/icons'
import type { SupportNeed } from './types'

const OPTIONS: { value: Exclude<SupportNeed, 'none'>; label: string; icon: React.ReactNode }[] = [
  { value: 'wheelchair', label: 'Wheelchair', icon: <IconWheelchair /> },
  { value: 'hearing', label: 'Hard of hearing', icon: <IconEar /> },
  { value: 'vision', label: 'Low vision', icon: <IconEye /> },
  { value: 'interpreter', label: 'Interpreter', icon: <IconSpeech /> },
]

/** A small bone token in a steel ring: the mark is cut into the face, and a
 *  cyan inlay lights along the bottom edge when it is chosen. */
function Token({
  label,
  icon,
  selected,
  onToggle,
}: {
  label: string
  icon: React.ReactNode
  selected: boolean
  onToggle: () => void
}) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <button type="button" className="token" data-selected={selected} aria-pressed={selected} onClick={onToggle}>
      <span className="token__disc">
        <svg viewBox="0 0 84 84" aria-hidden="true">
          <defs>
            <linearGradient id={`${raw}-bezel`} x1="0.14" y1="0" x2="0.86" y2="1">
              <stop offset="0" stopColor="#7b95aa" />
              <stop offset="0.18" stopColor="#3a5367" />
              <stop offset="0.46" stopColor="#0f1c26" />
              <stop offset="0.72" stopColor="#28414f" />
              <stop offset="0.88" stopColor="#5d7c92" />
              <stop offset="1" stopColor="#0d1922" />
            </linearGradient>
            <radialGradient id={`${raw}-face`} cx="0.36" cy="0.27" r="0.87">
              <stop offset="0" stopColor="#fdf8ee" />
              <stop offset="0.32" stopColor="#efe2cb" />
              <stop offset="0.6" stopColor="#d8c5a5" />
              <stop offset="0.82" stopColor="#b8a280" />
              <stop offset="1" stopColor="#897458" />
            </radialGradient>
            <radialGradient id={`${raw}-edge`} cx="50%" cy="50%" r="50%">
              <stop offset="0.54" stopColor="#6b5c45" stopOpacity="0" />
              <stop offset="0.88" stopColor="#5a4c37" stopOpacity="0.28" />
              <stop offset="1" stopColor="#302718" stopOpacity="0.58" />
            </radialGradient>
            <radialGradient id={`${raw}-bloom`} cx="0.46" cy="0.34" r="0.7">
              <stop offset="0" stopColor="#a5f3fc" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="1" stopColor="#0e7490" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${raw}-glare`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id={`${raw}-soft`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id={`${raw}-bloomBlur`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id={`${raw}-glow`} x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
            <filter id={`${raw}-grain`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.36" numOctaves="3" seed="3" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0" intercept="1" />
              </feComponentTransfer>
            </filter>
            <clipPath id={`${raw}-clip`}>
              <circle cx="42" cy="42" r="35" />
            </clipPath>
          </defs>

          <ellipse cx="42" cy="79" rx="24" ry="3.6" fill="#000000" opacity="0.5" filter={`url(#${raw}-soft)`} />

          <circle cx="42" cy="42" r="39" fill={`url(#${raw}-bezel)`} />
          <circle cx="42" cy="42" r="39" fill="none" stroke="#cbe8f5" strokeOpacity="0.22" strokeWidth="0.8" />
          <circle cx="42" cy="42" r="37" fill="none" stroke="#000000" strokeOpacity="0.6" strokeWidth="1.4" />
          <circle cx="42" cy="42" r="35" fill={`url(#${raw}-face)`} />

          <g clipPath={`url(#${raw}-clip)`}>
            <circle cx="42" cy="42" r="35" fill={`url(#${raw}-edge)`} />
            <circle
              className="token__lit"
              cx="42"
              cy="42"
              r="35"
              fill={`url(#${raw}-bloom)`}
              filter={`url(#${raw}-bloomBlur)`}
            />

            <g fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <g className="token__cut" transform="translate(22.5 21.4) scale(1.625)">
                {icon}
              </g>
              <g className="token__lip" transform="translate(22.5 23) scale(1.625)">
                {icon}
              </g>
            </g>

            <ellipse
              cx="29"
              cy="20"
              rx="14"
              ry="7.5"
              fill={`url(#${raw}-glare)`}
              transform="rotate(-27 29 20)"
              filter={`url(#${raw}-soft)`}
            />
            <path
              d="M 20 36 A 14 14 0 0 1 27 19"
              fill="none"
              stroke="#fffaf0"
              strokeOpacity="0.6"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <rect
              x="0"
              y="0"
              width="84"
              height="84"
              filter={`url(#${raw}-grain)`}
              opacity="0.26"
              style={{ mixBlendMode: 'multiply' }}
            />
          </g>

          {/* the inlay: the only thing that fills in */}
          <path
            className="token__arc"
            d="M 17 59 A 33 33 0 0 0 67 59"
            fill="none"
            stroke="#0e7490"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            className="token__arc token__arc--glow"
            d="M 17 58.4 A 33 33 0 0 0 67 58.4"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#${raw}-glow)`}
          />
        </svg>
      </span>
      <span className="token__label">{label}</span>
    </button>
  )
}

export function SupportPicker({
  value,
  onChange,
}: {
  value: SupportNeed[]
  onChange: (v: SupportNeed[]) => void
}) {
  const none = value.includes('none')

  const toggle = (need: Exclude<SupportNeed, 'none'>) => {
    const without = value.filter((v) => v !== 'none')
    onChange(without.includes(need) ? without.filter((v) => v !== need) : [...without, need])
  }

  return (
    <div className="support">
      <div className="tokens" role="group" aria-label="Support needs">
        {OPTIONS.map((option) => (
          <Token
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={value.includes(option.value) && !none}
            onToggle={() => toggle(option.value)}
          />
        ))}
      </div>

      <button
        type="button"
        className="nothing"
        data-selected={none}
        aria-pressed={none}
        onClick={() => onChange(none ? [] : ['none'])}
      >
        <span className="nothing__dot" aria-hidden="true">
          {none ? <IconMinus size={11} /> : null}
        </span>
        Nothing to add
      </button>
    </div>
  )
}
