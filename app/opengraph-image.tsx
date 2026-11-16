/* oxlint-disable react/only-export-components -- Next.js image route conventions */
import { ImageResponse } from 'next/og'

export const alt = 'MaxWell — rural triage, one question at a time'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const NODES = [
  { w: 168, h: 96, gem: 44, tone: 'complete' },
  { w: 178, h: 102, gem: 48, tone: 'complete' },
  { w: 186, h: 106, gem: 50, tone: 'active' },
  { w: 178, h: 100, gem: 46, tone: 'pending' },
  { w: 168, h: 94, gem: 42, tone: 'pending' },
]

const bone = {
  complete: 'linear-gradient(160deg, #f0e6d2 0%, #d9cbb0 42%, #b3a184 74%, #8d7c62 100%)',
  active: 'linear-gradient(160deg, #f6eedd 0%, #e2d5ba 40%, #bfae8f 72%, #94836a 100%)',
  pending: 'linear-gradient(160deg, #746a5a 0%, #5c5447 44%, #423c33 76%, #302b24 100%)',
}

const gem = {
  complete: 'linear-gradient(135deg, #a5f3fc 0%, #22d3ee 48%, #0b6b80 100%)',
  active: 'linear-gradient(135deg, #ffffff 0%, #67e8f9 40%, #0e7490 100%)',
  pending: 'linear-gradient(135deg, #3d4b54 0%, #1d2a32 100%)',
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(118deg, #08151e 0%, #040a10 52%, #02060a 100%)',
          padding: '68px 74px',
        }}
      >
        {/* the rail, held to the right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 26,
            bottom: 0,
            width: 440,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 40,
              bottom: 40,
              width: 16,
              display: 'flex',
              background: 'linear-gradient(180deg, #0b6b80 0%, #67e8f9 46%, #0b6b80 100%)',
              opacity: 0.5,
            }}
          />
          {NODES.map((node, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: node.w,
                height: node.h,
                borderRadius: 22,
                border: '1px solid rgba(255,255,255,0.16)',
                background: bone[node.tone as keyof typeof bone],
                boxShadow: '0 18px 34px -22px #000',
              }}
            >
              <div
                style={{
                  width: node.gem,
                  height: node.gem,
                  display: 'flex',
                  borderRadius: 6,
                  background: gem[node.tone as keyof typeof gem],
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(255,255,255,0.45)',
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 680,
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 16,
                height: 16,
                display: 'flex',
                background: 'linear-gradient(135deg, #a5f3fc 0%, #0e7490 100%)',
                transform: 'rotate(45deg)',
              }}
            />
            <div style={{ fontSize: 19, letterSpacing: 7, color: '#67e8f9' }}>
              RURAL TRIAGE · KARNATAKA
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 112, lineHeight: 1, letterSpacing: -4, color: '#eaf6fb' }}>
              MaxWell
            </div>
            <div
              style={{
                display: 'flex',
                width: 86,
                height: 3,
                marginTop: 30,
                background: 'linear-gradient(90deg, #22d3ee 0%, rgba(34,211,238,0) 100%)',
              }}
            />
            <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.4, color: '#9db4c2' }}>
              One question at a time, down the spine.
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 15, letterSpacing: 4, color: '#5d7684' }}>
            SYMPTOMS · VITALS · HISTORY · THE VISIT · THE RECORD
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
