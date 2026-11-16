/* ============================================================
   C8 · Handoff — the whole visit on one printed sheet. Nothing here
   asks a new question; it reads the file back, stamps it, and hands
   it to the desk. The sheet's code is a real QR of the same facts,
   so the paper and the phone agree.
   ============================================================ */

import type { HistoryAnswers } from '../History/types'
import { ALLERGY_OPTIONS, CONDITION_OPTIONS, MEDICINE_OPTIONS } from '../History/types'
import type { IntakeAnswers, IntakeLocation } from '../Intake/types'
import type { CareAnswers, FollowUp } from '../Care/types'
import type { ClinicalFile, MedicinesAnswers } from '../Medicines/types'
import { planOf } from '../Medicines/types'
import { centerOf, facilitiesFor, serialOf, type Facility } from '../Medicines/facilities'
import type { SymptomAnswers } from '../Symptoms/types'
import type { VitalsAnswers } from '../Vitals/types'
import {
  pressureWord,
  pulseWord,
  spo2Word,
  tempWord,
  DIA_MAX,
  DIA_MIN,
  PULSE_MAX,
  PULSE_MIN,
  SPO2_MAX,
  SPO2_MIN,
  SYS_MAX,
  SYS_MIN,
  TEMP_MAX,
  TEMP_MIN,
} from '../Vitals/types'

export interface HandoffRecord {
  intake: IntakeAnswers
  symptoms: SymptomAnswers
  vitals: VitalsAnswers
  history: HistoryAnswers
  medicines: MedicinesAnswers
  care: CareAnswers
  file: ClinicalFile
}

export const HANDOFF_QUESTION = {
  key: 'record',
  question: 'Read it once, then stamp it.',
  hint: 'This sheet is the whole visit. The stamp hands the record to the desk; the care plan is yours to keep.',
}

export const facilityOf = (record: HandoffRecord): Facility => {
  const list = facilitiesFor(record.intake.location)
  return list.find((f) => f.id === record.medicines.facilityId) ?? list[0]
}

/** The number C5's token already carries, so paper and brass agree. */
export function serialOfRecord(record: HandoffRecord): string {
  const facility = facilityOf(record)
  return serialOf(`${facility.id}-${record.medicines.slot ?? 'today'}`)
}

export const placeOf = (location: IntakeLocation | null): string => centerOf(location).place

export interface Stamp {
  date: string
  time: string
  /** 16 Nov 2026. */
  long: string
}

