/* ============================================================
   C7 · Second read — the file handed to a model for one more
   pair of eyes before it is stamped.

   Two sources, one shape. `localRead` is the clinic rulebook and
   always answers, so the station is never empty and the demo works
   with no network. `requestRead` asks the Mistral route, which is
   the same shape with a `source: 'model'` tag. Neither is a
   diagnosis; both say what to watch.
   ============================================================ */

import type { ClinicalFile, Plan } from '../Medicines/types'
import { planOf } from '../Medicines/types'
import type { HistoryAnswers } from '../History/types'
import type { IntakeAnswers } from '../Intake/types'
import type { SymptomAnswers } from '../Symptoms/types'
import type { VitalsAnswers } from '../Vitals/types'
import { severityWord } from '../Symptoms/types'

export type Likelihood = 'likely' | 'possible' | 'unlikely'
export type Concern = 'calm' | 'watch' | 'urgent'

export interface ReadCondition {
  name: string
  likelihood: Likelihood
  why: string
}

export interface ClinicalRead {
  /** One calm sentence, the whole picture. */
  read: string
  conditions: ReadCondition[]
  /** What would mean coming back / escalating. */
  watch: string[]
  concern: Concern
  /** The model's concern against ours. */
  agree: boolean
  source: 'model' | 'rules'
  /** Model id, or 'clinic rulebook'. */
  by: string
  /** ISO, for the slip's footer. */
  at: string
}

/** The compact file the route receives — no identifiers, no free text. */
export interface ReadInput {
  age: number | null
  sex: 'female' | 'male' | 'intersex' | null
  pregnant: boolean | null
  place: string
  symptoms: {
    areas: string[]
    onset: string | null
    severity: number | null
    flags: string[]
  }
  vitals: {
    temp: number | null
    pulse: number | null
    systolic: number | null
    diastolic: number | null
    spo2: number | null
  }
  history: {
    conditions: string[]
    medicines: string[]
    allergies: string[]
  }
  plan: {
    doses: string[]
    cautions: string[]
  }
}

export interface ReadRecord {
  intake: IntakeAnswers
  symptoms: SymptomAnswers
  vitals: VitalsAnswers
  history: HistoryAnswers
  file: ClinicalFile
}

export function readInputOf(record: ReadRecord, place: string): ReadInput {
  const plan: Plan = planOf(record.file)
  return {
    age: record.intake.age,
    sex: record.intake.sex,
    pregnant: record.intake.pregnant,
    place,
    symptoms: {
      areas: record.symptoms.areas,
      onset: record.symptoms.onset,
      severity: record.symptoms.severity,
      flags: record.symptoms.flags ?? [],
    },
    vitals: {
      temp: record.vitals.temp,
      pulse: record.vitals.pulse,
      systolic: record.vitals.systolic,
      diastolic: record.vitals.diastolic,
      spo2: record.vitals.spo2,
    },
    history: {
      conditions: record.history.conditions ?? [],
      medicines: record.history.medicines ?? [],
      allergies: record.history.allergies ?? [],
    },
    plan: {
      doses: plan.doses.map((d) => d.name),
      cautions: plan.notes,
    },
  }
}

/* ------------------------------------------------------------ urgency */

/** How much this file asks of the desk, from the vitals and the answers. */
export function concernOf(input: ReadInput): Concern {
  const { vitals: v, symptoms: s, age } = input
  let score = 0

  if (v.temp !== null && v.temp >= 39.5) score += 2
  else if (v.temp !== null && v.temp >= 38) score += 1
  if (v.pulse !== null && v.pulse >= 130) score += 2
  else if (v.pulse !== null && v.pulse >= 110) score += 1
  if (v.spo2 !== null && v.spo2 <= 91) score += 2
  else if (v.spo2 !== null && v.spo2 <= 94) score += 1
  if (v.systolic !== null && v.systolic >= 180) score += 2
  else if (v.systolic !== null && v.systolic >= 160) score += 1
  if (s.severity !== null && s.severity >= 8) score += 1
  else if (s.severity !== null && s.severity >= 6) score += 1
  if (s.flags.length > 0) score += 1
  if (s.onset === 'today' && s.severity !== null && s.severity >= 7) score += 1
  if (age !== null && (age < 2 || age >= 70) && s.areas.length > 0) score += 1
  if (input.pregnant && s.severity !== null && s.severity >= 5) score += 1

  return score >= 4 ? 'urgent' : score >= 1 ? 'watch' : 'calm'
}

/* ------------------------------------------------------------ clinic rulebook */

const AREA = {
  head: 'head',
  chest: 'chest',
  belly: 'belly',
  armL: 'arm',
  armR: 'arm',
  legL: 'leg',
  legR: 'leg',
} as const

