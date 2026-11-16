import { useMemo } from 'react'
import { qrMatrix } from './qr'

/* The code printed on the handoff sheet: a real QR of the file, drawn as one
   path so a thousand modules cost one node. */
export function QrMark({ value, className }: { value: string; className?: string }) {
  const matrix = useMemo(() => qrMatrix(value), [value])
  const n = matrix.length
  const quiet = 4
  const total = n + quiet * 2

  let path = ''
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) path += `M${x + quiet} ${y + quiet}h1v1h-1z`
    }
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label="Record code"
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#f8f1e0" />
      <path d={path} fill="#33260c" />
    </svg>
  )
}
