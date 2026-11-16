import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fitPoints, metresPerPixel, project, scaleBar, TILE } from './mapMath'
import type { Facility } from './facilities'

const ZOOM_MIN = 8
const ZOOM_MAX = 13
const TILE_URL = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

interface Rect {
  w: number
  h: number
}

/* A survey plate: OpenStreetMap tiles under a dark chart wash, pins in the
   same cut-stone language as the rail, and a route drawn from where you are
   standing to the door you picked. Tiles are only the ground — every label
   that matters is ours, drawn on top. */
export function Atlas({
  center,
  place,
  facilities,
  activeId,
  onPick,
}: {
  center: { lat: number; lon: number }
  place: string
  facilities: Facility[]
  activeId: string | null
  onPick: (id: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const errors = useRef(0)

  const [size, setSize] = useState<Rect>({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(10)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [offline, setOffline] = useState(false)

  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* A new village (or a resized plate) reframes the map around the whole little
     network; browsing afterwards stays where the patient left it. */
  useEffect(() => {
    if (!size.w || !size.h) return
    const fit = fitPoints(center, facilities, size.w, size.h, { min: ZOOM_MIN, max: ZOOM_MAX })
    setZoom(fit.zoom)
    setPan(fit.pan)
  }, [center, facilities, size.w, size.h])

  const here = project(center.lat, center.lon, zoom)
  const topLeft = { x: here.x - size.w / 2 + pan.x, y: here.y - size.h / 2 + pan.y }

  const at = (lat: number, lon: number) => {
    const p = project(lat, lon, zoom)
    return { x: p.x - topLeft.x, y: p.y - topLeft.y }
  }

  const you = { x: here.x - topLeft.x, y: here.y - topLeft.y }
  const active = facilities.find((f) => f.id === activeId) ?? null
  const activeAt = active ? at(active.lat, active.lon) : null

  const scale = scaleBar(metresPerPixel(center.lat, zoom))

  const tiles = useMemo(() => {
    if (!size.w || !size.h) return []
    const n = 2 ** zoom
    const x0 = Math.floor(topLeft.x / TILE)
    const x1 = Math.floor((topLeft.x + size.w) / TILE)
    const y0 = Math.max(0, Math.floor(topLeft.y / TILE))
    const y1 = Math.min(n - 1, Math.floor((topLeft.y + size.h) / TILE))
    const out: { key: string; x: number; y: number; z: number; tx: number; ty: number }[] = []
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        out.push({
          key: `${zoom}/${tx}/${ty}`,
          x: ((tx % n) + n) % n,
          y: ty,
          z: zoom,
          tx: tx * TILE - topLeft.x,
          ty: ty * TILE - topLeft.y,
        })
      }
    }
    return out
  }, [zoom, size.w, size.h, topLeft.x, topLeft.y])

  const zoomTo = (next: number) => setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next)))

  const dragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.atlas__btn, .atlas__pin')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
  }

  const dragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
  }

  const dragEnd = () => {
    drag.current = null
  }

  const key = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 160 : 64
    const map: Record<string, [number, number]> = {
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
    }
    if (e.key in map) {
      e.preventDefault()
      setPan((p) => ({ x: p.x + map[e.key][0], y: p.y + map[e.key][1] }))
      return
    }
    if (e.key === '+' || e.key === '=') return zoomTo(zoom + 1)
    if (e.key === '-' || e.key === '_') return zoomTo(zoom - 1)
    if (e.key === 'Home') setPan({ x: 0, y: 0 })
  }

  const bend = activeAt
    ? (() => {
        const dx = activeAt.x - you.x
        const dy = activeAt.y - you.y
        const len = Math.hypot(dx, dy) || 1
        const b = Math.min(54, len * 0.16)
        return { mx: (you.x + activeAt.x) / 2 - (dy / len) * b, my: (you.y + activeAt.y) / 2 + (dx / len) * b }
      })()
    : null

  return (
    <div className="atlas" data-offline={offline}>
      <div className="atlas__frame">
        <span className="atlas__screw atlas__screw--tl" aria-hidden="true" />
        <span className="atlas__screw atlas__screw--tr" aria-hidden="true" />
        <span className="atlas__screw atlas__screw--bl" aria-hidden="true" />
        <span className="atlas__screw atlas__screw--br" aria-hidden="true" />

        <div
          ref={host}
          className="atlas__glass"
          role="group"
          aria-label={`Map of hospitals near ${place}`}
          tabIndex={0}
          onPointerDown={dragStart}
          onPointerMove={dragMove}
          onPointerUp={dragEnd}
          onPointerCancel={dragEnd}
          onKeyDown={key}
        >
          <div className="atlas__tiles">
            {tiles.map((t) => (
              <img
                key={t.key}
                src={TILE_URL(t.z, t.x, t.y)}
                alt=""
                width={TILE}
                height={TILE}
                draggable={false}
                style={{ left: `${t.tx}px`, top: `${t.ty}px` }}
                onError={() => {
                  errors.current += 1
                  if (errors.current >= 3) setOffline(true)
                }}
              />
            ))}
          </div>

          {offline && (
            <svg className="atlas__survey" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <g className="atlas__contour">
                <path d="M40 300c40-70 120-90 190-60s120 40 190 0 130-60 150-10" />
                <path d="M20 260c50-80 140-100 215-68s115 44 185 6 120-56 148-12" />
                <path d="M0 220c60-92 160-110 240-76s110 48 180 12 110-52 150-20" />
                <path d="M-20 180c70-100 180-120 265-84s105 50 175 16 105-46 160-26" />
              </g>
              <path className="atlas__river" d="M20 40c90 30 120 90 200 110s150 10 220 60 90 70 150 90" />
              <path className="atlas__road" d="M-10 210 160 170 330 190 470 140 610 150" />
              <path className="atlas__road" d="M120 380 170 240 210 120 190 0" />
              <g className="atlas__grid">
                {Array.from({ length: 7 }, (_, i) => (
                  <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="360" />
                ))}
                {Array.from({ length: 5 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 90} x2="600" y2={i * 90} />
                ))}
              </g>
            </svg>
          )}

          <span className="atlas__tint" aria-hidden="true" />
          <span className="atlas__shade" aria-hidden="true" />

          <svg className="atlas__ink" width={size.w} height={size.h} aria-hidden="true">
            {activeAt && bend && (
              <path
                className="atlas__route"
                d={`M ${you.x} ${you.y} Q ${bend.mx} ${bend.my} ${activeAt.x} ${activeAt.y}`}
              />
            )}
          </svg>

          <span className="atlas__you" style={{ left: `${you.x}px`, top: `${you.y}px` }} aria-hidden="true">
            <span className="atlas__you-pulse" />
            <span className="atlas__you-ring" />
            <span className="atlas__you-dot" />
            <span className="atlas__you-tag">You</span>
          </span>

          {size.w > 0 &&
            facilities.map((f, i) => {
              const p = at(f.lat, f.lon)
              const on = f.id === activeId
              /* A tag below a bottom-edge pin would leave the glass; a tag
                 above it can land on the "you" marker. Put it beside. */
              const side = p.y > size.h - 82 ? (p.x > size.w / 2 ? 'left' : 'right') : 'bottom'
              return (
                <button
                  key={f.id}
                  type="button"
                  className="atlas__pin"
                  data-active={on}
                  style={{ left: `${p.x}px`, top: `${p.y}px` }}
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => onPick(f.id)}
                >
                  <span className="atlas__pin-gem">
                    <span className="atlas__pin-num">{i + 1}</span>
                  </span>
                  {on && (
                    <span
                      className="atlas__pin-tag"
                      data-side={side}
                      style={
                        side === 'bottom'
                          ? undefined
                          : { maxWidth: Math.max(104, (side === 'left' ? p.x : size.w - p.x) - 34) }
                      }
                    >
                      {f.name}
                      <span className="atlas__pin-km"> · {f.km} km</span>
                    </span>
                  )}
                </button>
              )
            })}

          <div className="atlas__chrome">
            <span className="atlas__scale" aria-hidden="true">
              <span className="atlas__scale-bar" style={{ width: `${Math.round(scale.px)}px` }} />
              <span className="atlas__scale-label">{scale.label}</span>
            </span>
          </div>

          <div className="atlas__tools">
            <button
              type="button"
              className="atlas__btn"
              aria-label="Zoom in"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => zoomTo(zoom + 1)}
            >
              +
            </button>
            <button
              type="button"
              className="atlas__btn"
              aria-label="Zoom out"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => zoomTo(zoom - 1)}
            >
              −
            </button>
            <button
              type="button"
              className="atlas__btn atlas__btn--home"
              aria-label="Centre on my location"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPan({ x: 0, y: 0 })}
            >
              <span className="atlas__dot" aria-hidden="true" />
            </button>
          </div>

          {!offline && (
            <a
              className="atlas__attr"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
            >
              © OpenStreetMap
            </a>
          )}

          <span className="atlas__plate" aria-hidden="true">
            {place}
          </span>
        </div>
      </div>
    </div>
  )
}
