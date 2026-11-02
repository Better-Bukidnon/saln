import type { SalnRecord } from './types'

/**
 * The one ordering rule for SALN records: positive when `a` should come before `b`.
 * Higher year first; on the same year the most recently verified wins (no verification date
 * sorts last); remaining ties go to the lexicographically greater id. Used by the cards,
 * the latest-year stat and the chart so they always agree.
 */
export function comparePreferred(a: SalnRecord, b: SalnRecord): number {
  if (a.year !== b.year) return a.year - b.year
  const va = a.verifiedAt ?? ''
  const vb = b.verifiedAt ?? ''
  if (va !== vb) return va < vb ? -1 : 1
  return a.id === b.id ? 0 : a.id < b.id ? -1 : 1
}

/** The record every surface treats as "latest": the first of newestFirst. */
export function latestSaln(records: SalnRecord[] | undefined): SalnRecord | undefined {
  if (!records?.length) return undefined
  return records.reduce((a, b) => (comparePreferred(b, a) > 0 ? b : a))
}

export const newestFirst = (records: SalnRecord[]): SalnRecord[] => [...records].sort((a, b) => comparePreferred(b, a))

export const sourceTypeKey = (t: SalnRecord['sourceType']): string => `sourceTypes.${t}`

export interface ChartPoint {
  year: number
  assets: number
  liabilities: number
  netWorth: number
}

export interface ChartData {
  points: ChartPoint[]
  min: number
  max: number
  from: number
  to: number
}

/** Over-time series, oldest first, one point per year (the preferred record of that year). Null unless there are at least two distinct years. */
export function chartSeries(records: SalnRecord[]): ChartData | null {
  const best = new Map<number, SalnRecord>()
  for (const r of records) {
    const cur = best.get(r.year)
    if (!cur || comparePreferred(r, cur) > 0) best.set(r.year, r)
  }
  const byYear = new Map<number, ChartPoint>()
  for (const [year, r] of best) {
    byYear.set(year, { year, assets: r.totalAssets, liabilities: r.totalLiabilities, netWorth: r.netWorth })
  }
  if (byYear.size < 2) return null
  const points = [...byYear.values()].sort((a, b) => a.year - b.year)
  const all = points.flatMap((p) => [p.assets, p.liabilities, p.netWorth])
  return { points, min: Math.min(...all), max: Math.max(...all), from: points[0].year, to: points[points.length - 1].year }
}

/** Compact peso label used on the chart: "₱ 20.3M", "₱ 0", "-₱ 1.8K". */
export function compactPeso(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 && abs >= 0.5 ? '-' : ''
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [size, suffix] of units) {
    if (abs >= size) return `${sign}\u20b1 ${(abs / size).toFixed(1)}${suffix}`
  }
  return `${sign}\u20b1 ${Math.round(abs)}`
}

function niceStep(range: number, intervals: number): number {
  const raw = range / intervals
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
}

/**
 * Vertical scale of the bar chart. The axis always contains zero and is rounded outward to a "nice"
 * step (about four intervals), so ticks are evenly spaced. If every value is 0 the axis is 0..1000.
 * `height` is the plot height in px; y(v) maps a value to a distance from the top of the plot.
 */
export function chartScale(data: ChartData, height: number) {
  const min = Math.min(0, data.min)
  const max = Math.max(0, data.max)
  const step = max === 0 && min === 0 ? 250 : niceStep(max - min, 4)
  const lo = Math.floor(min / step) * step
  const hi = max === 0 && min === 0 ? 1000 : Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  const span = hi - lo
  const y = (v: number) => ((hi - v) * height) / span
  return { lo, hi, step, span, y, ticks }
}

export interface LabelBox {
  id: string
  x: number // centre
  y: number // baseline
  w: number
  h: number
}

/** Ids of the value labels to show: scanned in order, a label is dropped if it overlaps one already kept. */
export function placeLabels(boxes: LabelBox[]): Set<string> {
  const kept: LabelBox[] = []
  for (const b of boxes) {
    const clash = kept.some((k) => Math.abs(k.x - b.x) < (k.w + b.w) / 2 && Math.abs(k.y - b.y) < (k.h + b.h) / 2)
    if (!clash) kept.push(b)
  }
  return new Set(kept.map((b) => b.id))
}
