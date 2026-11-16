export type SexAtBirth = 'female' | 'male' | 'intersex'

export type SupportNeed = 'wheelchair' | 'hearing' | 'vision' | 'interpreter' | 'none'

export interface IntakeLocation {
  /** Human label, e.g. "Kolar" or "Bengaluru Rural". */
  place: string
  /** Nearest facility we would send them to. */
  clinic: string
  distanceKm: number | null
  /** Degrees clockwise from north, when we know it. */
  bearing: number | null
  /** The point itself — C5 puts it on the map. */
  lat: number | null
  lon: number | null
  source: 'device' | 'manual'
}

export interface IntakeAnswers {
  age: number | null
  sex: SexAtBirth | null
  /** Only asked when `sex === 'female'`. */
  pregnant: boolean | null
  location: IntakeLocation | null
  support: SupportNeed[]
}

export const EMPTY_ANSWERS: IntakeAnswers = {
  age: null,
  sex: null,
  pregnant: null,
  location: null,
  support: [],
}

export type QuestionKey = 'age' | 'sex' | 'pregnant' | 'location' | 'support'

export interface QuestionMeta {
  key: QuestionKey
  /** The line the patient reads. */
  question: string
  hint: string
  /** Answered in a single tap, so the flow can move on by itself. */
  tap: boolean
  required: boolean
}

export const QUESTIONS: QuestionMeta[] = [
  {
    key: 'age',
    question: 'How old are you?',
    hint: 'Drag the scale — arrow keys fine-tune.',
    tap: false,
    required: true,
  },
  {
    key: 'sex',
    question: 'Sex registered at birth',
    hint: 'This decides a couple of the questions that follow.',
    tap: true,
    required: true,
  },
  {
    key: 'pregnant',
    question: 'Could you be pregnant right now?',
    hint: 'It changes which tests we suggest.',
    tap: true,
    required: true,
  },
  {
    key: 'location',
    question: 'Where are you right now?',
    hint: 'We use it to point you at the nearest clinic.',
    tap: false,
    required: true,
  },
  {
    key: 'support',
    question: 'Anything that would make this easier?',
    hint: 'Optional — pick as many as apply.',
    tap: false,
    required: false,
  },
]

/** The questions that actually apply to these answers, in order. */
export function activeQuestions(answers: IntakeAnswers): QuestionMeta[] {
  return QUESTIONS.filter((q) => q.key !== 'pregnant' || answers.sex === 'female')
}

export function isAnswered(answers: IntakeAnswers, key: QuestionKey): boolean {
  switch (key) {
    case 'age':
      return answers.age !== null
    case 'sex':
      return answers.sex !== null
    case 'pregnant':
      return answers.pregnant !== null
    case 'location':
      return answers.location !== null
    case 'support':
      // Optional: nothing ticked is a valid answer.
      return true
  }
}

export function progressOf(answers: IntakeAnswers): { done: number; total: number; ratio: number } {
  const required = activeQuestions(answers).filter((q) => q.required)
  const done = required.filter((q) => isAnswered(answers, q.key)).length
  return { done, total: required.length, ratio: required.length ? done / required.length : 1 }
}

export function isComplete(answers: IntakeAnswers): boolean {
  const required = activeQuestions(answers).filter((q) => q.required)
  return required.every((q) => isAnswered(answers, q.key))
}

export const SUPPORT_LABELS: Record<SupportNeed, string> = {
  wheelchair: 'Wheelchair',
  hearing: 'Hard of hearing',
  vision: 'Low vision',
  interpreter: 'Interpreter',
  none: 'Nothing to add',
}
