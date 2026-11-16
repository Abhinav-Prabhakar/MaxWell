/* ============================================================
   A small QR encoder — byte mode, error correction L, versions
   1–5, one Reed–Solomon block. Enough to print a real, scannable
   code on the handoff sheet without pulling a dependency in.

   The sheet's payload is a compact ASCII line (serial, place,
   readings, medicines, return date), so versions above five are
   never needed; if one were, `fitVersion` would throw rather than
   print a code that lies.
   ============================================================ */

interface QrVersion {
  version: number
  size: number
  /** Data codewords. */
  data: number
  /** Error-correction codewords. */
  ecc: number
}

const VERSIONS: QrVersion[] = [
  { version: 1, size: 21, data: 19, ecc: 7 },
  { version: 2, size: 25, data: 34, ecc: 10 },
  { version: 3, size: 29, data: 55, ecc: 15 },
  { version: 4, size: 33, data: 80, ecc: 20 },
  { version: 5, size: 37, data: 108, ecc: 26 },
]

const ALIGN: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
}

/* ------------------------------------------------------------ GF(256) */

const gfMul = (a: number, b: number): number => {
  let r = 0
  for (let i = 0; i < 8; i++) {
    if (b & 1) r ^= a
    const hi = a & 0x80
    a = (a << 1) & 0xff
    if (hi) a ^= 0x1d
    b >>= 1
  }
  return r
}

const gfPow = (a: number, n: number): number => {
  let r = 1
  for (let i = 0; i < n; i++) r = gfMul(r, a)
  return r
}

/** Generator polynomial for `degree` error-correction codewords. */
function rsGenerator(degree: number): number[] {
  let gen = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]
      next[j + 1] ^= gfMul(gen[j], gfPow(2, i))
    }
    gen = next
  }
  return gen
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = rsGenerator(degree)
  const rem = new Array<number>(degree).fill(0)
  for (const byte of data) {
    const factor = byte ^ rem[0]
    rem.shift()
    rem.push(0)
    for (let i = 0; i < degree; i++) rem[i] ^= gfMul(gen[i + 1], factor)
  }
  return rem
}

/* ------------------------------------------------------------ bits */

function pushBits(out: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i--) out.push((value >> i) & 1)
}

function fitVersion(byteLength: number): QrVersion {
  const v = VERSIONS.find((entry) => byteLength <= entry.data - 2)
  if (!v) throw new Error('QR payload too long for version 5')
  return v
}

function dataCodewords(bytes: Uint8Array, capacity: number): number[] {
  const bits: number[] = []
  pushBits(bits, 0b0100, 4) // byte mode
  pushBits(bits, bytes.length, 8) // versions 1–9 use an 8-bit count
  for (const byte of bytes) pushBits(bits, byte, 8)

  for (let i = 0; i < 4 && bits.length < capacity * 8; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  const words: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    words.push(byte)
  }

  const pads = [0xec, 0x11]
  for (let i = 0; words.length < capacity; i++) words.push(pads[i % 2])
  return words
}

/* ------------------------------------------------------------ matrix */

interface Grid {
  size: number
  cells: boolean[][]
  fn: boolean[][]
}

const blank = (size: number): Grid => ({
  size,
  cells: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  fn: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
})

const put = (g: Grid, x: number, y: number, dark: boolean): void => {
  if (x < 0 || y < 0 || x >= g.size || y >= g.size) return
  g.cells[y][x] = dark
  g.fn[y][x] = true
}

function drawFinder(g: Grid, cx: number, cy: number): void {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
      const dark =
        inside &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
      put(g, cx + dx, cy + dy, dark)
    }
  }
}

function drawTiming(g: Grid): void {
  for (let i = 8; i < g.size - 8; i++) {
    put(g, i, 6, i % 2 === 0)
    put(g, 6, i, i % 2 === 0)
  }
}

