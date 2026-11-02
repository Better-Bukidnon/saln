import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { captainsFromCsv, parseCsv, runCli, serializeCaptains } from '../../scripts/import-barangays'
import { validateData } from '../../scripts/validate-data'
import { barangaysOf, lgus } from '../../src/lib/geo'
import type { Geo } from '../../src/lib/types'

const root = join(__dirname, '..', '..')
const geo = JSON.parse(readFileSync(join(root, 'data', 'geo.json'), 'utf8')) as Geo
const fixture = readFileSync(join(root, 'tests', 'fixtures', 'barangay-captains.csv'), 'utf8')
const H = 'municipality,barangay,name,source\n'
const lguCode = (name: string) => lgus(geo).find((n) => n.name === name)!.psgc
const brgy = (lgu: string, name: string) =>
  barangaysOf(geo, lguCode(lgu)).find((b) => b.name === name)!.psgc

describe('Poblacion scoping', () => {
  it('maps each LGU Poblacion to its own code', () => {
    const r = captainsFromCsv(H + 'Damulog,Poblacion,A One,comelec\nDangcagan,Poblacion,B Two,comelec\n', geo)
    expect(r.unmatched).toEqual([])
    const byGeo = Object.fromEntries(r.officials.map((o) => [o.geoCode, o.name]))
    expect(byGeo[brgy('Damulog', 'Poblacion')]).toBe('A One')
    expect(byGeo[brgy('Dangcagan', 'Poblacion')]).toBe('B Two')
    expect(brgy('Damulog', 'Poblacion')).not.toBe(brgy('Dangcagan', 'Poblacion'))
  })
  it('does not fall back to another LGU: a barangay only in B is unmatched under A', () => {
    const r = captainsFromCsv(H + 'Damulog,Barangay 2,X Y,comelec\n', geo)
    expect(r.officials).toEqual([])
    expect(r.unmatched).toHaveLength(1)
  })
})

describe('name variants', () => {
  it('handles Brgy. prefix', () => {
    const r = captainsFromCsv(H + 'Damulog,Brgy. Poblacion,A,dilg\nDangcagan,Brgy Poblacion,B,dilg\nKadingilan,Barangay Poblacion,C,dilg\n', geo)
    expect(r.officials.map((o) => o.geoCode).sort()).toEqual(
      [brgy('Damulog', 'Poblacion'), brgy('Dangcagan', 'Poblacion'), brgy('Kadingilan', 'Poblacion')].sort(),
    )
  })
  it('handles LGU case, accent, hyphen, space and City-of variants', () => {
    for (const v of ['Impasug-ong', 'IMPASUG ONG', 'impasugong', 'Impasug-Óng', 'Municipality of Impasug-ong']) {
      const r = captainsFromCsv(H + `${v},Poblacion,A,dilg\n`, geo)
      expect(r.unmatched, v).toEqual([])
      expect(r.officials[0].geoCode).toBe(brgy('Impasug-Ong', 'Poblacion'))
    }
    for (const v of ['City of Malaybalay', 'Malaybalay', 'Malaybalay City']) {
      expect(captainsFromCsv(H + `${v},Barangay 2,A,dilg\n`, geo).unmatched, v).toEqual([])
    }
  })
  it('keeps numbers distinct and matches "(Pob.)" names', () => {
    const r = captainsFromCsv(H + 'Malaybalay,Barangay 2,A,dilg\nMalaybalay,Brgy. 3,B,dilg\nMalaybalay,Barangay 2 (Pob.),C,dilg\n', geo)
    expect(r.officials.map((o) => o.geoCode)).toEqual([brgy('City of Malaybalay', 'Barangay 2 (Pob.)'), brgy('City of Malaybalay', 'Barangay 3 (Pob.)')])
    expect(r.duplicates).toHaveLength(1)
    expect(r.officials[0].name).toBe('A')
  })
})

describe('bad rows', () => {
  it('unknown barangay and unknown LGU -> unmatched with row number', () => {
    const r = captainsFromCsv(H + 'Damulog,Nowhere,A,dilg\nAtlantis,Poblacion,B,dilg\n', geo)
    expect(r.officials).toEqual([])
    expect(r.unmatched).toHaveLength(2)
    expect(r.unmatched[0]).toContain('row 2')
    expect(r.unmatched[0]).toContain('Nowhere')
    expect(r.unmatched[1]).toContain('Atlantis')
  })
  it('duplicate -> first wins', () => {
    const r = captainsFromCsv(H + 'Damulog,Poblacion,First,dilg\nDamulog,Poblacion,Second,comelec\n', geo)
    expect(r.officials).toHaveLength(1)
    expect(r.officials[0].name).toBe('First')
    expect(r.duplicates).toHaveLength(1)
    expect(r.duplicates[0]).toContain('row 3')
  })
  it('bad source, empty name, short row -> invalid, never throws', () => {
    const r = captainsFromCsv(H + 'Damulog,Poblacion,A,facebook\nDamulog,Poblacion,  ,dilg\nDamulog,Poblacion\n,,,\n', geo)
    expect(r.officials).toEqual([])
    expect(r.invalid).toHaveLength(4)
    expect(r.invalid[0]).toContain('facebook')
  })
  it('missing header columns -> invalid, no throw', () => {
    const r = captainsFromCsv('a,b\n1,2\n', geo)
    expect(r.officials).toEqual([])
    expect(r.invalid.length).toBeGreaterThan(0)
  })
  it('empty input does not throw', () => {
    expect(captainsFromCsv('', geo).officials).toEqual([])
  })
})

