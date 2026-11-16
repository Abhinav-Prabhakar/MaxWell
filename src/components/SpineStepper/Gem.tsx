import type { SpineStepState } from './layout'
import { clamp01, easeOutBack } from './motion'

type IdFn = (name: string) => string
type Point = readonly [number, number]

/** Key light: upper-left, as in the rest of the drawing. */
const LIGHT: Point = [-0.45, -0.89]
/** A weak environment bounce, so the shadow side is not dead flat. */
const BOUNCE: Point = [0.62, 0.78]
const HALF_PI = Math.PI / 2

/** Flat planes, dark to bright — a facet takes exactly one step of this ramp. */
const RAMP = ['#0a2a3c', '#10455e', '#1a6a8a', '#2f9dc0', '#63d3ea', '#a8eefc', '#d9feff', '#ffffff']

const norm = ([x, y]: Point): Point => {
  const len = Math.hypot(x, y) || 1
  return [x / len, y / len]
}

const ring = (radius: number, offset: number): Point[] =>
  Array.from({ length: 8 }, (_, i) => {
    const angle = offset + (i * Math.PI) / 4
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })

const poly = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')

/** Facets between two rings, one quad per girdle edge. */
function band(outer: Point[], inner: Point[]): Point[][] {
  return outer.map((_, i) => {
    const next = (i + 1) % outer.length
    return [outer[i], outer[next], inner[next], inner[i]]
  })
}

function normalOf(points: Point[]) {
  return norm([
    points.reduce((sum, p) => sum + p[0], 0) / points.length,
    points.reduce((sum, p) => sum + p[1], 0) / points.length,
  ])
}

/** Which step of the ramp a facet's plane sits on. */
function facetStep(points: Point[], lift = 0) {
  const [x, y] = normalOf(points)
  const key = x * LIGHT[0] + y * LIGHT[1]
  const bounce = Math.max(0, x * BOUNCE[0] + y * BOUNCE[1])
  const index = 1 + Math.round(((key + 1) / 2) * 3.6 + bounce * 0.25) + lift
  return RAMP[Math.min(RAMP.length - 1, Math.max(0, index))]
}

export interface GemProps {
  cx: number
  cy: number
  radius: number
  state: Extract<SpineStepState, 'complete' | 'active'>
  /** Per-stone cut rotation, so no two gems catch the light identically. */
  seed: number
  unit: number
  uid: IdFn
  /**
   * Assembly progress, 0 → 1. Omit for a finished stone; anything below 1
   * builds the cut facet by facet, outside in.
   */
  form?: number
}

