import { useId, useState } from 'react'
import type { BodyArea } from './types'

/* A body on a dark screen: an etched figure in a steel plate, every part a
   switch. Drawn by hand so the silhouette can glow like a radiograph. */

const HEAD = { cx: 120, cy: 72, rx: 23, ry: 27 }

const TORSO =
  'M 120 104 C 101 104 89 113 85 129 C 81 148 85 175 91 197 C 93 209 94 217 96 226 L 144 226 C 146 217 147 209 149 197 C 155 175 159 148 155 129 C 151 113 139 104 120 104 Z'

const CHEST = 'M 74 96 L 166 96 L 166 176 Q 120 190 74 176 Z'
const BELLY = 'M 74 176 Q 120 190 166 176 L 166 230 L 74 230 Z'

const LIMBS = {
  armL: 'M 87 126 L 78 176 L 80 218',
  armR: 'M 153 126 L 162 176 L 160 218',
  legL: 'M 106 226 L 103 292 L 107 352',
  legR: 'M 134 226 L 137 292 L 133 352',
} as const

const RIBS = [0, 1, 2].map((i) => ({
  left: `M 120 ${130 + i * 17} C 108 ${130 + i * 17} 99 ${137 + i * 17} 95 ${148 + i * 17}`,
  right: `M 120 ${130 + i * 17} C 132 ${130 + i * 17} 141 ${137 + i * 17} 145 ${148 + i * 17}`,
}))

