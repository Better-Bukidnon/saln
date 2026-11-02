import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  contestsToOfficials,
  fetchContests,
  getJson,
  serialize,
  titleCaseName,
  type DynastiesContest,
} from '../../scripts/import-roster'
import type { Geo } from '../../src/lib/types'

const fx = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'dynasties-contests.json'), 'utf8'),
) as { data: { contests: DynastiesContest[] } }
const geo = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'geo.json'), 'utf8')) as Geo
const contests = fx.data.contests
const y2022 = contests.filter((c) => c.year === 2022)
const code = (name: string) => geo.nodes.find((n) => n.name === name)!.psgc

describe('contestsToOfficials', () => {
  const { officials, unmapped } = contestsToOfficials(y2022, geo, 2022)
  const find = (pos: string) => officials.filter((o) => o.position === pos)

  it('maps the governor winner to a province-level former term', () => {
    const [g] = find('Governor')
    expect(g).toMatchObject({
      id: '2022-province-governor-' + g.id.split('-').pop(),
      name: 'Oneil Pepito Roque',
      level: 'province',
      geoCode: '1001300000',
      termStart: '2022-06-30',
      termEnd: '2025-06-30',
      rosterSource: 'openhalalan',
    })
    expect(g.personId).toMatch(/^oh-/)
  })
  it('excludes non-winners', () => {
    expect(officials.map((o) => o.name)).not.toContain('Manuel Antonio Zubiri')
    expect(officials.map((o) => o.name)).not.toContain('Rory Pepito Roque')
  })
  it('maps mayors to the right LGU, including hyphen and City of names', () => {
    const mayors = find('Mayor')
    expect(mayors.find((m) => m.name === 'Cheche Antivo Uy')).toMatchObject({
      geoCode: code('Impasug-Ong'),
      level: 'municipality',
    })
    expect(mayors.find((m) => m.name.startsWith('Warren'))).toMatchObject({
      geoCode: code('City of Malaybalay'),
      level: 'city',
    })
  })
  it('puts unknown towns in unmapped and emits nothing for them', () => {
    expect(unmapped).toEqual(['ATLANTIS'])
    expect(officials.some((o) => o.position === 'Councilor')).toBe(false)
  })
  it('uses district position strings for representatives', () => {
    expect(find('Representative, 1st District')[0]).toMatchObject({ level: 'district', district: 1 })
  })
  it('never emits verified rows', () => {
    expect(officials.length).toBeGreaterThan(0)
    expect(officials.every((o) => o.rosterVerified === false)).toBe(true)
  })
  it('skips the seeded positions for 2025 but keeps local ones', () => {
    const r = contestsToOfficials(
      [...contests.filter((c) => c.year === 2025), y2022.find((c) => c.position === 'MAYOR')!],
      geo,
      2025,
    )
    expect(r.officials.map((o) => o.position)).toEqual(['Mayor'])
    expect(r.officials.every((o) => o.termEnd === '2028-06-30')).toBe(true)
  })
  it('is deterministic and sorted by id', () => {
    const rev = contestsToOfficials([...y2022].reverse(), geo, 2022)
    expect(serialize(rev.officials)).toBe(serialize(officials))
    const ids = officials.map((o) => o.id)
    expect(ids).toEqual([...ids].sort())
    expect(serialize(officials).endsWith('}\n]\n')).toBe(true)
  })
})

describe('titleCaseName', () => {
  it.each([
    ['FLORENCIO TADIAR FLORES JR', 'Florencio Tadiar Flores JR'],
    ['ARMANDO LLANO AYCO SR.', 'Armando Llano Ayco SR'],
    ['JOHNY ENGGAY DUM-OGAN', 'Johny Enggay Dum-Ogan'],
    ['AMELITA GEÑOSO TERO', 'Amelita Geñoso Tero'],
    ['JUAN DELA CRUZ III', 'Juan Dela Cruz III'],
  ])('%s', (i, o) => expect(titleCaseName(i)).toBe(o))
})

