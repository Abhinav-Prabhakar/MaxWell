import { useMemo, useState } from 'react'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { IconArrow, IconCheck, IconLocation, IconPill } from '../Station/icons'
import { Atlas } from './Atlas'
import { Dispenser } from './Dispenser'
import { Tray } from './Tray'
import { Visit } from './Visit'
import { IconClock } from './icons'
import { centerOf, facilitiesFor, KIND_LABEL, serialOf, type Facility } from './facilities'
import {
  isAnswered,
  isComplete,
  planOf,
  progressOf,
  slotOf,
  slotsOf,
  whenOf,
  MEDICINE_QUESTIONS,
  type ClinicalFile,
  type MedicinesAnswers,
  type SlotKey,
} from './types'
import type { IntakeLocation } from '../Intake/types'
import './medicines.css'

const GLYPH: Record<'where' | 'when', React.ReactNode> = {
  where: <IconLocation size={15} />,
  when: <IconClock size={15} />,
}

const LABEL: Record<'where' | 'when', string> = {
  where: 'Going to',
  when: 'Appointment',
}

/* The row of facilities under the map: hairline rows, numbered like the pins
   so the eye can go from one to the other without hunting. */
function Sites({
  facilities,
  value,
  onPick,
}: {
  facilities: Facility[]
  value: string | null
  onPick: (id: string) => void
}) {
  const roving = Math.max(
    0,
    facilities.findIndex((f) => f.id === value),
  )

  return (
    <div className="sites" role="radiogroup" aria-label="Nearby hospitals">
      {facilities.map((f, i) => {
        const on = f.id === value
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            className="site"
            data-on={on}
            tabIndex={i === roving ? 0 : -1}
            onClick={() => onPick(f.id)}
            onKeyDown={(e) => {
              const step =
                e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
              if (!step) return
              e.preventDefault()
              const next = (i + step + facilities.length) % facilities.length
              onPick(facilities[next].id)
              const rows = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.site')
              rows?.[next]?.focus()
            }}
          >
            <span className="site__num" aria-hidden="true">
              <span className="site__num-in">{i + 1}</span>
            </span>
            <span className="site__text">
              <span className="site__name">{f.name}</span>
              <span className="site__kind">
                {KIND_LABEL[f.kind]} · {f.services.join(' · ')}
              </span>
            </span>
            <span className="site__far">
              <span className="site__km">{f.km} km</span>
              <span className="site__min">about {f.minutes} min</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Medicines({
  answers,
  onChange,
  location,
  file,
  onFiled,
  onReopen,
  onNext,
}: {
  answers: MedicinesAnswers
  onChange: (next: MedicinesAnswers) => void
  location: IntakeLocation | null
  file: ClinicalFile
  onFiled: () => void
  onReopen: () => void
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<'where' | 'when'>('where')
  const [filed, setFiled] = useState(false)

  const facilities = useMemo(() => facilitiesFor(location), [location])
  const center = useMemo(() => centerOf(location), [location])
  const slots = useMemo(() => slotsOf(), [])
  const plan = useMemo(() => planOf(file), [file])

  const questions = MEDICINE_QUESTIONS
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)

  const facility = facilities.find((f) => f.id === answers.facilityId) ?? null
  const slot = slotOf(answers.slot, slots)

  const openIndex = Math.max(0, questions.findIndex((q) => q.key === activeKey))
  const open = questions[openIndex]
  const last = openIndex === questions.length - 1

  const canContinue = isAnswered(answers, open.key) && (!last || ready)

  const next = () => {
    if (last) {
      if (!ready) return
      setFiled(true)
      onFiled()
      return
    }
    setActiveKey('when')
  }

  const receipt = (key: 'where' | 'when') => {
    if (key === 'where') return facility ? { value: facility.name, flag: false } : { value: '—', flag: false }
    return slot ? { value: whenOf(slot), flag: false } : { value: '—', flag: false }
  }

  const trail = filed ? [] : questions.filter((q) => q.key !== open.key && isAnswered(answers, q.key))

  const reopen = (key: 'where' | 'when') => {
    setFiled(false)
    onReopen()
    setActiveKey(key)
  }

  return (
    <div className="intake medicines" data-done={filed}>
      <StationTop
        code="C5"
        title={filed ? 'Plan on file' : 'Medicines'}
        ratio={ratio}
        done={filed}
        count={filed ? 'done' : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!filed && (
          <Question key={open.key} meta={open}>
            {open.key === 'where' && (
              <div className="where">
                <Atlas
                  center={center}
                  place={center.place}
                  facilities={facilities}
                  activeId={answers.facilityId}
                  onPick={(id) => onChange({ ...answers, facilityId: id })}
                />
                <Sites
                  facilities={facilities}
                  value={answers.facilityId}
                  onPick={(id) => onChange({ ...answers, facilityId: id })}
                />
              </div>
            )}

            {open.key === 'when' && (
              <Dispenser slots={slots} value={answers.slot} onPick={(key: SlotKey) => onChange({ ...answers, slot: key })} />
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

        {filed && facility && slot && (
          <div className="file">
            <Visit facility={facility} slot={slot} serial={serialOf(`${facility.id}-${slot.key}`)} />

            <div className="strip" role="list" aria-label="Your visit">
              {questions.map((q) => (
                <span key={q.key} role="listitem" className="strip__cell">
                  <Receipt
                    glyph={GLYPH[q.key]}
                    label={LABEL[q.key]}
                    value={receipt(q.key).value}
                    flag={receipt(q.key).flag}
                    onEdit={() => reopen(q.key)}
                  />
                </span>
              ))}
            </div>

            <div className="plan-head" role="heading" aria-level={3}>
              <span className="plan-head__glyph" aria-hidden="true">
                <IconPill size={14} />
              </span>
              What the clinic gives you
            </div>

            <Tray plan={plan} />

            <div className="next">
              <button type="button" className="next__go" onClick={onNext}>
                <span className="next__pulse" aria-hidden="true" />
                <span className="next__name">C6 · Care plan</span>
                <span className="next__glyph" aria-hidden="true">
                  <IconCheck size={15} />
                </span>
              </button>
            </div>
          </div>
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
