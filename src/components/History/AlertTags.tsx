import { IconCheck } from '../Station/icons'
import { ALLERGY_OPTIONS, type AllergyKey } from './types'

/* Three tags to a rod: a wrapped row would leave its rings hanging on air. */
const RODS = Array.from({ length: Math.ceil(ALLERGY_OPTIONS.length / 3) }, (_, r) =>
  ALLERGY_OPTIONS.slice(r * 3, r * 3 + 3),
)

/* Bone tags on steel rods. A tag that is hung turns amber. */
export function AlertTags({
  value,
  onToggle,
  onNone,
}: {
  value: AllergyKey[] | null
  onToggle: (key: AllergyKey) => void
  onNone: () => void
}) {
  const on = value ?? []
  const none = value !== null && on.length === 0

  return (
    <div className="tags">
      <div className="tags__rack" role="group" aria-label="Allergies">
        {RODS.map((rod, r) => (
          <div className="tags__line" key={r}>
            <span className="tags__rail" aria-hidden="true" />
            <div className="tags__row">
              {rod.map((opt) => {
                const hung = on.includes(opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className="tag"
                    data-on={hung}
                    aria-pressed={hung}
                    onClick={() => onToggle(opt.key)}
                  >
                    <span className="tag__ring" aria-hidden="true" />
                    <span className="tag__plate">
                      <span className="tag__hole" aria-hidden="true" />
                      <span className="tag__label">{opt.label}</span>
                      <span className="tag__mark" aria-hidden="true">
                        !
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="nothing" data-selected={none} onClick={onNone}>
        <span className="nothing__dot" aria-hidden="true">
          <IconCheck size={10} />
        </span>
        No allergies
      </button>
    </div>
  )
}
