import { Medallion } from '../Intake/Choices'
import type { CheckInKey } from './types'

const OPTIONS: { value: CheckInKey; label: string; glyph: React.ReactNode }[] = [
  {
    value: 'home',
    label: 'Someone at home',
    glyph: (
      <>
        <path d="M55 86 86 60l31 26" />
        <path d="M63 84v36h46V84" />
        <path d="M78 120v-20h16v20" />
      </>
    ),
  },
  {
    value: 'neighbour',
    label: 'A neighbour',
    glyph: (
      <>
        <circle cx="70" cy="76" r="12" />
        <path d="M50 122c0-14 9-22 20-22s20 8 20 22" />
        <circle cx="112" cy="84" r="10" opacity="0.7" />
        <path d="M96 122c0-12 7-18 16-18s16 6 16 18" opacity="0.7" />
      </>
    ),
  },
  {
    value: 'alone',
    label: 'No one tonight',
    glyph: (
      <>
        <circle cx="78" cy="72" r="13" />
        <path d="M56 122c0-14 10-23 22-23s22 9 22 23" />
        <path d="M112 86v24M126 86v24M110 100h18M114 110v14M124 110v14" opacity="0.6" />
      </>
    ),
  },
]

/* Who is around tonight — three bone medallions, same seal language as C1. */
export function CheckIn({ value, onChange }: { value: CheckInKey | null; onChange: (v: CheckInKey) => void }) {
  const roving = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === value),
  )

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const at = OPTIONS.findIndex((o) => o.value === value)
    onChange(OPTIONS[(at + dir + OPTIONS.length) % OPTIONS.length].value)
  }

  return (
    <div className="meds care-check" role="radiogroup" aria-label="Who is with you tonight" onKeyDown={onKey}>
      {OPTIONS.map((o, i) => (
        <Medallion
          key={o.value}
          selected={value === o.value}
          checked={value === o.value}
          tabIndex={i === roving ? 0 : -1}
          label={o.label}
          glyph={o.glyph}
          onSelect={() => onChange(o.value)}
        />
      ))}
    </div>
  )
}
