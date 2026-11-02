import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  ['duplicate-official-id', 'duplicate-official-id'],
  ['orphan-person', 'orphan-personId'],
  ['bad-source-url-javascript', 'bad-source-url'],
  ['bad-source-url-data', 'bad-source-url'],
  ['bad-source-url-garbage', 'bad-source-url'],
  ['bad-source-url-mixedcase', 'bad-source-url'],
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

describe('validateData record ids in messages', () => {
  it('term-order message names the record id', () => {
    const [e] = validateData(join(fx, 'invalid', 'term-reversed'))
    expect(e).toContain('officials/gov.json[o1]:')
  })
  it('duplicate-official-id names the id and the first file', () => {
    const [e] = validateData(join(fx, 'invalid', 'duplicate-official-id'))
    expect(e).toContain('[o1]')
  })
  it('saln errors name the record id', () => {
    const [e] = validateData(join(fx, 'invalid', 'missing-sourceurl'))
    expect(e).toMatch(/saln\/[^:]+\[[^\]]+\]: missing-sourceUrl/)
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

describe('validateData SALN field checks', () => {
  const base = JSON.parse(readFileSync(join(fx, 'valid', 'saln', 'p1-2024.json'), 'utf8')) as Record<string, unknown>
  const run = (records: Record<string, unknown>[]) => {
    const d = mkdtempSync(join(tmpdir(), 'saln-'))
    cpSync(join(fx, 'valid'), d, { recursive: true })
    rmSync(join(d, 'saln'), { recursive: true })
    mkdirSync(join(d, 'saln'))
    records.forEach((r, i) => writeFileSync(join(d, 'saln', `r${i}.json`), JSON.stringify(r)))
    return validateData(d)
  }
  it('accepts a valid record', () => expect(run([base])).toEqual([]))
  it('rejects a status typo ("Verified")', () => {
    expect(run([{ ...base, status: 'Verified' }]).join('\n')).toContain('bad-status')
  })
  it('rejects an unknown sourceType', () => {
    expect(run([{ ...base, sourceType: 'Ombudsman' }]).join('\n')).toContain('bad-source-type')
  })
  it.each([2024.5, '2024', 1900, 3000])('rejects year %s', (year) => {
    expect(run([{ ...base, year }]).join('\n')).toContain('bad-year')
  })
  it('rejects non-finite or non-number amounts', () => {
    const e = run([{ ...base, totalAssets: '5', totalLiabilities: null }]).join('\n')
    expect(e).toContain('bad-amount: totalAssets')
    expect(e).toContain('bad-amount: totalLiabilities')
  })
  it.each(['yesterday', '2026-13-40', '2026-02-30'])('rejects verifiedAt %s', (verifiedAt) => {
    expect(run([{ ...base, verifiedAt }]).join('\n')).toContain('bad-verifiedAt')
  })
  it('accepts a full ISO timestamp for verifiedAt', () => {
    expect(run([{ ...base, verifiedAt: '2026-01-01T08:00:00Z' }])).toEqual([])
  })
  it('rejects a duplicate SALN id', () => {
    const e = run([base, { ...base, year: 2023 }]).join('\n')
    expect(e).toContain('duplicate-saln-id')
  })
})
