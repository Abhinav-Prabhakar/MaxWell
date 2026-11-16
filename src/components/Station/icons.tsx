import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconAge = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="13" r="7.2" />
    <path d="M12 9.6V13l2.4 1.6" />
    <path d="M9.4 4.2h5.2" opacity="0.6" />
  </svg>
)

export const IconSex = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="8.4" r="3.1" />
    <path d="M12 11.5v3.1" />
    <path d="M8.6 21c0-4 1.6-6.4 3.4-6.4S15.4 17 15.4 21" />
  </svg>
)

export const IconPregnant = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8.2" opacity="0.45" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
)

export const IconLocation = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 21s6.2-6 6.2-10.4A6.2 6.2 0 0 0 5.8 10.6C5.8 15 12 21 12 21Z" />
    <circle cx="12" cy="10.4" r="2.2" />
  </svg>
)

export const IconSupport = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 20.2c4.6-2.1 7.4-5 7.4-8.6a4 4 0 0 0-7.4-2.3 4 4 0 0 0-7.4 2.3c0 3.6 2.8 6.5 7.4 8.6Z" />
  </svg>
)

export const IconEdit = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M15.6 4.9l3.5 3.5M5 19l.9-3.9 8.9-8.9a1.6 1.6 0 0 1 2.3 0l1.5 1.5a1.6 1.6 0 0 1 0 2.3l-8.9 8.9L5 19Z" />
  </svg>
)

export const IconCheck = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M4.8 12.6l4.4 4.3L19.2 6.9" />
  </svg>
)

export const IconArrow = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 12h13" />
    <path d="M13 6.8l5.2 5.2L13 17.2" />
  </svg>
)

export const IconTarget = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="7.6" opacity="0.5" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3" opacity="0.7" />
  </svg>
)

export const IconWheelchair = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="10.4" cy="4.6" r="1.9" />
    <path d="M10.6 8.2v5.2h5.2l2.4 6" />
    <path d="M10.6 10.6H7.2" />
    <circle cx="9.4" cy="17.4" r="3.6" />
  </svg>
)

export const IconEar = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 14.4v-2.2a8 8 0 0 1 16 0v2.2" />
    <rect x="2.4" y="13.6" width="4.6" height="7" rx="2.2" />
    <rect x="17" y="13.6" width="4.6" height="7" rx="2.2" />
  </svg>
)

export const IconEye = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
)

export const IconSpeech = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M20.4 11.4c0 3.9-3.8 7-8.4 7a9.8 9.8 0 0 1-2.6-.35L5 20l1.1-3.1a6.4 6.4 0 0 1-2.5-5c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7Z" />
    <path d="M8.8 11.4h.01M12 11.4h.01M15.2 11.4h.01" strokeWidth="2" />
  </svg>
)

export const IconMinus = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M5.6 12h12.8" />
  </svg>
)

export const IconAmbulance = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M2.6 15.6V8.4h10.2v7.2" />
    <path d="M12.8 10.2h3.4l3.2 3v2.4" />
    <circle cx="6.8" cy="17.4" r="1.9" />
    <circle cx="16.4" cy="17.4" r="1.9" />
    <path d="M8.7 12h3.2M10.3 10.4v3.2" />
  </svg>
)

export const IconPill = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <rect x="4" y="9" width="16" height="6.4" rx="3.2" transform="rotate(-36 12 12.2)" />
    <path d="M9.6 15.3 14.4 8.9" />
  </svg>
)
