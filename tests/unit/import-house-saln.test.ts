import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  OCR_NEEDED,
  downloadFile,
  extractText,
  matchOfficial,
  parseHouseSummary,
  rowsToRecords,
  serialize,
  type HouseRow,
} from '../../scripts/import-house-saln'
import type { Official } from '../../src/lib/types'

const text = readFileSync(join(__dirname, '..', 'fixtures', 'house-saln-sample.txt'), 'utf8')
const URL_ = 'https://docs.congress.hrep.online/download/docs/saln.alpha.31Dec2016.pdf'

const rep = (id: string, name: string, district: 1 | 2 | 3 | 4, start = '2016-06-30', end: string | null = '2019-06-30'): Official => ({
  id: `${start.slice(0, 4)}-${id}`,
  personId: id,
  name,
  position: `Representative, ${district}th District`,
  level: 'district',
  geoCode: '1001300000',
  district,
  termStart: start,
  termEnd: end,
  rosterSource: 'openhalalan',
  rosterVerified: false,
})
const officials: Official[] = [
  rep('oh-acosta', 'Malou Acosta', 1),
  rep('oh-flores', 'Florencio Tadiar Flores JR', 2),
  rep('oh-zubiri', 'Manuel Antonio Zubiri', 3),
  rep('oh-roque', 'Rogelio Neil Roque', 4),
  rep('oh-zubiri22', 'Jose Maria JR Zubiri', 3, '2022-06-30', '2025-06-30'),
]
const row = (over: Partial<HouseRow> = {}): HouseRow => ({
  name: 'ZUBIRI, MANUEL F.',
  district: '3rd District, Bukidnon',
  totalAssets: 100,
  totalLiabilities: 40,
  netWorth: 60,
  ...over,
})

describe('parseHouseSummary', () => {
  const rows = parseHouseSummary(text, 'Bukidnon')
  it('finds exactly the 4 Bukidnon rows with exact values', () => {
    expect(rows).toEqual([
      { name: 'ACOSTA-ALBA, MA. LOURDES', district: '1st District, Bukidnon', totalAssets: 16366487.45, totalLiabilities: 6507000, netWorth: 9859487.45 },
      { name: 'FLORES, FLORENCIO JR. T.', district: '2nd District, Bukidnon', totalAssets: 11200000, totalLiabilities: 0, netWorth: 11200000 },
      { name: 'ROQUE, ROGELIO NEIL P.', district: '4th District, Bukidnon', totalAssets: 29469927.14, totalLiabilities: 4512738.16, netWorth: 24957188.98 },
      { name: 'ZUBIRI, MANUEL F.', district: '3rd District, Bukidnon', totalAssets: 90134705.53, totalLiabilities: 5315643.53, netWorth: 84819062 },
    ])
  })
  it('compares the province exactly, not by prefix or substring', () => {
    const t = `1 A, B  1st District, Bukidnon del Sur   1.00   0.00   1.00\n2 C, D  1st District, Bukidnon   2.00   0.00   2.00\n3 E, F  1st District, Not Bukidnon   3.00   0.00   3.00`
    expect(parseHouseSummary(t, 'Bukidnon').map((r) => r.name)).toEqual(['C, D'])
    expect(parseHouseSummary(t, 'bukidnon').map((r) => r.name)).toEqual(['C, D'])
  })
  it('joins a row wrapped onto a second line', () => {
    const t = `97 DE VENECIA, CHRISTOPHER "TOFF" VERA PEREZ 4th District, Bukidnon\n      32,752,445.00    2,068,884.00   30,683,561.00`
    expect(parseHouseSummary(t, 'Bukidnon')).toEqual([
      { name: 'DE VENECIA, CHRISTOPHER "TOFF" VERA PEREZ', district: '4th District, Bukidnon', totalAssets: 32752445, totalLiabilities: 2068884, netWorth: 30683561 },
    ])
  })
  it('does not throw on a malformed-amount row of another province (fixture has a Davao Oriental one)', () => {
    expect(text).toContain('9,878,302,76')
    let got: HouseRow[] = []
    expect(() => {
      got = parseHouseSummary(text, 'Bukidnon')
    }).not.toThrow()
    expect(got.map((r) => r.name)).toEqual([
      'ACOSTA-ALBA, MA. LOURDES',
      'FLORES, FLORENCIO JR. T.',
      'ROQUE, ROGELIO NEIL P.',
      'ZUBIRI, MANUEL F.',
    ])
  })
  it('throws "unparseable amounts" when the malformed row belongs to the target province', () => {
    expect(() => parseHouseSummary(text, 'Davao Oriental')).toThrow(/unparseable amounts/)
  })
  it('throws loudly when a matching province row has unparseable amounts', () => {
    const t = `1 A, B   1st District, Bukidnon   1,00,00   0.00   1.00`
    expect(() => parseHouseSummary(t, 'Bukidnon')).toThrow(/unparseable amounts/)
  })
  it('parses 0.00 and negative-looking amounts', () => {
    const t = `1 A, B   1st District, Bukidnon   0.00   0.00   0.00\n2 C, D   2nd District, Bukidnon   100.00   (250.50)   -150.50`
    const r = parseHouseSummary(t, 'Bukidnon')
    expect(r[0]).toMatchObject({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 })
    expect(r[1]).toMatchObject({ totalAssets: 100, totalLiabilities: -250.5, netWorth: -150.5 })
  })
  it('throws "scanned PDF: OCR needed" on empty text', () => {
    expect(() => parseHouseSummary('', 'Bukidnon')).toThrow('scanned PDF: OCR needed')
    expect(() => parseHouseSummary('  \n\f\n ', 'Bukidnon')).toThrow(OCR_NEEDED)
  })
})