const has = (input: ReadInput, flag: string) => input.symptoms.flags.includes(flag)
const areas = (input: ReadInput) => input.symptoms.areas.map((a) => AREA[a as keyof typeof AREA] ?? a)
const fever = (input: ReadInput) => input.vitals.temp !== null && input.vitals.temp >= 37.5
const raisedBp = (input: ReadInput) =>
  (input.vitals.systolic !== null && input.vitals.systolic >= 140) ||
  (input.vitals.diastolic !== null && input.vitals.diastolic >= 90)
const lowOxygen = (input: ReadInput) => input.vitals.spo2 !== null && input.vitals.spo2 <= 94
const fastPulse = (input: ReadInput) => input.vitals.pulse !== null && input.vitals.pulse >= 110

/** Deterministic, conservative, and honest about being a rulebook. */
export function localRead(input: ReadInput, at = new Date().toISOString()): ClinicalRead {
  const list = areas(input)
  const conditions: ReadCondition[] = []
  const watch: string[] = []

  if (has(input, 'chest') || (has(input, 'breath') && list.includes('chest'))) {
    conditions.push({
      name: 'Cardiac chest pain',
      likelihood: 'possible',
      why: 'Chest pain with breathlessness needs an ECG today',
    })
    watch.push('Crushing pain spreading to the arm or jaw')
    watch.push('Cold sweat, nausea, or a sense of doom')
  }

  if (list.includes('chest') && fever(input)) {
    conditions.push({
      name: 'Chest infection',
      likelihood: 'likely',
      why: 'Fever with chest pain or a wet cough',
    })
    watch.push('Breathing faster than usual, or lips going blue')
  }

  if (has(input, 'fever') || fever(input)) {
    conditions.push({
      name: 'Viral fever',
      likelihood: list.includes('head') ? 'likely' : 'possible',
      why: fever(input) ? `Temperature ${input.vitals.temp?.toFixed(1)} °C today` : 'Fever reported with body ache',
    })
    watch.push('Fever past three days, or spiking at night')
    watch.push('Drowsiness, confusion, or a stiff neck')
  }

  if (list.includes('head') && raisedBp(input)) {
    conditions.push({
      name: 'Headache with raised pressure',
      likelihood: 'possible',
      why: 'Pressure above range alongside a headache',
    })
    watch.push('The worst headache of their life, or vomiting')
  } else if (list.includes('head') && !fever(input)) {
    conditions.push({
      name: 'Tension headache',
      likelihood: 'possible',
      why: 'Headache without fever or a red flag',
    })
  }

  if (list.includes('belly')) {
    conditions.push({
      name: fever(input) ? 'Stomach infection' : 'Gastric pain',
      likelihood: 'possible',
      why: fever(input) ? 'Fever with belly pain' : 'Belly pain without fever',
    })
    watch.push('Pain settling in the right lower belly')
    watch.push('Cannot keep water down')
  }

  if (list.includes('arm') || list.includes('leg')) {
    conditions.push({
      name: 'Sprain or strain',
      likelihood: 'likely',
      why: 'Limb pain without a fever',
    })
    watch.push('Swelling that keeps growing, or cannot bear weight')
  }

  if (lowOxygen(input)) {
    watch.push('Oxygen under 94% on a repeat reading')
  }
  if (fastPulse(input)) {
    watch.push('A pulse over 110 at rest')
  }
  if (input.history.allergies.length > 0) {
    watch.push('Any new rash, swelling, or tightness after a tablet')
  }

  if (conditions.length === 0) {
    conditions.push({
      name: 'No clear pattern',
      likelihood: 'possible',
      why: 'Quiet readings; the clinic will examine before deciding',
    })
  }

  const concern = concernOf(input)
  const severity = input.symptoms.severity

  return {
    read: [
      input.age !== null ? `${input.age}-year-old` : 'Patient',
      input.sex ? ` ${input.sex}` : '',
      list.length ? ` with ${list.join(' and ')} trouble` : ' with no localised pain',
      severity !== null ? `, ${severityWord(severity).toLowerCase()}` : '',
      fever(input) ? ', feverish' : '',
      raisedBp(input) ? ', pressure above range' : '',
      '.',
    ].join(''),
    conditions: conditions.slice(0, 3),
    watch: watch.slice(0, 4),
    concern,
    agree: true,
    source: 'rules',
    by: 'Clinic rulebook',
    at,
  }
}

/** The read that came back from the model, or the rulebook if it did not. */
export function settleRead(read: ClinicalRead | null, input: ReadInput): ClinicalRead {
  return read ?? localRead(input)
}

export const SAME_CONCERN = (a: Concern, b: Concern) => (a === 'calm') === (b === 'calm') && (a === 'urgent') === (b === 'urgent')
