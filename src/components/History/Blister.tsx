import { IconCheck } from '../Station/icons'
import { MEDICINE_OPTIONS, type MedicineKey } from './types'

/* A foil blister of six daily medicines. A pressed pocket is punched through. */
export function Blister({
  value,
  onToggle,
  onNone,
}: {
  value: MedicineKey[] | null
  onToggle: (key: MedicineKey) => void
  onNone: () => void
}) {
  const on = value ?? []
  const none = value !== null && on.length === 0

  return (
    <div className="blister">
      <div className="blister__card">
        <span className="blister__tear" aria-hidden="true" />
        <span className="blister__seam" aria-hidden="true" />

        <div className="blister__grid" role="group" aria-label="Daily medicines">
          {MEDICINE_OPTIONS.map((opt) => {
            const out = on.includes(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                className="pocket"
                data-on={out}
                aria-pressed={out}
                onClick={() => onToggle(opt.key)}
              >
                <span className="pocket__well" aria-hidden="true">
                  <span className="pocket__dome" />
                  <span className="pocket__bite" />
                  <span className="pocket__glint" />
                </span>
                <span className="pocket__label">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button type="button" className="nothing" data-selected={none} onClick={onNone}>
        <span className="nothing__dot" aria-hidden="true">
          <IconCheck size={10} />
        </span>
        Nothing daily
      </button>
    </div>
  )
}
