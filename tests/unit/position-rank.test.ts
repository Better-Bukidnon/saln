import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultFilters, sortOfficials } from '../../src/lib/filter'
import { positionRank, rankOfPosition, UNRANKED } from '../../src/lib/position-rank'
import type { Official } from '../../src/lib/types'

function load(dir: string): Official[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const v = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Official | Official[]
      return Array.isArray(v) ? v : [v]
    })
}

describe('every position in the data has an explicit rank', () => {
  for (const [label, dir] of [
    ['data/officials', 'data/officials'],
    ['e2e fixtures', 'tests/fixtures/e2e-data/officials'],
  ] as const) {
    it(label, () => {
      const positions = [...new Set(load(dir).map((o) => o.position))].sort()
      expect(positions.length).toBeGreaterThan(0)
      const unranked = positions.filter((p) => rankOfPosition(p) === null)
      expect(unranked, `unranked positions (add them to src/lib/position-rank.ts): ${unranked.join(' | ')}`).toEqual([])
    })
  }
  it('an unknown position is not given a rank', () => expect(rankOfPosition('Chief Janitor')).toBeNull())
})

const o = (id: string, name: string, position: string, extra: Partial<Official> = {}): Official =>
  ({ id, personId: `p-${id}`, name, position, level: 'province', geoCode: 'X', termStart: '2022-06-30', termEnd: '2025-06-30', rosterVerified: false, ...extra }) as Official
const ids = (l: Official[]) => l.map((x) => x.id)
const name = { ...defaultFilters, sort: 'name' as const, dir: 'asc' as const }

describe('position ranking', () => {
  it('orders the posts top-down', () => {
    const order = ['Governor', 'Vice Governor', 'Representative, 1st District', 'Representative, 4th District', 'Board Member', 'Philippine Councilors League (PCL) President', 'Liga ng mga Barangay (ABC) President', 'SK Provincial Federation President', 'Indigenous Peoples Mandatory Representative (IPMR)', 'Mayor', 'Vice Mayor', 'Councilor', 'Barangay Captain']
    const ranks = order.map((p) => rankOfPosition(p)!)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(new Set(ranks).size).toBe(ranks.length)
  })
  it('acting and OIC take the rank of the post', () => {
    expect(rankOfPosition('Acting Governor')).toBe(rankOfPosition('Governor'))
    expect(rankOfPosition('OIC Vice Mayor')).toBe(rankOfPosition('Vice Mayor'))
  })
  it('positionRank falls back to UNRANKED only for unknown posts', () => expect(positionRank(o('x', 'A', 'Chief Janitor'))).toBe(UNRANKED))

  it('governor before vice governor whatever the names', () => {
    const r = sortOfficials([o('vg', 'Aaron', 'Vice Governor'), o('g', 'Zed', 'Governor')], new Map(), name)
    expect(ids(r)).toEqual(['g', 'vg'])
  })
  it('mayor, vice mayor, then councilors by name', () => {
    const r = sortOfficials([o('c2', 'Zoe', 'Councilor'), o('vm', 'Bea', 'Vice Mayor'), o('c1', 'Amy', 'Councilor'), o('m', 'Yan', 'Mayor')], new Map(), name)
    expect(ids(r)).toEqual(['m', 'vm', 'c1', 'c2'])
  })
  it('ex-officio seats follow the elected board members', () => {
    const r = sortOfficials([o('pcl', 'Aa', 'Philippine Councilors League (PCL) President'), o('b', 'Zz', 'Board Member')], new Map(), name)
    expect(ids(r)).toEqual(['b', 'pcl'])
  })
  it('descending reverses the whole order', () => {
    const r = sortOfficials([o('g', 'Zed', 'Governor'), o('vg', 'Aaron', 'Vice Governor')], new Map(), { ...name, dir: 'desc' })
    expect(ids(r)).toEqual(['vg', 'g'])
  })
  it('net worth is primary, rank breaks ties, then name', () => {
    const rec = (p: string, nw: number) => ({ personId: p, year: 2024, netWorth: nw, totalAssets: nw, totalLiabilities: 0, status: 'unverified' }) as never
    const m = new Map([['p-a', [rec('p-a', 5)]], ['p-b', [rec('p-b', 5)]], ['p-c', [rec('p-c', 9)]]])
    const r = sortOfficials([o('a', 'Ann', 'Councilor'), o('b', 'Bob', 'Mayor'), o('c', 'Cy', 'Councilor')], m, { ...defaultFilters, sort: 'netWorth', dir: 'desc' })
    expect(ids(r)).toEqual(['c', 'b', 'a'])
  })
  it('former officials: rank, then latest term end, then name', () => {
    const today = new Date('2026-01-01')
    const r = sortOfficials(
      [o('old', 'Aa', 'Councilor', { termEnd: '2019-06-30' }), o('new', 'Zz', 'Councilor', { termEnd: '2022-06-30' }), o('mayor', 'Mm', 'Mayor', { termEnd: '2016-06-30' })],
      new Map(),
      name,
      today,
    )
    expect(ids(r)).toEqual(['mayor', 'new', 'old'])
  })
})
