import { useEffect, useRef } from 'react'
import { Question, StationTop } from '../Station/Station'
import { IconCheck, IconEye } from '../Station/icons'
import { useSecondRead } from './useSecondRead'
import { concernOf, localRead, type ClinicalRead, type ReadInput } from './types'
import './read.css'

const REASON: Record<string, string> = {
  busy: 'The reader is busy. This is the clinic’s own read.',
  offline: 'No second reader on this connection. This is the clinic’s own read.',
  timeout: 'The reader took too long. This is the clinic’s own read.',
  unreadable: 'The reader’s answer was unclear. This is the clinic’s own read.',
  upstream: 'The reader is unreachable. This is the clinic’s own read.',
}

const LIKELIHOOD_LABEL = { likely: 'likely', possible: 'possible', unlikely: 'unlikely' } as const

const capitalize = (line: string) => (line ? line[0].toUpperCase() + line.slice(1) : line)
const BEADS = { likely: 3, possible: 2, unlikely: 1 } as const

/** The reader's own clock, on the slip. */
const stampOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

function SourceTag({ read }: { read: ClinicalRead }) {
  return (
    <span className="rslip__tag" data-source={read.source}>
      {read.source === 'model' ? read.by.replace(/-latest$/, '').replace(/-/g, ' ') : read.by}
    </span>
  )
}

function Conditions({ read }: { read: ClinicalRead }) {
  return (
    <ol className="rslip__conds" aria-label="Possibilities">
      {read.conditions.map((c) => (
        <li className="rslip__cond" key={c.name} data-l={c.likelihood}>
          <span className="rslip__beads" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <i key={i} data-on={i < BEADS[c.likelihood]} />
            ))}
          </span>
          <span className="rslip__name">{capitalize(c.name)}</span>
          <span className="rslip__why">{c.why}</span>
          <span className="sr-only">{LIKELIHOOD_LABEL[c.likelihood]}</span>
        </li>
      ))}
    </ol>
  )
}

function Watch({ read }: { read: ClinicalRead }) {
  if (read.watch.length === 0) return null
  return (
    <div className="rslip__watch">
      <span className="rslip__watch-k">Come back if</span>
      <ul className="rslip__watch-list">
        {read.watch.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  )
}

/* The station: a steel reader holding one slip of file, and a second pair of
   eyes over it. The model is the second reader; the clinic's rulebook answers
   when it cannot, so the desk is never left with a blank page. */
export function SecondRead({
  input,
  onRead,
  onNext,
}: {
  input: ReadInput
  onRead: () => void
  onNext: () => void
}) {
  const { status, read, reason, at, again } = useSecondRead(input)
  /* The rulebook answer is deterministic, so it is safe to build during render
     as long as it keeps the time the request failed. */
  const shown = read ?? (status === 'error' && at ? localRead(input, at) : null)
  const ours = concernOf(input)

  /* The rail moves on the moment the read lands: this station has no
     question to file, the slip is the answer. */
  const reported = useRef(false)
  useEffect(() => {
    if (!shown || reported.current) return
    reported.current = true
    onRead()
  }, [shown, onRead])

  const ready = shown !== null
  const quiet = reason ? REASON[reason] ?? REASON.offline : null

  return (
    <div className="intake second-read" data-state={status}>
      <StationTop
        code="C7"
        title="Second read"
        ratio={ready ? 1 : 0.35}
        done={ready}
        count={status === 'loading' ? 'reading' : 'ready'}
      />

      <p className="sr-only" aria-live="polite">
        {shown
          ? `Second read: ${shown.read}`
          : status === 'loading'
            ? 'The file is with a second reader.'
            : ''}
      </p>

      <div className="intake__body">
        <Question
          meta={{
            key: 'read',
            question: ready ? 'One more pair of eyes.' : 'Reading the file.',
            hint:
              'The file goes to a second reader before it is handed over. It is not a diagnosis; it names possibilities and the signs that mean come back.',
          }}
        >
          <div className="reader" data-state={status} aria-busy={status === 'loading'}>
            <div className="reader__housing">
              <span className="reader__screw reader__screw--tl" aria-hidden="true" />
              <span className="reader__screw reader__screw--tr" aria-hidden="true" />
              <span className="reader__screw reader__screw--bl" aria-hidden="true" />
              <span className="reader__screw reader__screw--br" aria-hidden="true" />
              <span className="reader__lamp" aria-hidden="true" />

              <div className="reader__glass">
                <span className="reader__rail reader__rail--top" aria-hidden="true" />
                <span className="reader__rail reader__rail--bottom" aria-hidden="true" />
                <span className="reader__sweep" aria-hidden="true" />

                {shown ? (
                  <div className="rslip" key={shown.at}>
                    <div className="rslip__head">
                      <span className="rslip__kicker">
                        <IconEye size={10} />
                        Second read
                      </span>
                      <span className="rslip__meta">
                        <SourceTag read={shown} />
                        <span className="rslip__at">{stampOf(shown.at)}</span>
                      </span>
                    </div>

                    <p className="rslip__line">{capitalize(shown.read)}</p>

                    <Conditions read={shown} />
                    <Watch read={shown} />

                    <div className="rslip__foot">
                      <span className="rslip__note">A second read, not a diagnosis.</span>
                      {shown.concern !== ours && (
                        <span className="rslip__gap" data-cautious={shown.concern === 'calm'}>
                          {shown.concern === 'calm'
                            ? 'The clinic would watch this more closely'
                            : 'The reader sees more to watch'}
                        </span>
                      )}
                      {!quiet && (
                        <button type="button" className="rslip__again" onClick={again}>
                          Read again
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rslip rslip--latent" aria-hidden="true">
                    <div className="rslip__head">
                      <span className="rslip__kicker">
                        <IconEye size={10} />
                        Second read
                      </span>
                      <span className="rslip__meta">
                        <span className="rslip__tag">waiting</span>
                      </span>
                    </div>
                    <span className="rslip__ghost rslip__ghost--a" />
                    <span className="rslip__ghost rslip__ghost--b" />
                    <span className="rslip__ghost rslip__ghost--c" />
                    <div className="rslip__ghost-rows">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="rslip__ghost-row">
                          <i />
                          <i />
                        </span>
                      ))}
                    </div>
                    <span className="rslip__latent-note">The same sheet, one more reader.</span>
                  </div>
                )}
              </div>

              <div className="reader__foot">
                <span className="reader__lampdot" aria-hidden="true" />
                {status === 'loading'
                  ? 'Reading'
                  : quiet ?? (shown?.source === 'model' ? 'Answered' : 'Clinic copy')}
                {quiet && (
                  <button type="button" className="reader__retry" onClick={again}>
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        </Question>
      </div>

      {ready && (
        <div className="next">
          <button type="button" className="next__go" onClick={onNext}>
            <span className="next__pulse" aria-hidden="true" />
            <span className="next__name">C8 · Handoff</span>
            <span className="next__glyph" aria-hidden="true">
              <IconCheck size={15} />
            </span>
          </button>
        </div>
      )}

      <p className="second-read__note">
        <IconCheck size={11} />
        The plan is unchanged. The record still goes to the desk.
      </p>
    </div>
  )
}
