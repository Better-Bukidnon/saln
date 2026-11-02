import { describe, expect, it } from 'vitest'
import { defaultFilters, sortOfficials } from '../../src/lib/filter'
import { latestSaln } from '../../src/lib/saln-view'
import type { Official, SalnRecord } from '../../src/lib/types'

const off = (id: string): Official => ({
  id, personId: 'p-' + id, name: id, position: 'x', level: 'province', geoCode: 'P',
  termStart: '2025-06-30', termEnd: null, rosterSource: 'manual', rosterVerified: false,
})
const rec = (id: string, personId: string, nw: number, verifiedAt?: string): SalnRecord => ({
  id, personId, year: 2024, filingType: 'annual', totalAssets: nw, totalLiabilities: 0, netWorth: nw,
  sourceType: 'lgu', sourceUrl: 'https://example.org/x', status: 'submitted', verifiedAt,
})

describe('sortOfficials uses the same latest record as the card', () => {
  it('same-year records: the later verifiedAt (the figure the card shows) drives the sort', () => {
    // a: older record has the bigger number, newer-verified record is small -> card shows 100
    const a = [rec('a1', 'p-a', 900, '2025-01-01'), rec('a2', 'p-a', 100, '2025-06-01')]
    const b = [rec('b1', 'p-b', 500, '2025-03-01')]
    expect(latestSaln(a)?.netWorth).toBe(100)
    const m = new Map([['p-a', a], ['p-b', b]])
    const asc = sortOfficials([off('a'), off('b')], m, { ...defaultFilters, sort: 'netWorth', dir: 'asc' })
    expect(asc.map((o) => o.id)).toEqual(['a', 'b'])
  })
  it('same year and no dates: the greater id wins, regardless of array order', () => {
    const recs = [rec('z9', 'p-a', 10), rec('a1', 'p-a', 999)]
    expect(latestSaln(recs)?.id).toBe('z9')
    const m = new Map([['p-a', recs], ['p-b', [rec('b1', 'p-b', 50)]]])
    const asc = sortOfficials([off('b'), off('a')], m, { ...defaultFilters, sort: 'netWorth', dir: 'asc' })
    expect(asc.map((o) => o.id)).toEqual(['a', 'b'])
  })
})
