import { readdirSync } from 'node:fs'
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
