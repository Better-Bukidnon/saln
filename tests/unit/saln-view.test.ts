import { describe, expect, it } from 'vitest'
import type { SalnRecord } from '../../src/lib/types'
import { chartSeries, compactPeso, comparePreferred, newestFirst, sourceTypeKey } from '../../src/lib/saln-view'
import { latestSaln } from '../../src/lib/data'

function rec(year: number, assets: number, liab: number, id = `r${year}`): SalnRecord {
  return {
    id, personId: 'p', year, filingType: 'annual', totalAssets: assets, totalLiabilities: liab,
    netWorth: assets - liab, sourceType: 'submitted', sourceUrl: 'https://x', status: 'submitted',
  }
}

describe('newestFirst', () => {
  it('sorts by year descending without mutating the input', () => {
    const input = [rec(2022, 1, 0), rec(2024, 1, 0), rec(2023, 1, 0)]
    expect(newestFirst(input).map((r) => r.year)).toEqual([2024, 2023, 2022])
    expect(input.map((r) => r.year)).toEqual([2022, 2024, 2023])
  })
})

describe('sourceTypeKey', () => {
  it('maps each source type to its i18n key', () => {
    expect(sourceTypeKey('house-summary')).toBe('sourceTypes.house-summary')
    expect(sourceTypeKey('submitted')).toBe('sourceTypes.submitted')
  })
})

describe('chartSeries', () => {
  it('is null for fewer than two distinct years', () => {
    expect(chartSeries([])).toBeNull()
    expect(chartSeries([rec(2024, 5, 1)])).toBeNull()
    expect(chartSeries([rec(2024, 5, 1, 'a'), rec(2024, 6, 1, 'b')])).toBeNull()
  })
  it('returns points oldest first with all three series and a range that includes negatives', () => {
    const s = chartSeries([rec(2024, 30, 5), rec(2022, 20, 25)])!
    expect(s.points.map((p) => p.year)).toEqual([2022, 2024])
    expect(s.points[0]).toMatchObject({ assets: 20, liabilities: 25, netWorth: -5 })
    expect(s.min).toBe(-5)
    expect(s.max).toBe(30)
    expect([s.from, s.to]).toEqual([2022, 2024])
  })
  it('keeps one point per year: the preferred record of that year, whatever the input order', () => {
    const lo = rec(2023, 2, 0, 'a')
    const hi = rec(2023, 3, 0, 'b')
    for (const input of [[rec(2022, 1, 0), lo, hi], [rec(2022, 1, 0), hi, lo]]) {
      const s = chartSeries(input)!
      expect(s.points).toHaveLength(2)
      expect(s.points[1].assets).toBe(3)
    }
  })
})

describe('same-year records: one rule everywhere', () => {
  const plain = rec(2024, 100, 10, 'a-plain')
  const verifiedOld = { ...rec(2024, 200, 20, 'b-old'), status: 'verified' as const, verifiedBy: 'M', verifiedAt: '2026-01-01' }
  const verifiedNew = { ...rec(2024, 300, 30, 'c-new'), status: 'verified' as const, verifiedBy: 'M', verifiedAt: '2026-06-01' }
  const tie1 = rec(2024, 400, 40, 'd-1')
  const tie2 = rec(2024, 500, 50, 'd-2')

  it('prefers the most recently verified record, then the greater id', () => {
    expect(comparePreferred(verifiedNew, verifiedOld)).toBeGreaterThan(0)
    expect(comparePreferred(verifiedOld, plain)).toBeGreaterThan(0)
    expect(comparePreferred(tie2, tie1)).toBeGreaterThan(0)
  })
  it('chart point, latest record and first card agree, in any input order', () => {
    const all = [plain, verifiedNew, verifiedOld, rec(2022, 1, 0)]
    for (const input of [all, [...all].reverse()]) {
      const chart = chartSeries(input)!
      const point = chart.points.find((p) => p.year === 2024)!
      const latest = latestSaln(input)!
      const first = newestFirst(input)[0]
      expect(latest.id).toBe('c-new')
      expect(first.id).toBe('c-new')
      expect(point.netWorth).toBe(latest.netWorth)
      expect(point.assets).toBe(first.totalAssets)
    }
  })
  it('falls back to id when nothing is verified', () => {
    for (const input of [[tie1, tie2], [tie2, tie1]]) {
      expect(latestSaln(input)!.id).toBe('d-2')
      expect(newestFirst(input).map((r) => r.id)).toEqual(['d-2', 'd-1'])
    }
  })
})

describe('compactPeso', () => {
  it('formats like the reference: one decimal with K/M/B and a space after the peso sign', () => {
    expect(compactPeso(20_300_000)).toBe('\u20b1 20.3M')
    expect(compactPeso(1_800_000)).toBe('\u20b1 1.8M')
    expect(compactPeso(122_800_000_000)).toBe('\u20b1 122.8B')
    expect(compactPeso(5_300)).toBe('\u20b1 5.3K')
    expect(compactPeso(0)).toBe('\u20b1 0')
    expect(compactPeso(750)).toBe('\u20b1 750')
    expect(compactPeso(-1_800_000)).toBe('-\u20b1 1.8M')
  })
})
