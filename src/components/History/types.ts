/* ============================================================
   C4 · History — what the body already lives with, what it takes
   every day, and what it reacts to. All three are records, not
   readings: none of them ends the visit.
   ============================================================ */

export type ConditionKey = 'diabetes' | 'pressure' | 'heart' | 'asthma' | 'kidney' | 'thyroid' | 'tb' | 'cancer'

export type MedicineKey = 'bp' | 'sugar' | 'inhaler' | 'thinner' | 'thyroid' | 'pain'

export type AllergyKey = 'penicillin' | 'sulfa' | 'aspirin' | 'latex' | 'peanut' | 'dust'

export type HistoryKey = 'conditions' | 'medicines' | 'allergies'

export interface HistoryAnswers {
  /** null = not asked yet; [] = none of them. */
  conditions: ConditionKey[] | null
  medicines: MedicineKey[] | null
  allergies: AllergyKey[] | null
}

export const EMPTY_HISTORY: HistoryAnswers = {
  conditions: null,
  medicines: null,
  allergies: null,
}

export const CONDITION_OPTIONS: { key: ConditionKey; label: string }[] = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'pressure', label: 'High BP' },
  { key: 'heart', label: 'Heart' },
  { key: 'asthma', label: 'Asthma' },
  { key: 'kidney', label: 'Kidney' },
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'tb', label: 'TB' },
  { key: 'cancer', label: 'Cancer' },
]

export const MEDICINE_OPTIONS: { key: MedicineKey; label: string }[] = [
  { key: 'bp', label: 'BP tablet' },
  { key: 'sugar', label: 'Sugar tablet' },
  { key: 'inhaler', label: 'Inhaler' },
  { key: 'thinner', label: 'Blood thinner' },
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'pain', label: 'Painkiller' },
]

export const ALLERGY_OPTIONS: { key: AllergyKey; label: string }[] = [
  { key: 'penicillin', label: 'Penicillin' },
  { key: 'sulfa', label: 'Sulfa' },
  { key: 'aspirin', label: 'Aspirin' },
  { key: 'latex', label: 'Latex' },
  { key: 'peanut', label: 'Peanuts' },
  { key: 'dust', label: 'Dust' },
]

export const HISTORY_QUESTIONS: { key: HistoryKey; question: string; hint: string }[] = [
  {
    key: 'conditions',
    question: 'Do you live with any of these?',
    hint: 'Flip the steel switch for each long-term condition.',
  },
  {
    key: 'medicines',
    question: 'What do you take every day?',
    hint: 'Press a pocket to punch out each daily medicine.',
  },
  {
    key: 'allergies',
    question: 'Does your body react to anything?',
    hint: 'Hang a bone tag for each allergy.',
  },
]

const labelOf = <K extends string>(options: { key: K; label: string }[], keys: K[] | null): string[] =>
  (keys ?? []).map((k) => options.find((o) => o.key === k)?.label ?? k)

/** Two names and a count is enough for a folded receipt; the switches hold the rest. */
const summary = (names: string[]): string =>
  names.length <= 2 ? names.join(' · ') : `${names.slice(0, 2).join(' · ')} +${names.length - 2}`

export function isAnswered(a: HistoryAnswers, key: HistoryKey): boolean {
  return a[key] !== null
}

export function progressOf(a: HistoryAnswers): { done: number; total: number; ratio: number } {
  const total = HISTORY_QUESTIONS.length
  const done = HISTORY_QUESTIONS.filter((q) => isAnswered(a, q.key)).length
  return { done, total, ratio: done / total }
}

export function isComplete(a: HistoryAnswers): boolean {
  return HISTORY_QUESTIONS.every((q) => isAnswered(a, q.key))
}

export function toggleCondition(a: HistoryAnswers, key: ConditionKey): HistoryAnswers {
  const cur = a.conditions ?? []
  return { ...a, conditions: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
}

export function toggleMedicine(a: HistoryAnswers, key: MedicineKey): HistoryAnswers {
  const cur = a.medicines ?? []
  return { ...a, medicines: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
}

export function toggleAllergy(a: HistoryAnswers, key: AllergyKey): HistoryAnswers {
  const cur = a.allergies ?? []
  return { ...a, allergies: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
}

/** "None of these" is an answer, not an empty field. */
export function noneOf(a: HistoryAnswers, key: HistoryKey): HistoryAnswers {
  if (key === 'conditions') return { ...a, conditions: [] }
  if (key === 'medicines') return { ...a, medicines: [] }
  return { ...a, allergies: [] }
}

/** The recap line for each question. */
export function receiptOf(a: HistoryAnswers, key: HistoryKey): { value: string; flag: boolean } {
  if (key === 'conditions') {
    const names = labelOf(CONDITION_OPTIONS, a.conditions)
    return {
      value: a.conditions === null ? '—' : names.length === 0 ? 'None' : summary(names),
      flag: names.length > 0,
    }
  }
  if (key === 'medicines') {
    const names = labelOf(MEDICINE_OPTIONS, a.medicines)
    return {
      value: a.medicines === null ? '—' : names.length === 0 ? 'None daily' : summary(names),
      flag: (a.medicines ?? []).includes('thinner'),
    }
  }
  const names = labelOf(ALLERGY_OPTIONS, a.allergies)
  return {
    value: a.allergies === null ? '—' : names.length === 0 ? 'No allergies' : summary(names),
    flag: names.length > 0,
  }
}
