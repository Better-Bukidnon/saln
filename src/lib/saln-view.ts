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
