/* ============================================================
   C3 · Vitals — four readings off the trolley. Every one can be
   marked "not taken": a rural clinic may have no working cuff or
   oximeter, and a made-up number is worse than a gap.
   ============================================================ */

export type VitalKey = 'temp' | 'pulse' | 'pressure' | 'oxygen'

export const TEMP_MIN = 35
export const TEMP_MAX = 42
export const PULSE_MIN = 40
export const PULSE_MAX = 180
export const SYS_MIN = 70
export const SYS_MAX = 220
export const DIA_MIN = 40
export const DIA_MAX = 140
export const SPO2_MIN = 70
export const SPO2_MAX = 100

export interface VitalsAnswers {
  /** Degrees Celsius, one decimal. */
  temp: number | null
  /** Beats per minute. */
  pulse: number | null
  systolic: number | null
  diastolic: number | null
  /** Percent. */
  spo2: number | null
  /** Questions the clinic could not measure. */
  skipped: VitalKey[]
}

export const EMPTY_VITALS: VitalsAnswers = {
  temp: null,
  pulse: null,
  systolic: null,
  diastolic: null,
  spo2: null,
  skipped: [],
}

export const VITAL_QUESTIONS: { key: VitalKey; question: string; hint: string }[] = [
  {
    key: 'temp',
    question: 'What did the thermometer say?',
    hint: 'Drag the reader along the tube to the reading in degrees Celsius.',
  },
  {
    key: 'pulse',
    question: 'How fast is the pulse?',
    hint: 'Drag the fader until the beats match the monitor.',
  },
  {
    key: 'pressure',
    question: 'What does the cuff read?',
    hint: 'Set the upper number, then the lower one. Drag each bead.',
  },
  {
    key: 'oxygen',
    question: 'And the oxygen level?',
    hint: 'Drag the fill to the percentage on the oximeter.',
  },
]

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function setTemp(a: VitalsAnswers, v: number): VitalsAnswers {
  return { ...a, temp: clamp(Math.round(v * 10) / 10, TEMP_MIN, TEMP_MAX), skipped: a.skipped.filter((k) => k !== 'temp') }
}

export function setPulse(a: VitalsAnswers, v: number): VitalsAnswers {
  return {
    ...a,
    pulse: clamp(Math.round(v), PULSE_MIN, PULSE_MAX),
    skipped: a.skipped.filter((k) => k !== 'pulse'),
  }
}

/** The cuff cannot have a lower number above the upper one, so each bead pushes
 *  the other along rather than crossing it. */
export function setSystolic(a: VitalsAnswers, v: number): VitalsAnswers {
  const systolic = clamp(Math.round(v), SYS_MIN, SYS_MAX)
  const diastolic = a.diastolic === null ? null : Math.min(a.diastolic, Math.max(DIA_MIN, systolic - 10))
  return { ...a, systolic, diastolic, skipped: a.skipped.filter((k) => k !== 'pressure') }
}

export function setDiastolic(a: VitalsAnswers, v: number): VitalsAnswers {
  const diastolic = clamp(Math.round(v), DIA_MIN, DIA_MAX)
  const systolic = a.systolic === null ? null : Math.max(a.systolic, diastolic + 10)
  return { ...a, diastolic, systolic, skipped: a.skipped.filter((k) => k !== 'pressure') }
}

export function setSpo2(a: VitalsAnswers, v: number): VitalsAnswers {
  return {
    ...a,
    spo2: clamp(Math.round(v), SPO2_MIN, SPO2_MAX),
    skipped: a.skipped.filter((k) => k !== 'oxygen'),
  }
}

export function setPressure(a: VitalsAnswers, systolic: number, diastolic: number): VitalsAnswers {
  const sys = clamp(Math.round(systolic), SYS_MIN, SYS_MAX)
  const dia = clamp(Math.round(diastolic), DIA_MIN, Math.min(DIA_MAX, sys - 10))
  return { ...a, systolic: sys, diastolic: dia, skipped: a.skipped.filter((k) => k !== 'pressure') }
}

export function skipVital(a: VitalsAnswers, key: VitalKey): VitalsAnswers {
  const skipped = a.skipped.includes(key) ? a.skipped : [...a.skipped, key]
  if (key === 'temp') return { ...a, temp: null, skipped }
  if (key === 'pulse') return { ...a, pulse: null, skipped }
  if (key === 'pressure') return { ...a, systolic: null, diastolic: null, skipped }
  return { ...a, spo2: null, skipped }
}

export function isSkipped(a: VitalsAnswers, key: VitalKey): boolean {
  return a.skipped.includes(key)
}

