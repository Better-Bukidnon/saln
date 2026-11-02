import { describe, expect, it, vi } from 'vitest'
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

describe('demo data flag', () => {
  it('does not include the sample official without VITE_DEMO_DATA', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_DEMO_DATA', '')
    const { loadAll: load } = await import('../../src/lib/data')
    expect(load().officials.some((o) => o.sample)).toBe(false)
    vi.unstubAllEnvs()
  })
  it('merges exactly one sample official and three SALN years with the flag', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_DEMO_DATA', '1')
    const { loadAll: load } = await import('../../src/lib/data')
    const { officials, salnByPerson } = load()
    const sample = officials.filter((o) => o.sample)
    expect(sample).toHaveLength(1)
    expect(sample[0].name).toBe('Juan Dela Cruz (SAMPLE)')
    const recs = salnByPerson.get(sample[0].personId)!
    expect(recs.map((r) => r.year).sort()).toEqual([2022, 2023, 2024])
    for (const r of recs) expect(Math.round((r.totalAssets - r.totalLiabilities) * 100)).toBe(Math.round(r.netWorth * 100))
    expect(recs.filter((r) => r.status === 'verified').map((r) => r.verifiedBy)).toEqual(['Demo Maintainer'])
    vi.unstubAllEnvs()
  })
})
