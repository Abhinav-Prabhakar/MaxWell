import type { Plan } from './types'

/* A steel tray of capsules and one engraved line each: what to take, how
   much, when, and why it was chosen. */
export function Tray({ plan }: { plan: Plan }) {
  if (plan.empty) {
    return (
      <div className="tray">
        <div className="tray__plate tray__plate--calm">
          <span className="tray__calm-mark" aria-hidden="true">
            ❯
          </span>
          <span className="tray__calm-title">Nothing to take today</span>
          <span className="tray__calm-line">Rest, drink water, and come back if the fever climbs.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="tray">
      <div className="tray__plate">
        <span className="tray__rim" aria-hidden="true" />
        <ul className="tray__list">
          {plan.doses.map((d) => (
            <li className="dose" key={d.key}>
              <span className="dose__well" aria-hidden="true">
                <span className="dose__capsule" data-tone={d.key === 'paracetamol' ? 'amber' : 'teal'} />
              </span>
              <span className="dose__text">
                <span className="dose__line">
                  <span className="dose__name">{d.name}</span>
                  <span className="dose__dose">{d.dose}</span>
                </span>
                <span className="dose__when">{d.when}</span>
                <span className="dose__why">{d.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {plan.notes.length > 0 && (
        <ul className="tray__notes">
          {plan.notes.map((n) => (
            <li className="tray__note" key={n}>
              <span className="tray__note-dot" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
