import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createSpineLayout, type SpineStepInput } from './layout'
import { Gem } from './Gem'
import { clamp01, easeInOutCubic, lerp } from './motion'
import './spine-stepper.css'

export type { SpineStepInput, SpineStepState } from './layout'

export interface SpineStepperProps {
  steps: SpineStepInput[]
  eyebrow?: string
  title?: string
  showHeader?: boolean
  className?: string
}

const FALLBACK = { width: 620, height: 900 }

/* Advance choreography: the charge gathers, travels, lands, and only then does
   the stone build itself — one clock, four beats. */
const LEAD_MS = 180
const TRANSIT_MS = 780
const FORM_MS = 1240
const TOTAL_MS = LEAD_MS + TRANSIT_MS + FORM_MS + 200

export function SpineStepper({
  steps,
  eyebrow = 'SPINAL CORD · STEPPER',
  title = 'Neural Integration',
  showHeader = true,
  className,
}: SpineStepperProps) {
  const raw = useId()
  const uid = (name: string) => `spine-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}-${name}`

  const hostRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState(FALLBACK)

  /* The drawing is laid out in CSS pixels, 1:1 with the box it lives in, so a
     step added or a window resized re-flows the whole column instead of
     stretching a fixed drawing. */
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const measure = () => {
      const { width, height } = host.getBoundingClientRect()
      if (width < 1 || height < 1) return
      setBox((prev) =>
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(
    () => createSpineLayout(steps, { ...box, showHeader }),
    [steps, box, showHeader],
  )

  const { cx, unit, cord, nodes, header, completed, labelScale, width, height } = layout
  const activeIndex = nodes.findIndex((node) => node.state === 'active')

  /* One clock drives both beats of an advance: the charge running down the
     cord, then the stone on the node it lands on building itself. */
  const [charge, setCharge] = useState<{
    from: number
    to: number
    node: number
    fromNode: number
    start: number
  } | null>(null)
  const [clock, setClock] = useState(0)
  const lastStop = useRef<{ height: number; active: number } | null>(null)

  const elapsed = charge ? clock : TOTAL_MS
  /* Beat 1 — the charge gathers at the stone it is leaving. */
  const lead = charge ? clamp01(elapsed / LEAD_MS) : 1
  /* Beat 2 — it runs down the cord. */
  const travel = charge ? easeInOutCubic(clamp01((elapsed - LEAD_MS) / TRANSIT_MS)) : 1
  /* Beat 3 — the stone on the far node builds itself. */
  const form = charge ? clamp01((elapsed - LEAD_MS - TRANSIT_MS) / FORM_MS) : 1
  const fillHeight = charge ? lerp(charge.from, charge.to, travel) : layout.fill.height
  const headY = cord.top + fillHeight
  const headReveal = charge
    ? clamp01((LEAD_MS + TRANSIT_MS + 200 - elapsed) / 200)
    : 0
  const headX = cord.x + cord.width / 2
  /* A small organic flicker, so the head reads as live current. */
  const flick = 1 + 0.1 * Math.sin(elapsed / 55)
  /* The head starts tight inside the stone it is leaving and only opens up once
     it is out on the cord — a full-size bloom at the gather beat would swallow
     the cut it is sitting on. */
  const chargeUp =
    elapsed < LEAD_MS
      ? 0.38
      : 0.38 + 0.62 * easeInOutCubic(clamp01((elapsed - LEAD_MS) / 240))

  useLayoutEffect(() => {
    const next = { height: layout.fill.height, active: activeIndex }
    const prev = lastStop.current
    lastStop.current = next
    if (!prev) return

    if (next.active !== prev.active && next.height > prev.height + 1) {
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return
      /* If a second advance lands mid-flight, hand over from where the charge
         actually is, not from the height it was still travelling to. */
      const from = charge ? lerp(charge.from, charge.to, travel) : prev.height
      setCharge({
        from,
        to: next.height,
        node: next.active,
        fromNode: prev.active,
        start: performance.now(),
      })
      setClock(0)
    } else if (next.height < prev.height - 1) {
      setCharge(null)
    }
    /* Deliberately keyed to the column's geometry, not to `travel` — reading the
       current frame's position must not re-arm the effect on every frame. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.fill.height, activeIndex])

  useEffect(() => {
    if (!charge) return
    let raf = 0
    const tick = () => {
      const ms = performance.now() - charge.start
      if (ms >= TOTAL_MS) {
        setCharge(null)
        return
      }
      setClock(ms)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [charge])

  const gemRadius = Math.min(Math.max(21 * unit, 13), 29)
  const fontSize = (px: number) => (px * labelScale).toFixed(2)
  /* Vertical pitch of the column, so the label block can drop its third line
     before rows start to collide. */
  const pitch = nodes.length > 1 ? nodes[1].y - nodes[0].y : Infinity
  const showStatus = pitch >= 58

  return (
    <div ref={hostRef} className={['spine-stepper', className].filter(Boolean).join(' ')}>
      <svg
        className="spine-stepper__canvas"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`${title}: ${completed} of ${steps.length} steps complete`}
        fontFamily="Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      >
        <defs>
          {/* ================= CORD ================= */}
          <linearGradient id={uid('cordFill')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b6b80" />
            <stop offset="0.35" stopColor="#1594ad" />
            <stop offset="0.7" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a5f3fc" />
          </linearGradient>

          <linearGradient id={uid('cordShell')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#04121a" />
            <stop offset="0.28" stopColor="#0d1c27" />
            <stop offset="0.5" stopColor="#0a1620" />
            <stop offset="0.82" stopColor="#122534" />
            <stop offset="1" stopColor="#050d14" />
          </linearGradient>

          <linearGradient id={uid('cordFade')} x1="0" y1={cord.top} x2="0" y2={cord.bottom} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.06" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.9" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id={uid('cordMask')} maskUnits="userSpaceOnUse" x={cord.x - 60} y={cord.top - 60} width={cord.width + 120} height={cord.bottom - cord.top + 120}>
            <rect x={cord.x - 60} y={cord.top} width={cord.width + 120} height={cord.bottom - cord.top} fill={`url(#${uid('cordFade')})`} />
          </mask>

          {/* The bloom down the lit cord, as a horizontal falloff rather than a
              blur: a filtered rect has to be re-rasterised on every frame of an
              advance, which is far and away the most expensive thing here. */}
          <linearGradient id={uid('cordCore')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="0.34" stopColor="#67e8f9" stopOpacity="0.34" />
            <stop offset="0.5" stopColor="#a5f3fc" stopOpacity="0.5" />
            <stop offset="0.66" stopColor="#67e8f9" stopOpacity="0.34" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={uid('fillHead')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#d9fbff" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id={uid('cometTrail')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="0.55" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="1" stopColor="#a5f3fc" stopOpacity="0.8" />
          </linearGradient>

          <radialGradient id={uid('cometHalo')} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.24" stopColor="#a5f3fc" stopOpacity="0.6" />
            <stop offset="0.62" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>

          {/* ================= STONE ================= */}
          <radialGradient id={uid('gemAura')} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0.42" />
            <stop offset="0.45" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="1" stopColor="#0e7490" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={uid('gemAuraHot')} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ecfeff" stopOpacity="0.5" />
            <stop offset="0.28" stopColor="#67e8f9" stopOpacity="0.32" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={uid('gemGirdle')} cx="0.4" cy="0.34" r="0.72">
            <stop offset="0" stopColor="#1a6a8a" />
            <stop offset="0.6" stopColor="#0a2a3c" />
            <stop offset="1" stopColor="#03121b" />
          </radialGradient>

          <radialGradient id={uid('gemBody')} cx="0.38" cy="0.3" r="0.82">
            <stop offset="0" stopColor="#4ac2df" />
            <stop offset="0.32" stopColor="#1a6a8a" />
            <stop offset="0.7" stopColor="#0d3c52" />
            <stop offset="1" stopColor="#03161f" />
          </radialGradient>

          <radialGradient id={uid('gemTable')} cx="0.4" cy="0.32" r="0.78">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.38" stopColor="#c7f7ff" />
            <stop offset="0.72" stopColor="#63d3ea" />
            <stop offset="1" stopColor="#2f9dc0" />
          </radialGradient>

          <radialGradient id={uid('gemCore')} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="0.45" stopColor="#7ee7f7" stopOpacity="0.42" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={uid('gemRim')} x1="0.2" y1="0.9" x2="0.8" y2="0.1">
            <stop offset="0" stopColor="#c7f7ff" stopOpacity="0.85" />
            <stop offset="0.32" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="0.72" stopColor="#0a2a3c" stopOpacity="0.9" />
            <stop offset="1" stopColor="#02101a" />
          </linearGradient>

          <filter id={uid('gemSoft')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id={uid('gemHalo')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          {/* ================= BONE ================= */}
          <linearGradient id={uid('bodyGrad')} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#fdf9f1" />
            <stop offset="0.14" stopColor="#efe7d8" />
            <stop offset="0.42" stopColor="#dacfbc" />
            <stop offset="0.72" stopColor="#b5a995" />
            <stop offset="0.92" stopColor="#948876" />
            <stop offset="1" stopColor="#7d7261" />
          </linearGradient>

          <linearGradient id={uid('wingGrad')} x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0" stopColor="#e8dfce" />
            <stop offset="0.42" stopColor="#c1b59f" />
            <stop offset="1" stopColor="#756a5a" />
          </linearGradient>

          <radialGradient id={uid('litRadial')} cx="0.34" cy="0.22" r="0.72">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={uid('edgeDark')} cx="0.5" cy="0.44" r="0.63">
            <stop offset="0.42" stopColor="#1a130b" stopOpacity="0" />
            <stop offset="0.82" stopColor="#1a130b" stopOpacity="0.32" />
            <stop offset="1" stopColor="#0f0a05" stopOpacity="0.75" />
          </radialGradient>

          <linearGradient id={uid('bottomAO')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2015" stopOpacity="0" />
            <stop offset="1" stopColor="#1e160d" stopOpacity="0.8" />
          </linearGradient>

          <path
            id={uid('bodyPath')}
            d="M-44,-42
              C-30,-45 -14,-46 0,-46
              C14,-46 30,-45 44,-42
              C50,-40 52,-30 52,-18
              C52,-6 52,8 52,20
              C52,32 48,42 38,44
              C24,46 12,47 0,47
              C-12,47 -24,46 -38,44
              C-48,42 -52,32 -52,20
              C-52,8 -52,-6 -52,-18
              C-52,-30 -50,-40 -44,-42 Z"
          />

          <clipPath id={uid('bodyClip')}>
            <path
              d="M-44,-42
                C-30,-45 -14,-46 0,-46
                C14,-46 30,-45 44,-42
                C50,-40 52,-30 52,-18
                C52,-6 52,8 52,20
                C52,32 48,42 38,44
                C24,46 12,47 0,47
                C-12,47 -24,46 -38,44
                C-48,42 -52,32 -52,20
                C-52,8 -52,-6 -52,-18
                C-52,-30 -50,-40 -44,-42 Z"
            />
          </clipPath>

          <filter id={uid('organ')} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="9" result="t" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="t"
              scale="3.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id={uid('grain')} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="3" seed="4" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
          </filter>

          <filter id={uid('b4')} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={uid('b14')} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          {/* ================= VERTEBRA ================= */}
          <g id={uid('vert')}>
            <ellipse cx="0" cy="18" rx="58" ry="36" fill="#000000" opacity="0.5" filter={`url(#${uid('b14')})`} />

            <g filter={`url(#${uid('organ')})`}>
              <ellipse cx="0" cy="46" rx="25" ry="13" fill="#6b6152" />

              <path
                d="M-46,-26 C-58,-35 -70,-43 -80,-45
                   C-89,-46 -93,-39 -88,-31
                   C-81,-20 -65,-8 -49,-1 Z"
                fill={`url(#${uid('wingGrad')})`}
              />
              <path
                d="M46,-26 C58,-35 70,-43 80,-45
                   C89,-46 93,-39 88,-31
                   C81,-20 65,-8 49,-1 Z"
                fill={`url(#${uid('wingGrad')})`}
              />

              <use href={`#${uid('bodyPath')}`} fill={`url(#${uid('bodyGrad')})`} />

              <g clipPath={`url(#${uid('bodyClip')})`}>
                <rect x="-62" y="-56" width="124" height="112" fill={`url(#${uid('litRadial')})`} />
                <rect x="-62" y="-56" width="124" height="112" fill={`url(#${uid('edgeDark')})`} />
                <rect x="-62" y="8" width="124" height="48" fill={`url(#${uid('bottomAO')})`} />

                <ellipse cx="-17" cy="-27" rx="27" ry="10" fill="#ffffff" opacity="0.6" filter={`url(#${uid('b4')})`} />
                <ellipse cx="-40" cy="-4" rx="7" ry="17" fill="#ffffff" opacity="0.35" filter={`url(#${uid('b4')})`} />
                <ellipse cx="16" cy="-34" rx="18" ry="5" fill="#ffffff" opacity="0.35" filter={`url(#${uid('b4')})`} />

                <path
                  d="M52,-18 C52,-4 52,10 52,24"
                  stroke="#8fd8f5"
                  strokeWidth="2.4"
                  fill="none"
                  opacity="0.22"
                  filter={`url(#${uid('b4')})`}
                />

                <rect
                  x="-62"
                  y="-56"
                  width="124"
                  height="112"
                  filter={`url(#${uid('grain')})`}
                  opacity="0.2"
                  style={{ mixBlendMode: 'overlay' }}
                />
              </g>

              <path
                d="M-46,-26 C-58,-35 -70,-43 -80,-45"
                stroke="#fff8ea"
                strokeWidth="1.6"
                fill="none"
                opacity="0.38"
                filter={`url(#${uid('b4')})`}
              />
              <path
                d="M46,-26 C58,-35 70,-43 80,-45"
                stroke="#fff8ea"
                strokeWidth="1.6"
                fill="none"
                opacity="0.3"
                filter={`url(#${uid('b4')})`}
              />
            </g>
          </g>
        </defs>

        {/* ================= CORD ================= */}
        <g mask={`url(#${uid('cordMask')})`}>
          <rect x={cord.x} y={cord.top} width={cord.width} height={cord.bottom - cord.top} rx={cord.radius} fill={`url(#${uid('cordShell')})`} />
          <rect
            x={cord.x}
            y={cord.top}
            width={cord.width}
            height={cord.bottom - cord.top}
            rx={cord.radius}
            fill="none"
            stroke="#1b2836"
            strokeWidth={Math.max(1, unit)}
          />

          <rect x={cord.x + 3 * unit} y={cord.top + 3} width={cord.width - 6 * unit} height={fillHeight} rx={cord.radius - 3 * unit} fill={`url(#${uid('cordFill')})`} />
          <rect
            x={cord.x + 3 * unit}
            y={cord.top + 3}
            width={cord.width - 6 * unit}
            height={fillHeight}
            rx={cord.radius - 3 * unit}
            fill={`url(#${uid('cordCore')})`}
          />

          {/* leading edge of the fill */}
          <rect
            x={cord.x + 2 * unit}
            y={cord.top + fillHeight - 26}
            width={cord.width - 4 * unit}
            height="26"
            rx={12 * unit}
            fill={`url(#${uid('fillHead')})`}
            opacity="0.55"
          />

          <rect x={cord.x + 4 * unit} y={cord.top + 8} width={3 * unit} height={Math.max(fillHeight - 16, 0)} rx={1.5 * unit} fill="#ffffff" opacity="0.18" />
          <rect x={cord.x + cord.width - 5 * unit} y={cord.top + 8} width={1.6 * unit} height={Math.max(fillHeight - 16, 0)} rx={0.8 * unit} fill="#8fd8f5" opacity="0.14" />

          {/* the afterglow the charge drags down the cord */}
          {charge && headReveal > 0 && (
            <rect
              x={cord.x + 2 * unit}
              y={headY - 150 * unit}
              width={cord.width - 4 * unit}
              height={150 * unit}
              fill={`url(#${uid('cometTrail')})`}
              opacity={headReveal}
            />
          )}
        </g>

        {/* ================= VERTEBRAE + STONES ================= */}
        {nodes.map((node, index) => {
          const isComplete = node.state === 'complete'
          const isActive = node.state === 'active'
          const isPending = node.state === 'pending'
          const progress = Math.min(1, Math.max(0, node.progress ?? 0))
          const dotX = cx + 98 * unit
          const labelX = cx + 150 * unit
          const barWidth = Math.max(0, Math.min(170 * unit, width - labelX - 26))

          /* The node the charge is heading for stays dormant until it lands,
             then wakes as the stone assembles. */
          const isForming = charge?.node === index
          /* The impact only exists once the charge has actually arrived. */
          const landed = isForming && form > 0
          const isDeparting = charge?.fromNode === index && lead < 1
          const nodeForm = isForming ? form : undefined
          const socket = isPending ? 1 : isForming ? clamp01(1 - form / 0.06) : 0
          const wake = isForming ? travel : 1
          /* The bone takes the hit: a short damped recoil as the charge lands. */
          const hit = isForming ? clamp01(form / 0.12) : 1
          const jolt = isForming ? (1 - hit) * Math.sin(hit * Math.PI * 3) * 2.4 : 0

          const accent = isComplete ? '#2dd4bf' : isActive ? '#67e8f9' : '#31404f'
          const labelColor = isComplete ? '#dbe7f2' : isActive ? '#ffffff' : '#6b7c8d'
          const statusColor = isComplete ? '#2dd4bf' : isActive ? '#67e8f9' : '#42566a'

          return (
            <g key={`${node.id}-${index}`}>
              <g
                transform={`translate(${cx} ${node.y + jolt}) rotate(${node.rotate}) scale(${node.scale * unit})`}
                opacity={isPending ? 0.58 : isForming ? (landed ? 1 : 0.58) : 1}
              >
                <use href={`#${uid('vert')}`} />
              </g>

              {/* the stone the charge is leaving draws its light back in, behind
                  the stone so the cut stays legible while the charge gathers */}
              {isDeparting && (
                <g style={{ mixBlendMode: 'screen' }} opacity={(1 - lead) * 0.8}>
                  <circle
                    cx={cx}
                    cy={node.y}
                    r={gemRadius * lerp(2.15, 0.95, easeInOutCubic(lead))}
                    fill="none"
                    stroke="#a5f3fc"
                    strokeWidth={Math.max(1, 1.8 * unit)}
                  />
                </g>
              )}

              {/* nothing is cut until the charge has actually landed — before
                  that the node is just an empty socket */}
              {!isPending && (isForming ? form > 0.004 : true) && (
                <Gem
                  cx={cx}
                  cy={node.y}
                  radius={gemRadius * (isActive ? 1.08 : 1)}
                  state={isComplete ? 'complete' : 'active'}
                  seed={index + 1}
                  unit={unit}
                  uid={uid}
                  form={nodeForm}
                />
              )}

              {socket > 0 && (
                <g opacity={socket}>
                  <circle cx={cx} cy={node.y} r={gemRadius} fill={`url(#${uid('gemGirdle')})`} opacity="0.4" />
                  <circle cx={cx} cy={node.y} r={gemRadius} fill="none" stroke="#2a3a48" strokeWidth={Math.max(1, unit)} />
                  <circle cx={cx} cy={node.y} r={gemRadius * 0.62} fill="#0d1a22" />
                </g>
              )}

              {/* impact: two shockwave rings and a spray of light across the bone */}
              {landed && (
                <>
                  <g style={{ mixBlendMode: 'screen' }} opacity={clamp01(1 - form / 0.5)}>
                    <circle
                      cx={cx}
                      cy={node.y}
                      r={gemRadius * (0.65 + 2.1 * clamp01(form / 0.5))}
                      fill="none"
                      stroke="#a5f3fc"
                      strokeWidth={Math.max(1.2, 2.8 * unit)}
                    />
                  </g>
                  <g style={{ mixBlendMode: 'screen' }} opacity={clamp01(1 - form / 0.24)}>
                    <circle
                      cx={cx}
                      cy={node.y}
                      r={gemRadius * (0.5 + 1.5 * clamp01(form / 0.24))}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={Math.max(1, 1.6 * unit)}
                    />
                  </g>
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = (i * Math.PI) / 3 + 0.34
                    const reach = clamp01(form / 0.2)
                    const near = gemRadius * (0.75 + 0.9 * reach)
                    const far = gemRadius * (0.95 + 1.7 * reach)
                    return (
                      <line
                        key={i}
                        x1={cx + Math.cos(angle) * near}
                        y1={node.y + Math.sin(angle) * near}
                        x2={cx + Math.cos(angle) * far}
                        y2={node.y + Math.sin(angle) * far}
                        stroke="#d9fbff"
                        strokeWidth={Math.max(0.8, 1.5 * unit)}
                        strokeLinecap="round"
                        opacity={clamp01(1 - form / 0.2) * 0.75}
                        style={{ mixBlendMode: 'screen' }}
                      />
                    )
                  })}
                </>
              )}

              {/* ================= LABEL ================= */}
              <g opacity={isForming ? 0.4 + 0.6 * wake : 1}>
                <line
                  x1={dotX + 2}
                  y1={node.y}
                  x2={dotX + 34 * unit}
                  y2={node.y}
                  stroke={accent}
                  strokeWidth={isActive ? 1.6 : 1.2}
                  opacity={isComplete ? 0.45 : isActive ? 0.85 : 1}
                />
                <circle cx={dotX} cy={node.y} r={isActive ? 3.6 : 2.8} fill={accent} opacity={isComplete ? 0.9 : 1} />
                {isActive && <circle cx={dotX} cy={node.y} r="8" fill="none" stroke="#67e8f9" strokeWidth="1" opacity="0.4" />}

                <text
                  x={labelX}
                  y={node.y - 20}
                  fontSize={fontSize(10)}
                  letterSpacing={2.6 * labelScale}
                  fill={isComplete ? '#2dd4bf' : isActive ? '#67e8f9' : '#3f4f60'}
                  opacity={isComplete ? 0.72 : 1}
                >
                  {node.id}
                </text>
                <text x={labelX} y={node.y + 3} fontSize={fontSize(17)} fontWeight="600" fill={labelColor}>
                  {node.title}
                </text>
                {showStatus && (
                  <text x={labelX} y={node.y + 24} fontSize={fontSize(12)} fill={statusColor} opacity={isComplete ? 0.85 : 1}>
                    {isComplete ? 'Complete' : isActive ? `In progress · ${Math.round(progress * 100)}%` : 'Pending'}
                  </text>
                )}

                {showStatus && isActive && barWidth > 12 && (
                  <>
                    <rect x={labelX} y={node.y + 34} width={barWidth} height="2.5" rx="1.25" fill="#132029" />
                    <rect x={labelX} y={node.y + 34} width={barWidth * progress} height="2.5" rx="1.25" fill="#22d3ee" />
                    <rect
                      x={labelX}
                      y={node.y + 34}
                      width={barWidth * progress}
                      height="2.5"
                      rx="1.25"
                      fill="#22d3ee"
                      filter={`url(#${uid('b4')})`}
                      opacity="0.8"
                    />
                  </>
                )}
              </g>
            </g>
          )
        })}

        {/* the charge itself, drawn over the bone so light spills across it */}
        {charge && headReveal > 0 && (
          <g opacity={headReveal} style={{ mixBlendMode: 'screen' }}>
            {/* the tail the head drags behind it */}
            <rect
              x={headX - cord.width * 0.46 * chargeUp}
              y={headY - 150 * unit}
              width={cord.width * 0.92 * chargeUp}
              height={150 * unit}
              rx={cord.width * 0.46 * chargeUp}
              fill={`url(#${uid('cometTrail')})`}
              opacity="0.85"
            />

            {/* halo + spill across the bone */}
            <ellipse cx={headX} cy={headY} rx={cord.width * 1.9 * chargeUp} ry={34 * unit * chargeUp} fill={`url(#${uid('cometHalo')})`} />
            <ellipse cx={headX} cy={headY} rx={cord.width * 0.9 * chargeUp} ry={12 * unit * chargeUp} fill="#a5f3fc" opacity="0.5" />

            {/* core */}
            <ellipse cx={headX} cy={headY} rx={cord.width * 0.62 * flick * chargeUp} ry={8 * unit * chargeUp} fill="#ffffff" opacity="0.95" />
            <circle cx={headX} cy={headY} r={3.4 * unit * chargeUp} fill="#ffffff" />

            {/* the charge drawing itself together before it leaves */}
            {lead < 1 && (
              <circle
                cx={headX}
                cy={headY}
                r={lerp(46 * unit, 6 * unit, easeInOutCubic(lead))}
                fill="none"
                stroke="#a5f3fc"
                strokeWidth={Math.max(1, 2 * unit * (1 - lead * 0.5))}
                opacity={(1 - lead) * 0.75}
              />
            )}
          </g>
        )}

        {/* ================= HEADER ================= */}
        {header && (
          <>
            <text x="30" y={header.eyebrowY} fontSize="10.5" letterSpacing="3.6" fill="#5f7285">
              {eyebrow}
            </text>
            <text
              x="30"
              y={header.titleY}
              fontSize={header.titleSize}
              fontWeight="600"
              fill="#f1f5f9"
              letterSpacing="-0.4"
            >
              {title}
            </text>

            <text x={width - 30} y={header.eyebrowY} fontSize="10" letterSpacing="3.2" fill="#5f7285" textAnchor="end">
              COMPLETE
            </text>
            <text x={width - 30} y={header.titleY} fontSize={header.titleSize * 0.9} fontWeight="600" fill="#22d3ee" textAnchor="end">
              {completed} / {steps.length}
            </text>

            <line x1="30" y1={header.ruleY} x2={width - 30} y2={header.ruleY} stroke="#16202b" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  )
}

export default SpineStepper