export function stampOf(now: Date): Stamp {
  return {
    date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    long: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

/** Compact, ASCII, under the version-5 ceiling: the paper's facts in a code. */
export function qrPayload(record: HandoffRecord, now: Date): string {
  const v = record.vitals
  const age = record.intake.age
  const sex = record.intake.sex ? record.intake.sex[0].toUpperCase() : ''
  const doses = planOf(record.file)
    .doses.map((d) => d.key.toUpperCase())
    .join('+')
  const place = placeOf(record.intake.location).replace(/[^A-Za-z]/g, '').slice(0, 18)
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  return [
    'MX7',
    serialOfRecord(record),
    place,
    ymd,
    `${age ?? '?'}${sex}${record.intake.pregnant ? 'P' : ''}`,
    v.temp !== null ? `T${v.temp.toFixed(1)}` : '',
    v.pulse !== null ? `P${v.pulse}` : '',
    v.systolic !== null && v.diastolic !== null ? `B${v.systolic}/${v.diastolic}` : '',
    v.spo2 !== null ? `O${v.spo2}` : '',
    doses || 'NONE',
    record.care.followUp?.toUpperCase() ?? 'TBD',
  ]
    .filter(Boolean)
    .join('|')
}

/* ------------------------------------------------------------ vitals strip */

export type Tone = 'plain' | 'amber' | 'rose'

export interface VitalCell {
  key: string
  label: string
  value: string
  unit: string
  word: string
  /** 0–1 position on the instrument's scale, null when not taken. */
  ratio: number | null
  tone: Tone
  empty: boolean
}

const cell = (args: VitalCell): VitalCell => args

const scale = (value: number, min: number, max: number) => Math.max(0, Math.min(1, (value - min) / (max - min)))

export function vitalsOf(v: VitalsAnswers): VitalCell[] {
  const pressureTone: Tone =
    v.systolic !== null && (v.systolic >= 180 || v.systolic <= 90 || (v.diastolic !== null && v.diastolic >= 110))
      ? 'rose'
      : v.systolic !== null && (v.systolic >= 140 || (v.diastolic !== null && v.diastolic >= 90))
        ? 'amber'
        : 'plain'

  return [
    cell({
      key: 'temp',
      label: 'Temp',
      value: v.temp !== null ? v.temp.toFixed(1) : '—',
      unit: '°C',
      word: v.temp !== null ? tempWord(v.temp) : 'Not taken',
      ratio: v.temp !== null ? scale(v.temp, TEMP_MIN, TEMP_MAX) : null,
      tone: v.temp !== null && v.temp >= 39.5 ? 'rose' : v.temp !== null && v.temp >= 37.5 ? 'amber' : 'plain',
      empty: v.temp === null,
    }),
    cell({
      key: 'pulse',
      label: 'Pulse',
      value: v.pulse !== null ? String(v.pulse) : '—',
      unit: 'bpm',
      word: v.pulse !== null ? pulseWord(v.pulse) : 'Not taken',
      ratio: v.pulse !== null ? scale(v.pulse, PULSE_MIN, PULSE_MAX) : null,
      tone: v.pulse !== null && (v.pulse >= 130 || v.pulse <= 45) ? 'rose' : v.pulse !== null && (v.pulse > 100 || v.pulse < 50) ? 'amber' : 'plain',
      empty: v.pulse === null,
    }),
    cell({
      key: 'pressure',
      label: 'Pressure',
      value: v.systolic !== null && v.diastolic !== null ? `${v.systolic}/${v.diastolic}` : '—',
      unit: '',
      word:
        v.systolic !== null && v.diastolic !== null
          ? pressureWord(v.systolic, v.diastolic)
          : 'Not taken',
      ratio: v.systolic !== null ? scale(v.systolic, SYS_MIN, SYS_MAX) : v.diastolic !== null ? scale(v.diastolic, DIA_MIN, DIA_MAX) : null,
      tone: pressureTone,
      empty: v.systolic === null || v.diastolic === null,
    }),
    cell({
      key: 'oxygen',
      label: 'Oxygen',
      value: v.spo2 !== null ? String(v.spo2) : '—',
      unit: '%',
      word: v.spo2 !== null ? spo2Word(v.spo2) : 'Not taken',
      ratio: v.spo2 !== null ? scale(v.spo2, SPO2_MIN, SPO2_MAX) : null,
      tone: v.spo2 !== null && v.spo2 <= 91 ? 'rose' : v.spo2 !== null && v.spo2 <= 94 ? 'amber' : 'plain',
      empty: v.spo2 === null,
    }),
  ]
}

/* ------------------------------------------------------------ history chips */

export interface Chip {
  key: string
  label: string
  tone: 'plain' | 'med' | 'warn'
}

const labelOf = <K extends string>(options: { key: K; label: string }[], keys: K[]): string[] =>
  keys.map((k) => options.find((o) => o.key === k)?.label ?? k)

export function chipsOf(history: HistoryAnswers): Chip[] {
  const chips: Chip[] = [
    ...labelOf(CONDITION_OPTIONS, history.conditions ?? []).map((label) => ({
      key: `c-${label}`,
      label,
      tone: 'plain' as const,
    })),
    ...labelOf(MEDICINE_OPTIONS, history.medicines ?? []).map((label) => ({
      key: `m-${label}`,
      label,
      tone: 'med' as const,
    })),
    ...labelOf(ALLERGY_OPTIONS, history.allergies ?? []).map((label) => ({
      key: `a-${label}`,
      label: `${label} allergy`,
      tone: 'warn' as const,
    })),
  ]
  return chips
}

/* ------------------------------------------------------------ dates */

export const returnDateOf = (care: CareAnswers, slips: FollowUp[]): FollowUp | null =>
  care.followUp ? (slips.find((s) => s.key === care.followUp) ?? null) : null
