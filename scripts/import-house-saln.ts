import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { netWorthMatches } from '../src/lib/money'
import type { Official, SalnRecord } from '../src/lib/types'

export const OCR_NEEDED = 'scanned PDF: OCR needed'
export const FILING_TYPE = 'House summary (as of 31 Dec)'

export interface HouseRow {
  name: string
  district: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

const AMOUNT = /^[-(]?\d{1,3}(?:,\d{3})*\.\d{2}\)?$/
function parseAmount(s: string): number | undefined {
  if (!AMOUNT.test(s)) return undefined
  const neg = s.startsWith('-') || s.startsWith('(')
  const n = Number(s.replace(/[-(),]/g, ''))
  return neg ? -n : n
}

const ROW =
  /^(.*?)\s+((?:Lone|\d+(?:st|nd|rd|th)) District),\s*(.+?)\s{2,}(\S+)\s+(\S+)\s+(\S+)\s*$/i
const AMOUNTS_ONLY = /^\s*\S+\s+\S+\s+\S+\s*$/

/** Parse the `pdftotext -layout` text of the House SALN summary into rows of one province. */
export function parseHouseSummary(text: string, province: string): HouseRow[] {
  if (!text.replace(/[\s\f]/g, '')) throw new Error(OCR_NEEDED)
  const want = province.trim().toLowerCase()
  const lines = text.split(/\r?\n/)
  const rows: HouseRow[] = []
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    // a long name can push the amounts onto the next line
    if (
      /District,\s*\S/i.test(line) &&
      !ROW.test(line) &&
      i + 1 < lines.length &&
      AMOUNTS_ONLY.test(lines[i + 1]) &&
      /\d\.\d\d/.test(lines[i + 1])
    ) {
      line = `${line.trimEnd()}  ${lines[i + 1].trim().replace(/\s+/g, '  ')}`
      i++
    }
    const m = ROW.exec(line)
    if (!m) continue
    if (m[3].trim().toLowerCase() !== want) continue
    const name = m[1].replace(/^\s*\d+\s+/, '').replace(/^[A-Z*]\s+(?=[A-Z])/, '').trim()
    const district = `${m[2]}, ${m[3].trim()}`
    const [a, l, n] = [m[4], m[5], m[6]].map(parseAmount)
    if (a === undefined || l === undefined || n === undefined) {
      throw new Error(`unparseable amounts for ${name} (${district}): ${m[4]} | ${m[5]} | ${m[6]}`)
    }
    rows.push({ name, district, totalAssets: a, totalLiabilities: l, netWorth: n })
  }
  return rows
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v'])
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

function houseNameParts(name: string): { surname: string; first: string } | undefined {
  const comma = name.indexOf(',')
  if (comma < 0) return undefined
  const surname = fold(name.slice(0, comma)).join('')
  const given = fold(name.slice(comma + 1)).filter((t) => !SUFFIXES.has(t))
  return surname && given.length ? { surname, first: given[0] } : undefined
}
/** Dynasties display names are "Given [Middle] Surname [JR]". */
function officialNameParts(name: string): { surname: string; first: string } | undefined {
  const t = fold(name).filter((x) => !SUFFIXES.has(x))
  return t.length >= 2 ? { surname: t[t.length - 1], first: t[0] } : undefined
}

function inTerm(o: Official, year: number): boolean {
  const asOf = `${year}-12-31`
  return o.termStart <= asOf && (o.termEnd === null || o.termEnd >= asOf)
}
const isDistrictRep = (o: Official, year: number) =>
  o.level === 'district' && /^representative/i.test(o.position) && inTerm(o, year)

/**
 * Alias (maintainer-set) wins. Otherwise auto-match only on surname AND first given name, and only
 * when exactly one representative of that year (same district, when known) qualifies.
 */
export function matchOfficial(
  row: HouseRow,
  officials: Official[],
  aliases: Record<string, string>,
  year: number,
): Official | undefined {
  const pool = officials.filter((o) => isDistrictRep(o, year))
  const aliased = Object.hasOwn(aliases, row.name) ? aliases[row.name] : undefined
  if (aliased !== undefined) return pool.find((o) => o.personId === aliased)
  const h = houseNameParts(row.name)
  if (!h) return undefined
  const ord = /^(\d+)/.exec(row.district)?.[1]
  const hits = pool.filter((o) => {
    const p = officialNameParts(o.name)
    if (!p || p.surname !== h.surname || p.first !== h.first) return false
    return !ord || o.district === undefined || String(o.district) === ord
  })
  return hits.length === 1 ? hits[0] : undefined
}

export function rowsToRecords(
  rows: HouseRow[],
  officials: Official[],
  aliases: Record<string, string>,
  year: number,
  sourceUrl: string,
): { records: SalnRecord[]; unmatched: HouseRow[]; mismatched: HouseRow[] } {
  const records: SalnRecord[] = []
  const unmatched: HouseRow[] = []
  const mismatched: HouseRow[] = []
  for (const row of rows) {
    if (!netWorthMatches(row)) {
      mismatched.push(row)
      continue
    }
    const o = matchOfficial(row, officials, aliases, year)
    if (!o) {
      unmatched.push(row)
      continue
    }
    records.push({
      id: `house-${year}-${o.personId}`,
      personId: o.personId,
      year,
      filingType: FILING_TYPE,
      totalAssets: row.totalAssets,
      totalLiabilities: row.totalLiabilities,
      netWorth: row.netWorth,
      sourceType: 'house-summary',
      sourceUrl,
      status: 'submitted',
    })
  }
  records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { records, unmatched, mismatched }
}

export function serialize(records: SalnRecord[]): string {
  return JSON.stringify(records, null, 2) + '\n'
}

export interface DownloadOpts {
  fetchFn?: typeof fetch
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
}
export async function downloadFile(url: string, opts: DownloadOpts = {}): Promise<Uint8Array> {
  const fetchFn = opts.fetchFn ?? fetch
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchFn(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 60_000) })
      if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`)
      return new Uint8Array(await res.arrayBuffer())
    } catch (e) {
      lastErr = e
      if (attempt < 2) await sleep(1000 * 2 ** attempt)
    }
  }
  throw new Error(`failed after 3 attempts for ${url}: ${(lastErr as Error).message}`)
}

type ExecFn = (
  file: string,
  args: string[],
  opts: { maxBuffer: number },
) => Promise<{ stdout: string }>

export async function extractText(
  pdfPath: string,
  exec: ExecFn = promisify(execFile) as unknown as ExecFn,
): Promise<string> {
  const { stdout } = await exec('pdftotext', ['-layout', pdfPath, '-'], { maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

function loadOfficials(dir: string): Official[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      const v = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Official | Official[]
      return Array.isArray(v) ? v : [v]
    })
}

async function main(argv: string[]) {
  const valueFlags = new Set(['--year', '--province', '--aliases', '--out', '--source-url'])
  const arg = (name: string) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const input = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && valueFlags.has(argv[i - 1])))
  const year = Number(arg('--year'))
  const province = arg('--province')
  if (!input || !Number.isInteger(year) || !province) {
    throw new Error(
      'usage: import-house-saln <pdf-url-or-path> --year 2016 --province Bukidnon [--aliases f] [--out f] [--force]',
    )
  }
  const out = resolve(arg('--out') ?? `data/saln/house-${year}.json`)
  if (existsSync(out) && !argv.includes('--force')) {
    throw new Error(`${out} exists; pass --force to overwrite`)
  }
  const isUrl = /^https?:\/\//i.test(input)
  const sourceUrl = isUrl ? input : arg('--source-url')
  if (!sourceUrl) throw new Error('a local PDF path needs --source-url <public url of the PDF>')
  let pdf = resolve(input)
  if (isUrl) {
    pdf = join(mkdtempSync(join(tmpdir(), 'house-saln-')), 'saln.pdf')
    writeFileSync(pdf, await downloadFile(input))
  }
  const text = await extractText(pdf)
  const rows = parseHouseSummary(text, province)
  const aliasFile = arg('--aliases')
  const aliases = aliasFile
    ? (JSON.parse(readFileSync(resolve(aliasFile), 'utf8')) as Record<string, string>)
    : {}
  const officials = loadOfficials(resolve('data/officials'))
  const { records, unmatched, mismatched } = rowsToRecords(rows, officials, aliases, year, sourceUrl)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, serialize(records))
  console.log(
    `rows: ${rows.length}, matched: ${records.length}, unmatched: ${unmatched.length}, mismatched: ${mismatched.length}`,
  )
  for (const r of unmatched) console.log(`  UNMATCHED ${r.name} (${r.district}) - add to aliases if confident`)
  for (const r of mismatched)
    console.log(`  MISMATCHED ${r.name}: ${r.totalAssets} - ${r.totalLiabilities} != ${r.netWorth}`)
  console.log(`wrote ${out}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e: Error) => {
    console.error(e.message)
    process.exit(1)
  })
}
