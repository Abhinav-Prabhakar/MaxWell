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

export const IconHospital = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M4.4 20.6V6.4a1.4 1.4 0 0 1 1.4-1.4h12.4a1.4 1.4 0 0 1 1.4 1.4v14.2" />
    <path d="M2.6 20.6h18.8" />
    <path d="M12 7.8v4.4M9.8 10h4.4" />
    <path d="M9.4 20.6v-3.4h5.2v3.4" opacity="0.7" />
  </svg>
)

export const IconClock = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3 1.9" />
  </svg>
)

export const IconToken = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="4.6" opacity="0.55" />
    <path d="M12 3.8v2.6M12 17.6v2.6" opacity="0.6" />
  </svg>
)
