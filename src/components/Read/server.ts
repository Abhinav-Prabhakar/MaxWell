/* ============================================================
   The second read, server side. One prompt, one JSON contract,
   and a validator that refuses to pass on anything the desk should
   not read: no doses, no injections, no new medicine names.
   Imported only by `app/api/read/route.ts`.
   ============================================================ */

import {
  concernOf,
  SAME_CONCERN,
  type ClinicalRead,
  type Concern,
  type Likelihood,
  type ReadCondition,
  type ReadInput,
} from './types'

export const DEFAULT_MODEL = 'ministral-8b-latest'

export function modelOf(): string {
  return process.env.MISTRAL_MODEL?.trim() || DEFAULT_MODEL
}

export function hasKey(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY?.trim())
}

const SYSTEM = [
  'You are the second pair of eyes at a rural primary health centre in Karnataka, India.',
  'You write for the nurse at the desk, not for the patient. Be calm, concrete and brief.',
  '',
  'What the fields mean:',
  '- history.allergies lists allergies the patient HAS. Never write that they do not have one.',
  '- history.conditions and history.medicines are what the patient already lives with.',
  '- plan.doses is the only medicine the clinic is giving. Never invent another.',
  '- symptoms.flags lists danger signs the patient reports right now.',
  '',
  'Rules:',
  '- Never give a diagnosis or claim certainty. Name possibilities and what would change the picture.',
  '- Each condition is a possible cause. Never restate the symptom as the condition (not "severe headache").',
  '- Never write a dose, a strength, a route, an injection, or a medicine outside plan.doses.',
  '- Use words, not numbers; the sheet already prints every reading.',
  '- If something dangerous is possible, say it once, plainly, without alarm.',
  '- Plain English, Indian usage. Short sentences. No markdown inside strings.',
  '',
  'Return only JSON with this exact shape:',
  '{"read":"one calm sentence, max 24 words","conditions":[{"name":"max 5 words, no Possible prefix","likelihood":"likely|possible|unlikely","why":"max 12 words"}],"watch":["max 10 words"],"concern":"calm|watch|urgent"}',
  'conditions: 2 or 3. watch: 2 to 4 items, each a sign that means come back now.',
].join('\n')

export function messagesOf(input: ReadInput) {
  return [
    { role: 'system' as const, content: SYSTEM },
    { role: 'user' as const, content: JSON.stringify(input) },
  ]
}

/* ------------------------------------------------------------ validation */

const LIKELIHOOD: Likelihood[] = ['likely', 'possible', 'unlikely']
const CONCERN: Concern[] = ['calm', 'watch', 'urgent']

const clean = (value: unknown, max: number): string =>
  typeof value === 'string'
    ? value
        .replace(/\s+/g, ' ')
        .replace(/^["'“”]+|["'“”]+$/g, '')
        .trim()
        .slice(0, max)
    : ''

const round = (value: unknown, min: number, max: number): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10))
}

const words = (value: unknown, max: number): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => clean(entry, 24))
        .filter(Boolean)
        .slice(0, max)
    : []

/** The body is public input: keep only the fields the prompt uses. */
export function coerceInput(body: unknown): ReadInput | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const obj = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  if (!b.symptoms || !b.vitals || !b.history) return null

  const sex = b.sex
  const symptoms = obj(b.symptoms)
  const vitals = obj(b.vitals)
  const history = obj(b.history)
  const plan = obj(b.plan)

  return {
    age: round(b.age, 0, 120),
    sex: sex === 'female' || sex === 'male' || sex === 'intersex' ? sex : null,
    pregnant: b.pregnant === true ? true : b.pregnant === false ? false : null,
    place: clean(b.place, 40),
    symptoms: {
      areas: words(symptoms.areas, 7),
      onset: clean(symptoms.onset, 12) || null,
      severity: round(symptoms.severity, 0, 10),
      flags: words(symptoms.flags, 6),
    },
    vitals: {
      temp: round(vitals.temp, 30, 45),
      pulse: round(vitals.pulse, 20, 250),
      systolic: round(vitals.systolic, 40, 300),
      diastolic: round(vitals.diastolic, 20, 200),
      spo2: round(vitals.spo2, 40, 100),
    },
    history: {
      conditions: words(history.conditions, 8),
      medicines: words(history.medicines, 8),
      allergies: words(history.allergies, 8),
    },
    plan: {
      doses: words(plan.doses, 4),
      cautions: words(plan.cautions, 4),
    },
  }
}

/** A dose, a route, or an injection: never something the desk should read. */
const UNSAFE = /(\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|ml|iu|units?)\b)|\b(iv|i\.v\.|im|i\.m\.|injection|infusion)\b/i

const safe = (value: string): boolean => value.length > 1 && !UNSAFE.test(value)

function conditionOf(raw: unknown): ReadCondition | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>
  /* The model likes to restate the likelihood in the name ("Brain bleed
     possible"). The beads already carry it. */
  const name = clean(entry.name, 44)
    .replace(/^(likely|possible|unlikely|probable)\s+/i, '')
    .replace(/\s*[—–-]?\s*\b(likely|possible|unlikely|probable)\b$/i, '')
    .trim()
  const why = clean(entry.why, 84)
  const likelihood = LIKELIHOOD.includes(entry.likelihood as Likelihood)
    ? (entry.likelihood as Likelihood)
    : 'possible'
  if (!safe(name) || !safe(why)) return null
  return { name, likelihood, why }
}

export interface ModelRead {
  read: string
  conditions: ReadCondition[]
  watch: string[]
  concern: Concern
}

/** Anything the model says goes through here before it reaches the slip. */
export function coerce(raw: unknown): ModelRead | null {
  if (!raw || typeof raw !== 'object') return null
  const body = raw as Record<string, unknown>

  const read = clean(body.read, 220)
  if (!safe(read)) return null

  const conditions = Array.isArray(body.conditions)
    ? body.conditions.map(conditionOf).filter((c): c is ReadCondition => c !== null).slice(0, 3)
    : []
  if (conditions.length === 0) return null

  const watch = Array.isArray(body.watch)
    ? body.watch.map((w) => clean(w, 68)).filter(safe).slice(0, 4)
    : []

  const concern = CONCERN.includes(body.concern as Concern) ? (body.concern as Concern) : 'watch'

  return { read, conditions, watch, concern }
}

export function toRead(
  model: ModelRead,
  input: ReadInput,
  by: string,
  at: Date,
): ClinicalRead {
  const ours = concernOf(input)
  return {
    read: model.read,
    conditions: model.conditions,
    watch: model.watch,
    concern: model.concern,
    agree: SAME_CONCERN(ours, model.concern),
    source: 'model',
    by,
    at: at.toISOString(),
  }
}

export { concernOf }
