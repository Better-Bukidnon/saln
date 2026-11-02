import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildGeo } from '../../scripts/build-geo'
import { barangaysOf, lgus, nodeByCode } from '../../src/lib/geo'

const geo = {
  nodes: buildGeo(readFileSync(join(__dirname, '..', 'fixtures', 'psgc-sample.csv'), 'utf8')),
}

describe('geo helpers', () => {
  it('lgus returns cities and municipalities sorted by name', () => {
    expect(lgus(geo).map((n) => n.name)).toEqual(['Baungon', 'Malaybalay City'])
  })
  it('lgus sorts "City of X" under X but keeps the displayed name', () => {
    const g = {
      nodes: [
        { psgc: '1', name: 'Wao', type: 'municipality' as const },
        { psgc: '2', name: 'City of Malaybalay', type: 'city' as const },
        { psgc: '3', name: 'Baungon', type: 'municipality' as const },
        { psgc: '4', name: 'City of Valencia', type: 'city' as const },
        { psgc: '5', name: 'Lantapan', type: 'municipality' as const },
      ],
    }
    expect(lgus(g).map((n) => n.name)).toEqual(['Baungon', 'Lantapan', 'City of Malaybalay', 'City of Valencia', 'Wao'])
  })
  it('barangaysOf returns only that LGU barangays', () => {
    const a = barangaysOf(geo, '1001301000')
    const b = barangaysOf(geo, '1001302000')
    expect(a.map((n) => n.name)).toEqual(['Balintad', 'Poblacion'])
    expect(b.map((n) => n.name)).toEqual(['Aglayan', 'Poblacion'])
    expect(a[1].psgc).not.toBe(b[1].psgc)
  })
  it('nodeByCode finds and misses', () => {
    expect(nodeByCode(geo, '1001301000')?.name).toBe('Baungon')
    expect(nodeByCode(geo, 'bogus')).toBeUndefined()
  })
})
