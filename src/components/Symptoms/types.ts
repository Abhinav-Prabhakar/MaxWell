/* ============================================================
   C2 · Symptoms — what hurts, since when, how much, and whether
   anything on the red-flag list is happening right now.
   ============================================================ */

export type BodyArea = 'head' | 'chest' | 'belly' | 'armL' | 'armR' | 'legL' | 'legR'

export type Onset = 'today' | 'days' | 'week' | 'longer'

export type RedFlag = 'chest' | 'breath' | 'faint' | 'bleed' | 'fever' | 'confusion'

export interface SymptomAnswers {
  areas: BodyArea[]
  /** null while unanswered, and null again if "all over" is chosen. */
  onset: Onset | null
  severity: number | null
  /** null while unanswered; [] means "none of these". */
  flags: RedFlag[] | null
}

export const EMPTY_SYMPTOMS: SymptomAnswers = {
  areas: [],
  onset: null,
  severity: null,
  flags: null,
}

export type SymptomKey = 'areas' | 'onset' | 'severity' | 'flags'

export const SYMPTOM_QUESTIONS: { key: SymptomKey; question: string; hint: string; required: boolean; tap: boolean }[] = [
  {
    key: 'areas',
    question: 'Where does it hurt?',
    hint: 'Tap every part of the body that hurts. Tap a lit part again to clear it.',
    required: true,
    tap: false,
  },
  {
    key: 'onset',
    question: 'When did it start?',
    hint: 'Slide the rule to the closest point.',
    required: true,
    tap: true,
  },
  {
    key: 'severity',
    question: 'How bad is it right now?',
    hint: 'Pull the column up or down. Zero is nothing, ten is the worst you can imagine.',
    required: true,
    tap: false,
  },
  {
    key: 'flags',
    question: 'Is any of this happening?',
    hint: 'These need a doctor straight away. If none apply, choose none of these.',
    required: true,
    tap: false,
  },
]

export const AREA_LABELS: Record<BodyArea, string> = {
  head: 'Head',
  chest: 'Chest',
  belly: 'Belly',
  armL: 'Left arm',
  armR: 'Right arm',
  legL: 'Left leg',
  legR: 'Right leg',
}

export const ONSET_LABELS: Record<Onset, string> = {
  today: 'Today',
  days: '2–3 days',
  week: 'This week',
  longer: 'Over a week',
}

export const FLAG_LABELS: Record<RedFlag, string> = {
  chest: 'Chest pain',
  breath: 'Breathless',
  faint: 'Fainted',
  bleed: 'Heavy bleeding',
  fever: 'Fever + stiff neck',
  confusion: 'Confused',
}

/** The long form, for the receipt and for screen readers. */
export const FLAG_DETAIL: Record<RedFlag, string> = {
  chest: 'Chest pain or pressure',
  breath: 'Trouble breathing',
  faint: 'Fainting or nearly fainting',
  bleed: 'Bleeding that will not stop',
  fever: 'Fever with a stiff neck',
  confusion: 'Confusion or trouble waking',
}

export function severityWord(v: number): string {
  if (v === 0) return 'None'
  if (v <= 3) return 'Mild'
  if (v <= 6) return 'Moderate'
  if (v <= 8) return 'Severe'
  return 'Worst'
}

export function isAnswered(answers: SymptomAnswers, key: SymptomKey): boolean {
  switch (key) {
    case 'areas':
      return answers.areas.length > 0
    case 'onset':
      return answers.onset !== null
    case 'severity':
      return answers.severity !== null
    case 'flags':
      return answers.flags !== null
  }
}

export function progressOf(answers: SymptomAnswers): { done: number; total: number; ratio: number } {
  const total = SYMPTOM_QUESTIONS.length
  const done = SYMPTOM_QUESTIONS.filter((q) => isAnswered(answers, q.key)).length
  return { done, total, ratio: done / total }
}

export function isComplete(answers: SymptomAnswers): boolean {
  return SYMPTOM_QUESTIONS.every((q) => isAnswered(answers, q.key))
}

/** Anything here means an ambulance, not an appointment. */
export function isEmergency(answers: SymptomAnswers): boolean {
  return (answers.flags?.length ?? 0) > 0
}

/** The receipt line for each question. */
export function receiptOf(answers: SymptomAnswers, key: SymptomKey): { label: string; value: string; flag: boolean } {
  switch (key) {
    case 'areas': {
      const areas = answers.areas.slice(0, 2).map((a) => AREA_LABELS[a])
      const more = answers.areas.length - areas.length
      return { label: 'Hurts', value: areas.join(' · ') + (more > 0 ? ` +${more}` : ''), flag: false }
    }
    case 'onset':
      return { label: 'Started', value: answers.onset ? ONSET_LABELS[answers.onset] : '—', flag: false }
    case 'severity':
      return {
        label: 'Severity',
        value: answers.severity === null ? '—' : `${answers.severity} / 10 · ${severityWord(answers.severity)}`,
        flag: answers.severity !== null && answers.severity >= 8,
      }
    case 'flags': {
      const flags = answers.flags ?? []
      if (flags.length === 0) return { label: 'Warning signs', value: 'None', flag: false }
      const first = FLAG_LABELS[flags[0]]
      return { label: 'Warning signs', value: first + (flags.length > 1 ? ` +${flags.length - 1}` : ''), flag: true }
    }
  }
}
