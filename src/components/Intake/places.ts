export interface Place {
  id: string
  name: string
  clinic: string
  lat: number
  lon: number
  /** One of the hospital's own catchment towns, offered for manual choice. */
  home?: boolean
}

/* An offline gazetteer of Karnataka district centres and the facility each one
   drains to. Enough to name where someone is from coarse coordinates without
   calling out to a geocoder — and wide enough that a real device fix almost
   always lands inside it. */
export const PLACES: Place[] = [
  { id: 'kolar', name: 'Kolar', clinic: 'PHC Kolar Rural', lat: 13.136, lon: 78.133, home: true },
  { id: 'chikkaballapur', name: 'Chikkaballapur', clinic: 'PHC Chikkaballapur', lat: 13.436, lon: 77.728, home: true },
  { id: 'tumkur', name: 'Tumkur', clinic: 'PHC Tumkur North', lat: 13.339, lon: 77.114, home: true },
  { id: 'ramanagara', name: 'Ramanagara', clinic: 'CHC Ramanagara', lat: 12.723, lon: 77.281, home: true },
  { id: 'mandya', name: 'Mandya', clinic: 'PHC Mandya East', lat: 12.522, lon: 76.895, home: true },
  { id: 'hassan', name: 'Hassan', clinic: 'CHC Hassan Rural', lat: 13.007, lon: 76.096, home: true },
  { id: 'mysuru', name: 'Mysuru', clinic: 'CHC Mysuru South', lat: 12.295, lon: 76.639, home: true },
  { id: 'devanahalli', name: 'Devanahalli', clinic: 'PHC Devanahalli', lat: 13.243, lon: 77.712, home: true },

  /* the rest of the state, so a device fix is never mistaken for "no location" */
  { id: 'bengaluru', name: 'Bengaluru', clinic: 'CHC Bengaluru East', lat: 12.972, lon: 77.594 },
  { id: 'bagalkot', name: 'Bagalkot', clinic: 'PHC Bagalkot', lat: 16.182, lon: 75.696 },
  { id: 'ballari', name: 'Ballari', clinic: 'CHC Ballari', lat: 15.139, lon: 76.921 },
  { id: 'belagavi', name: 'Belagavi', clinic: 'CHC Belagavi', lat: 15.849, lon: 74.498 },
  { id: 'bidar', name: 'Bidar', clinic: 'PHC Bidar', lat: 17.911, lon: 77.530 },
  { id: 'chamarajanagar', name: 'Chamarajanagar', clinic: 'PHC Chamarajanagar', lat: 11.926, lon: 76.943 },
  { id: 'chikkamagaluru', name: 'Chikkamagaluru', clinic: 'PHC Chikkamagaluru', lat: 13.316, lon: 75.772 },
  { id: 'chitradurga', name: 'Chitradurga', clinic: 'CHC Chitradurga', lat: 14.226, lon: 76.398 },
  { id: 'mangaluru', name: 'Mangaluru', clinic: 'CHC Dakshina Kannada', lat: 12.914, lon: 74.856 },
  { id: 'davanagere', name: 'Davanagere', clinic: 'CHC Davanagere', lat: 14.464, lon: 75.921 },
  { id: 'dharwad', name: 'Dharwad', clinic: 'CHC Dharwad', lat: 15.458, lon: 75.008 },
  { id: 'gadag', name: 'Gadag', clinic: 'PHC Gadag', lat: 15.432, lon: 75.632 },
  { id: 'haveri', name: 'Haveri', clinic: 'PHC Haveri', lat: 14.794, lon: 75.404 },
  { id: 'kalaburagi', name: 'Kalaburagi', clinic: 'CHC Kalaburagi', lat: 17.329, lon: 76.834 },
  { id: 'madikeri', name: 'Madikeri', clinic: 'PHC Kodagu', lat: 12.424, lon: 75.738 },
  { id: 'koppal', name: 'Koppal', clinic: 'PHC Koppal', lat: 15.351, lon: 76.155 },
  { id: 'raichur', name: 'Raichur', clinic: 'CHC Raichur', lat: 16.207, lon: 77.356 },
  { id: 'shivamogga', name: 'Shivamogga', clinic: 'CHC Shivamogga', lat: 13.930, lon: 75.568 },
  { id: 'udupi', name: 'Udupi', clinic: 'CHC Udupi', lat: 13.341, lon: 74.742 },
  { id: 'karwar', name: 'Karwar', clinic: 'PHC Uttara Kannada', lat: 14.813, lon: 74.130 },
  { id: 'vijayapura', name: 'Vijayapura', clinic: 'CHC Vijayapura', lat: 16.830, lon: 75.710 },
  { id: 'yadgir', name: 'Yadgir', clinic: 'PHC Yadgir', lat: 16.770, lon: 77.138 },
  { id: 'hosapete', name: 'Hosapete', clinic: 'PHC Vijayanagara', lat: 15.269, lon: 76.387 },
]

/** The towns offered when someone would rather pick than be found. */
export const TOWNS: Place[] = PLACES.filter((p) => p.home)

/* A fix further than this from every district centre is not a Karnataka
   address: say so plainly instead of pretending it is one of ours. */
export const NETWORK_KM = 300

const R = 6371

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Degrees clockwise from north, from a to b. */
export function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLon = toRad(bLon - aLon)
  const y = Math.sin(dLon) * Math.cos(toRad(bLat))
  const x =
    Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) -
    Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(dLon)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  return (deg + 360) % 360
}

export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export const compassOf = (bearing: number) => COMPASS[Math.round(bearing / 45) % 8]

export interface Nearest {
  place: Place
  km: number
  bearing: number
}

/** Closest district centre to a fix — our stand-in for a reverse geocoder. */
export function nearestPlace(lat: number, lon: number): Nearest {
  let best: Nearest | null = null
  for (const place of PLACES) {
    const km = haversineKm(lat, lon, place.lat, place.lon)
    if (!best || km < best.km) {
      best = { place, km, bearing: bearingDeg(lat, lon, place.lat, place.lon) }
    }
  }
  return best as Nearest
}

/** `13.05° N · 78.16° E`, for when we have a fix but no district to name. */
export function coordsOf(lat: number, lon: number): string {
  const ns = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`
  const ew = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`
  return `${ns} · ${ew}`
}
