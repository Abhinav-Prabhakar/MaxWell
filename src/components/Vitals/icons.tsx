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

export const IconThermometer = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M10.4 13.8V5.4a1.6 1.6 0 0 1 3.2 0v8.4a3.8 3.8 0 1 1-3.2 0Z" />
    <path d="M12 8.6v5.6" />
    <path d="M15.8 6.4h1.8M15.8 9.4h1.4M15.8 12.4h1.8" opacity="0.65" />
  </svg>
)

export const IconBeat = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M2.6 12.4h4.2l2-5.4 3.1 10.4 2.3-5h7.2" />
  </svg>
)

export const IconGauge = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="M12 18 15.4 10" />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
    <path d="M4.6 13.4h2.2M17.2 13.4h2.2M6.6 8.6l1.6 1.6M17.4 8.6l-1.6 1.6" opacity="0.55" />
  </svg>
)

export const IconOxygen = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.4c2.6 3.2 5 5.6 5 9.1a5 5 0 0 1-10 0c0-3.5 2.4-5.9 5-9.1Z" />
    <path d="M9.8 12.6h4.4M12 10.4v4.4" opacity="0.7" />
  </svg>
)