function drawAlignment(g: Grid, version: number): void {
  const centers = ALIGN[version]
  const last = g.size - 7
  for (const cy of centers) {
    for (const cx of centers) {
      if ((cx === 6 && cy === 6) || (cx === 6 && cy === last) || (cx === last && cy === 6)) continue
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          put(g, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    }
  }
}

/** Reserve the two format strips and the always-dark module. */
function reserveFormat(g: Grid): void {
  for (let i = 0; i <= 8; i++) {
    if (i === 6) continue // timing row / column
    put(g, 8, i, false)
    put(g, i, 8, false)
  }
  for (let i = 0; i < 8; i++) put(g, g.size - 1 - i, 8, false)
  for (let i = 8; i < 15; i++) put(g, 8, g.size - 15 + i, false)
  put(g, 8, g.size - 8, true)
}

function formatBits(mask: number): number {
  const data = (0b01 << 3) | mask // EC level L = 01
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return (((data << 10) | rem) ^ 0x5412) & 0x7fff
}

function drawFormat(g: Grid, mask: number): void {
  const bits = formatBits(mask)
  const bit = (i: number) => ((bits >> i) & 1) === 1

  for (let i = 0; i <= 5; i++) put(g, 8, i, bit(i))
  put(g, 8, 7, bit(6))
  put(g, 8, 8, bit(7))
  put(g, 7, 8, bit(8))
  for (let i = 9; i < 15; i++) put(g, 14 - i, 8, bit(i))

  for (let i = 0; i < 8; i++) put(g, g.size - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) put(g, 8, g.size - 15 + i, bit(i))
  put(g, 8, g.size - 8, true)
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function placeData(g: Grid, bits: number[]): void {
  let index = 0
  let upward = true
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5 // skip the vertical timing column
    for (let step = 0; step < g.size; step++) {
      const y = upward ? g.size - 1 - step : step
      for (let j = 0; j < 2; j++) {
        const x = right - j
        if (g.fn[y][x]) continue
        g.cells[y][x] = index < bits.length ? bits[index] === 1 : false
        index++
      }
    }
    upward = !upward
  }
}

function applyMask(g: Grid, mask: number): void {
  const fn = MASKS[mask]
  for (let y = 0; y < g.size; y++) {
    for (let x = 0; x < g.size; x++) {
      if (!g.fn[y][x] && fn(x, y)) g.cells[y][x] = !g.cells[y][x]
    }
  }
}

/* ------------------------------------------------------------ penalty */

function penalty(cells: boolean[][]): number {
  const size = cells.length
  let score = 0

  for (let i = 0; i < size; i++) {
    let rowRun = 1
    let colRun = 1
    for (let j = 1; j < size; j++) {
      if (cells[i][j] === cells[i][j - 1]) rowRun++
      else {
        if (rowRun >= 5) score += 3 + (rowRun - 5)
        rowRun = 1
      }
      if (cells[j][i] === cells[j - 1][i]) colRun++
      else {
        if (colRun >= 5) score += 3 + (colRun - 5)
        colRun = 1
      }
    }
    if (rowRun >= 5) score += 3 + (rowRun - 5)
    if (colRun >= 5) score += 3 + (colRun - 5)
  }

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = cells[y][x]
      if (c === cells[y][x + 1] && c === cells[y + 1][x] && c === cells[y + 1][x + 1]) score += 3
    }
  }

  const patterns = ['10111010000', '00001011101']
  for (let i = 0; i < size; i++) {
    let row = ''
    let col = ''
    for (let j = 0; j < size; j++) {
      row += cells[i][j] ? '1' : '0'
      col += cells[j][i] ? '1' : '0'
    }
    for (const p of patterns) {
      let at = row.indexOf(p)
      while (at !== -1) {
        score += 40
        at = row.indexOf(p, at + 1)
      }
      at = col.indexOf(p)
      while (at !== -1) {
        score += 40
        at = col.indexOf(p, at + 1)
      }
    }
  }

  let dark = 0
  for (const row of cells) for (const cell of row) if (cell) dark++
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10
  return score
}

/* ------------------------------------------------------------ public */

function render(bytes: Uint8Array, version: QrVersion, mask: number): boolean[][] {
  const g = blank(version.size)
  drawFinder(g, 0, 0)
  drawFinder(g, g.size - 7, 0)
  drawFinder(g, 0, g.size - 7)
  drawTiming(g)
  drawAlignment(g, version.version)
  reserveFormat(g)

  const data = dataCodewords(bytes, version.data)
  const ecc = rsRemainder(data, version.ecc)
  const bits: number[] = []
  for (const word of [...data, ...ecc]) pushBits(bits, word, 8)

  placeData(g, bits)
  applyMask(g, mask)
  drawFormat(g, mask)
  return g.cells
}

/** A real QR matrix (true = dark). Quiet zone is the caller's job. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text)
  const version = fitVersion(bytes.length)

  let best: boolean[][] | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const cells = render(bytes, version, mask)
    const score = penalty(cells)
    if (score < bestScore) {
      best = cells
      bestScore = score
    }
  }
  return best!
}
