import { FLAG_DETAIL, FLAG_LABELS, type RedFlag } from './types'
import { IconCheck } from '../Station/icons'
import { IconDrop, IconFaint, IconHeart, IconLungs, IconSpiral, IconThermo } from './icons'

const FLAGS: { key: RedFlag; glyph: React.ReactNode }[] = [
  { key: 'chest', glyph: <IconHeart size={22} /> },
  { key: 'breath', glyph: <IconLungs size={22} /> },
  { key: 'faint', glyph: <IconFaint size={22} /> },
  { key: 'bleed', glyph: <IconDrop size={22} /> },
  { key: 'fever', glyph: <IconThermo size={22} /> },
  { key: 'confusion', glyph: <IconSpiral size={22} /> },
]

/* Six plates on a panel, each one a physical switch. Pressed, they light. */
export function FlagPlates({ value, onChange }: { value: RedFlag[] | null; onChange: (v: RedFlag[]) => void }) {
  const on = value ?? []
  const none = value !== null && on.length === 0

  const toggle = (key: RedFlag) => {
    onChange(on.includes(key) ? on.filter((f) => f !== key) : [...on, key])
  }

  return (
    <div className="flags">
      <div className="flags__grid" role="group" aria-label="Warning signs happening now">
        {FLAGS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="flag"
            data-on={on.includes(f.key)}
            aria-pressed={on.includes(f.key)}
            aria-label={FLAG_DETAIL[f.key]}
            onClick={() => toggle(f.key)}
          >
            <span className="flag__plate" aria-hidden="true">
              <span className="flag__glyph">{f.glyph}</span>
              <span className="flag__label">{FLAG_LABELS[f.key]}</span>
              <span className="flag__lamp" />
            </span>
          </button>
        ))}

        <button
          type="button"
          className="flag flag--none"
          data-on={none}
          aria-pressed={none}
          aria-label="None of these"
          onClick={() => onChange([])}
        >
          <span className="flag__plate" aria-hidden="true">
            <span className="flag__glyph">
              <IconCheck size={20} />
            </span>
            <span className="flag__label">None of these</span>
            <span className="flag__lamp" />
          </span>
        </button>
      </div>

      <p className="flags__sos" data-on={on.length > 0} aria-live="polite">
        <span className="flags__beacon" aria-hidden="true" />
        {on.length > 0 ? (
          <>
            This needs an ambulance —{' '}
            <a href="tel:108" className="flags__call">
              call 108
            </a>{' '}
            now.
          </>
        ) : (
          <span className="flags__quiet">Nothing urgent is fine too.</span>
        )}
      </p>
    </div>
  )
}
