import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { barangaysOf, lgus } from '../src/lib/geo'
import type { Geo, GeoNode, Official } from '../src/lib/types'
import { titleCaseName } from './import-roster'

export const TERM_START = '2023-11-30'
export const TERM_END = '2026-11-30'
export const SOURCES = ['comelec', 'dilg', 'community'] as const
type Source = (typeof SOURCES)[number]
const COLUMNS = ['municipality', 'barangay', 'name', 'source']

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
const squash = (s: string) => fold(s).replace(/[^a-z0-9]/g, '')

const lguKey = (s: string) =>
  squash(
    fold(s)
      .trim()
      .replace(/^(city|municipality)\s+of\s+/, '')
      .replace(/\s+city$/, ''),
  )
/** Barangay key; keeps digits, strips "Barangay"/"Brgy." prefix. `loose` also drops "(Pob.)"-style parentheticals. */
const brgyKey = (s: string, loose: boolean) => {
  let t = fold(s).trim()
  if (loose) t = t.replace(/\([^)]*\)/g, ' ')
  t = t.trim().replace(/^(barangay|brgy\.?)\s+/, '')
  return squash(t)
}

/** Minimal RFC 4180 parser: quotes, doubled quotes, CRLF/LF, optional BOM. Blank lines are skipped. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let any = false
  const endRow = () => {
    row.push(cell)
    if (any || row.length > 1 || row[0] !== '') rows.push(row)
    row = []
    cell = ''
    any = false
  }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"') {
      quoted = true
      any = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
      any = true
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      endRow()
    } else cell += ch
  }
  if (cell !== '' || row.length || any) endRow()
  return rows
}

export interface CaptainResult {
  officials: Official[]
  unmatched: string[]
  duplicates: string[]
  invalid: string[]
}

export function captainsFromCsv(csv: string, geo: Geo): CaptainResult {
  const out: CaptainResult = { officials: [], unmatched: [], duplicates: [], invalid: [] }
  const rows = parseCsv(csv)
  if (!rows.length) return out
  const header = rows[0].map((h) => fold(h).trim())
  const idx = COLUMNS.map((c) => header.indexOf(c))
  if (idx.some((i) => i < 0)) {
    out.invalid.push(`row 1: header must contain columns ${COLUMNS.join(',')} (got "${rows[0].join(',')}")`)
    return out
  }

  const lguByKey = new Map<string, GeoNode>()
  for (const l of lgus(geo)) lguByKey.set(lguKey(l.name), l)
  const brgyIndex = new Map<string, { strict: Map<string, GeoNode>; loose: Map<string, GeoNode[]> }>()
  const indexFor = (lgu: GeoNode) => {
    let e = brgyIndex.get(lgu.psgc)
    if (!e) {
      e = { strict: new Map(), loose: new Map() }
      for (const b of barangaysOf(geo, lgu.psgc)) {
        e.strict.set(brgyKey(b.name, false), b)
        const k = brgyKey(b.name, true)
        e.loose.set(k, [...(e.loose.get(k) ?? []), b])
      }
      brgyIndex.set(lgu.psgc, e)
    }
    return e
  }

  const seen = new Set<string>()
  const found: Official[] = []
  rows.slice(1).forEach((r, n) => {
    const rowNo = n + 2
    const [lguRaw, brgyRaw, nameRaw, srcRaw] = idx.map((i) => (r[i] ?? '').trim())
    const desc = `row ${rowNo}: ${lguRaw} / ${brgyRaw} / ${nameRaw} / ${srcRaw}`
    if (r.length < COLUMNS.length) return void out.invalid.push(`${desc} (expected ${COLUMNS.length} columns, got ${r.length})`)
    const source = srcRaw.toLowerCase()
    if (!(SOURCES as readonly string[]).includes(source))
      return void out.invalid.push(`${desc} (source must be one of ${SOURCES.join('|')})`)
    if (!nameRaw) return void out.invalid.push(`${desc} (empty name)`)

    const lgu = lguByKey.get(lguKey(lguRaw))
    if (!lgu) return void out.unmatched.push(`${desc} (unknown municipality)`)
    const e = indexFor(lgu)
    let b = e.strict.get(brgyKey(brgyRaw, false))
    if (!b) {
      const cands = e.loose.get(brgyKey(brgyRaw, true)) ?? []
      if (cands.length === 1) b = cands[0]
    }
    if (!b) return void out.unmatched.push(`${desc} (unknown barangay in ${lgu.name})`)
    if (seen.has(b.psgc)) return void out.duplicates.push(`${desc} (${b.name}, ${lgu.name} already has a captain; first row wins)`)
    seen.add(b.psgc)
    found.push({
      id: `2023-${b.psgc}-punong-barangay`,
      personId: `cap-${b.psgc}-2023`,
      name: titleCaseName(nameRaw),
      position: 'Punong Barangay',
      level: 'barangay',
      geoCode: b.psgc,
      termStart: TERM_START,
      termEnd: TERM_END,
      rosterSource: source as Source,
      rosterVerified: false,
    })
  })
  out.officials = found.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return out
}

export function serializeCaptains(officials: Official[]): string {
  return JSON.stringify(officials, null, 2) + '\n'
}

/** Returns the process exit code. All output goes through `log`. */
export function runCli(argv: string[], geo: Geo, log: (s: string) => void): number {
  const flag = (f: string) => argv.includes(f)
  const outIdx = argv.indexOf('--out')
  const out = resolve(outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : 'data/officials/barangay-captains.json')
  const file = argv.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1))
  if (!file) {
    log('usage: tsx scripts/import-barangays.ts <file.csv> [--out <file.json>] [--allow-partial] [--force]')
    return 1
  }
  let csv: string
  try {
    csv = readFileSync(resolve(file), 'utf8')
  } catch (e) {
    log(`cannot read ${file}: ${(e as Error).message}`)
    return 1
  }
  const r = captainsFromCsv(csv, geo)
  log(`captains: ${r.officials.length}, unmatched: ${r.unmatched.length}, duplicates: ${r.duplicates.length}, invalid: ${r.invalid.length}`)
  for (const [label, list] of [['UNMATCHED', r.unmatched], ['DUPLICATE', r.duplicates], ['INVALID', r.invalid]] as const)
    for (const l of list) log(`${label} ${l}`)

  const have = new Set(r.officials.map((o) => o.geoCode))
  const missing = lgus(geo).flatMap((l) =>
    barangaysOf(geo, l.psgc)
      .filter((b) => !have.has(b.psgc))
      .map((b) => `${b.name} (${l.name})`),
  )
  if (missing.length > 20) log(`${missing.length} barangays have no captain in this CSV; first 20:`)
  else log(`${missing.length} barangays have no captain in this CSV:`)
  for (const m of missing.slice(0, 20)) log(`  - ${m}`)

  if ((r.unmatched.length || r.invalid.length) && !flag('--allow-partial')) {
    log('not written: fix unmatched/invalid rows or pass --allow-partial')
    return 1
  }
  if (existsSync(out) && !flag('--force')) {
    log(`refusing to overwrite ${out}; pass --force`)
    return 1
  }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, serializeCaptains(r.officials))
  log(`wrote ${out}`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const geo = JSON.parse(readFileSync(resolve('data/geo.json'), 'utf8')) as Geo
  process.exit(runCli(process.argv.slice(2), geo, (s) => console.log(s)))
}