describe('matchOfficial', () => {
  it('auto-matches surname and first name (Dynasties name order, suffix ignored)', () => {
    expect(matchOfficial(row({ name: 'FLORES, FLORENCIO JR. T.', district: '2nd District, Bukidnon' }), officials, {}, 2016)?.personId).toBe('oh-flores')
    expect(matchOfficial(row({ name: 'ROQUE, ROGELIO NEIL P.', district: '4th District, Bukidnon' }), officials, {}, 2016)?.personId).toBe('oh-roque')
    expect(matchOfficial(row(), officials, {}, 2016)?.personId).toBe('oh-zubiri')
  })
  it('does not match by the term of another year', () => {
    expect(matchOfficial(row(), officials, {}, 2022)?.personId).not.toBe('oh-zubiri')
  })
  it('never force-matches MA. vs Malou / compound surname', () => {
    expect(matchOfficial(row({ name: 'ACOSTA-ALBA, MA. LOURDES', district: '1st District, Bukidnon' }), officials, {}, 2016)).toBeUndefined()
  })
  it('accent and punctuation insensitive', () => {
    const o = [rep('p1', 'José Peña', 1)]
    expect(matchOfficial(row({ name: 'PENA, JOSE', district: '1st District, Bukidnon' }), o, {}, 2016)?.personId).toBe('p1')
  })
  it('MARIA does not equal MA. by itself', () => {
    const o = [rep('p2', 'Maria Cruz', 1)]
    expect(matchOfficial(row({ name: 'CRUZ, MA. LUISA', district: '1st District, Bukidnon' }), o, {}, 2016)).toBeUndefined()
  })
  it('ambiguous candidates -> undefined', () => {
    const o = [rep('a', 'Juan Cruz', 1), rep('b', 'Juan Cruz', 1)]
    expect(matchOfficial(row({ name: 'CRUZ, JUAN', district: '1st District, Bukidnon' }), o, {}, 2016)).toBeUndefined()
  })
  it('alias wins over auto-match and over ambiguity', () => {
    const o = [rep('a', 'Juan Cruz', 1), rep('b', 'Juan Cruz', 1)]
    const r = row({ name: 'CRUZ, JUAN', district: '1st District, Bukidnon' })
    expect(matchOfficial(r, o, { 'CRUZ, JUAN': 'b' }, 2016)?.personId).toBe('b')
    // alias beats a clean auto-match pointing elsewhere
    expect(matchOfficial(row(), officials, { 'ZUBIRI, MANUEL F.': 'oh-roque' }, 2016)?.personId).toBe('oh-roque')
  })
  it('alias resolves the Acosta-Alba row; an alias to a person outside the term is not forced', () => {
    const r = row({ name: 'ACOSTA-ALBA, MA. LOURDES', district: '1st District, Bukidnon' })
    expect(matchOfficial(r, officials, { [r.name]: 'oh-acosta' }, 2016)?.personId).toBe('oh-acosta')
    expect(matchOfficial(r, officials, { [r.name]: 'oh-zubiri22' }, 2016)).toBeUndefined()
    expect(matchOfficial(r, officials, { [r.name]: 'nobody' }, 2016)).toBeUndefined()
  })
})

