import { describe, expect, it } from 'vitest'
import type { SalnRecord } from '../../src/lib/types'
import { chartSeries, newestFirst, sourceTypeKey } from '../../src/lib/saln-view'

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
  it('keeps one point per year (the last record given)', () => {
    const s = chartSeries([rec(2022, 1, 0), rec(2023, 2, 0, 'a'), rec(2023, 3, 0, 'b')])!
    expect(s.points).toHaveLength(2)
    expect(s.points[1].assets).toBe(3)
  })
})
