/* ============================================================
   C6 · Care plan — when the clinic sees this patient again, and
   who is around them tonight. Both questions shape a plan the
   patient can carry: a return stub, three things to do at home,
   and the signs that mean come back now.
   ============================================================ */

import { planOf, type ClinicalFile } from '../Medicines/types'

export type FollowUpKey = 'soon' | 'week' | 'month'
export type CheckInKey = 'home' | 'neighbour' | 'alone'

export interface CareAnswers {
  followUp: FollowUpKey | null
  checkIn: CheckInKey | null
}

export const EMPTY_CARE: CareAnswers = {
  followUp: null,
  checkIn: null,
}

export const CARE_QUESTIONS: { key: 'followUp' | 'checkIn'; question: string; hint: string }[] = [
  {
    key: 'followUp',
    question: 'When should we see you again?',
    hint: 'The amber pin marks the date the clinic suggests. You can choose a later one.',
  },
  {
    key: 'checkIn',
    question: 'Who is with you tonight?',
    hint: 'This decides what the plan says about getting help if the night turns bad.',
  },
]

/* ------------------------------------------------------------ dates */

export interface FollowUp {
  key: FollowUpKey
  /** Short tab line: "In 2 days". */
  label: string
  /** Concrete date: "Tue 18 Nov". */
  date: string
  /** "Tuesday". */
  weekday: string
  /** "morning OPD". */
  note: string
}

const addDays = (from: Date, days: number) => {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

export function followUps(now: Date = new Date()): FollowUp[] {
  const make = (key: FollowUpKey, days: number, label: string): FollowUp => {
    const d = addDays(now, days)
    return {
      key,
      label,
      date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
      note: 'morning OPD',
    }
  }
  return [make('soon', 2, 'In 2 days'), make('week', 7, 'In 1 week'), make('month', 21, 'In 3 weeks')]
}

export const followUpOf = (key: FollowUpKey | null, slips: FollowUp[]): FollowUp | null =>
  key === null ? null : (slips.find((s) => s.key === key) ?? null)

/** What the file implies, before the patient is asked. */
export function suggestFollowUp(file: ClinicalFile): FollowUpKey {
  const { symptoms, vitals } = file
  const temp = vitals.temp
  const severity = symptoms.severity
  const spo2 = vitals.spo2

  const urgent =
    (temp !== null && temp >= 38.5) ||
    (severity !== null && severity >= 7) ||
    (spo2 !== null && spo2 <= 94) ||
    (file.age !== null && file.age < 5) ||
    file.pregnant === true

  if (urgent) return 'soon'

  const needsReview =
    (temp !== null && temp >= 37.5) ||
    (severity !== null && severity >= 4) ||
    (symptoms.flags?.length ?? 0) > 0 ||
    (symptoms.areas?.length ?? 0) > 0

  return needsReview ? 'week' : 'month'
}

/* ------------------------------------------------------------ home care */

export type CareTone = 'plain' | 'amber'

export interface CareTile {
  key: string
  title: string
  line: string
  tone: CareTone
}

/** Three things at most: a plan nobody reads is not a plan. */
export function careTilesOf(file: ClinicalFile): CareTile[] {
  const { symptoms, vitals, history } = file

  const fever = vitals.temp !== null && vitals.temp >= 37.5
  const pain = symptoms.severity !== null && symptoms.severity >= 4
  const sys = vitals.systolic
  const dia = vitals.diastolic
  const pressure = (sys !== null && sys >= 140) || (dia !== null && dia >= 90)
  const onBp = (history.medicines ?? []).includes('bp')
  const diabetes = (history.conditions ?? []).includes('diabetes') || (history.medicines ?? []).includes('sugar')
  const doses = planOf(file).doses.length > 0

  const tiles: CareTile[] = [{ key: 'water', title: 'Water', line: 'Sip through the day', tone: 'plain' }]

  if (doses) tiles.push({ key: 'food', title: 'Food', line: 'Tablets after eating', tone: 'plain' })

  if (pressure || onBp) {
    tiles.push({ key: 'salt', title: 'Salt', line: 'Keep it low today', tone: 'amber' })
  } else if (diabetes) {
    tiles.push({ key: 'sugar', title: 'Sugar', line: 'Skip the sweet tea', tone: 'amber' })
  } else if (fever) {
    tiles.push({ key: 'cool', title: 'Cool', line: 'Light clothes, open window', tone: 'plain' })
  } else {
    tiles.push({ key: 'rest', title: 'Rest', line: pain ? 'No field work today' : 'Take it slow today', tone: 'plain' })
  }

  return tiles
}

/* ------------------------------------------------------- warning signs */

export interface WatchSign {
  key: string
  text: string
}

export function watchOf(file: ClinicalFile): WatchSign[] {
  const { symptoms, vitals } = file
  const flags = symptoms.flags ?? []
  const picked: WatchSign[] = []

  if (flags.includes('chest')) picked.push({ key: 'chest', text: 'Chest pain or tightness' })
  if (flags.includes('breath') || (vitals.spo2 !== null && vitals.spo2 <= 94)) {
    picked.push({ key: 'breath', text: 'Breathless at rest' })
  }
  if (flags.includes('bleed')) picked.push({ key: 'bleed', text: "Bleeding that won't stop" })
  if (flags.includes('confusion')) picked.push({ key: 'confusion', text: 'Drowsy or confused' })
  if (flags.includes('fever') || (vitals.temp !== null && vitals.temp >= 37.5)) {
    picked.push({ key: 'fever', text: 'Fever above 39°' })
  }

  const fallback: WatchSign[] = [
    { key: 'vomit', text: 'Vomiting everything' },
    { key: 'dizzy', text: 'Dizzy when standing' },
    { key: 'fever', text: 'Fever that climbs' },
  ]

  for (const f of fallback) {
    if (picked.length >= 3) break
    if (!picked.some((p) => p.key === f.key)) picked.push(f)
  }

  return picked.slice(0, 3)
}

export const CHECK_IN_LINE: Record<CheckInKey, string> = {
  home: 'Someone is at home tonight',
  neighbour: 'A neighbour will look in tonight',
  alone: 'No one tonight — ask the desk for a call',
}

export const CHECK_IN_LABEL: Record<CheckInKey, string> = {
  home: 'Someone at home',
  neighbour: 'A neighbour',
  alone: 'No one tonight',
}

/* ------------------------------------------------------------ answers */

export function isAnswered(answers: CareAnswers, key: 'followUp' | 'checkIn'): boolean {
  return answers[key] !== null
}

export function progressOf(answers: CareAnswers): { done: number; total: number; ratio: number } {
  const total = CARE_QUESTIONS.length
  const done = CARE_QUESTIONS.filter((q) => isAnswered(answers, q.key)).length
  return { done, total, ratio: done / total }
}

export function isComplete(answers: CareAnswers): boolean {
  return CARE_QUESTIONS.every((q) => isAnswered(answers, q.key))
}