export function isAnswered(a: VitalsAnswers, key: VitalKey): boolean {
  if (isSkipped(a, key)) return true
  switch (key) {
    case 'temp':
      return a.temp !== null
    case 'pulse':
      return a.pulse !== null
    case 'pressure':
      return a.systolic !== null && a.diastolic !== null
    case 'oxygen':
      return a.spo2 !== null
  }
}

export function progressOf(a: VitalsAnswers): { done: number; total: number; ratio: number } {
  const total = VITAL_QUESTIONS.length
  const done = VITAL_QUESTIONS.filter((q) => isAnswered(a, q.key)).length
  return { done, total, ratio: done / total }
}

export function isComplete(a: VitalsAnswers): boolean {
  return VITAL_QUESTIONS.every((q) => isAnswered(a, q.key))
}

/* ---------------------------------------------------------------- reading
   The words are for the receipt and the readout; the thresholds are the
   ones that change what happens next. */

export function tempWord(v: number): string {
  if (v < 36) return 'Low'
  if (v < 37.5) return 'Normal'
  if (v < 39.5) return 'Fever'
  return 'High fever'
}

export function pulseWord(v: number): string {
  if (v < 50) return 'Slow'
  if (v <= 100) return 'Normal'
  if (v <= 120) return 'Fast'
  return 'Very fast'
}

export function pressureWord(sys: number, dia: number): string {
  if (sys < 90) return 'Low'
  if (sys >= 160 || dia >= 100) return 'High'
  if (sys >= 140 || dia >= 90) return 'Raised'
  return 'Normal'
}

export function spo2Word(v: number): string {
  if (v >= 95) return 'Normal'
  if (v >= 92) return 'Low-normal'
  return 'Low'
}

/** The readings that end the visit at this station. */
export function criticalOf(a: VitalsAnswers): VitalKey[] {
  const out: VitalKey[] = []
  if (a.spo2 !== null && a.spo2 <= 91) out.push('oxygen')
  if (a.systolic !== null && (a.systolic >= 180 || a.systolic <= 90)) out.push('pressure')
  else if (a.diastolic !== null && a.diastolic >= 110) out.push('pressure')
  if (a.pulse !== null && (a.pulse >= 130 || a.pulse <= 45)) out.push('pulse')
  if (a.temp !== null && a.temp >= 39.5) out.push('temp')
  return out
}

export function isCritical(a: VitalsAnswers): boolean {
  return criticalOf(a).length > 0
}

/** What the alarm says, in the order a clinician would read it. */
export function criticalLine(a: VitalsAnswers): string {
  const parts: string[] = []
  if (a.spo2 !== null && a.spo2 <= 91) parts.push(`oxygen at ${a.spo2}%`)
  if (a.systolic !== null && a.systolic >= 180) parts.push(`blood pressure at ${a.systolic} over ${a.diastolic}`)
  else if (a.systolic !== null && a.systolic <= 90)
    parts.push(`blood pressure down at ${a.systolic} over ${a.diastolic}`)
  else if (a.diastolic !== null && a.diastolic >= 110) parts.push(`a lower pressure of ${a.diastolic}`)
  if (a.pulse !== null && a.pulse >= 130) parts.push(`a pulse of ${a.pulse}`)
  else if (a.pulse !== null && a.pulse <= 45) parts.push(`a pulse of only ${a.pulse}`)
  if (a.temp !== null && a.temp >= 39.5) parts.push(`a temperature of ${a.temp.toFixed(1)}`)

  if (parts.length === 0) return ''
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `With ${list}, this needs a doctor now.`
}

/** The receipt line for each question. */
export function receiptOf(a: VitalsAnswers, key: VitalKey): { value: string; flag: boolean } {
  if (isSkipped(a, key)) return { value: 'Not taken', flag: false }
  switch (key) {
    case 'temp':
      return {
        value: a.temp === null ? '—' : `${a.temp.toFixed(1)} °C`,
        flag: a.temp !== null && a.temp >= 38,
      }
    case 'pulse':
      return {
        value: a.pulse === null ? '—' : `${a.pulse} bpm`,
        flag: a.pulse !== null && (a.pulse >= 120 || a.pulse <= 50),
      }
    case 'pressure':
      return {
        value: a.systolic === null || a.diastolic === null ? '—' : `${a.systolic}/${a.diastolic}`,
        flag:
          a.systolic !== null &&
          (a.systolic >= 160 || a.systolic <= 95 || (a.diastolic !== null && a.diastolic >= 100)),
      }
    case 'oxygen':
      return {
        value: a.spo2 === null ? '—' : `${a.spo2}%`,
        flag: a.spo2 !== null && a.spo2 <= 93,
      }
  }
}