describe('csv parsing', () => {
  it('BOM + CRLF + quoted comma/quote', () => {
    const csv = '﻿municipality,barangay,name,source\r\nDamulog,Poblacion,"REYES, ANA ""Annie""",dilg\r\n'
    expect(parseCsv(csv)[1]).toEqual(['Damulog', 'Poblacion', 'REYES, ANA "Annie"', 'dilg'])
    const r = captainsFromCsv(csv.replace('""Annie""', 'Lim'), geo)
    expect(r.invalid).toEqual([])
    expect(r.officials[0].name).toBe('Reyes, Ana Lim')
  })
  it('source is case-insensitive', () => {
    expect(captainsFromCsv(H + 'Damulog,Poblacion,A,COMELEC\n', geo).officials[0].rosterSource).toBe('comelec')
  })
})

describe('fixture', () => {
  const r = captainsFromCsv(fixture, geo)
  it('classifies rows', () => {
    expect(r.officials).toHaveLength(5)
    expect(r.unmatched).toHaveLength(2)
    expect(r.duplicates).toHaveLength(1)
    expect(r.invalid).toHaveLength(2)
  })
  it('official shape', () => {
    const d = r.officials.find((o) => o.geoCode === brgy('Damulog', 'Poblacion'))!
    expect(d).toEqual({
      id: `2023-${d.geoCode}-punong-barangay`,
      personId: `cap-${d.geoCode}-2023`,
      name: 'Juan Dela Cruz',
      position: 'Punong Barangay',
      level: 'barangay',
      geoCode: d.geoCode,
      termStart: '2023-11-30',
      termEnd: '2026-11-30',
      rosterSource: 'comelec',
      rosterVerified: false,
    })
    expect(r.officials.find((o) => o.name === 'Ana, Reyes-Lim')!.rosterSource).toBe('community')
    expect(r.officials.find((o) => o.name === "Pedro O'Brien")).toBeTruthy()
    expect(r.officials.find((o) => o.name === 'Jose Rizal JR')).toBeTruthy()
  })
  it('all unverified barangay-level with real barangay codes', () => {
    const codes = new Set(geo.nodes.filter((n) => n.type === 'barangay').map((n) => n.psgc))
    for (const o of r.officials) {
      expect(o.rosterVerified).toBe(false)
      expect(o.level).toBe('barangay')
      expect(codes.has(o.geoCode)).toBe(true)
    }
  })
  it('is sorted and deterministic', () => {
    const ids = r.officials.map((o) => o.id)
    expect(ids).toEqual([...ids].sort())
    expect(serializeCaptains(captainsFromCsv(fixture, geo).officials)).toBe(serializeCaptains(r.officials))
    expect(serializeCaptains(r.officials).endsWith('}\n]\n')).toBe(true)
  })
  it('output validates with validateData', () => {
    const dir = mkdtempSync(join(tmpdir(), 'brgy-'))
    cpSync(join(root, 'data', 'geo.json'), join(dir, 'geo.json'))
    mkdirSync(join(dir, 'officials'))
    writeFileSync(join(dir, 'officials', 'barangay-captains.json'), serializeCaptains(r.officials))
    expect(validateData(dir)).toEqual([])
  })
})

describe('runCli', () => {
  const mk = () => {
    const dir = mkdtempSync(join(tmpdir(), 'brgy-cli-'))
    const csv = join(dir, 'in.csv')
    writeFileSync(csv, fixture)
    return { dir, csv, out: join(dir, 'out.json') }
  }
  const quiet = () => {
    const lines: string[] = []
    return { lines, log: (s: string) => lines.push(s) }
  }
  it('exits non-zero with unmatched/invalid unless --allow-partial, and writes nothing', () => {
    const { csv, out } = mk()
    const q = quiet()
    expect(runCli([csv, '--out', out], geo, q.log)).toBe(1)
    expect(existsSync(out)).toBe(false)
    expect(q.lines.join('\n')).toMatch(/no captain/i)
  })
  it('--allow-partial writes; refuses overwrite without --force', () => {
    const { csv, out } = mk()
    expect(runCli([csv, '--out', out, '--allow-partial'], geo, quiet().log)).toBe(0)
    expect(JSON.parse(readFileSync(out, 'utf8'))).toHaveLength(5)
    expect(runCli([csv, '--out', out, '--allow-partial'], geo, quiet().log)).toBe(1)
    expect(runCli([csv, '--out', out, '--allow-partial', '--force'], geo, quiet().log)).toBe(0)
  })
  it('lists barangays without captain: first 20 and count when > 20', () => {
    const { csv, out } = mk()
    const q = quiet()
    runCli([csv, '--out', out, '--allow-partial'], geo, q.log)
    const text = q.lines.join('\n')
    expect(text).toContain('459')
    expect(text.split('\n').filter((l) => l.startsWith('  - ')).length).toBeLessThanOrEqual(20)
  })
  it('missing file -> non-zero', () => {
    expect(runCli(['/nonexistent.csv'], geo, quiet().log)).toBe(1)
  })
})