describe('rowsToRecords', () => {
  const rows = parseHouseSummary(text, 'Bukidnon')
  const aliases = { 'ACOSTA-ALBA, MA. LOURDES': 'oh-acosta' }
  it('builds submitted house-summary records, never verified', () => {
    const { records, unmatched, mismatched } = rowsToRecords(rows, officials, aliases, 2016, URL_)
    expect(unmatched).toEqual([])
    expect(mismatched).toEqual([])
    expect(records).toHaveLength(4)
    expect(records.find((r) => r.personId === 'oh-zubiri')).toEqual({
      id: 'house-2016-oh-zubiri',
      personId: 'oh-zubiri',
      year: 2016,
      filingType: 'House summary (as of 31 Dec)',
      totalAssets: 90134705.53,
      totalLiabilities: 5315643.53,
      netWorth: 84819062,
      sourceType: 'house-summary',
      sourceUrl: URL_,
      status: 'submitted',
    })
    expect(records.every((r) => r.status === 'submitted' && !('verifiedBy' in r))).toBe(true)
  })
  it('without an alias the Acosta-Alba row is unmatched (names are never force-matched)', () => {
    const { records, unmatched } = rowsToRecords(rows, officials, {}, 2016, URL_)
    expect(unmatched.map((r) => r.name)).toEqual(['ACOSTA-ALBA, MA. LOURDES'])
    expect(records).toHaveLength(3)
  })
  it('routes a net-worth mismatch to mismatched with no record', () => {
    const bad = row({ netWorth: 61 })
    const { records, mismatched, unmatched } = rowsToRecords([bad], officials, {}, 2016, URL_)
    expect(records).toEqual([])
    expect(mismatched).toEqual([bad])
    expect(unmatched).toEqual([])
  })
  it('output is sorted by id and serialization is deterministic', () => {
    const a = rowsToRecords([...rows].reverse(), officials, aliases, 2016, URL_).records
    const b = rowsToRecords(rows, officials, aliases, 2016, URL_).records
    expect(serialize(a)).toBe(serialize(b))
    expect(a.map((r) => r.id)).toEqual([...a.map((r) => r.id)].sort())
  })
})

describe('extractText / downloadFile (no network, no real pdftotext)', () => {
  it('extractText passes an argument array to execFile', async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: 'hello' })
    expect(await extractText('/x/a.pdf', exec)).toBe('hello')
    expect(exec).toHaveBeenCalledWith('pdftotext', ['-layout', '/x/a.pdf', '-'], expect.anything())
  })
  it('downloadFile fails loudly on non-200 after 3 attempts', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('no', { status: 404 }))
    await expect(downloadFile(URL_, { fetchFn, sleep: async () => {} })).rejects.toThrow(/failed after 3 attempts.*HTTP 404/)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
  it('downloadFile retries then returns bytes', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(new Response('abc', { status: 200 }))
    const buf = await downloadFile(URL_, { fetchFn, sleep: async () => {} })
    expect(Buffer.from(buf).toString()).toBe('abc')
  })
})
