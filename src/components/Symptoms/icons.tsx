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

export const IconBody = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="4.6" r="2.4" />
    <path d="M8 21v-4.4L6.4 11l2-2.2h7.2l2 2.2L16 16.6V21" />
    <path d="M6.4 11 4.6 14" />
    <path d="M17.6 11 19.4 14" />
  </svg>
)

export const IconClock = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="7.6" />
    <path d="M12 7.8v4.4l2.9 1.9" />
  </svg>
)

export const IconPulse = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M2.6 12.4h4.2l2-5.4 3.1 10.4 2.3-5h7.2" />
  </svg>
)

export const IconSiren = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M6.6 15.4v-2.6a5.4 5.4 0 0 1 10.8 0v2.6" />
    <rect x="4.2" y="15.2" width="15.6" height="3.6" rx="1.8" />
    <path d="M12 4.2V6M5.2 6.6l1.3 1.3M18.8 6.6l-1.3 1.3" opacity="0.8" />
  </svg>
)

export const IconHeart = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 20.6S4.4 15.8 4.4 10.4a4.5 4.5 0 0 1 7.6-2.9 4.5 4.5 0 0 1 7.6 2.9c0 5.4-7.6 10.2-7.6 10.2Z" />
    <path d="M6.6 10.8h2.2l1.2-2 1.6 4 1.2-2h2.6" opacity="0.85" />
  </svg>
)

export const IconLungs = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.4v8.2" />
    <path d="M11.2 7.6c-2.4 0-3.2 3-3.4 5.4-.2 2.4-1.4 4.4-.2 5.4 1.5 1.2 4.2.2 4.6-2.1.3-1.7-.4-3.4-.6-5-.2-1.8-.4-3.7-.4-3.7Z" />
    <path d="M12.8 7.6c2.4 0 3.2 3 3.4 5.4.2 2.4 1.4 4.4.2 5.4-1.5 1.2-4.2.2-4.6-2.1-.3-1.7.4-3.4.6-5 .2-1.8.4-3.7.4-3.7Z" />
  </svg>
)

export const IconDrop = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.2c2.9 3.9 5.1 6.5 5.1 9.3a5.1 5.1 0 0 1-10.2 0c0-2.8 2.2-5.4 5.1-9.3Z" />
    <path d="M9.8 12.6a2.2 2.2 0 0 0 2.2 2.2" opacity="0.7" />
  </svg>
)

export const IconThermo = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M10.4 13.8V5.4a1.6 1.6 0 0 1 3.2 0v8.4a3.8 3.8 0 1 1-3.2 0Z" />
    <path d="M12 8.6v5.6" />
    <path d="M15.8 6.4h1.8M15.8 9.4h1.4M15.8 12.4h1.8" opacity="0.7" />
  </svg>
)

export const IconSpiral = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12.8 12a1.5 1.5 0 1 1-1.5-1.5 3.3 3.3 0 1 1-3.3 3.3 5.1 5.1 0 1 1 5.1-5.1 6.9 6.9 0 0 1-6.9 6.9" />
  </svg>
)

export const IconFaint = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="16.2" cy="6.4" r="2.2" />
    <path d="M14.2 8.8 9.4 11.4l2.2 2.4" />
    <path d="M9.4 11.4 6.2 14.4" />
    <path d="M11.6 13.8l-1.8 3.8" />
    <path d="M2.8 20.2h18.4" opacity="0.8" />
  </svg>
)

