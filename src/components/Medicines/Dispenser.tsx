import type { Slot, SlotKey } from './types'

/* Three brass tokens in a steel dispenser. The one you take drops out of the
   slot and keeps the light; the others sit back in the feed. */
export function Dispenser({
  slots,
  value,
  onPick,
}: {
  slots: Slot[]
  value: SlotKey | null
  onPick: (key: SlotKey) => void
}) {
  return (
    <div className="slots">
      <div className="slots__plate">
        <span className="slots__slot" aria-hidden="true" />
        <div className="slots__row" role="group" aria-label="Appointment time">
          {slots.map((s) => {
            const on = s.key === value
            return (
              <button
                key={s.key}
                type="button"
                className="token"
                data-on={on}
                aria-pressed={on}
                aria-label={`${s.day}, ${s.time}`}
                onClick={() => onPick(s.key)}
              >
                <span className="token__disc" aria-hidden="true">
                  <span className="token__day">{s.day}</span>
                </span>
                <span className="token__time">{s.time}</span>
                {s.date && <span className="token__date">{s.date}</span>}
              </button>
            )
          })}
        </div>
        <span className="slots__grille" aria-hidden="true" />
        <span className="slots__note">Held for 20 minutes</span>
      </div>
    </div>
  )
}
