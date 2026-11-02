import type { SalnRecord } from './types'

export const newestFirst = (records: SalnRecord[]): SalnRecord[] => [...records].sort((a, b) => b.year - a.year)

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

/** Over-time series, oldest first, one point per year. Null unless there are at least two distinct years. */
export function chartSeries(records: SalnRecord[]): ChartData | null {
  const byYear = new Map<number, ChartPoint>()
  for (const r of records) {
    byYear.set(r.year, { year: r.year, assets: r.totalAssets, liabilities: r.totalLiabilities, netWorth: r.netWorth })
  }
  if (byYear.size < 2) return null
  const points = [...byYear.values()].sort((a, b) => a.year - b.year)
  const all = points.flatMap((p) => [p.assets, p.liabilities, p.netWorth])
  return { points, min: Math.min(...all), max: Math.max(...all), from: points[0].year, to: points[points.length - 1].year }
}
