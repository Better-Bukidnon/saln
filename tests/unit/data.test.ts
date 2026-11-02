import { describe, expect, it } from 'vitest'
import { latestSaln, loadAll } from '../../src/lib/data'
import type { SalnRecord } from '../../src/lib/types'

const rec = (year: number): SalnRecord => ({
  id: `r${year}`, personId: 'p', year, filingType: 'annual', totalAssets: 1, totalLiabilities: 0,
  netWorth: 1, sourceType: 'ombudsman', sourceUrl: 'https://example.org', status: 'submitted',
})

describe('latestSaln', () => {
  it('picks the highest year regardless of order', () => {
    expect(latestSaln([rec(2022), rec(2024), rec(2023)])?.year).toBe(2024)
  })
  it('returns undefined for empty or undefined', () => {
    expect(latestSaln([])).toBeUndefined()
    expect(latestSaln(undefined)).toBeUndefined()
  })
})

describe('loadAll', () => {
  it('loads geo, officials and groups SALN by personId', () => {
    const { geo, officials, salnByPerson } = loadAll()
    expect(geo.nodes.length).toBeGreaterThan(0)
    expect(officials.length).toBeGreaterThan(0)
    for (const [pid, rs] of salnByPerson) expect(rs.every((r) => r.personId === pid)).toBe(true)
  })
})
