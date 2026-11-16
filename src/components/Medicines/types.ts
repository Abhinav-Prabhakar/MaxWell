/* ============================================================
   C5 · Medicines — where the visit happens, when, and what the
   clinic actually hands over. Suggestions are drawn from the file
   the patient has already built (symptoms, vitals, history), so two
   people with the same answers always get the same tray.
   ============================================================ */

import type { HistoryAnswers } from '../History/types'
import type { SymptomAnswers } from '../Symptoms/types'
import type { VitalsAnswers } from '../Vitals/types'
import type { Facility } from './facilities'

export type SlotKey = 'today' | 'tomorrow' | 'week'

export interface Slot {
  key: SlotKey
  /** "Today", "Tomorrow", "Thu". */
  day: string
  /** "20 Nov" for anything past tomorrow, otherwise empty. */
  date: string
  time: string
}

export interface MedicinesAnswers {
  facilityId: string | null
  slot: SlotKey | null
}

export const EMPTY_MEDICINES: MedicinesAnswers = {
  facilityId: null,
  slot: null,
}

export const MEDICINE_QUESTIONS: { key: 'where' | 'when'; question: string; hint: string }[] = [
  {
    key: 'where',
    question: 'Which hospital can you reach?',
    hint: 'The map shows the facilities around you. Pick the one you can travel to.',
  },
  {
    key: 'when',
    question: 'When can you come?',
    hint: 'The clinic holds the slot for twenty minutes after the time on the token.',
  },
]

/** Clinic hours are 9–5; after four, the evening desk takes the last tokens. */
export function slotsOf(now: Date = new Date()): Slot[] {
  const late = now.getHours() >= 16
  const third = new Date(now)
  third.setDate(third.getDate() + 2)
  return [
    { key: 'today', day: 'Today', date: '', time: late ? '6:30 pm' : '4:30 pm' },
    { key: 'tomorrow', day: 'Tomorrow', date: '', time: '9:00 am' },
    {
      key: 'week',
      day: third.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: third.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      time: '10:00 am',
    },
  ]
}

export const whenOf = (slot: Slot): string => `${slot.day}${slot.date ? ` ${slot.date}` : ''} · ${slot.time}`

export const slotOf = (key: SlotKey | null, slots: Slot[]): Slot | null =>
  key === null ? null : (slots.find((s) => s.key === key) ?? null)

/* ---------------------------------------------------------------- the tray */

export interface Dose {
  key: string
  name: string
  dose: string
  when: string
  why: string
}

export interface Plan {
  doses: Dose[]
  /** One or two lines the pharmacist has to see. */
  notes: string[]
  empty: boolean
}

export interface ClinicalFile {
  age: number | null
  pregnant: boolean | null
  symptoms: SymptomAnswers
  vitals: VitalsAnswers
  history: HistoryAnswers
}

export function planOf(file: ClinicalFile): Plan {
  const { symptoms, vitals, history } = file
  const doses: Dose[] = []
  const notes: string[] = []

  const temp = vitals.temp
  const severity = symptoms.severity
  const fever = temp !== null && temp >= 37.5
  const pain = severity !== null && severity >= 4 && symptoms.areas.length > 0
  const child = file.age !== null && file.age < 12

  if (fever || pain) {
    doses.push({
      key: 'paracetamol',
      name: 'Paracetamol',
      dose: child ? 'Child dose' : '650 mg',
      when: fever && pain ? 'Every 8 hours, after food' : 'Up to three times a day, after food',
      why:
        fever && pain
          ? `Fever ${temp!.toFixed(1)}°C, pain ${severity}/10`
          : fever
            ? `Fever ${temp!.toFixed(1)}°C`
            : `Pain ${severity}/10`,
    })
  }

  const sys = vitals.systolic
  const dia = vitals.diastolic
  const read = sys !== null && dia !== null
  const high = read && (sys >= 140 || dia >= 90)
  const onBp = (history.medicines ?? []).includes('bp') || (history.conditions ?? []).includes('pressure')

  if (high || onBp) {
    doses.push({
      key: 'bp',
      name: onBp ? 'BP tablet' : 'Amlodipine 5 mg',
      dose: onBp ? 'Usual dose' : 'One tablet',
      when: onBp ? 'Tonight, as always' : 'Starting tonight, then each morning',
      why: read ? `Pressure ${sys}/${dia}` : 'Long-term pressure',
    })
  }

  const sugar = (history.conditions ?? []).includes('diabetes') || (history.medicines ?? []).includes('sugar')
  if (sugar) {
    doses.push({
      key: 'sugar',
      name: 'Sugar tablet',
      dose: 'Usual dose',
      when: 'Tonight, as always',
      why: 'Diabetes on file',
    })
  }

  if ((history.allergies ?? []).includes('penicillin')) {
    notes.push('Not penicillin — your record flags an allergy to it.')
  }
  if ((history.medicines ?? []).includes('thinner')) {
    notes.push('On a blood thinner — nothing beyond paracetamol without asking.')
  }
  if (vitals.spo2 !== null && vitals.spo2 <= 93) {
    notes.push(`Oxygen is ${vitals.spo2}% — stay near the facility tonight.`)
  }
  if (file.pregnant) {
    notes.push('Tell the pharmacist you may be pregnant.')
  }
  if (child) {
    notes.push('Under 12 — the pharmacist sets the dose by weight.')
  }

  return { doses: doses.slice(0, 3), notes: notes.slice(0, 2), empty: doses.length === 0 }
}

/* ------------------------------------------------------------ answers, etc */

export function isAnswered(answers: MedicinesAnswers, key: 'where' | 'when'): boolean {
  return key === 'where' ? answers.facilityId !== null : answers.slot !== null
}

export function progressOf(answers: MedicinesAnswers): { done: number; total: number; ratio: number } {
  const total = MEDICINE_QUESTIONS.length
  const done = MEDICINE_QUESTIONS.filter((q) => isAnswered(answers, q.key)).length
  return { done, total, ratio: done / total }
}

export function isComplete(answers: MedicinesAnswers): boolean {
  return MEDICINE_QUESTIONS.every((q) => isAnswered(answers, q.key))
}

export function receiptOf(
  _answers: MedicinesAnswers,
  facility: Facility | null,
  slot: Slot | null,
): { value: string; flag: boolean } {
  if (slot) return { value: whenOf(slot), flag: false }
  if (facility) return { value: facility.name, flag: false }
  return { value: '—', flag: false }
}