const mk = (id: string, pos: string, district: string, winners: string[], city: string | null = null): DynastiesContest => ({
  id,
  year: 2019,
  position: pos,
  district,
  city,
  city_slug: city ? city.toLowerCase() : null,
  candidates: winners.map((n, i) => ({ person_id: `p${i}${id}`.slice(0, 10), display_name: n, party: 'X', won: 1 })),
})

describe('mapping gaps', () => {
  it('vice governor is province level', () => {
    const r = contestsToOfficials([mk('vg', 'VICE GOVERNOR', '', ['ANA CRUZ'])], geo, 2019)
    expect(r.officials[0]).toMatchObject({ position: 'Vice Governor', level: 'province', geoCode: '1001300000' })
  })
  it('board member keeps district and is province level', () => {
    const r = contestsToOfficials([mk('b', 'PROVINCIAL BOARD MEMBER', 'THIRD', ['ANA CRUZ'])], geo, 2019)
    expect(r.officials[0]).toMatchObject({ position: 'Board Member', level: 'province', district: 3 })
  })
  it('two winners in one contest get distinct ids', () => {
    const r = contestsToOfficials([mk('c', 'COUNCILOR', 'LONE', ['ANA CRUZ', 'BEN DIAZ'], 'BAUNGON')], geo, 2019)
    expect(r.officials).toHaveLength(2)
    expect(new Set(r.officials.map((o) => o.id)).size).toBe(2)
  })
  it('keeps II uppercase', () => expect(titleCaseName('JOSE REYES II')).toBe('Jose Reyes II'))
  it('every emitted geoCode exists in geo.json', () => {
    const codes = new Set(geo.nodes.map((n) => n.psgc))
    const { officials } = contestsToOfficials(contests, geo, 2022)
    expect(officials.length).toBeGreaterThan(0)
    expect(officials.every((o) => codes.has(o.geoCode))).toBe(true)
  })
})

describe('http', () => {
  const sleep = vi.fn(async () => {})
  const ok = (contests: unknown[]) => new Response(JSON.stringify({ data: { contests } }), { status: 200 })
  const fakes = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) }))

  it('paginates until a partial page', async () => {
    const urls: string[] = []
    const fetchFn = vi.fn(async (u: string | URL | Request) => {
      urls.push(String(u))
      return ok(fakes(urls.length === 1 ? 50 : 3))
    }) as unknown as typeof fetch
    const r = await fetchContests(2019, 'mayor', { fetchFn, sleep })
    expect(r).toHaveLength(53)
    expect(urls).toHaveLength(2)
    expect(urls[1]).toContain('page=2')
  })
  it('retries 500 then succeeds after exactly 2 calls', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(new Response('x', { status: 500 }))
      .mockResolvedValueOnce(ok([])) as unknown as typeof fetch
    await getJson('http://x/y', { fetchFn, sleep })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
  it('throws after three 500s with status and URL', async () => {
    const fetchFn = vi.fn(async () => new Response('x', { status: 500 })) as unknown as typeof fetch
    await expect(getJson('http://x/y', { fetchFn, sleep })).rejects.toThrow(/500.*http:\/\/x\/y/)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
  it('throws on 404', async () => {
    const fetchFn = vi.fn(async () => new Response('x', { status: 404 })) as unknown as typeof fetch
    await expect(getJson('http://x/y', { fetchFn, sleep })).rejects.toThrow(/404/)
  })
  it('aborts a request that never resolves via the timeout', async () => {
    const fetchFn = vi.fn(
      (_u: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_res, rej) => {
          init!.signal!.addEventListener('abort', () => rej(new Error('aborted')))
        }),
    ) as unknown as typeof fetch
    await expect(getJson('http://x/y', { fetchFn, sleep, timeoutMs: 5 })).rejects.toThrow(/aborted/)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
  it('backs off through the injected sleep (1s then 2s), not real time', async () => {
    const s = vi.fn((ms: number) => Promise.resolve(void ms))
    const fetchFn = vi.fn(async () => new Response('x', { status: 500 })) as unknown as typeof fetch
    await expect(getJson('http://x/y', { fetchFn, sleep: s })).rejects.toThrow()
    expect(s.mock.calls.map((c) => c[0])).toEqual([1000, 2000])
  })
})
