import { useState } from 'react'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { EmergencyCard } from '../Station/Emergency'
import { IconArrow } from '../Station/icons'
import { BodyMap } from './BodyMap'
import { FlagPlates } from './FlagPlates'
import { OnsetRule } from './OnsetRule'
import { Severity } from './Severity'
import { IconBody, IconClock, IconPulse, IconSiren } from './icons'
import {
  isComplete,
  isEmergency,
  progressOf,
  receiptOf,
  SYMPTOM_QUESTIONS,
  type BodyArea,
  type RedFlag,
  type SymptomAnswers,
  type SymptomKey,
} from './types'
import './symptoms.css'

const ALL_AREAS: BodyArea[] = ['head', 'chest', 'belly', 'armL', 'armR', 'legL', 'legR']

const GLYPH: Record<SymptomKey, React.ReactNode> = {
  areas: <IconBody size={15} />,
  onset: <IconClock size={15} />,
  severity: <IconPulse size={15} />,
  flags: <IconSiren size={15} />,
}

const LABEL: Record<SymptomKey, string> = {
  areas: 'Hurts',
  onset: 'Started',
  severity: 'Severity',
  flags: 'Warning signs',
}

const LINES: Record<RedFlag, string> = {
  chest: 'Chest pain needs an ambulance, not an appointment.',
  breath: 'Trouble breathing needs help on the way.',
  faint: 'Fainting needs to be looked at straight away.',
  bleed: 'Bleeding this heavy needs to be stopped by a clinician.',
  fever: 'A fever with a stiff neck needs urgent care.',
  confusion: 'Confusion needs an ambulance.',
}

export function Symptoms({
  answers,
  onChange,
  location,
  onFiled,
  onReopen,
  onNext,
}: {
  answers: SymptomAnswers
  onChange: (next: SymptomAnswers) => void
  /** Where C1 put them, so the ambulance card can name the nearest facility. */
  location: { place: string; clinic: string; distanceKm: number | null } | null
  onFiled: () => void
  onReopen: () => void
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<SymptomKey>('areas')
  const [filed, setFiled] = useState(false)

  const questions = SYMPTOM_QUESTIONS
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)
  const emergency = isEmergency(answers)

  const openIndex = Math.max(0, questions.findIndex((q) => q.key === activeKey))
  const open = questions[openIndex]
  const last = openIndex === questions.length - 1

  const patch = (p: Partial<SymptomAnswers>) => onChange({ ...answers, ...p })

  const answerTap = (p: Partial<SymptomAnswers>, from: SymptomKey) => {
    const at = questions.findIndex((q) => q.key === from)
    const nextKey = questions[at + 1]?.key
    patch(p)
    window.setTimeout(() => {
      if (nextKey) setActiveKey(nextKey)
    }, 320)
  }

  const toggleArea = (area: BodyArea | 'all') => {
    const cur = answers.areas
    if (area === 'all') {
      patch({ areas: cur.length === ALL_AREAS.length ? [] : ALL_AREAS })
      return
    }
    patch({ areas: cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area] })
  }

  const trail = filed ? [] : questions.filter((q) => q.key !== open.key && isDone(q.key))

  function isDone(key: SymptomKey) {
    if (key === 'areas') return answers.areas.length > 0
    if (key === 'onset') return answers.onset !== null
    if (key === 'severity') return answers.severity !== null
    return answers.flags !== null
  }

  const receipt = (key: SymptomKey) => receiptOf(answers, key)

  const canContinue = isDone(open.key) && (!last || ready)

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
    const ahead = questions.findIndex((q, i) => i > openIndex && !isDone(q.key))
    setActiveKey(questions[ahead >= 0 ? ahead : Math.min(openIndex + 1, questions.length - 1)].key)
  }

  const headline = emergency && answers.flags ? LINES[answers.flags[0]] : ''
  const where = location
    ? `${location.clinic}${location.distanceKm !== null ? ` · ${location.distanceKm} km` : ''}`
    : null

  return (
    <div className="intake symptoms" data-done={filed} data-emergency={emergency}>
      <StationTop
        code="C2"
        title={filed ? (emergency ? 'Emergency' : 'Symptoms on file') : 'Symptoms'}
        ratio={ratio}
        done={filed && !emergency}
        count={filed ? (emergency ? 'urgent' : 'done') : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!filed && (
          <Question key={open.key} meta={open}>
            {open.key === 'areas' && <BodyMap value={answers.areas} onToggle={toggleArea} />}

            {open.key === 'onset' && (
              <OnsetRule value={answers.onset} onChange={(onset) => answerTap({ onset }, 'onset')} />
            )}

            {open.key === 'severity' && (
              <Severity value={answers.severity} onChange={(severity) => patch({ severity })} />
            )}

            {open.key === 'flags' && (
              <FlagPlates value={answers.flags} onChange={(flags: RedFlag[]) => patch({ flags })} />
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

        {filed && emergency && (
          <EmergencyCard
            head="Call 108 now"
            line={headline}
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
            }}
          />
        )}

        {filed && !emergency && (
          <>
            <div className="recap" role="list" aria-label="Your answers">
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
                <span className="next__name">C3 · Vitals</span>
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
            items={questions.map((q) => ({ key: q.key, label: LABEL[q.key], answered: isDone(q.key) }))}
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
