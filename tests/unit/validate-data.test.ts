import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateData } from '../../scripts/validate-data'

const fx = join(__dirname, '..', 'fixtures')
const cases: [string, string][] = [
  ['unknown-geocode', 'unknown-geoCode'],
  ['missing-sourceurl', 'missing-sourceUrl'],
  ['networth-mismatch', 'net-worth-mismatch'],
  ['verified-no-verifiedby', 'verified-missing-verifiedBy'],
  ['duplicate-saln', 'duplicate-saln'],
  ['term-reversed', 'term-order'],
  ['orphan-person', 'orphan-personId'],
]

describe('validateData', () => {
  it('valid fixture has no errors', () => expect(validateData(join(fx, 'valid'))).toEqual([]))
  it('tolerates empty dir', () => expect(validateData(join(fx, 'empty'))).toEqual([]))
  it('covers every invalid fixture', () =>
    expect(readdirSync(join(fx, 'invalid')).sort()).toEqual(cases.map((c) => c[0]).sort()))
  it.each(cases)('%s -> one error naming %s', (dir, rule) => {
    const errs = validateData(join(fx, 'invalid', dir))
    expect(errs).toHaveLength(1)
    expect(errs[0]).toContain(rule)
  })
})

describe('validateData strictGeoCounts', () => {
  const mk = (nodes: unknown[]) => {
    const d = mkdtempSync(join(tmpdir(), 'geo-'))
    writeFileSync(join(d, 'geo.json'), JSON.stringify({ nodes }))
    return d
  }
  it('fixture geo passes without the option', () => {
    expect(validateData(join(fx, 'valid'))).toEqual([])
  })
  it('flags wrong counts', () => {
    const errs = validateData(mk([{ psgc: '1001300000', name: 'B', type: 'province' }]), { strictGeoCounts: true })
    expect(errs.join('\n')).toContain('geo-counts')
  })
  it('flags a barangay whose parent is missing', () => {
    const errs = validateData(
      mk([{ psgc: '1001301001', name: 'X', type: 'barangay', parent: '1001301000' }]),
      { strictGeoCounts: true },
    )
    expect(errs.join('\n')).toContain('geo-orphan-parent')
  })
  it('passes the real data/ dir', () => {
    expect(validateData(join(__dirname, '..', '..', 'data'), { strictGeoCounts: true })).toEqual([])
  })
})
