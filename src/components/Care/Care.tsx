import { useMemo, useState } from 'react'
import { Dots, Question, Receipt, StationTop } from '../Station/Station'
import { IconArrow, IconCheck } from '../Station/icons'
import { facilitiesFor } from '../Medicines/facilities'
import type { ClinicalFile } from '../Medicines/types'
import { CheckIn } from './CheckIn'
import { FollowUpSlips } from './FollowUpSlips'
import { CareTiles, ReturnStub, WatchRail } from './Plan'
import { IconCalendar, IconHouse } from './icons'
import {
  CARE_QUESTIONS,
  CHECK_IN_LABEL,
  careTilesOf,
  followUpOf,
  followUps,
  isAnswered,
  isComplete,
  progressOf,
  suggestFollowUp,
  watchOf,
  type CareAnswers,
  type CheckInKey,
  type FollowUpKey,
} from './types'
import type { IntakeLocation } from '../Intake/types'
import type { MedicinesAnswers } from '../Medicines/types'
import './care.css'

const GLYPH: Record<'followUp' | 'checkIn', React.ReactNode> = {
  followUp: <IconCalendar size={15} />,
  checkIn: <IconHouse size={15} />,
}

const LABEL: Record<'followUp' | 'checkIn', string> = {
  followUp: 'Return',
  checkIn: 'Tonight',
}

/* C6 · Care plan — the visit becomes something to take home: a return date,
   three things to do, and the signs that mean come back now. */
export function Care({
  answers,
  onChange,
  location,
  medicines,
  file,
  onFiled,
  onReopen,
  onNext,
}: {
  answers: CareAnswers
  onChange: (next: CareAnswers) => void
  location: IntakeLocation | null
  medicines: MedicinesAnswers
  file: ClinicalFile
  onFiled: () => void
  onReopen: () => void
  onNext: () => void
}) {
  const [activeKey, setActiveKey] = useState<'followUp' | 'checkIn'>('followUp')
  const [filed, setFiled] = useState(false)

  const slips = useMemo(() => followUps(), [])
  const suggested = useMemo(() => suggestFollowUp(file), [file])
  const tiles = useMemo(() => careTilesOf(file), [file])
  const watch = useMemo(() => watchOf(file), [file])

  const facility = useMemo(() => {
    const list = facilitiesFor(location)
    return list.find((f) => f.id === medicines.facilityId)?.name ?? location?.clinic ?? 'the clinic'
  }, [location, medicines.facilityId])

  const questions = CARE_QUESTIONS
  const { ratio } = progressOf(answers)
  const ready = isComplete(answers)

  const slip = followUpOf(answers.followUp, slips)
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
    setActiveKey('checkIn')
  }

  const receipt = (key: 'followUp' | 'checkIn') => {
    if (key === 'followUp') {
      return { value: slip ? `${slip.label} · ${slip.date}` : '—', flag: false }
    }
    const v = answers.checkIn
    return { value: v ? CHECK_IN_LABEL[v] : '—', flag: false }
  }

  const trail = filed ? [] : questions.filter((q) => q.key !== open.key && isAnswered(answers, q.key))

  const reopen = (key: 'followUp' | 'checkIn') => {
    setFiled(false)
    onReopen()
    setActiveKey(key)
  }

  return (
    <div className="intake care" data-done={filed}>
      <StationTop
        code="C6"
        title={filed ? 'Care plan set' : 'Care plan'}
        ratio={ratio}
        done={filed}
        count={filed ? 'done' : `${openIndex + 1} / ${questions.length}`}
      />

      <div className="intake__body">
        {!filed && (
          <Question key={open.key} meta={open}>
            {open.key === 'followUp' && (
              <FollowUpSlips
                slips={slips}
                value={answers.followUp}
                suggested={suggested}
                onPick={(key: FollowUpKey) => onChange({ ...answers, followUp: key })}
              />
            )}

            {open.key === 'checkIn' && (
              <CheckIn value={answers.checkIn} onChange={(v: CheckInKey) => onChange({ ...answers, checkIn: v })} />
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

        {filed && slip && (
          <div className="care-file">
            <ReturnStub slip={slip} facility={facility} checkIn={answers.checkIn} />

            <div className="strip" role="list" aria-label="Your plan">
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

            <div className="care-head" role="heading" aria-level={3}>
              <span className="care-head__glyph" aria-hidden="true">
                <IconHouse size={14} />
              </span>
              At home
            </div>

            <CareTiles tiles={tiles} />

            <WatchRail signs={watch} />

            <div className="next">
              <button type="button" className="next__go" onClick={onNext}>
                <span className="next__pulse" aria-hidden="true" />
                <span className="next__name">C7 · Second read</span>
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