export function Gem({ cx, cy, radius: r, state, seed, unit, uid, form }: GemProps) {
  const active = state === 'active'
  const forming = form !== undefined
  const f = form ?? 1

  const girdle = ring(r, -HALF_PI)
  const crown = ring(r * 0.62, -HALF_PI + Math.PI / 8)
  const table = ring(r * 0.36, -HALF_PI)
  const bezel = band(girdle, crown)
  const star = band(crown, table)

  const spark = (r * 1.15) / 6
  const edge = Math.max(0.3, r * 0.013)
  const sparkPath = (s: number) =>
    `M0,${-s} C${s * 0.09},${-s * 0.09} ${s * 0.09},${-s * 0.09} ${s},0` +
    ` C${s * 0.09},${s * 0.09} ${s * 0.09},${s * 0.09} 0,${s}` +
    ` C${-s * 0.09},${s * 0.09} ${-s * 0.09},${s * 0.09} ${-s},0` +
    ` C${-s * 0.09},${-s * 0.09} ${-s * 0.09},${-s * 0.09} 0,${-s} Z`

  /** 0 → 1 for a piece whose slot opens at `delay`. */
  const stage = (delay: number, spread = 0.16) => {
    if (!forming) return 1
    return clamp01((f - delay) / spread)
  }

  /** A facet flying in from outside the stone and locking into the cut. */
  const piece = (points: Point[], delay: number, spread = 0.18) => {
    const p = stage(delay, spread)
    if (!forming) return { opacity: 1, transform: undefined, flash: 0 }
    const [nx, ny] = normalOf(points)
    const k = easeOutBack(p)
    const out = r * 1.24 * (1 - k)
    /* The edge catches as it seats — that is the "machined into place" read. */
    const lock = clamp01((p - 0.5) / 0.5)
    return {
      opacity: clamp01(p * 1.7),
      transform: `translate(${(nx * out).toFixed(2)} ${(ny * out).toFixed(2)}) scale(${(0.5 + 0.5 * k).toFixed(3)})`,
      flash: p > 0 && p < 1 ? Math.sin(lock * Math.PI) : 0,
    }
  }

  const auraIn = forming ? clamp01(f / 0.22) : 1
  const tableFlash = forming ? clamp01((f - 0.56) / 0.14) : 1
  const shellIn = stage(0.0, 0.1)
  /* The finished stone settles with a single soft bounce. */
  const settle = forming ? Math.sin(clamp01((f - 0.87) / 0.13) * Math.PI) * 0.045 : 0
  /* The scaffold fades in a beat after the girdle wall, and out as the crown seats. */
  const scaffold = forming ? clamp01((f - 0.02) / 0.1) * clamp01((0.9 - f) / 0.22) : 0

  return (
    <g
      transform={`translate(${cx} ${cy})${settle > 0.0005 ? ` scale(${(1 + settle).toFixed(4)})` : ''}`}
      data-gem={active ? 'active' : 'complete'}
      data-form={forming ? f.toFixed(3) : undefined}
    >
      {/* aura bleeding into the tissue around the stone */}
      <g opacity={auraIn}>
        <circle
          r={r * (active ? 3.1 : 2.3) * (0.55 + 0.45 * auraIn)}
          fill={`url(#${uid(active ? 'gemAuraHot' : 'gemAura')})`}
          style={{ mixBlendMode: 'screen' }}
          opacity={active ? 0.85 : 0.7}
        >
          {active && (
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite" />
          )}
        </circle>
      </g>

      {active && (
        <g opacity={auraIn}>
          <circle
            r={r * 1.42}
            fill="none"
            stroke="#67e8f9"
            strokeWidth={Math.max(1, unit * 1.2)}
            opacity="0.5"
            filter={`url(#${uid('gemHalo')})`}
          >
            <animate attributeName="r" values={`${r * 1.2};${r * 2.5}`} dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* seat shadow, so the stone sits *in* the bone */}
      <g opacity={shellIn}>
        <ellipse
          cx={r * 0.1}
          cy={r * 0.5}
          rx={r * 1.04}
          ry={r * 0.54}
          fill="#020c09"
          opacity="0.5"
          filter={`url(#${uid('gemSoft')})`}
        />
        <ellipse cx={r * 0.22} cy={r * 0.88} rx={r * 0.7} ry={r * 0.18} fill="#04120d" opacity="0.4" filter={`url(#${uid('gemHalo')})`} />
      </g>

      {/* girdle wall, with the scaffold ring the cut is being turned against */}
      <circle
        r={r}
        fill={`url(#${uid('gemGirdle')})`}
        opacity={clamp01(shellIn * 1.6)}
        transform={forming ? `scale(${(0.86 + 0.14 * easeOutBack(shellIn)).toFixed(3)})` : undefined}
      />
      {scaffold > 0 && (
        <g
          transform={`rotate(${(-45 + 110 * f).toFixed(1)})`}
          opacity={scaffold * 0.55}
          style={{ mixBlendMode: 'screen' }}
        >
          <circle
            r={r * 1.03}
            fill="none"
            stroke="#a5f3fc"
            strokeWidth={Math.max(0.6, r * 0.026)}
            strokeDasharray={`${(r * 0.2).toFixed(2)} ${(r * 0.15).toFixed(2)}`}
            strokeLinecap="round"
          />
        </g>
      )}

      <g transform={`rotate(${((seed * 23) % 24) - 12})`}>
        {/* crown: eight flat planes around the table */}
        {bezel.map((facet, i) => {
          const s = piece(facet, 0.05 + i * 0.036)
          return (
            <g key={`b${i}`} opacity={s.opacity} transform={s.transform}>
              <polygon
                points={poly(facet)}
                fill={facetStep(facet)}
                stroke="#011a13"
                strokeOpacity="0.3"
                strokeWidth={edge}
                strokeLinejoin="round"
              />
              {s.flash > 0 && (
                <polygon
                  points={poly(facet)}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity={0.5 * s.flash}
                  strokeWidth={edge * 2.4}
                  strokeLinejoin="round"
                />
              )}
            </g>
          )
        })}

        {/* star facets, a step brighter — light pools towards the middle */}
        {star.map((facet, i) => {
          const s = piece(facet, 0.3 + i * 0.032)
          return (
            <g key={`s${i}`} opacity={s.opacity} transform={s.transform}>
              <polygon
                points={poly(facet)}
                fill={facetStep(facet, 1)}
                stroke="#011a13"
                strokeOpacity="0.26"
                strokeWidth={edge}
                strokeLinejoin="round"
              />
              {s.flash > 0 && (
                <polygon
                  points={poly(facet)}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity={0.45 * s.flash}
                  strokeWidth={edge * 2.4}
                  strokeLinejoin="round"
                />
              )}
            </g>
          )
        })}

        {/* fire: a pink and an amber flash picked up off-plane */}
        {(() => {
          const s = piece(star[2], 0.34)
          const s2 = piece(bezel[6], 0.24)
          return (
            <>
              <polygon points={poly(star[2])} fill="#f0abfc" opacity={0.16 * s.opacity} transform={s.transform} style={{ mixBlendMode: 'screen' }} />
              <polygon points={poly(bezel[6])} fill="#fcd34d" opacity={0.1 * s2.opacity} transform={s2.transform} style={{ mixBlendMode: 'screen' }} />
            </>
          )
        })()}

        {/* table — the window into the stone, cut last */}
        {(() => {
          const s = piece(table, 0.58)
          return (
            <g opacity={s.opacity} transform={s.transform}>
              <polygon points={poly(table)} fill={`url(#${uid('gemTable')})`} />
              <polygon
                points={poly(table)}
                fill="none"
                stroke="#04170f"
                strokeOpacity="0.5"
                strokeWidth={edge * 1.6}
              />
              {s.flash > 0 && (
                <polygon
                  points={poly(table)}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity={0.55 * s.flash}
                  strokeWidth={edge * 2.6}
                  strokeLinejoin="round"
                />
              )}
              {forming && tableFlash < 1 && (
                <polygon points={poly(table)} fill="#ffffff" opacity={(1 - tableFlash) * 0.7} />
              )}
            </g>
          )
        })()}

        {/* caustic under the table */}
        <ellipse
          cy={r * 0.1}
          rx={r * 0.2}
          ry={r * 0.13}
          fill={`url(#${uid('gemCore')})`}
          style={{ mixBlendMode: 'screen' }}
          opacity={stage(0.66, 0.18)}
        />

        {/* girdle edge: pale where the environment wraps the far side */}
        <polygon
          points={poly(girdle)}
          fill="none"
          stroke={`url(#${uid('gemRim')})`}
          strokeWidth={Math.max(0.9, r * 0.05)}
          strokeLinejoin="round"
          opacity={stage(0.68, 0.2)}
        />
        <circle
          r={r * 0.955}
          fill="none"
          stroke="#eafff7"
          strokeOpacity="0.07"
          strokeWidth={Math.max(0.4, r * 0.014)}
          opacity={stage(0.68, 0.2)}
        />
      </g>

      {/* specular: soft shelf of light, then the hot spot */}
      <g opacity={stage(0.7, 0.2)}>
        <ellipse
          cx={-r * 0.34}
          cy={-r * 0.4}
          rx={r * 0.22}
          ry={r * 0.13}
          fill="#ffffff"
          opacity="0.18"
          filter={`url(#${uid('gemSoft')})`}
        />
        <ellipse cx={-r * 0.42} cy={-r * 0.46} rx={r * 0.1} ry={r * 0.055} fill="#ffffff" opacity="0.95" />
      </g>

      {/* key light catching the upper-left girdle edge */}
      <path
        d={`M${-r * 0.96},${-r * 0.28} A ${r} ${r} 0 0 1 ${-r * 0.3},${-r * 0.95}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={Math.max(0.7, r * 0.045)}
        strokeLinecap="round"
        opacity={0.42 * stage(0.7, 0.2)}
        filter={`url(#${uid('gemHalo')})`}
      />

      {/* bounce light climbing the lower-right facet */}
      <path
        d={`M${r * 0.4},${r * 0.7} A ${r} ${r} 0 0 0 ${r * 0.88},${r * 0.2}`}
        fill="none"
        stroke="#bff4ff"
        strokeWidth={Math.max(0.7, r * 0.055)}
        strokeLinecap="round"
        opacity={0.32 * stage(0.7, 0.2)}
        filter={`url(#${uid('gemHalo')})`}
      />

      {/* sparkle — the last thing to catch */}
      {(() => {
        const p = stage(0.82, 0.18)
        const k = forming ? easeOutBack(p) : 1
        return (
          <g transform={`translate(${-r * 0.4} ${-r * 0.46}) scale(${k.toFixed(3)})`} opacity={p * (active ? 1 : 0.9)}>
            <path d={sparkPath(spark)} fill="#ffffff">
              {active && (
                <animate attributeName="opacity" values="0.55;1;0.55" dur="2.4s" repeatCount="indefinite" />
              )}
            </path>
          </g>
        )
      })()}

      {/* a second, smaller twinkle as the crown finally seats */}
      {(() => {
        const p = stage(0.9, 0.1)
        const k = forming ? easeOutBack(p) : 1
        if (!forming || p <= 0) return null
        return (
          <g transform={`translate(${r * 0.44} ${r * 0.3}) scale(${k.toFixed(3)})`} opacity={p * 0.8}>
            <path d={sparkPath(spark * 0.55)} fill="#eafdff" />
          </g>
        )
      })()}
    </g>
  )
}

export default Gem
