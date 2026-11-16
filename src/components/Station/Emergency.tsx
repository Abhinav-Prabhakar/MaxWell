import type { ReactNode } from 'react'
import { IconAmbulance } from './icons'
import './emergency.css'

/** The end of the visit: the one card that stops the questionnaire and asks for
 *  an ambulance. C2 reaches it through red flags, C3 through critical vitals. */
export function EmergencyCard({
  head,
  line,
  where,
  onReview,
}: {
  head: string
  line: ReactNode
  where: ReactNode
  onReview: () => void
}) {
  return (
    <div className="sos" role="alert">
      <div className="sos__beacon" aria-hidden="true">
        <span className="sos__ring" />
        <span className="sos__ring" />
        <span className="sos__core">
          <IconAmbulance size={30} />
        </span>
      </div>

      <h2 className="sos__head">{head}</h2>
      <p className="sos__line">{line}</p>

      <a className="sos__call" href="tel:108">
        <IconAmbulance size={18} />
        Call 108
      </a>

      <p className="sos__where">{where}</p>

      <button type="button" className="sos__review" onClick={onReview}>
        Review my answers
      </button>
    </div>
  )
}
