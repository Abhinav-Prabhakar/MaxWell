import { useState } from 'react'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { IconArrow, IconPill } from '../Station/icons'
import { AlertTags } from './AlertTags'
import { Blister } from './Blister'
import { ConditionBank } from './ConditionBank'
import { IconAlert, IconClipboard } from './icons'
import {
  isAnswered,
  isComplete,
  noneOf,
  progressOf,
  receiptOf,
  toggleAllergy,
  toggleCondition,
  toggleMedicine,
  HISTORY_QUESTIONS,
  type AllergyKey,
  type ConditionKey,
  type HistoryAnswers,
  type HistoryKey,
  type MedicineKey,
} from './types'
import './history.css'

const GLYPH: Record<HistoryKey, React.ReactNode> = {
  conditions: <IconClipboard size={15} />,
  medicines: <IconPill size={15} />,
  allergies: <IconAlert size={15} />,
}

const LABEL: Record<HistoryKey, string> = {
  conditions: 'Long-term',
  medicines: 'Daily medicines',
  allergies: 'Allergies',
}

export function History({
  answers,
  onChange,
  onFiled,
  onReopen,
  onNext,
}: {
  answers: HistoryAnswers
  onChange: (next: HistoryAnswers) => void
  onFiled: () => void
  onReopen: () => void
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<HistoryKey>('conditions')
  const [filed, setFiled] = useState(false)

  const questions = HISTORY_QUESTIONS
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)

  const openIndex = Math.max(0, questions.findIndex((q) => q.key === activeKey))
  const open = questions[openIndex]
  const last = openIndex === questions.length - 1

  const receipt = (key: HistoryKey) => receiptOf(answers, key)

  const canContinue = isAnswered(answers, open.key) && (!last || ready)

  const finish = () => {
    if (!ready) return
    setFiled(true)
    onFiled()
  }

  const next = () => {
    if (last) {
      finish()
      return
    }
    const ahead = questions.findIndex((q, i) => i > openIndex && !isAnswered(answers, q.key))
    setActiveKey(questions[ahead >= 0 ? ahead : Math.min(openIndex + 1, questions.length - 1)].key)
  }

  const trail = filed ? [] : questions.filter((q) => q.key !== open.key && isAnswered(answers, q.key))

  return (
    <div className="intake history" data-done={filed}>
      <StationTop
        code="C4"
        title={filed ? 'History on file' : 'History'}
        ratio={ratio}
        done={filed}
        count={filed ? 'done' : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!filed && (
          <Question key={open.key} meta={open}>
            {open.key === 'conditions' && (
              <ConditionBank
                value={answers.conditions}
                onToggle={(key: ConditionKey) => onChange(toggleCondition(answers, key))}
                onNone={() => onChange(noneOf(answers, 'conditions'))}
              />
            )}

            {open.key === 'medicines' && (
              <Blister
                value={answers.medicines}
                onToggle={(key: MedicineKey) => onChange(toggleMedicine(answers, key))}
                onNone={() => onChange(noneOf(answers, 'medicines'))}
              />
            )}

            {open.key === 'allergies' && (
              <AlertTags
                value={answers.allergies}
                onToggle={(key: AllergyKey) => onChange(toggleAllergy(answers, key))}
                onNone={() => onChange(noneOf(answers, 'allergies'))}
              />
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
                  value={receipt(q.key).value}
                  flag={receipt(q.key).flag}
                  onEdit={() => setActiveKey(q.key)}
                />
              </span>
            ))}
          </div>
        )}

        {filed && (
          <>
            <div className="recap" role="list" aria-label="Your history">
              {questions.map((q) => (
                <span key={q.key} role="listitem" className="recap__row">
                  <Receipt
                    glyph={GLYPH[q.key]}
                    label={LABEL[q.key]}
                    value={receipt(q.key).value}
                    flag={receipt(q.key).flag}
                    onEdit={() => {
                      setFiled(false)
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
                <span className="next__name">C5 · Medicines</span>
                <span className="next__glyph" aria-hidden="true">
                  <IconArrow size={16} />
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {!filed && (
        <footer className="intake__foot">
          <Dots
            items={questions.map((q) => ({ key: q.key, label: LABEL[q.key], answered: isAnswered(answers, q.key) }))}
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
