import { IconCalendar, IconCool, IconFood, IconRest, IconSalt, IconSugar, IconWarn, IconWater } from './icons'
import type { CareTile, CheckInKey, FollowUp, WatchSign } from './types'
import { CHECK_IN_LINE } from './types'

const TILE_ICON: Record<string, React.ReactNode> = {
  water: <IconWater size={22} />,
  food: <IconFood size={22} />,
  cool: <IconCool size={22} />,
  salt: <IconSalt size={22} />,
  sugar: <IconSugar size={22} />,
  rest: <IconRest size={22} />,
}

/* The return stub: a bone card the desk clips into the file, with the next
   date under the page edge and a rubber stamp in the corner. */
export function ReturnStub({
  slip,
  facility,
  checkIn,
}: {
  slip: FollowUp
  facility: string
  checkIn: CheckInKey | null
}) {
  return (
    <article className="stub">
      <span className="stub__hole" aria-hidden="true" />
      <span className="stub__stamp" aria-hidden="true">
        Return
      </span>

      <div className="stub__when">
        <span className="stub__in">
          <IconCalendar size={12} />
          {slip.label}
        </span>
        <span className="stub__date">{slip.date}</span>
        <span className="stub__note">{slip.note}</span>
      </div>

      <span className="stub__perf" aria-hidden="true" />

      <div className="stub__where">
        <span className="stub__kicker">Return visit</span>
        <span className="stub__place">{facility}</span>
        {checkIn && (
          <span className="stub__check">
            <span className="stub__check-dot" aria-hidden="true" />
            {CHECK_IN_LINE[checkIn]}
          </span>
        )}
      </div>
    </article>
  )
}

/* Three steel tiles: the whole of what to do at home, one line each. */
export function CareTiles({ tiles }: { tiles: CareTile[] }) {
  return (
    <ul className="ctiles">
      {tiles.map((t) => (
        <li className="ctile" key={t.key} data-tone={t.tone}>
          <span className="ctile__well" aria-hidden="true">
            {TILE_ICON[t.key] ?? <IconWater size={22} />}
          </span>
          <span className="ctile__title">{t.title}</span>
          <span className="ctile__line">{t.line}</span>
        </li>
      ))}
    </ul>
  )
}

/* The signs that mean come back now, hung on a short steel rod. */
export function WatchRail({ signs }: { signs: WatchSign[] }) {
  return (
    <div className="watch">
      <span className="watch__label">
        <IconWarn size={13} />
        Come back if
      </span>
      <span className="watch__rod" aria-hidden="true" />
      <ul className="watch__tags">
        {signs.map((s) => (
          <li className="watch__tag" key={s.key}>
            <span className="watch__mark" aria-hidden="true">
              !
            </span>
            {s.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
