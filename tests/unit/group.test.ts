import { describe, expect, it } from 'vitest'
import type { Geo, Official } from '../../src/lib/types'
import { groupOfficials, type OfficialGroup } from '../../src/lib/group'

const P = '1001300000'
const geo: Geo = {
  nodes: [
    { psgc: P, name: 'Bukidnon', type: 'province' },
    { psgc: 'Z', name: 'Zeta', type: 'municipality', parent: P },
    { psgc: 'A', name: 'Alpha', type: 'municipality', parent: P },
    { psgc: 'M', name: 'Malaybalay', type: 'city', parent: P },
    { psgc: 'A1', name: 'A One', type: 'barangay', parent: 'A' },
    { psgc: 'Z1', name: 'Z One', type: 'barangay', parent: 'Z' },
  ],
}
const today = new Date('2026-11-02T00:00:00Z')

function off(id: string, level: Official['level'], geoCode: string, position: string, extra: Partial<Official> = {}): Official {
  return {
    id, personId: 'p-' + id, name: id, position, level, geoCode,
    termStart: '2025-06-30', termEnd: null, rosterSource: 'manual', rosterVerified: false, ...extra,
  }
}
const former = { termStart: '2019-06-30', termEnd: '2025-06-29' }
const gov = off('gov', 'province', P, 'Governor')
const vg = off('vg', 'province', P, 'Vice Governor')
const bm = off('bm', 'province', P, 'Board Member')
const abc = off('abc', 'province', P, 'Liga ng mga Barangay (ABC) President')
const rep = off('rep', 'district', P, 'Representative, 1st District')
const mayZ = off('mz', 'municipality', 'Z', 'Mayor')
const cllA = off('ca', 'municipality', 'A', 'Councilor')
const mayM = off('mm', 'city', 'M', 'Mayor')
const capA = off('ka', 'barangay', 'A1', 'Barangay Captain')
const capZ = off('kz', 'barangay', 'Z1', 'Barangay Captain')
const formerGov = off('fgov', 'province', P, 'Governor', former)
const formerA = off('fa', 'municipality', 'A', 'Mayor', former)

const keys = (gs: OfficialGroup[]) => gs.map((g) => g.key)
const ids = (g: OfficialGroup) => g.officials.map((o) => o.id)

describe('groupOfficials', () => {
  const all = [capZ, mayZ, bm, rep, gov, cllA, capA, vg, mayM, abc, formerGov, formerA]
  const { current, former: past } = groupOfficials(all, geo, today)

  it('orders current groups: provincial, SP, House, LGUs by name, barangay groups by LGU name', () => {
    expect(keys(current)).toEqual([
      'provincial', 'sp', 'house', 'lgu:A', 'lgu:M', 'lgu:Z', 'barangay:A', 'barangay:Z',
    ])
    expect(current.map((g) => g.kind)).toEqual([
      'provincial', 'sp', 'house', 'lgu', 'lgu', 'lgu', 'barangay', 'barangay',
    ])
  })
  it('puts governor and vice governor in Provincial Heads, other provincial rows in SP', () => {
    expect(ids(current[0]).sort()).toEqual(['gov', 'vg'])
    expect(ids(current[1]).sort()).toEqual(['abc', 'bm'])
    expect(ids(current[2])).toEqual(['rep'])
  })
  it('groups city and municipality officials per LGU and barangay captains per parent LGU', () => {
    expect(ids(current[3])).toEqual(['ca'])
    expect(current[3].code).toBe('A')
    expect(ids(current[5])).toEqual(['mz'])
    expect(ids(current[6])).toEqual(['ka'])
    expect(current[6].code).toBe('A')
  })
  it('splits former from current', () => {
    expect(keys(past)).toEqual(['provincial', 'lgu:A'])
    expect(ids(past[0])).toEqual(['fgov'])
    expect(current.flatMap(ids)).not.toContain('fgov')
  })
  it('counts every official exactly once', () => {
    const n = [...current, ...past].reduce((s, g) => s + g.officials.length, 0)
    expect(n).toBe(all.length)
  })
  it('hides empty groups and preserves input order inside a group', () => {
    const r = groupOfficials([vg, gov], geo, today)
    expect(keys(r.current)).toEqual(['provincial'])
    expect(ids(r.current[0])).toEqual(['vg', 'gov'])
    expect(r.former).toEqual([])
    expect(groupOfficials([], geo, today)).toEqual({ current: [], former: [] })
  })
  it('treats not-yet-started terms as current', () => {
    const future = off('fu', 'municipality', 'A', 'Mayor', { termStart: '2027-01-01' })
    expect(keys(groupOfficials([future], geo, today).current)).toEqual(['lgu:A'])
  })
  it('keeps a barangay captain with an unknown barangay in a group instead of dropping it', () => {
    const lost = off('lost', 'barangay', 'nowhere', 'Barangay Captain')
    const r = groupOfficials([lost], geo, today)
    expect(r.current.map((g) => g.kind)).toEqual(['barangay'])
    expect(ids(r.current[0])).toEqual(['lost'])
  })
  it('treats acting and OIC governors as provincial heads, but not other governor-related titles', () => {
    const acting = off('ag', 'province', P, 'Acting Governor')
    const oic = off('oic', 'province', P, 'OIC Vice Governor')
    const actVg = off('avg', 'province', P, 'acting vice-governor')
    const sec = off('sec', 'province', P, "Governor's Secretary")
    const r = groupOfficials([acting, oic, actVg, sec], geo, today)
    expect(r.current.map((g) => [g.key, g.officials.map((o) => o.id)])).toEqual([
      ['provincial', ['ag', 'oic', 'avg']],
      ['sp', ['sec']],
    ])
  })
})
