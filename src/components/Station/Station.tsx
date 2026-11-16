import type { ReactNode } from 'react'
import { IconCheck, IconEdit } from './icons'

export interface QuestionMetaLike {
  key: string
  /** The line the patient reads. */
  question: string
  hint: string
}

/** The one open question: a line of type, then the instrument that answers it. */
export function Question({ meta, children }: { meta: QuestionMetaLike; children: ReactNode }) {
  return (
    <section className="q" aria-labelledby={`q-${meta.key}`} aria-describedby={`q-${meta.key}-hint`}>
      <h2 className="q__title" id={`q-${meta.key}`}>
        {meta.question}
      </h2>
      <p className="sr-only" id={`q-${meta.key}-hint`}>
        {meta.hint}
      </p>
      <div className="q__body">{children}</div>
    </section>
  )
}

/** An answered question, folded down to one mark and one value. */
export function Receipt({
  glyph,
  label,
  value,
  flag,
  onEdit,
}: {
  glyph: ReactNode
  label: string
  value: ReactNode
  /** A small clinical marker, e.g. a possible pregnancy. */
  flag?: boolean
  onEdit: () => void
}) {
  return (
    <button type="button" className="receipt" onClick={onEdit} aria-label={`Edit ${label}: ${value}`}>
      <span className="receipt__glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="receipt__label">{label}</span>
      <span className="receipt__value">
        {flag && <span className="receipt__flag" aria-hidden="true" />}
        {value}
      </span>
      <span className="receipt__edit" aria-hidden="true">
        <IconEdit size={13} />
      </span>
    </button>
  )
}

/** A station's head: the code, its name, how far through it is. */
export function StationTop({
  code,
  title,
  ratio,
  done,
  count,
}: {
  code: string
  title: string
  ratio: number
  done: boolean
  count: string | null
}) {
  return (
    <header className="intake__top">
      <div className="intake__ring" data-done={done}>
        <svg viewBox="0 0 58 58" aria-hidden="true">
          <defs>
            <linearGradient id="ringArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a5f3fc" />
              <stop offset="0.6" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <circle cx="29" cy="29" r="25" className="ring__track" />
          <circle cx="29" cy="29" r="21.5" className="ring__groove" />
          <circle
            cx="29"
            cy="29"
            r="25"
            className="ring__arc"
            strokeDasharray={2 * Math.PI * 25}
            strokeDashoffset={2 * Math.PI * 25 * (1 - (done ? 1 : ratio))}
            transform="rotate(-90 29 29)"
          />
        </svg>
        <span className="intake__ring-core" aria-hidden="true">
          {done ? <IconCheck size={17} /> : code}
        </span>
      </div>

      <h1 className="intake__title">{title}</h1>
      <span className="intake__rule" aria-hidden="true" />
      {count && (
        <span className="intake__count" aria-hidden="true">
          {count}
        </span>
      )}
    </header>
  )
}

/** The row of question markers in the foot. */
export function Dots({
  items,
  openIndex,
  onPick,
}: {
  items: { key: string; label: string; answered: boolean }[]
  openIndex: number
  onPick: (index: number) => void
}) {
  return (
    <div className="dots" role="group" aria-label="Questions">
      {items.map((q, i) => (
        <button
          key={q.key}
          type="button"
          className="dots__dot"
          data-answered={q.answered}
          data-current={i === openIndex}
          aria-label={`${q.label}${q.answered ? ', answered' : ''}`}
          aria-current={i === openIndex ? 'step' : undefined}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  )
}