export function BodyMap({
  value,
  onToggle,
}: {
  value: BodyArea[]
  onToggle: (area: BodyArea | 'all') => void
}) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [hover, setHover] = useState<BodyArea | null>(null)

  const zone = (area: BodyArea, label: string, shape: React.ReactNode) => {
    const on = value.includes(area)
    return (
      <g
        key={area}
        className="zone"
        data-on={on}
        data-hover={hover === area}
        role="checkbox"
        aria-checked={on}
        aria-label={label}
        tabIndex={0}
        onClick={() => onToggle(area)}
        onPointerEnter={() => setHover(area)}
        onPointerLeave={() => setHover((h) => (h === area ? null : h))}
        onFocus={() => setHover(area)}
        onBlur={() => setHover((h) => (h === area ? null : h))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(area)
          }
        }}
      >
        {shape}
      </g>
    )
  }

  return (
    <div className="body">
      <svg viewBox="0 0 240 420" className="body__svg">
        <defs>
          <linearGradient id={`${raw}-plate`} x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#5c7686" />
            <stop offset="0.06" stopColor="#2b414f" />
            <stop offset="0.3" stopColor="#111f28" />
            <stop offset="0.62" stopColor="#0a141b" />
            <stop offset="0.88" stopColor="#1b2c37" />
            <stop offset="1" stopColor="#4a6473" />
          </linearGradient>

          <radialGradient id={`${raw}-window`} cx="0.5" cy="0.4" r="0.8">
            <stop offset="0" stopColor="#040d13" />
            <stop offset="0.6" stopColor="#020810" />
            <stop offset="1" stopColor="#01050a" />
          </radialGradient>

          <radialGradient id={`${raw}-body`} cx="0.46" cy="0.34" r="0.72">
            <stop offset="0" stopColor="#13414f" />
            <stop offset="0.45" stopColor="#0e3140" />
            <stop offset="0.78" stopColor="#0a2330" />
            <stop offset="1" stopColor="#071820" />
          </radialGradient>

          <linearGradient id={`${raw}-limb`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#12414f" />
            <stop offset="0.55" stopColor="#0d2c3a" />
            <stop offset="1" stopColor="#08202b" />
          </linearGradient>

          <radialGradient id={`${raw}-screen`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="1" stopColor="#0e7490" stopOpacity="0" />
          </radialGradient>

          <pattern id={`${raw}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="1" fill="#a5f3fc" opacity="0.5" />
          </pattern>

          <linearGradient id={`${raw}-beam`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
            <stop offset="0.7" stopColor="#67e8f9" stopOpacity="0.12" />
            <stop offset="1" stopColor="#eafdff" stopOpacity="0.34" />
          </linearGradient>

          <filter id={`${raw}-soft`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${raw}-glass`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          <clipPath id={`${raw}-torso`}>
            <path d={TORSO} />
          </clipPath>
          <clipPath id={`${raw}-windowClip`}>
            <rect x="22" y="22" width="196" height="376" rx="8" />
          </clipPath>
        </defs>

        {/* the plate: steel frame, recessed window, screws */}
        <rect x="4" y="4" width="232" height="412" rx="14" fill={`url(#${raw}-plate)`} />
        <rect x="4.7" y="4.7" width="230.6" height="410.6" rx="13.5" fill="none" stroke="#d3eefb" strokeOpacity="0.2" />
        <rect x="11" y="11" width="218" height="398" rx="9" fill="none" stroke="#000000" strokeOpacity="0.55" strokeWidth="1.6" />
        <rect x="22" y="22" width="196" height="376" rx="8" fill={`url(#${raw}-window)`} />
        <rect x="22" y="22" width="196" height="376" rx="8" fill="none" stroke="#000000" strokeOpacity="0.8" strokeWidth="2" />

        {[
          [14, 14],
          [226, 14],
          [14, 406],
          [226, 406],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="3.6" fill="#0a141b" stroke="#8fb6c8" strokeOpacity="0.22" strokeWidth="0.8" />
            <line x1={x - 2.4} y1={y} x2={x + 2.4} y2={y} stroke="#8fb6c8" strokeOpacity="0.25" strokeWidth="0.8" />
          </g>
        ))}

        <g clipPath={`url(#${raw}-windowClip)`}>
          {/* the light the screen throws */}
          <ellipse cx="120" cy="196" rx="94" ry="176" fill={`url(#${raw}-screen)`} opacity="0.85" />
          <rect x="22" y="22" width="196" height="376" fill={`url(#${raw}-scan)`} opacity="0.05" pointerEvents="none" />

          {/* the beam that boots the plate: one pass, then it is gone */}
          <g className="plate__scan" pointerEvents="none">
            <rect x="22" y="22" width="196" height="34" fill={`url(#${raw}-beam)`} />
            <line x1="22" y1="56" x2="218" y2="56" stroke="#dffaff" strokeOpacity="0.5" strokeWidth="1" />
          </g>

          {/* silhouette, brighter than the screen so it reads as a body */}
          <g filter={`url(#${raw}-soft)`} opacity="0.5" pointerEvents="none">
            <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill="#22d3ee" />
            <path d={TORSO} fill="#0e7490" />
            {Object.values(LIMBS).map((d) => (
              <path key={d} d={d} fill="none" stroke="#0e7490" strokeWidth="18" strokeLinecap="round" />
            ))}
          </g>

          <g pointerEvents="none">
            <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={`url(#${raw}-body)`} />
            <rect x="111" y="92" width="18" height="18" rx="6" fill={`url(#${raw}-limb)`} />
            <path d={TORSO} fill={`url(#${raw}-body)`} />
          </g>
          <g fill="none" stroke={`url(#${raw}-limb)`} strokeWidth="18" strokeLinecap="round" pointerEvents="none">
            {Object.values(LIMBS).map((d) => (
              <path key={d} d={d} />
            ))}
          </g>

          {/* every part is a switch */}
          {zone(
            'head',
            'Head',
            <>
              <ellipse className="zone__hit" cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx + 5} ry={HEAD.ry + 5} />
              <ellipse className="zone__fill" cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
              <ellipse className="zone__edge" cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx + 5} ry={HEAD.ry + 5} />
            </>,
          )}

          <g clipPath={`url(#${raw}-torso)`}>
            {zone(
              'chest',
              'Chest',
              <>
                <path className="zone__fill" d={CHEST} />
                <path className="zone__edge" d={CHEST} />
              </>,
            )}
            {zone(
              'belly',
              'Belly',
              <>
                <path className="zone__fill" d={BELLY} />
                <path className="zone__edge" d={BELLY} />
              </>,
            )}
          </g>

          {zone(
            'armL',
            'Left arm',
            <>
              <path className="zone__hit" d={LIMBS.armL} />
              <path className="zone__limb" d={LIMBS.armL} />
              <path className="zone__edge" d={LIMBS.armL} />
            </>,
          )}
          {zone(
            'armR',
            'Right arm',
            <>
              <path className="zone__hit" d={LIMBS.armR} />
              <path className="zone__limb" d={LIMBS.armR} />
              <path className="zone__edge" d={LIMBS.armR} />
            </>,
          )}
          {zone(
            'legL',
            'Left leg',
            <>
              <path className="zone__hit" d={LIMBS.legL} />
              <path className="zone__limb" d={LIMBS.legL} />
              <path className="zone__edge" d={LIMBS.legL} />
            </>,
          )}
          {zone(
            'legR',
            'Right leg',
            <>
              <path className="zone__hit" d={LIMBS.legR} />
              <path className="zone__limb" d={LIMBS.legR} />
              <path className="zone__edge" d={LIMBS.legR} />
            </>,
          )}

          {/* what is under the skin: ribs, sternum, spine, pelvis, knees */}
          <g fill="none" stroke="#9deafd" strokeOpacity="0.2" strokeWidth="0.9" strokeLinecap="round" pointerEvents="none">
            {RIBS.map((r) => (
              <g key={r.left}>
                <path d={r.left} />
                <path d={r.right} />
              </g>
            ))}
            <path d="M 120 122 L 120 168" strokeOpacity="0.26" />
            <path d="M 98 118 Q 120 111 142 118" />
            <path d="M 98 216 Q 120 232 142 216" />
          </g>
          <g pointerEvents="none">
            {[
              [120, 132],
              [120, 148],
              [120, 164],
              [120, 180],
              [120, 196],
              [120, 212],
            ].map(([x, y]) => (
              <circle key={y} cx={x} cy={y} r="1.6" fill="#a5f3fc" opacity="0.28" />
            ))}
            <circle cx="103" cy="292" r="2.8" fill="#a5f3fc" opacity="0.22" />
            <circle cx="137" cy="292" r="2.8" fill="#a5f3fc" opacity="0.22" />
          </g>

          {/* glass over the plate */}
          <g pointerEvents="none">
            <ellipse
              cx="82"
              cy="80"
              rx="62"
              ry="94"
              fill="#ffffff"
              opacity="0.035"
              transform="rotate(-16 82 80)"
              filter={`url(#${raw}-glass)`}
            />
            <rect x="22" y="22" width="196" height="376" fill="none" stroke="#9deafd" strokeOpacity="0.09" strokeWidth="1" rx="8" />
          </g>
        </g>
      </svg>

      <button
        type="button"
        className="body__all"
        data-on={value.length === 7}
        aria-pressed={value.length === 7}
        onClick={() => onToggle('all')}
      >
        <span className="body__all-dot" aria-hidden="true" />
        All over
      </button>
    </div>
  )
}
