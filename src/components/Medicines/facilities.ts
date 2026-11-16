/* ============================================================
   Nearby facilities.
   The first entry is the clinic C1's compass already named, at the
   distance and bearing the fix gave — so the map agrees with the
   needle. The rest are the tier above it (taluk, district, mission),
   placed deterministically around the same point so a given village
   always sees the same little network.

   NOT a live facility register: a demo set built from the district
   gazetteer. Swap `facilitiesFor` for a real feed (data.gov.in health
   directory or OSM `amenity=hospital`) and the map, list and ticket
   keep working unchanged.
   ============================================================ */

import { haversineKm, PLACES } from '../Intake/places'
import type { IntakeLocation } from '../Intake/types'
import { destPoint } from './mapMath'

export type FacilityKind = 'phc' | 'chc' | 'district' | 'private'

export interface Facility {
  id: string
  name: string
  kind: FacilityKind
  lat: number
  lon: number
  km: number
  /** Rough road time, minutes. */
  minutes: number
  services: string[]
}

export const KIND_LABEL: Record<FacilityKind, string> = {
  phc: 'Primary health centre',
  chc: 'Community health centre',
  district: 'District hospital',
  private: 'Private hospital',
}

const SERVICES: Record<FacilityKind, string[]> = {
  phc: ['OPD 9–5', 'Delivery'],
  chc: ['24 h', 'X-ray'],
  district: ['24 h', 'Blood bank'],
  private: ['OPD', 'Lab'],
}

/* FNV-1a: the same village always gets the same layout. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export const serialOf = (seed: string): string => String((hash(seed) % 900) + 100)

/** The map, the list and every distance hang off this point. */
export function centerOf(location: IntakeLocation | null): { lat: number; lon: number; place: string } {
  if (location?.lat != null && location.lon != null) {
    return { lat: location.lat, lon: location.lon, place: location.place }
  }
  const base = PLACES.find((p) => p.name === location?.place) ?? PLACES[0]
  return { lat: base.lat, lon: base.lon, place: base.name }
}

const facilityAt = (
  center: { lat: number; lon: number },
  id: string,
  name: string,
  kind: FacilityKind,
  bearing: number,
  km: number,
): Facility => {
  const at = destPoint(center.lat, center.lon, bearing, km)
  const real = haversineKm(center.lat, center.lon, at.lat, at.lon)
  return {
    id,
    name,
    kind,
    lat: at.lat,
    lon: at.lon,
    km: Math.max(1, Math.round(real)),
    minutes: Math.max(4, Math.round(real * 3.2)),
    services: SERVICES[kind],
  }
}

/* Smallest angle between two bearings, 0–180. */
const gap = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180)

/* Pins are big; two doors on the same bearing read as one. Walk a wanted
   bearing round the dial until it clears everything already placed — still
   deterministic, so a village keeps the same little map. */
function spread(wish: number, used: number[], min = 38): number {
  let b = ((wish % 360) + 360) % 360
  for (let i = 0; i < 10 && used.some((u) => gap(u, b) < min); i++) b = (b + min) % 360
  used.push(b)
  return b
}

export function facilitiesFor(location: IntakeLocation | null): Facility[] {
  const center = centerOf(location)
  const place = center.place
  const seed = hash(place) % 360

  const clinic = location?.clinic ?? `PHC ${place} Rural`
  const firstKind: FacilityKind = clinic.startsWith('CHC') ? 'chc' : 'phc'
  const firstKm = location?.distanceKm ?? 6
  const firstBearing = location?.bearing ?? 40

  const used: number[] = [firstBearing]
  const list = [
    facilityAt(center, 'closest', clinic, firstKind, firstBearing, firstKm),
    facilityAt(center, 'taluk', `Taluk Hospital ${place}`, 'chc', spread(seed + 118, used), 12 + (hash(place + 't') % 40) / 10),
    facilityAt(center, 'district', `${place} District Hospital`, 'district', spread(seed + 214, used), 19 + (hash(place + 'd') % 60) / 10),
    facilityAt(center, 'mission', `${place} Mission Hospital`, 'private', spread(seed + 296, used), 8 + (hash(place + 'm') % 30) / 10),
  ]

  return list.sort((a, b) => a.km - b.km)
}
