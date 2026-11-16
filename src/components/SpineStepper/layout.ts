export type SpineStepState = 'complete' | 'active' | 'pending'

/** What a caller supplies: no geometry, no coordinates. */
export interface SpineStepInput {
  id: string
  title: string
  state: SpineStepState
  /** 0–1, only meaningful while the step is active. */
  progress?: number
}

export interface SpineNodeLayout extends SpineStepInput {
  /** Node centre, in CSS pixels of the measured box. */
  y: number
  /** Resting tilt of the vertebra, in degrees. */
  rotate: number
  /** Perspective drift: vertebrae sit marginally larger towards the bottom. */
  scale: number
}

export interface SpineLayout {
  width: number
  height: number
  /** Spine axis. */
  cx: number
  /** Base unit: 1 ≈ the proportions of the original drawing. */
  unit: number
  /** Label text scale, so type never collides with the right edge. */
  labelScale: number
  header: {
    ruleY: number
    eyebrowY: number
    titleY: number
    titleSize: number
  } | null
  cord: {
    x: number
    width: number
    radius: number
    top: number
    bottom: number
  }
  nodes: SpineNodeLayout[]
  fill: { top: number; height: number }
  completed: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** A per-index tilt, so the column never looks mechanically aligned. */
const TILTS = [-1.6, 1.1, -0.9, 1.5, -1.1, 0.8, -0.7, 1.3, -1.4, 0.6, -0.5, 1.2]

/** Spine geometry, in the units of the source artwork. */
const NODE_WIDTH = 186
const NODE_HALF = NODE_WIDTH / 2
const REFERENCE_SPACING = 112
const HEADER_RULE = 104
const TOP_GAP = 72
const BOTTOM_GAP = 92
/** Without a header the column gets the same breathing room top and bottom. */
const OPEN_GAP = 96
const SPACING_MAX = 178
/** Room the label lane needs, left of the right margin. */
const LABEL_ROOM = 200
const LABEL_OFFSET = 243

export interface SpineLayoutOptions {
  width: number
  height: number
  showHeader: boolean
}

export function createSpineLayout(
  steps: SpineStepInput[],
  { width, height, showHeader }: SpineLayoutOptions,
): SpineLayout {
  const header = showHeader
    ? {
        ruleY: HEADER_RULE,
        eyebrowY: 36,
        titleY: 76,
        titleSize: clamp(width * 0.05, 20, 30),
      }
    : null

  const top = header ? header.ruleY + TOP_GAP : OPEN_GAP
  const bottom = Math.max(top + 1, height - (header ? BOTTOM_GAP : OPEN_GAP))

  const count = Math.max(steps.length, 1)
  const span = bottom - top
  /* Any number of steps fits the height: the pitch compresses, it never overflows. */
  const spacing = count > 1 ? Math.min(span / (count - 1), SPACING_MAX) : 0
  const used = spacing * (count - 1)
  const first = top + Math.max(0, (span - used) / 2)

  /* One unit of the artwork, shrunk to fit both the vertical pitch and the
     horizontally available lane, so any step count and any viewport works. */
  const unit = clamp(
    Math.min(spacing / REFERENCE_SPACING, (width - 56 - LABEL_ROOM) / LABEL_OFFSET),
    0.32,
    1.4,
  )

  const cx = 30 + NODE_HALF * unit
  const labelStart = cx + 98 * unit
  const labelRoom = width - labelStart - 30
  /* Type shrinks with the pitch too, so labels never collide when the column
     gets dense. */
  const labelScale = clamp(Math.min(labelRoom / 232, spacing / 84), 0.6, 1.04)

  const tiltMid = (count - 1) / 2
  const nodes: SpineNodeLayout[] = steps.map((step, index) => ({
    ...step,
    y: first + spacing * index,
    rotate: TILTS[index % TILTS.length],
    /* 0.92 → 1.05 across the column, as in the original drawing. */
    scale:
      1 +
      (count > 1 ? (index - tiltMid) / tiltMid : 0) * 0.065 +
      ((index * 37) % 5) * 0.004,
  }))

  const cord = {
    x: cx - 14 * unit,
    width: 28 * unit,
    radius: 14 * unit,
    top: Math.max((header?.ruleY ?? 0) + 10, -24),
    bottom: height + 32,
  }

  const activeIndex = nodes.findIndex((node) => node.state === 'active')
  const lastLit = [...nodes].reverse().find((node) => node.state !== 'pending')
  const fillEnd = activeIndex >= 0 ? nodes[activeIndex].y + 1 : lastLit ? lastLit.y + 1 : cord.top
  const fillHeight = clamp(fillEnd - cord.top, 0, cord.bottom - cord.top)

  return {
    width,
    height,
    cx,
    unit,
    labelScale,
    header,
    cord,
    nodes,
    fill: { top: cord.top, height: fillHeight },
    completed: steps.filter((step) => step.state === 'complete').length,
  }
}
