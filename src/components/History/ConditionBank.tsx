import { IconCheck } from '../Station/icons'
import { CONDITION_OPTIONS, type ConditionKey } from './types'

/* Eight toggle switches on one steel plate. Each flip sets a lamp. */
export function ConditionBank({
  value,
  onToggle,
  onNone,
}: {
  value: ConditionKey[] | null
  onToggle: (key: ConditionKey) => void
  onNone: () => void
}) {
  const on = value ?? []
  const none = value !== null && on.length === 0

  return (
    <div className="bank">
      <div className="bank__plate">
        <span className="bank__groove" aria-hidden="true" />

        <div className="bank__grid" role="group" aria-label="Long-term conditions">
          {CONDITION_OPTIONS.map((opt) => {
            const lit = on.includes(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                className="switch"
                data-on={lit}
                aria-pressed={lit}
                onClick={() => onToggle(opt.key)}
              >
                <span className="switch__lamp" aria-hidden="true" />
                <span className="switch__slot" aria-hidden="true">
                  <span className="switch__lever">
                    <span className="switch__ridge" />
                  </span>
                </span>
                <span className="switch__label">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button type="button" className="nothing" data-selected={none} onClick={onNone}>
        <span className="nothing__dot" aria-hidden="true">
          <IconCheck size={10} />
        </span>
        None of these
      </button>
    </div>
  )
}
