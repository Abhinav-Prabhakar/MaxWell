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

/** The small mark beside the age: registered sex at birth. */
export const IconSexMark = ({ sex, size = 14 }: { sex: 'female' | 'male' | 'intersex'; size?: number }) => {
  if (sex === 'female') {
    return (
      <svg {...base(size)}>
        <circle cx="12" cy="9" r="5" />
        <path d="M12 14v6M9.2 17.4h5.6" />
      </svg>
    )
  }
  if (sex === 'male') {
    return (
      <svg {...base(size)}>
        <circle cx="10.2" cy="13.8" r="5" />
        <path d="M13.8 10.2 19 5M14.6 5H19v4.4" />
      </svg>
    )
  }
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="5.2" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 3.2v3.4M12 17.4v3.4M3.2 12h3.4M17.4 12h3.4" />
    </svg>
  )
}

export const IconRecord = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M6 3.4h8.4L19 8v12.6H6z" />
    <path d="M14.2 3.6V8H19" />
    <path d="M8.8 11.6h7M8.8 14.6h7M8.8 17.6h4.2" opacity="0.7" />
  </svg>
)

export const IconHand = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M8.4 12.6V5.4a1.6 1.6 0 0 1 3.2 0v5.2" />
    <path d="M11.6 10.6V4.2a1.6 1.6 0 0 1 3.2 0v6.4" />
    <path d="M14.8 10.8V6.2a1.6 1.6 0 0 1 3.2 0v8.4a6 6 0 0 1-6 6h-1.4a5.4 5.4 0 0 1-5.4-5.4v-2.4a1.6 1.6 0 0 1 3.2 0" />
  </svg>
)

export const IconLeaf = ({ size, ...rest }: Props) => (
  <svg {...base(size)} {...rest}>
    <path d="M20 4.6C11.6 3.8 5.2 7.6 4.4 14.4c3.8 1 7.4.2 9.8-2.6 2-2.4 2.6-5 2.6-5" />
    <path d="M4.8 20c.8-4.6 3.4-7.6 7.2-9.4" />
  </svg>
)
