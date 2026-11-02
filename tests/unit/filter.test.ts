import { describe, expect, it } from 'vitest'
import type { Geo, Official, SalnRecord } from '../../src/lib/types'
import {
  defaultFilters,
  filterOfficials,
  isCurrent,
  parseFilters,
  serializeFilters,
  sortOfficials,
  type Filters,
} from '../../src/lib/filter'

const P = '1001300000'
const geo: Geo = {
  nodes: [
    { psgc: P, name: 'Bukidnon', type: 'province' },
    { psgc: 'A', name: 'Alpha', type: 'municipality', parent: P },
    { psgc: 'B', name: 'Beta', type: 'city', parent: P },
    { psgc: 'A1', name: 'A One', type: 'barangay', parent: 'A' },
    { psgc: 'A2', name: 'A Two', type: 'barangay', parent: 'A' },
    { psgc: 'B1', name: 'B One', type: 'barangay', parent: 'B' },
  ],
}
const today = new Date('2026-11-02T00:00:00Z')

function off(id: string, name: string, level: Official['level'], geoCode: string, extra: Partial<Official> = {}): Official {
  return {
    id, personId: 'p-' + id, name, position: 'x', level, geoCode,
    termStart: '2025-06-30', termEnd: null, rosterSource: 'manual', rosterVerified: false, ...extra,
  }
}
const governor = off('gov', 'Gov Prov', 'province', P)
const mayorA = off('ma', 'Mayor Nuñez', 'municipality', 'A')
const mayorB = off('mb', 'Mayor NUNEZ B', 'city', 'B')
const capA1 = off('ca1', 'Capt A1', 'barangay', 'A1')
const capA2 = off('ca2', 'Capt A2', 'barangay', 'A2')
const capB1 = off('cb1', 'Capt B1', 'barangay', 'B1')
const formerA = off('fa', 'Former A', 'municipality', 'A', { termStart: '2019-06-30', termEnd: '2025-06-29' })
const futureA = off('fu', 'Future A', 'municipality', 'A', { termStart: '2027-01-01' })
const all = [governor, mayorA, mayorB, capA1, capA2, capB1, formerA, futureA]
const ids = (os: Official[]) => os.map((o) => o.id).sort()
const f = (o: Partial<Filters> = {}): Filters => ({ ...defaultFilters, status: 'all', ...o })
const run = (o: Partial<Filters>) => filterOfficials(all, new Map(), geo, f(o), today)

function saln(personId: string, year: number, assets: number, liab: number): SalnRecord {
  return {
    id: personId + year, personId, year, filingType: 'annual', totalAssets: assets,
    totalLiabilities: liab, netWorth: assets - liab, sourceType: 'lgu', sourceUrl: 'https://x', status: 'submitted',
  }
}

describe('geography filters', () => {
  it('no lgu shows all', () => expect(run({}).length).toBe(all.length))
  it('lgu shows lgu and its barangay officials, not province-wide', () => {
    expect(ids(run({ lgu: 'A' }))).toEqual(['ca1', 'ca2', 'fa', 'fu', 'ma'])
  })
  it('provinceWide adds province officials', () => {
    expect(ids(run({ lgu: 'A', provinceWide: true }))).toContain('gov')
  })
  it('barangay shows only that captain', () => {
    expect(ids(run({ lgu: 'A', barangay: 'A1' }))).toEqual(['ca1'])
  })
})

describe('isCurrent', () => {
  it('null termEnd', () => expect(isCurrent(mayorA, today)).toBe(true))
  it('termEnd today is current', () => expect(isCurrent(off('x', 'x', 'city', 'A', { termEnd: '2026-11-02' }), today)).toBe(true))
  it('day after termEnd is not', () => expect(isCurrent(off('x', 'x', 'city', 'A', { termEnd: '2026-11-01' }), today)).toBe(false))
  it('future start is not', () => expect(isCurrent(futureA, today)).toBe(false))
})

describe('status/level/hasSaln/q', () => {
  it('status', () => {
    expect(ids(run({ status: 'current' }))).not.toContain('fa')
    expect(ids(run({ status: 'current' }))).not.toContain('fu')
    expect(ids(run({ status: 'former' }))).toEqual(['fa'])
  })
  it('level', () => expect(ids(run({ level: 'barangay' }))).toEqual(['ca1', 'ca2', 'cb1']))
  it('level applies after geography', () => expect(ids(run({ lgu: 'A', level: 'barangay' }))).toEqual(['ca1', 'ca2']))
  it('hasSaln', () => {
    const m = new Map([['p-ma', [saln('p-ma', 2024, 10, 1)]]])
    expect(ids(filterOfficials(all, m, geo, f({ hasSaln: true }), today))).toEqual(['ma'])
  })
  it('accent-insensitive q', () => expect(ids(run({ q: 'nuñez' }))).toEqual(['ma', 'mb']))
  it('q without accent', () => expect(ids(run({ q: 'NUNEZ' }))).toEqual(['ma', 'mb']))
  it('regex-like q does not throw', () => {
    expect(run({ q: '(Jr.' })).toEqual([])
    expect(run({ q: '[a-' })).toEqual([])
  })
  it('blank q matches all', () => expect(run({ q: '   ' }).length).toBe(all.length))
})

