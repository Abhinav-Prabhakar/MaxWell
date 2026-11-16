import { KIND_LABEL, type Facility } from './facilities'
import type { Slot } from './types'

/* The brass slip the desk hands over: when, where, and a serial the file
   already knows. */
export function Visit({ facility, slot, serial }: { facility: Facility; slot: Slot; serial: string }) {
  return (
    <div className="visit">
      <div className="visit__stub">
        <span className="visit__day">{slot.day}</span>
        <span className="visit__time">{slot.time}</span>
        {slot.date && <span className="visit__date">{slot.date}</span>}
      </div>

      <span className="visit__perf" aria-hidden="true" />

      <div className="visit__body">
        <span className="visit__kicker">Outpatient token</span>
        <span className="visit__place">{facility.name}</span>
        <span className="visit__meta">
          {facility.km} km · about {facility.minutes} min · {KIND_LABEL[facility.kind]}
        </span>
      </div>

      <span className="visit__serial" aria-hidden="true">
        № {serial}
      </span>

      <span className="visit__notch visit__notch--top" aria-hidden="true" />
      <span className="visit__notch visit__notch--bottom" aria-hidden="true" />
    </div>
  )
}
