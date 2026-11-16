import { useState } from 'react'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { EmergencyCard } from '../Station/Emergency'
import { IconArrow, IconMinus } from '../Station/icons'
import { OxygenCell } from './OxygenCell'
import { PressureColumn } from './PressureColumn'
import { PulseMonitor } from './PulseMonitor'
import { Thermometer } from './Thermometer'
import { IconBeat, IconGauge, IconOxygen, IconThermometer } from './icons'
import {
  criticalLine,
  criticalOf,
  isAnswered,
  isComplete,
  isCritical,
  isSkipped,
  progressOf,
  receiptOf,
  setDiastolic,
  setPulse,
  setSpo2,
  setSystolic,
  setTemp,
  skipVital,
  VITAL_QUESTIONS,
  type VitalKey,
  type VitalsAnswers,
} from './types'
import './vitals.css'

const GLYPH: Record<VitalKey, React.ReactNode> = {
  temp: <IconThermometer size={15} />,
  pulse: <IconBeat size={15} />,
  pressure: <IconGauge size={15} />,
  oxygen: <IconOxygen size={15} />,
}

const LABEL: Record<VitalKey, string> = {
  temp: 'Temperature',
  pulse: 'Pulse',
  pressure: 'Blood pressure',
  oxygen: 'Oxygen',
}

const SKIP_REASON: Record<VitalKey, string> = {
  temp: 'Not taken — no thermometer',
  pulse: "Not taken — couldn't count it",
  pressure: 'Not taken — no working cuff',
  oxygen: 'Not taken — no oximeter',
}

export function Vitals({
  answers,
  onChange,
  location,
  onFiled,
  onReopen,
  onNext,
}: {
  answers: VitalsAnswers
  onChange: (next: VitalsAnswers) => void
  location: { place: string; clinic: string; distanceKm: number | null } | null
  onFiled: () => void
  onReopen: () => void
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<VitalKey>('temp')
  const [filed, setFiled] = useState(false)

  const questions = VITAL_QUESTIONS
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)
  const emergency = isCritical(answers)

  const openIndex = Math.max(0, questions.findIndex((q) => q.key === activeKey))
  const open = questions[openIndex]
  const last = openIndex === questions.length - 1
  const skipped = isSkipped(answers, open.key)

  const receipt = (key: VitalKey) => receiptOf(answers, key)

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

  const skip = () => {
    onChange(skipVital(answers, open.key))
    if (!last) setActiveKey(questions[openIndex + 1].key)
  }

  const undoSkip = () => {
    onChange({ ...answers, skipped: answers.skipped.filter((k) => k !== open.key) })
  }

  const trail = filed ? [] : questions.filter((q) => q.key !== open.key && isAnswered(answers, q.key))

  const where = location
    ? `${location.clinic}${location.distanceKm !== null ? ` · ${location.distanceKm} km` : ''}`
    : null

  return (
    <div className="intake vitals" data-done={filed} data-emergency={emergency}>
      <StationTop
        code="C3"
        title={filed ? (emergency ? 'Emergency' : 'Vitals on file') : 'Vitals'}
        ratio={ratio}
        done={filed && !emergency}
        count={filed ? (emergency ? 'urgent' : 'done') : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!filed && (
          <>
            <Question key={open.key} meta={open}>
              {open.key === 'temp' && (
                <Thermometer value={answers.temp} onChange={(v) => onChange(setTemp(answers, v))} />
              )}

              {open.key === 'pulse' && (
                <PulseMonitor value={answers.pulse} onChange={(v) => onChange(setPulse(answers, v))} />
              )}

              {open.key === 'pressure' && (
                <PressureColumn
                  systolic={answers.systolic}
                  diastolic={answers.diastolic}
                  onSystolic={(v) => onChange(setSystolic(answers, v))}
                  onDiastolic={(v) => onChange(setDiastolic(answers, v))}
                />
              )}

              {open.key === 'oxygen' && (
                <OxygenCell value={answers.spo2} onChange={(v) => onChange(setSpo2(answers, v))} />
              )}
            </Question>

            {skipped ? (
              <button type="button" className="vitals-skip" data-on="true" onClick={undoSkip}>
                <span className="vitals-skip__dot" aria-hidden="true">
                  <IconMinus size={11} />
                </span>
                Not taken — record it instead
              </button>
            ) : (
              <button type="button" className="vitals-skip" onClick={skip}>
                <span className="vitals-skip__dot" aria-hidden="true">
                  <IconMinus size={11} />
                </span>
                {SKIP_REASON[open.key]}
              </button>
            )}
          </>
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

        {filed && emergency && (
          <EmergencyCard
            head="Call 108 now"
            line={criticalLine(answers)}
            where={
              where ? (
                <>
                  Nearest facility <span className="sos__clinic">{where}</span>
                </>
              ) : (
                'Tell the operator exactly where you are.'
              )
            }
            onReview={() => {
              setFiled(false)
              onReopen()
              setActiveKey(criticalOf(answers)[0] ?? 'temp')
            }}
          />
        )}

        {filed && !emergency && (
          <>
            <div className="recap" role="list" aria-label="Your vitals">
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
                <span className="next__name">C4 · History</span>
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

      {filed && emergency && (
        <footer className="intake__foot">
          <span className="sos__foot">
            <span className="sos__beacon-dot" aria-hidden="true" />
            Stay on the line.
          </span>
        </footer>
      )}
    </div>
  )
}
