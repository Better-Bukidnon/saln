import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  contestsToOfficials,
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
