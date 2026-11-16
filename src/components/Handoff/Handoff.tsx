import { useEffect, useMemo, useRef, useState } from 'react'
import { Question, StationTop } from '../Station/Station'
import { IconArrow, IconCheck } from '../Station/icons'
import { followUps } from '../Care/types'
import { Sheet } from './Sheet'
import { IconHand } from './icons'
import { HANDOFF_QUESTION, type HandoffRecord } from './types'
import './handoff.css'

/* C8 · Handoff — the file read back on one sheet, then stamped. The stamp is
   the only answer: a press, an inked ring, and the visit is on the desk. */
export function Handoff({
  record,
  onFiled,
  onRestart,
}: {
  record: HandoffRecord
  onFiled: () => void
  onRestart: () => void
}) {
  const [stamped, setStamped] = useState(false)
  // oxlint-disable-next-line react/purity -- the stamp is the moment the station opened
  const now = useMemo(() => new Date(), [])
  const slips = useMemo(() => followUps(now), [now])
  const doneRef = useRef<HTMLDivElement>(null)

  /* The sheet is taller than a phone; after the stamp, bring the filed status
     and its one action into view instead of leaving them under the fold. */
  useEffect(() => {
    if (!stamped) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    doneRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
  }, [stamped])

  const stamp = () => {
    if (stamped) return
    setStamped(true)
    onFiled()
  }

  return (
    <div className="intake handoff" data-done={stamped}>
      <p className="sr-only" aria-live="polite">
        {stamped ? 'Record stamped and handed to the desk.' : ''}
      </p>

      <StationTop
        code="C8"
        title={stamped ? 'Handed over' : 'Handoff'}
        ratio={stamped ? 1 : 0}
        done={stamped}
        count={stamped ? 'done' : 'last step'}
      />

      <div className="intake__body">
        <Question
          meta={{
            ...HANDOFF_QUESTION,
            question: stamped ? 'Handed to the desk.' : HANDOFF_QUESTION.question,
          }}
        >
          <div className="press" data-stamped={stamped}>
            <span className="press__screw press__screw--tl" aria-hidden="true" />
            <span className="press__screw press__screw--tr" aria-hidden="true" />
            <span className="press__screw press__screw--bl" aria-hidden="true" />
            <span className="press__screw press__screw--br" aria-hidden="true" />
            <div className="press__paper">
              <span className="press__clip" aria-hidden="true" />
              <Sheet record={record} now={now} slips={slips} stamped={stamped} />
            </div>

            <button
              type="button"
              className="stamp"
              data-stamped={stamped}
              aria-label={stamped ? 'Record already stamped' : 'Stamp the record and hand it over'}
              aria-disabled={stamped}
              title={stamped ? 'Handed over' : 'Stamp the record'}
              onClick={stamp}
            >
              <span className="stamp__glow" aria-hidden="true" />
              <span className="stamp__rod" aria-hidden="true" />
              <span className="stamp__ball" aria-hidden="true" />
              <span className="stamp__head" aria-hidden="true" />
              <span className="stamp__plate" aria-hidden="true" />
              <span className="stamp__label" aria-hidden="true">
                {stamped ? 'Filed' : 'Press'}
              </span>
            </button>
          </div>
        </Question>
      </div>

      {stamped ? (
        <div ref={doneRef} className="handoff__done">
          <span className="handoff__status">
            <span className="handoff__dot" aria-hidden="true" />
            <IconCheck size={13} />
            Filed at the desk
          </span>
          <button type="button" className="handoff__next" onClick={onRestart}>
            Next patient
            <IconArrow size={14} />
          </button>
        </div>
      ) : (
        <p className="handoff__hint">
          <IconHand size={13} />
          The desk keeps this sheet. The care plan is yours to take home.
        </p>
      )}
    </div>
  )
}
