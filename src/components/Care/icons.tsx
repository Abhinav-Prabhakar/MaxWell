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

export const IconWater = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.4c3 4.1 5.4 6.8 5.4 9.4a5.4 5.4 0 0 1-10.8 0c0-2.6 2.4-5.3 5.4-9.4Z" />
    <path d="M9.6 13.6a2.6 2.6 0 0 0 2.3 2.8" opacity="0.6" />
  </svg>
)

export const IconFood = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M3.4 11.4h17.2a8.6 8.6 0 0 1-17.2 0Z" />
    <path d="M6.2 8.6c.6-3 2.7-4.4 5.8-4.4s5.2 1.4 5.8 4.4" />
    <path d="M2.6 19.4h18.8" opacity="0.5" />
  </svg>
)

export const IconCool = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.2v17.6M4.4 7.6l15.2 8.8M19.6 7.6 4.4 16.4" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
)

export const IconSalt = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M9 8.2h6l1.6 7.2a3.4 3.4 0 0 1-3.3 4.2h-2.6a3.4 3.4 0 0 1-3.3-4.2Z" />
    <path d="M9.6 8.2c0-2.2 1-3.4 2.4-3.4s2.4 1.2 2.4 3.4" />
    <path d="M10.4 12.4h.01M13.6 12.4h.01M12 15.6h.01" strokeWidth="2" />
  </svg>
)

export const IconSugar = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="m8.2 15.8 6.4-6.4 4.2 4.2-6.4 6.4z" />
    <path d="M5.4 12.6V6.4a1.2 1.2 0 0 1 1.2-1.2h6.2l2.8 2.8" />
    <path d="M5.4 12.6 12 19.2" opacity="0.5" />
  </svg>
)

export const IconRest = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M3.2 18.4v-7.6M3.2 15.2h17.6v3.2" />
    <path d="M6.4 15.2v-5.2a1.2 1.2 0 0 1 1.2-1.2h4.2a2.6 2.6 0 0 1 2.6 2.6v3.8" />
    <path d="M17.2 15.2v-2.4" opacity="0.5" />
  </svg>
)

export const IconWarn = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.8 21 20H3z" />
    <path d="M12 9.4v4.6M12 17.2h.01" strokeWidth="1.8" />
  </svg>
)

export const IconCalendar = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2" />
    <path d="M3.4 9.6h17.2M8.2 3.4v3.4M15.8 3.4v3.4" />
    <path d="M7.6 13.2h2.2M14.2 13.2h2.2M7.6 16.8h2.2" opacity="0.65" />
  </svg>
)

export const IconHouse = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M3.6 11.4 12 4.2l8.4 7.2" />
    <path d="M5.8 10.6v9.2h12.4v-9.2" />
    <path d="M9.8 19.8v-5.2h4.4v5.2" />
  </svg>
)

export const IconClip = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M8.6 3.6h6.8v4.2H8.6z" />
    <path d="M6.8 7.8h10.4v12.6H6.8z" />
  </svg>
)
