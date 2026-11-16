import { useId, useMemo, useState } from 'react'
import { compassOf, coordsOf, NETWORK_KM, nearestPlace, PLACES, TOWNS } from './places'
import type { IntakeLocation } from './types'
import { IconTarget } from '../Station/icons'

type Mode = 'idle' | 'locating' | 'denied' | 'insecure' | 'unavailable' | 'timeout' | 'outside'

const C = 170
const FACE = 141
const CASE = 152

/** Point on the card, 0° at the top (north), clockwise. */
const at = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const
}
const pt = (deg: number, r: number) => at(deg, r).join(' ')

const arcPath = (from: number, to: number, r: number) => {
  const [x1, y1] = at(from, r)
  const [x2, y2] = at(to, r)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

const COPY: Record<Exclude<Mode, 'idle'>, { title: string; hint: string }> = {
  locating: { title: 'Finding you…', hint: 'Hold still for a moment' },
  denied: { title: 'Location is blocked', hint: 'Allow it in the address bar — or pick a town' },
  insecure: { title: 'Location is blocked here', hint: 'It needs a secure page — pick a town below' },
  unavailable: { title: 'No location signal', hint: 'Pick the nearest town below' },
  timeout: { title: 'Location timed out', hint: 'Tap the compass to try again, or pick a town' },
  outside: { title: 'Outside our districts', hint: 'Pick the town you are nearest to' },
}

/** A machined compass in an anodised case: chamfered bezel, turned card,
 *  engraved rose, a bevelled needle on a jewel pivot, glass over the lot. */
export function Compass({
  value,
  onChange,
}: {
  value: IntakeLocation | null
  onChange: (v: IntakeLocation) => void
}) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [mode, setMode] = useState<Mode>('idle')
  const [fix, setFix] = useState<{ lat: number; lon: number } | null>(null)

  const detect = () => {
    if (mode === 'locating') return
    if (!window.isSecureContext) {
      setMode('insecure')
      return
    }
    if (!('geolocation' in navigator)) {
      setMode('unavailable')
      return
    }

    setFix(null)
    setMode('locating')

    const ask = (high: boolean, wait: number) =>
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: high,
          timeout: wait,
          maximumAge: 120_000,
        }),
      )

    const fail = (err: GeolocationPositionError) =>
      setMode(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable')

    const settle = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      setFix({ lat: latitude, lon: longitude })
      const near = nearestPlace(latitude, longitude)
      if (near.km > NETWORK_KM) {
        setMode('outside')
        return
      }
      onChange({
        place: near.place.name,
        clinic: near.place.clinic,
        distanceKm: Math.max(1, Math.round(near.km)),
        bearing: Math.round(near.bearing),
        lat: latitude,
        lon: longitude,
        source: 'device',
      })
      setMode('idle')
    }

    /* If the origin has been blocked before, Chrome answers with code 1 and no
       prompt; check the permission store so the sweep doesn't flash for nothing. */
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'denied') setMode('denied')
      })
      .catch(() => {})

    /* A precise fix can time out indoors; a coarse one usually still lands us in
       the right district, which is all the clinic choice needs. */
    ask(true, 8000)
      .catch((err: GeolocationPositionError) => (err.code === 3 ? ask(false, 7000) : Promise.reject(err)))
      .then(settle, fail)
  }

  const pick = (place: (typeof PLACES)[number]) => {
    onChange({
      place: place.name,
      clinic: place.clinic,
      distanceKm: null,
      bearing: null,
      lat: place.lat,
      lon: place.lon,
      source: 'manual',
    })
    setMode('idle')
    setFix(null)
  }

  /* A radiogroup owes the keyboard arrow navigation, not just tab stops. */
  const townKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + TOWNS.length) % TOWNS.length
    pick(TOWNS[next])
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.town')[next]?.focus()
  }

  /* The needle points at the facility. A hand-picked town has no bearing, so
     the card dims the needle rather than pretending it knows a direction. */
  const angle = value?.bearing ?? 0

  const locating = mode === 'locating'
  const coords = fix ? coordsOf(fix.lat, fix.lon) : null

  /* Everything except the needle and the searching sweep is fixed: the card is
     engraved once and never rebuilt on re-render. */
  const card = useMemo(
    () => (
      <g clipPath={`url(#${raw}-faceClip)`}>
        {/* anodised card, keyed from the upper left */}
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-face)`} />
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-sheen)`} />

        {/* turned finish: fine concentric machining marks */}
        {Array.from({ length: 96 }, (_, i) => {
          const r = 8 + i * 1.36
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

        {/* the window the glass is reflecting, low and broad over the north-west */}
        <ellipse
          cx={C - 38}
          cy={C - 50}
          rx="94"
          ry="50"
          fill="#ffffff"
          opacity="0.075"
          transform={`rotate(-26 ${C - 38} ${C - 50})`}
          filter={`url(#${raw}-blurMd)`}
        />
        <ellipse
          cx={C - 60}
          cy={C - 18}
          rx="38"
          ry="60"
          fill="#dff6ff"
          opacity="0.055"
          transform={`rotate(18 ${C - 60} ${C - 18})`}
          filter={`url(#${raw}-blurLg)`}
        />

        {/* the engraved rose: eight points, cardinal ones longest */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = i * 45
          const long = i % 2 === 0
          return (
            <path
              key={`rose${i}`}
              d={`M ${pt(a - 5.6, 15)} L ${pt(a, long ? 63 : 45)} L ${pt(a + 5.6, 15)} Z`}
              fill="none"
              stroke="#8fb6c8"
              strokeOpacity={long ? 0.18 : 0.11}
              strokeWidth="0.7"
            />
          )
        })}
        <circle cx={C} cy={C} r="63.6" fill="none" stroke="#000000" strokeOpacity="0.28" strokeWidth="0.8" />
        <circle cx={C} cy={C} r="64.4" fill="none" stroke="#a9cdde" strokeOpacity="0.05" strokeWidth="0.6" />

        {/* graduated ring: a groove every five degrees, a lit wall beside it */}
        {Array.from({ length: 72 }, (_, i) => {
          const a = i * 5
          const major = i % 9 === 0
          const mid = i % 3 === 0
          const r1 = major ? 113 : mid ? 119 : 125
          return (
            <g key={`t${i}`}>
              <line
                x1={at(a, r1)[0]}
                y1={at(a, r1)[1]}
                x2={at(a, 133)[0]}
                y2={at(a, 133)[1]}
                stroke="#000000"
                strokeOpacity="0.8"
                strokeWidth={major ? 2.2 : mid ? 1.4 : 1}
              />
              <line
                x1={at(a + 0.52, r1)[0]}
                y1={at(a + 0.52, r1)[1]}
                x2={at(a + 0.52, 133)[0]}
                y2={at(a + 0.52, 133)[1]}
                stroke={major ? '#a8cddd' : '#7ba2b5'}
                strokeOpacity={major ? 0.42 : 0.2}
                strokeWidth={major ? 0.9 : 0.55}
              />
            </g>
          )
        })}

        {/* degree numbers in the inner ring */}
        {[30, 60, 120, 150, 210, 240, 300, 330].map((v) => {
          const [x, y] = at(v, 84)
          return (
            <g key={`d${v}`}>
              <text
                x={x}
                y={y + 0.9}
                fill="#8fb6c8"
                fillOpacity="0.1"
                fontSize="8.6"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' }}
              >
                {String(v).padStart(3, '0')}
              </text>
              <text
                x={x}
                y={y}
                fill="#8fb3c5"
                fillOpacity="0.82"
                fontSize="8.6"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' }}
              >
                {String(v).padStart(3, '0')}
              </text>
            </g>
          )
        })}

        {/* cardinals, printed upright on the card */}
        {(
          [
            ['N', 0, 13.4],
            ['E', 90, 12],
            ['S', 180, 12],
            ['W', 270, 12],
          ] as const
        ).map(([letter, deg, size]) => {
          const [x, y] = at(deg, 105)
          return (
            <g key={letter}>
              <text
                x={x}
                y={y + 1.2}
                fill="#dff6ff"
                fillOpacity="0.14"
                fontSize={size}
                fontWeight="500"
                letterSpacing="0.6"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {letter}
              </text>
              <text
                x={x}
                y={y}
                fill={letter === 'N' ? '#d6ecf6' : '#93b8ca'}
                fillOpacity="0.92"
                fontSize={size}
                fontWeight="500"
                letterSpacing="0.6"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {letter}
              </text>
            </g>
          )
        })}
        {[
          ['NE', 45],
          ['SE', 135],
          ['SW', 225],
          ['NW', 315],
        ].map(([letter, deg]) => {
          const [x, y] = at(deg as number, 105)
          return (
            <text
              key={letter}
              x={x}
              y={y}
              fill="#7ea3b6"
              fillOpacity="0.46"
              fontSize="6.2"
              letterSpacing="0.5"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {letter}
            </text>
          )
        })}

        {/* printed hairlines and the crystal's soft lower edge */}
        <circle cx={C} cy={C} r="112" fill="none" stroke="#000000" strokeOpacity="0.34" strokeWidth="0.8" />
        <circle cx={C} cy={C} r="111.2" fill="none" stroke="#a9cdde" strokeOpacity="0.05" strokeWidth="0.6" />

        {/* dust caught under the glass */}
        <circle cx="130" cy="86" r="0.9" fill="#eafcff" opacity="0.18" />
        <circle cx="226" cy="126" r="0.7" fill="#eafcff" opacity="0.12" />
        <circle cx="156" cy="244" r="1" fill="#eafcff" opacity="0.09" />

        {/* grain whose luminance becomes alpha, so it speckles rather than washes */}
        <rect x="0" y="0" width="340" height="340" filter={`url(#${raw}-grain)`} opacity="0.45" style={{ mixBlendMode: 'soft-light' }} />
        <circle cx={C} cy={C} r={FACE} fill={`url(#${raw}-vignette)`} />
      </g>
    ),
    [raw],
  )

  return (
    <div className="loc">
      <div className="loc__row">
        <button
          type="button"
          className="compass"
          data-mode={mode}
          data-found={value ? 'true' : 'false'}
          data-manual={value && value.bearing === null ? 'true' : 'false'}
          onClick={detect}
          aria-label={value ? `Found ${value.place}. Use my location again` : 'Use my location'}
        >
          <div className="compass__spot" aria-hidden="true" />

          <svg viewBox="0 0 340 340" className="compass__svg" aria-hidden="true">
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
                <stop offset="0" stopColor="#374e61" />
                <stop offset="0.24" stopColor="#223748" />
                <stop offset="0.5" stopColor="#142635" />
                <stop offset="0.76" stopColor="#0a1721" />
                <stop offset="1" stopColor="#050b10" />
              </radialGradient>

              <linearGradient id={`${raw}-sheen`} x1="0.14" y1="0" x2="0.92" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="0.36" stopColor="#dff6ff" stopOpacity="0.035" />
                <stop offset="0.62" stopColor="#000000" stopOpacity="0.1" />
                <stop offset="1" stopColor="#000000" stopOpacity="0.34" />
              </linearGradient>

              <radialGradient id={`${raw}-vignette`} cx="50%" cy="50%" r="50%">
                <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
                <stop offset="0.86" stopColor="#000000" stopOpacity="0.24" />
                <stop offset="1" stopColor="#000000" stopOpacity="0.62" />
              </radialGradient>

              <linearGradient id={`${raw}-band`} x1="0" y1="0" x2="0.2" y2="1">
                <stop offset="0" stopColor="#eafcff" stopOpacity="0" />
                <stop offset="0.45" stopColor="#eafcff" stopOpacity="0.075" />
                <stop offset="1" stopColor="#eafcff" stopOpacity="0" />
              </linearGradient>

              {/* the needle: a lit north facet and a shadowed one sharing a ridge */}
              <linearGradient id={`${raw}-northHi`} x1="0" y1="0" x2="1" y2="0.2">
                <stop offset="0" stopColor="#f6feff" />
                <stop offset="0.42" stopColor="#cfeef9" />
                <stop offset="1" stopColor="#6f9dad" />
              </linearGradient>
              <linearGradient id={`${raw}-northLo`} x1="0" y1="0" x2="1" y2="0.2">
                <stop offset="0" stopColor="#a6cfde" />
                <stop offset="0.55" stopColor="#4d7789" />
                <stop offset="1" stopColor="#1c3038" />
              </linearGradient>
              <linearGradient id={`${raw}-south`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#4c6574" />
                <stop offset="0.5" stopColor="#213440" />
                <stop offset="1" stopColor="#0c161d" />
              </linearGradient>

              <radialGradient id={`${raw}-hub`} cx="0.3" cy="0.24" r="0.84">
                <stop offset="0" stopColor="#e2f3fa" />
                <stop offset="0.26" stopColor="#9db9c9" />
                <stop offset="0.56" stopColor="#3a5265" />
                <stop offset="0.82" stopColor="#162632" />
                <stop offset="1" stopColor="#0a131b" />
              </radialGradient>

              <radialGradient id={`${raw}-jewel`} cx="0.36" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#f4feff" />
                <stop offset="0.42" stopColor="#8df0fd" />
                <stop offset="0.78" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#0a6478" />
              </radialGradient>

              <linearGradient id={`${raw}-sweep`} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
                <stop offset="0.55" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="1" stopColor="#a5f3fc" stopOpacity="0.44" />
              </linearGradient>

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

              <filter id={`${raw}-grain`} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="23" />
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

            {/* shadow on the surface: a wide penumbra and a tight core */}
            <ellipse cx={C - 6} cy={C + 20} rx="152" ry="146" fill="#000000" opacity="0.5" filter={`url(#${raw}-blurLg)`} />
            <ellipse cx={C - 2} cy={C + 10} rx="128" ry="122" fill="#000000" opacity="0.42" filter={`url(#${raw}-blurSm)`} />

            {/* the case has height: a dark skirt under the lower edge */}
            <path
              d={`M ${at(150, 151)} A 151 151 0 0 1 ${at(30, 151)} L ${at(30, 156)} A 156 156 0 0 0 ${at(150, 156)} Z`}
              fill="#01050a"
              opacity="0.85"
            />

            {/* case: outer wall, chamfer, parting groove, inner wall */}
            <circle cx={C} cy={C} r={CASE} fill={`url(#${raw}-wall)`} />
            <circle cx={C} cy={C} r={CASE} fill="none" stroke="#d7f0fa" strokeOpacity="0.16" strokeWidth="0.9" />
            <circle cx={C} cy={C} r="149.4" fill="none" stroke={`url(#${raw}-bevel)`} strokeWidth="2.4" />
            {Array.from({ length: 7 }, (_, i) => (
              <circle key={`b${i}`} cx={C} cy={C} r={143 + i * 1.35} fill="none" stroke="#dff4ff" strokeOpacity="0.05" strokeWidth="0.4" />
            ))}
            <circle cx={C} cy={C} r="146.6" fill="none" stroke="#000000" strokeOpacity="0.6" strokeWidth="1.8" />
            <circle cx={C} cy={C} r="145.4" fill="none" stroke="#a5cbdd" strokeOpacity="0.07" strokeWidth="0.7" />
            <circle cx={C} cy={C} r="144.6" fill="#050a10" />
            <circle cx={C} cy={C} r="143" fill="none" stroke={`url(#${raw}-innerWall)`} strokeWidth="2.8" />

            {card}

            {/* the index mark at the top of the case */}
            <path d={`M ${C} 30.4 L ${C - 3.4} 22.6 L ${C + 3.4} 22.6 Z`} fill="#cfe8f5" opacity="0.42" />
            <path d={`M ${C} 30.4 L ${C - 3.4} 22.6 L ${C} 22.6 Z`} fill="#ffffff" opacity="0.35" />

            {/* searching: a radar wedge and expanding rings under the glass */}
            {locating && (
              <g clipPath={`url(#${raw}-faceClip)`}>
                <g className="compass__sweep">
                  <path d={`M ${C} ${C} L ${pt(-34, 148)} A 148 148 0 0 1 ${pt(34, 148)} Z`} fill={`url(#${raw}-sweep)`} />
                  <path d={`M ${C} ${C} L ${pt(34, 148)}`} stroke="#a5f3fc" strokeWidth="1.1" opacity="0.55" />
                </g>
                <circle cx={C} cy={C} r="72" fill="none" stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 7" className="compass__dash" />
                <circle cx={C} cy={C} r="44" fill="none" stroke="#22d3ee" strokeOpacity="0.18" strokeWidth="0.9" />
                <circle cx={C} cy={C} r="96" fill="none" stroke="#67e8f9" strokeOpacity="0.3" strokeWidth="1.1" className="compass__ping" />
              </g>
            )}

            {/* the needle, parked north until there is a bearing */}
            <g
              className="compass__needle"
              style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px` }}
            >
              <g opacity="0.6" filter={`url(#${raw}-blurSm)`} transform="translate(1.8 3)">
                <path d={`M ${C} ${C - 97} L ${C + 9.4} ${C} L ${C - 9.4} ${C} Z`} fill="#000000" />
                <path d={`M ${C} ${C + 56} L ${C + 8} ${C} L ${C - 8} ${C} Z`} fill="#000000" />
              </g>

              {/* the south half: shorter, darker, a counterweight */}
              <path d={`M ${C} ${C + 56} L ${C + 8} ${C} L ${C - 8} ${C} Z`} fill={`url(#${raw}-south)`} />
              <path d={`M ${C} ${C + 56} L ${C} ${C} L ${C - 8} ${C} Z`} fill="#000000" opacity="0.24" />
              <path d={`M ${C} ${C + 56} L ${C - 8} ${C}`} stroke="#9fc4d2" strokeOpacity="0.24" strokeWidth="0.6" />

              {/* the north half: two facets meeting on a lit ridge */}
              <path d={`M ${C} ${C - 97} L ${C + 9.4} ${C} L ${C} ${C} Z`} fill={`url(#${raw}-northLo)`} />
              <path d={`M ${C} ${C - 97} L ${C} ${C} L ${C - 9.4} ${C} Z`} fill={`url(#${raw}-northHi)`} />
              <path d={`M ${C} ${C - 97} L ${C} ${C - 4}`} stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.9" />
              <path d={`M ${C} ${C - 97} L ${C + 9.4} ${C}`} stroke="#000000" strokeOpacity="0.34" strokeWidth="0.7" />
              <path d={`M ${C} ${C - 97} L ${C} ${C + 56}`} stroke="#000000" strokeOpacity="0.18" strokeWidth="0.4" />
              <circle cx={C} cy={C - 85} r="1.2" fill="#ffffff" opacity="0.65" />
            </g>

            {/* pivot: a machined cap around a jewel */}
            <ellipse cx={C + 1.4} cy={C + 2.6} rx="11.6" ry="10.6" fill="#000000" opacity="0.55" filter={`url(#${raw}-blurSm)`} />
            <circle cx={C} cy={C} r="10.8" fill={`url(#${raw}-hub)`} />
            <circle cx={C} cy={C} r="10.8" fill="none" stroke="#000000" strokeOpacity="0.55" strokeWidth="0.9" />
            <circle cx={C} cy={C} r="7.9" fill="#050a10" stroke="#a9cdde" strokeOpacity="0.1" strokeWidth="0.7" />
            <circle cx={C} cy={C} r="8.6" fill="#22d3ee" opacity="0.22" filter={`url(#${raw}-glow)`} />
            <circle cx={C} cy={C} r="5" fill={`url(#${raw}-jewel)`} />
            <circle cx={C} cy={C} r="5" fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="0.6" />
            <circle cx={C - 1.5} cy={C - 1.7} r="1.5" fill="#ffffff" opacity="0.8" />
            {value && (
              <circle
                key={value.place}
                cx={C}
                cy={C}
                r="29"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="1.2"
                opacity="0.5"
                className="compass__ping"
              />
            )}

            {/* crystal over everything */}
            <g clipPath={`url(#${raw}-faceClip)`}>
              <rect x="26" y="52" width="288" height="34" fill={`url(#${raw}-band)`} opacity="0.65" />
              <path d={arcPath(276, 346, 128)} fill="none" stroke="#eafcff" strokeOpacity="0.16" strokeWidth="1.6" strokeLinecap="butt" />
              <path d={arcPath(196, 268, 96)} fill="none" stroke="#eafcff" strokeOpacity="0.1" strokeWidth="1.2" strokeLinecap="butt" />
              <ellipse cx={C - 34} cy={C - 62} rx="62" ry="26" fill="#ffffff" opacity="0.07" transform={`rotate(-24 ${C - 34} ${C - 62})`} filter={`url(#${raw}-blurMd)`} />
            </g>
            <circle cx={C} cy={C} r={FACE - 0.6} fill="none" stroke="#dff6ff" strokeOpacity="0.1" strokeWidth="1" />
            <circle cx={C} cy={C} r={FACE - 2.6} fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="0.8" />

            {/* polished catches on the case, lit from the upper left */}
            <path d={arcPath(274, 358, 149.4)} fill="none" stroke="#eafdff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            <path d={arcPath(78, 142, 150.4)} fill="none" stroke="#a9d2e4" strokeOpacity="0.12" strokeWidth="1.2" strokeLinecap="round" />
            <path d={arcPath(184, 238, 151.2)} fill="none" stroke="#ffd9a8" strokeOpacity="0.13" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <span className="compass__cta" aria-hidden="true">
            <IconTarget size={15} />
          </span>
        </button>

        <div className="loc__read" aria-live="polite">
          {value ? (
            <>
              <p className="loc__place" key={value.place}>
                {value.place}
              </p>
              <p className="loc__clinic">
                <span className="loc__clinic-pip" aria-hidden="true" />
                {value.clinic}
              </p>
              <p className="loc__meta">
                {value.distanceKm !== null ? (
                  <>
                    <span className="loc__dist">≈ {value.distanceKm} km</span>
                    <span className="loc__bearing">{compassOf(value.bearing ?? 0)}</span>
                  </>
                ) : (
                  <span className="loc__dist">chosen by hand</span>
                )}
              </p>
              {mode !== 'idle' && mode !== 'locating' && <p className="loc__note">{COPY[mode].title}</p>}
            </>
          ) : (
            <>
              <p className="loc__place loc__place--empty">
                {mode === 'idle' ? 'Tap the compass' : COPY[mode].title}
              </p>
              <p className="loc__hint">{mode === 'idle' ? "We'll find your nearest clinic" : COPY[mode].hint}</p>
              {mode === 'outside' && coords && <p className="loc__coords">{coords}</p>}
            </>
          )}
        </div>
      </div>

      <div className="towns" role="radiogroup" aria-label="Nearest town">
        {TOWNS.map((place, i) => {
          const selected = value?.place === place.name
          return (
            <button
              key={place.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || !value ? 0 : -1}
              className="town"
              data-selected={selected}
              onClick={() => pick(place)}
              onKeyDown={(e) => townKey(e, i)}
            >
              <span className="town__pip" aria-hidden="true" />
              {place.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
