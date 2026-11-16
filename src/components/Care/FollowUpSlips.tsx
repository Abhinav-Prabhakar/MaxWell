import type { CSSProperties } from 'react'
import type { FollowUp, FollowUpKey } from './types'

/* Three bone return slips in a steel tray, fanned like a card index. The brass
   tab on each edge carries the interval; the chosen slip slides out of the
   stack and keeps the light. */
export function FollowUpSlips({
  slips,
  value,
  suggested,
  onPick,
}: {
  slips: FollowUp[]
  value: FollowUpKey | null
  suggested: FollowUpKey
  onPick: (key: FollowUpKey) => void
}) {
  const roving = Math.max(
    0,
    slips.findIndex((s) => s.key === value),
  )

  return (
    <div className="slips" role="radiogroup" aria-label="Follow-up date">
      <div className="slips__tray">
        <span className="slips__clip" aria-hidden="true" />
        {slips.map((s, i) => {
          const on = s.key === value
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${s.label}, ${s.date}${s.key === suggested ? ', suggested' : ''}`}
              tabIndex={i === roving ? 0 : -1}
              className="slip"
              data-on={on}
              data-sug={s.key === suggested}
              style={{ '--i': i } as CSSProperties}
              onClick={() => onPick(s.key)}
              onKeyDown={(e) => {
                const step =
                  e.key === 'ArrowDown' || e.key === 'ArrowRight'
                    ? 1
                    : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
                      ? -1
                      : 0
                if (!step) return
                e.preventDefault()
                const next = (i + step + slips.length) % slips.length
                onPick(slips[next].key)
                const cards = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.slip')
                cards?.[next]?.focus()
              }}
            >
              <span className="slip__tab" aria-hidden="true">
                {s.label}
              </span>
              <span className="slip__date">{s.date}</span>
              <span className="slip__note">{s.note}</span>
              {s.key === suggested && (
                <span className="slip__sug" aria-hidden="true">
                  <span className="slip__pin" />
                  Suggested
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
