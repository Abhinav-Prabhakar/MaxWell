import { useMemo, useState } from 'react'
import { AgeGauge } from './AgeGauge'
import { PregnancyPicker, SexPicker } from './Choices'
import { Compass } from './Compass'
import { SupportPicker } from './SupportPicker'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { IconAge, IconArrow, IconLocation, IconPregnant, IconSex, IconSupport } from '../Station/icons'
import {
  activeQuestions,
  isAnswered,
  isComplete,
  progressOf,
  SUPPORT_LABELS,
  type IntakeAnswers,
  type QuestionKey,
} from './types'
import './intake.css'

const SEX_LABEL = { female: 'Female', male: 'Male', intersex: 'Intersex' } as const

const GLYPH: Record<QuestionKey, React.ReactNode> = {
  age: <IconAge size={15} />,
  sex: <IconSex size={15} />,
  pregnant: <IconPregnant size={15} />,
  location: <IconLocation size={15} />,
  support: <IconSupport size={15} />,
}

const LABEL: Record<QuestionKey, string> = {
  age: 'Age',
  sex: 'Sex at birth',
  pregnant: 'Pregnancy',
  location: 'Location',
  support: 'Support',
}

export function Intake({
  answers,
  onChange,
  onFinish,
  onReopen,
  onNext,
}: {
  answers: IntakeAnswers
  onChange: (next: IntakeAnswers) => void
  /** The patient has filed this station. */
  onFinish: () => void
  /** They went back into an answer, so the station is open again. */
  onReopen: () => void
  /** Open the next station. */
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<QuestionKey>('age')
  const [submitted, setSubmitted] = useState(false)

  const questions = useMemo(() => activeQuestions(answers), [answers])
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)

  const found = questions.findIndex((q) => q.key === activeKey)
  const firstRequiredOpen = questions.findIndex((q) => q.required && !isAnswered(answers, q.key))
  const fallback = firstRequiredOpen === -1 ? questions.length - 1 : firstRequiredOpen
  /* If the active question no longer applies (sex changed under it), the flow
     falls back to the first thing still missing. */
  const openIndex = found >= 0 ? found : Math.min(fallback, questions.length - 1)
  const open = questions[openIndex]
  const last = openIndex === questions.length - 1

  const patch = (p: Partial<IntakeAnswers>) => onChange({ ...answers, ...p })

  /* Tap answers get a beat to land, then the next question takes over — using
     the question list as it will exist after the answer is stored, so choosing
     "female" does open the pregnancy question. */
  const answerTap = (p: Partial<IntakeAnswers>, from: QuestionKey) => {
    const after = activeQuestions({ ...answers, ...p })
    const at = after.findIndex((q) => q.key === from)
    const nextKey = after[at + 1]?.key
    patch(p)
    window.setTimeout(() => {
      if (nextKey) setActiveKey(nextKey)
    }, 320)
  }

  const value = (key: QuestionKey) => {
    switch (key) {
      case 'age':
        return answers.age === null ? null : `${answers.age}`
      case 'sex':
        return answers.sex ? SEX_LABEL[answers.sex] : null
      case 'pregnant':
        return answers.pregnant === null ? null : answers.pregnant ? 'Possibly' : 'No'
      case 'location':
        return answers.location?.place ?? null
      case 'support':
        return answers.support.length ? answers.support.map((s) => SUPPORT_LABELS[s]).join(' · ') : 'Nothing added'
    }
  }

  /* The trail: every question already behind the cursor, in order. Support is
     optional, so an empty one earns no mark — it would claim an answer. */
  const trail = submitted
    ? []
    : questions.filter(
        (q, i) =>
          i !== openIndex &&
          isAnswered(answers, q.key) &&
          (q.key !== 'support' || answers.support.length > 0),
      )

  const canContinue = isAnswered(answers, open.key) && (!last || ready)

  const finish = () => {
    if (!ready) return
    onFinish()
    setSubmitted(true)
  }

  /* Move to the next thing that actually needs an answer; when nothing does,
     go to the last card so "Finish" is one click away. */
  const next = () => {
    if (last) {
      finish()
      return
    }
    const ahead = questions.findIndex((q, i) => i > openIndex && q.required && !isAnswered(answers, q.key))
    const target = ahead >= 0 ? ahead : ready ? questions.length - 1 : openIndex + 1
    setActiveKey(questions[target].key)
  }

  const flagOf = (key: QuestionKey) => key === 'pregnant' && answers.pregnant === true

  return (
    <div className="intake" data-done={submitted}>
      <StationTop
        code="C1"
        title={submitted ? 'Basics on file' : 'Patient check-in'}
        ratio={ratio}
        done={submitted}
        count={submitted ? 'done' : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!submitted && (
          <Question key={open.key} meta={open}>
            {open.key === 'age' && <AgeGauge value={answers.age} onChange={(age) => patch({ age })} />}

            {open.key === 'sex' && (
              <SexPicker
                value={answers.sex}
                onChange={(sex) => answerTap({ sex, pregnant: sex === 'female' ? answers.pregnant : null }, 'sex')}
              />
            )}

            {open.key === 'pregnant' && (
              <PregnancyPicker value={answers.pregnant} onChange={(pregnant) => answerTap({ pregnant }, 'pregnant')} />
            )}

            {open.key === 'location' && (
              <Compass value={answers.location} onChange={(location) => patch({ location })} />
            )}

            {open.key === 'support' && (
              <SupportPicker value={answers.support} onChange={(support) => patch({ support })} />
            )}
          </Question>
        )}

        {trail.length > 0 && (
          <div className="strip" role="list" aria-label="Answered">
            {trail.map((q) => (
              <span key={q.key} role="listitem" className="strip__cell">
                <Receipt
                  glyph={GLYPH[q.key]}
                  label={LABEL[q.key]}
                  value={value(q.key)}
                  flag={flagOf(q.key)}
                  onEdit={() => setActiveKey(q.key)}
                />
              </span>
            ))}
          </div>
        )}

        {submitted && (
          <>
            <div className="recap" role="list" aria-label="Your answers">
              {questions.map((q) => (
                <span key={q.key} role="listitem" className="recap__row">
                  <Receipt
                    glyph={GLYPH[q.key]}
                    label={LABEL[q.key]}
                    value={value(q.key) ?? '—'}
                    flag={flagOf(q.key)}
                    onEdit={() => {
                      setSubmitted(false)
                      onReopen()
                      setActiveKey(q.key)
                    }}
                  />
                </span>
              ))}
            </div>

            <div className="next">
              <button type="button" className="next__go" onClick={onNext}>
                <span className="next__pulse" aria-hidden="true" />
                <span className="next__name">C2 · Symptoms</span>
                <span className="next__glyph" aria-hidden="true">
                  <IconArrow size={16} />
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {!submitted && (
        <footer className="intake__foot">
          <Dots
            items={questions.map((q) => ({
              key: q.key,
              label: LABEL[q.key],
              answered: q.required && isAnswered(answers, q.key),
            }))}
            openIndex={openIndex}
            onPick={(i) => setActiveKey(questions[i].key)}
          />

          <button type="button" className="action action--primary intake__go" onClick={next} disabled={!canContinue}>
            {last ? 'Finish' : 'Continue'}
            <IconArrow size={16} />
          </button>
        </footer>
      )}
    </div>
  )
}
