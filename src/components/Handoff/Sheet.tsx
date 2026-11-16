import { useMemo } from 'react'
import { CHECK_IN_LINE, type FollowUp } from '../Care/types'
import type { BodyArea } from '../Symptoms/types'
import { AREA_LABELS, FLAG_LABELS, ONSET_LABELS, severityWord } from '../Symptoms/types'
import { IconEar, IconEye, IconSpeech, IconWheelchair } from '../Station/icons'
import { SUPPORT_LABELS, type SupportNeed } from '../Intake/types'
import { planOf, slotOf, slotsOf, whenOf } from '../Medicines/types'
import { QrMark } from './QrMark'
import { IconRecord, IconSexMark } from './icons'
import {
  chipsOf,
  facilityOf,
  placeOf,
  qrPayload,
  returnDateOf,
  serialOfRecord,
  stampOf,
  vitalsOf,
  type HandoffRecord,
} from './types'

const SEX_LABEL = { female: 'Female', male: 'Male', intersex: 'Intersex' } as const

const SUPPORT_ICON = {
  wheelchair: IconWheelchair,
  hearing: IconEar,
  vision: IconEye,
  interpreter: IconSpeech,
} as const

/* ------------------------------------------------------------ body diagram */

const ARM =
  'M31.5 36C26 42 23 52 21 64 19.5 72 18.5 80 17.5 86 16 88 13.5 87.5 13 86 15 74 17 60 20.5 48 23 40 26 34.5 29 32.5Z'
const LEG = 'M38.5 88C36.5 98 35.5 112 35 128 34.8 133 34.5 136 33 136 30.5 136 29.5 134.5 29.5 131.5 30.5 116 31 100 32.5 88Z'

function BodyAreaShape({ area, className }: { area: BodyArea; className: string }) {
  if (area === 'head') {
    return (
      <g className={className}>
        <circle cx="45" cy="16" r="9.6" />
        <rect x="41" y="24" width="8" height="7" rx="3" />
      </g>
    )
  }
  if (area === 'chest') {
    return (
      <path
        className={className}
        d="M31 34C36 29.5 54 29.5 59 34 61.5 44 60 55 58 64 52 67.5 38 67.5 32 64 30 55 28.5 44 31 34Z"
      />
    )
  }
  if (area === 'belly') {
    return (
      <path
        className={className}
        d="M32 64C38 67.5 52 67.5 58 64 57 73 55 81 52 87 48 89.5 42 89.5 38 87 35 81 33 73 32 64Z"
      />
    )
  }
  if (area === 'armL') return <path className={className} d={ARM} />
  if (area === 'armR') {
    return (
      <g transform="translate(90 0) scale(-1 1)">
        <path className={className} d={ARM} />
      </g>
    )
  }
  if (area === 'legL') return <path className={className} d={LEG} />
  return (
    <g transform="translate(90 0) scale(-1 1)">
      <path className={className} d={LEG} />
    </g>
  )
}

const ALL_AREAS: BodyArea[] = ['head', 'chest', 'belly', 'armL', 'armR', 'legL', 'legR']

