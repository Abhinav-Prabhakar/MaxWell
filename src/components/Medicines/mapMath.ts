/* ============================================================
   Slippy-map arithmetic, without a map library: Web Mercator,
   tile addressing, and the two extra helpers a "nearby" plate
   needs — a point at a bearing and a scale bar.
   ============================================================ */

export const TILE = 256

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const EARTH_M = 6371 // km

export const worldSize = (z: number) => TILE * 2 ** z

/** Lon/lat → world pixels at zoom z. */
export function project(lat: number, lon: number, z: number): { x: number; y: number } {
  const s = worldSize(z)
  const x = ((lon + 180) / 360) * s
  const sin = Math.sin(lat * D2R)
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s
  return { x, y }
}

export function unproject(x: number, y: number, z: number): { lat: number; lon: number } {
  const s = worldSize(z)
  const lon = (x / s) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / s
  return { lat: Math.atan(Math.sinh(n)) * R2D, lon }
}

/** Ground metres covered by one screen pixel. */
export const metresPerPixel = (lat: number, z: number) => (156543.03392 * Math.cos(lat * D2R)) / 2 ** z

/** The closest integer zoom at which every point, plus the anchor, fits on the
    plate — and the pan that centres that little network. Pins never clip. */
export function fitPoints(
  anchor: { lat: number; lon: number },
  points: { lat: number; lon: number }[],
  w: number,
  h: number,
  opts: { min?: number; max?: number; pad?: number } = {},
): { zoom: number; pan: { x: number; y: number } } {
  const { min = 8, max = 13, pad = 30 } = opts
  if (!w || !h) return { zoom: 10, pan: { x: 0, y: 0 } }

  for (let z = max; z >= min; z--) {
    const a = project(anchor.lat, anchor.lon, z)
    const ps = points.map((p) => project(p.lat, p.lon, z))
    const xs = [...ps.map((p) => p.x), a.x]
    const ys = [...ps.map((p) => p.y), a.y]
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const y0 = Math.min(...ys)
    const y1 = Math.max(...ys)
    if (x1 - x0 <= w - pad * 2 && y1 - y0 <= h - pad * 2) {
      return { zoom: z, pan: { x: (x0 + x1) / 2 - a.x, y: (y0 + y1) / 2 - a.y } }
    }
  }

  return { zoom: min, pan: { x: 0, y: 0 } }
}

/** Where you end up walking `km` from a point on a given bearing. */
export function destPoint(lat: number, lon: number, bearing: number, km: number): { lat: number; lon: number } {
  const d = km / EARTH_M
  const t = bearing * D2R
  const p1 = lat * D2R
  const l1 = lon * D2R
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t))
  const l2 =
    l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2))
  return { lat: p2 * R2D, lon: l2 * R2D }
}

/** A round number of metres that fits, and the pixels it needs. */
export function scaleBar(mpp: number, maxPx = 104): { px: number; label: string } {
  const metres = Math.max(1, mpp * maxPx)
  const pow = 10 ** Math.floor(Math.log10(metres))
  const step = [5, 2, 1].map((m) => m * pow).find((v) => v <= metres) ?? pow
  const label = step >= 1000 ? `${Math.round(step / 100) / 10} km` : `${Math.round(step)} m`
  return { px: step / mpp, label }
}