describe('sort', () => {
  const m = new Map([
    ['p-ma', [saln('p-ma', 2022, 999, 0), saln('p-ma', 2024, 100, 20)]],
    ['p-mb', [saln('p-mb', 2024, 10, 50)]],
    ['p-ca1', [saln('p-ca1', 2024, 500, 0)]],
  ])
  const three = [mayorA, mayorB, capA1, capA2]
  it('netWorth desc: negative above no-SALN, latest year used', () => {
    const r = sortOfficials(three, m, f({ sort: 'netWorth', dir: 'desc' }))
    expect(r.map((o) => o.id)).toEqual(['ca1', 'ma', 'mb', 'ca2'])
  })
  it('netWorth asc keeps no-SALN last', () => {
    const r = sortOfficials(three, m, f({ sort: 'netWorth', dir: 'asc' }))
    expect(r.map((o) => o.id)).toEqual(['mb', 'ma', 'ca1', 'ca2'])
  })
  it('name sort accent-insensitive with id tiebreak', () => {
    const a = off('2', 'Ñandu', 'city', 'A')
    const b = off('1', 'nandu', 'city', 'A')
    const c = off('3', 'Zed', 'city', 'A')
    const r = sortOfficials([c, a, b], new Map(), f({ sort: 'name', dir: 'asc' }))
    expect(r.map((o) => o.id)).toEqual(['1', '2', '3'])
  })
})

describe('parse/serialize', () => {
  it('unknown lgu gives defaults', () => expect(parseFilters(new URLSearchParams('lgu=zzz'), geo)).toEqual(defaultFilters))
  it('barangay without lgu ignored', () => expect(parseFilters(new URLSearchParams('barangay=A1'), geo)).toEqual(defaultFilters))
  it('barangay of other lgu dropped', () => {
    const r = parseFilters(new URLSearchParams('lgu=A&barangay=B1'), geo)
    expect(r.lgu).toBe('A')
    expect(r.barangay).toBeUndefined()
  })
  it('invalid enums fall back', () => {
    expect(parseFilters(new URLSearchParams('level=x&status=y&sort=z&dir=w'), geo)).toEqual(defaultFilters)
  })
  it('defaults serialize empty', () => expect(serializeFilters(defaultFilters).toString()).toBe(''))
  it('round-trips', () => {
    const p = new URLSearchParams('lgu=A&barangay=A1&pw=1&level=barangay&status=former&saln=1&q=nu%C3%B1ez&sort=netWorth&dir=desc')
    const parsed = parseFilters(p, geo)
    expect(parsed.provinceWide).toBe(true)
    expect(parseFilters(serializeFilters(parsed), geo)).toEqual(parsed)
    expect(serializeFilters(parsed).get('barangay')).toBe('A1')
  })
})

describe('Asia/Manila calendar day (machine-TZ independent)', () => {
  const mk = (extra: Partial<Official>) => off('t', 'T', 'city', 'A', extra)
  it('Manila next day: termEnd previous day is not current and is former', () => {
    const t = new Date('2026-11-01T17:00:00Z')
    const o = mk({ termEnd: '2026-11-01' })
    expect(isCurrent(o, t)).toBe(false)
    expect(filterOfficials([o], new Map(), geo, f({ status: 'former' }), t)).toEqual([o])
  })
  it('termStart on Manila date is current', () => {
    expect(isCurrent(mk({ termStart: '2026-11-02' }), new Date('2026-11-01T17:00:00Z'))).toBe(true)
  })
  it('23:59:59 Manila on termEnd is current', () => {
    expect(isCurrent(mk({ termEnd: '2026-11-02' }), new Date('2026-11-02T15:59:59Z'))).toBe(true)
  })
  it('00:00 Manila next day is not current', () => {
    expect(isCurrent(mk({ termEnd: '2026-11-02' }), new Date('2026-11-02T16:00:00Z'))).toBe(false)
  })
  it('Invalid Date is not current and does not throw', () => {
    expect(isCurrent(mk({}), new Date('nope'))).toBe(false)
  })
  it('former excludes termEnd equal to today', () => {
    const o = mk({ termEnd: '2026-11-02' })
    expect(filterOfficials([o], new Map(), geo, f({ status: 'former' }), today)).toEqual([])
  })
})

describe('duplicate barangay names and province-wide', () => {
  const g2: Geo = {
    nodes: [
      ...geo.nodes,
      { psgc: 'AP', name: 'Poblacion', type: 'barangay', parent: 'A' },
      { psgc: 'BP', name: 'Poblacion', type: 'barangay', parent: 'B' },
    ],
  }
  const capAP = off('cap', 'Capt AP', 'barangay', 'AP')
  const capBP = off('cbp', 'Capt BP', 'barangay', 'BP')
  const dist = off('d1', 'District Rep', 'district', P, { district: 1 })
  const pool = [capAP, capBP, mayorA, dist]
  const run2 = (qs: string, today2 = today) => {
    const fl = parseFilters(new URLSearchParams(qs), g2)
    return filterOfficials(pool, new Map(), g2, { ...fl, status: 'all' }, today2).map((o) => o.id).sort()
  }
  it('own Poblacion returns only that captain', () => expect(run2('lgu=A&barangay=AP')).toEqual(['cap']))
  it("other LGU's Poblacion is dropped, whole LGU shown", () => {
    expect(parseFilters(new URLSearchParams('lgu=A&barangay=BP'), g2).barangay).toBeUndefined()
    expect(run2('lgu=A&barangay=BP')).toEqual(['cap', 'ma'])
  })
  it('bad lgu with valid barangay gives defaults', () => {
    expect(parseFilters(new URLSearchParams('lgu=zzz&barangay=AP'), g2)).toEqual(defaultFilters)
  })
  it('district is province-wide', () => {
    expect(run2('')).toContain('d1')
    expect(run2('lgu=A')).not.toContain('d1')
    expect(run2('lgu=A&pw=1')).toContain('d1')
  })
})