function BodyMark({ areas }: { areas: BodyArea[] }) {
  const label = areas.length ? areas.map((a) => AREA_LABELS[a]).join(', ') : 'No area marked'
  return (
    <svg className="hs__body" viewBox="0 0 90 146" role="img" aria-label={label}>
      <g className="hs__body-base">
        {ALL_AREAS.map((a) => (
          <BodyAreaShape key={a} area={a} className="hs__body-part" />
        ))}
      </g>
      <g className="hs__body-hit">
        {areas.map((a) => (
          <BodyAreaShape key={a} area={a} className="hs__body-lit" />
        ))}
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------ barcode */

function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const source = `${seed}-maxwell`
    return Array.from({ length: 28 }, (_, i) => 1 + ((source.charCodeAt(i % source.length) * 7 + i * 5) % 3))
  }, [seed])

  return (
    <span className="hs__bars" aria-hidden="true">
      {bars.map((w, i) => (
        <i key={i} style={{ width: `${w}px` }} />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------ the sheet */

export function Sheet({
  record,
  now,
  slips,
  stamped,
}: {
  record: HandoffRecord
  now: Date
  slips: FollowUp[]
  stamped: boolean
}) {
  const serial = serialOfRecord(record)
  const stamp = stampOf(now)
  const facility = facilityOf(record)
  const place = placeOf(record.intake.location)
  const vitals = vitalsOf(record.vitals)
  const chips = chipsOf(record.history)
  const shown = chips.slice(0, 8)
  const rest = Math.max(0, chips.length - 8)
  const plan = planOf(record.file)
  const back = returnDateOf(record.care, slips)
  const slot = slotOf(record.medicines.slot, slotsOf(now))
  const areas = record.symptoms.areas
  const flags = record.symptoms.flags ?? []
  const severity = record.symptoms.severity
  const supports = record.intake.support.filter(
    (s): s is Exclude<SupportNeed, 'none'> => s !== 'none',
  )
  const payload = qrPayload(record, now)

  return (
    <article className="sheet" data-stamped={stamped} aria-label={`Visit record, number ${serial}`}>
      <header className="hs__top">
        <div className="hs__brand">
          <span className="hs__kicker">
            <IconRecord size={9} />
            Triage record
          </span>
          <span className="hs__clinic">{facility.name}</span>
          {slot && <span className="hs__visit">Visit {whenOf(slot)}</span>}
        </div>
        <div className="hs__meta">
          <span className="hs__no">
            <i>№</i> {serial}
          </span>
          <span className="hs__filed">
            {stamp.date} · {stamp.time}
          </span>
        </div>
      </header>

      <div className="hs__route" aria-hidden="true">
        {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'].map((code) => (
          <span className="hs__stop" key={code}>
            <i className="hs__stone" />
            {code}
          </span>
        ))}
      </div>

      <section className="hs__sec">
        <span className="hs__label">Patient</span>
        <div className="hs__id">
          <span className="hs__age">{record.intake.age ?? '—'}</span>
          <span className="hs__age-unit">years</span>
          {record.intake.sex && (
            <span className="hs__sex">
              <IconSexMark sex={record.intake.sex} size={13} />
              {SEX_LABEL[record.intake.sex]}
            </span>
          )}
          {record.intake.pregnant === true && <span className="hs__prego">Possible pregnancy</span>}
          {supports.length > 0 && (
            <span className="hs__supports">
              {supports.map((s) => {
                const Icon = SUPPORT_ICON[s]
                return (
                  <span className="hs__support" key={s}>
                    <Icon size={12} />
                    <span className="sr-only">{SUPPORT_LABELS[s]}</span>
                  </span>
                )
              })}
            </span>
          )}
        </div>
        <div className="hs__place">
          <i className="hs__place-dot" aria-hidden="true" />
          {place} · {facility.km} km to the clinic
        </div>
      </section>

      <section className="hs__sec">
        <span className="hs__label">Readings</span>
        <div className="hs__vitals">
          {vitals.map((v) => (
            <div className="hs__vital" key={v.key} data-tone={v.tone} data-empty={v.empty}>
              <span className="hs__vital-k">{v.label}</span>
              <span className="hs__vital-v">
                {v.value}
                {v.unit && <i>{v.unit}</i>}
              </span>
              <span className="hs__vital-bar">
                <i style={{ width: `${(v.ratio ?? 0) * 100}%` }} />
              </span>
              <span className="hs__vital-w">{v.word}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hs__sec">
        <span className="hs__label">Symptoms</span>
        <div className="hs__symptoms">
          <BodyMark areas={areas} />
          <div className="hs__sym">
            <span className="hs__areas">
              {areas.length ? areas.map((a) => AREA_LABELS[a]).join(' · ') : 'None marked'}
            </span>
            <span className="hs__sev">
              <span className="hs__sev-cells" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <i className="hs__sev-cell" key={i} data-on={severity !== null && i < severity} />
                ))}
              </span>
              <span className="hs__sev-word">
                {severity !== null ? `${severity}/10 · ${severityWord(severity)}` : 'Not rated'}
              </span>
            </span>
            <span className="hs__onset">
              {record.symptoms.onset
                ? `Started ${ONSET_LABELS[record.symptoms.onset].toLowerCase()}`
                : 'Onset not recorded'}
            </span>
            {flags.length > 0 ? (
              <span className="hs__flags">
                {flags.map((f) => (
                  <span className="hs__flag" key={f}>
                    {FLAG_LABELS[f]}
                  </span>
                ))}
              </span>
            ) : (
              <span className="hs__calm">No red flags</span>
            )}
          </div>
        </div>
      </section>

      <section className="hs__sec">
        <span className="hs__label">History</span>
        {chips.length > 0 ? (
          <div className="hs__chips">
            {shown.map((c) => (
              <span className="hs__chip" key={c.key} data-tone={c.tone}>
                {c.label}
              </span>
            ))}
            {rest > 0 && <span className="hs__chip">+{rest}</span>}
          </div>
        ) : (
          <span className="hs__none">Nothing on file</span>
        )}
      </section>

      <section className="hs__sec">
        <span className="hs__label">Take home</span>
        {plan.doses.length > 0 ? (
          <div className="hs__blister">
            {plan.doses.map((d) => (
              <span className="hs__dose" key={d.key}>
                <i className="hs__pill" aria-hidden="true" />
                <b>{d.name}</b>
                <i className="hs__dose-n">{d.dose}</i>
              </span>
            ))}
          </div>
        ) : (
          <span className="hs__none">No medicine today</span>
        )}
        {plan.notes[0] && <span className="hs__note">{plan.notes[0]}</span>}
      </section>

      <div className="hs__bottom">
        <div className="hs__plan">
          <span className="hs__label">Return</span>
          <div className="hs__return">
            <span className="hs__return-d">{back?.date ?? 'Date at the desk'}</span>
            <span className="hs__return-w">{back?.note ?? 'morning OPD'}</span>
          </div>
          <span className="hs__return-f">{facility.name}</span>
          {record.care.checkIn && <span className="hs__tonight">{CHECK_IN_LINE[record.care.checkIn]}</span>}
        </div>

        <div className="hs__code">
          <QrMark value={payload} className="hs__qr" />
          <span className="hs__code-k">File code · № {serial}</span>
        </div>
      </div>

      <footer className="hs__foot">
        <Barcode seed={serial} />
        <span className="hs__foot-note">
          {place} · {stamp.long}
        </span>
      </footer>

      <span className="sheet__stamp" aria-hidden="true">
        <span className="sheet__stamp-in">
          <b>Handed over</b>
          <span>{stamp.date}</span>
          <span>Maxwell · C7</span>
        </span>
      </span>
    </article>
  )
}
