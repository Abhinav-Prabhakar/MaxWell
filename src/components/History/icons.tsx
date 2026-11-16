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

export const IconClipboard = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <rect x="4.4" y="4.4" width="15.2" height="16.2" rx="2.4" />
    <path d="M9 4.4V3.6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.8" />
    <path d="M8.4 10.4h7.2M8.4 13.8h7.2M8.4 17.2h4.2" opacity="0.65" />
  </svg>
)

export const IconAlert = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.8 21 19.6H3L12 3.8Z" />
    <path d="M12 9.4v4.6M12 17.2h.01" />
  </svg>
)
