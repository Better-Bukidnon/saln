import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildGeo } from '../../scripts/build-geo'

const csv = readFileSync(join(__dirname, '..', 'fixtures', 'psgc-sample.csv'), 'utf8')

describe('buildGeo', () => {
  const nodes = buildGeo(csv)
  const of = (t: string) => nodes.filter((n) => n.type === t)
  it('keeps 1 province, 2 LGUs, 4 barangays and drops non-Bukidnon rows', () => {
    expect(of('province')).toHaveLength(1)
    expect(of('city')).toHaveLength(1)
    expect(of('municipality')).toHaveLength(1)
    expect(of('barangay')).toHaveLength(4)
    expect(nodes.every((n) => n.psgc.startsWith('10013'))).toBe(true)
  })
  it('sets parent from the code hierarchy', () => {
    const baungon = nodes.find((n) => n.name === 'Baungon')!
    expect(baungon.parent).toBe('1001300000')
    expect(nodes.find((n) => n.type === 'province')!.parent).toBeUndefined()
    for (const b of of('barangay')) {
      expect(nodes.find((n) => n.psgc === b.parent)?.type).toMatch(/city|municipality/)
      expect(b.psgc.startsWith(b.parent!.slice(0, 7))).toBe(true)
    }
  })
  it('handles quoted commas and keeps both Poblacion with distinct codes', () => {
    const pob = nodes.filter((n) => n.name === 'Poblacion')
    expect(pob.map((n) => n.psgc)).toEqual(['1001301002', '1001302002'])
    expect(pob.map((n) => n.parent)).toEqual(['1001301000', '1001302000'])
  })
  it('throws on missing columns', () => {
    expect(() => buildGeo('a,b\n1,2')).toThrow(/column/i)
  })
})
