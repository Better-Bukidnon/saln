import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { netWorthMatches } from '../src/lib/money'
import { safeHref } from '../src/lib/url'
import { SALN_SOURCE_TYPES, SALN_STATUSES } from '../src/lib/types'
import type { Geo, Official, SalnRecord } from '../src/lib/types'

function readJsonDir<T>(dir: string): { file: string; value: T }[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      // a file holds one record or an array of records
      const parsed = JSON.parse(readFileSync(join(dir, f), 'utf8')) as T | T[]
      return (Array.isArray(parsed) ? parsed : [parsed]).map((value) => ({ file: f, value }))
    })
}

function validIsoDate(v: unknown): boolean {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(v)) return false
  const d = new Date(v)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v.slice(0, 10)
}

export function validateData(dir: string, opts: { strictGeoCounts?: boolean } = {}): string[] {
  const errors: string[] = []
  const geoPath = join(dir, 'geo.json')
  const geo: Geo = existsSync(geoPath)
    ? (JSON.parse(readFileSync(geoPath, 'utf8')) as Geo)
    : { nodes: [] }
  const geoCodes = new Set(geo.nodes.map((n) => n.psgc))
  if (opts.strictGeoCounts && geo.nodes.length > 0) {
    const count = (types: string[]) => geo.nodes.filter((n) => types.includes(n.type)).length
    const want: [string, number, number][] = [
      ['province', count(['province']), 1],
      ['LGU (city+municipality)', count(['city', 'municipality']), 22],
      ['barangay', count(['barangay']), 464],
    ]
    for (const [label, got, exp] of want) {
      if (got !== exp) errors.push(`geo.json: geo-counts: expected ${exp} ${label} nodes, found ${got}`)
    }
    for (const n of geo.nodes) {
      if (n.type !== 'province' && (!n.parent || !geoCodes.has(n.parent))) {
        errors.push(`geo.json: geo-orphan-parent: ${n.psgc} (${n.name}) has missing parent ${n.parent}`)
      }
    }
  }
  const officials = readJsonDir<Official>(join(dir, 'officials'))
  const salns = readJsonDir<SalnRecord>(join(dir, 'saln'))
  const personIds = new Set(officials.map((o) => o.value.personId))

  const seenOfficial = new Map<string, string>()
  for (const { file, value: o } of officials) {
    const at = `officials/${file}[${o.id}]`
    if (!geoCodes.has(o.geoCode)) {
      errors.push(`${at}: unknown-geoCode: ${o.geoCode} is not in geo.json`)
    }
    if (o.termEnd !== null && o.termEnd < o.termStart) {
      errors.push(`${at}: term-order: termEnd ${o.termEnd} is before termStart ${o.termStart}`)
    }
    const first = seenOfficial.get(o.id)
    if (first !== undefined) {
      errors.push(`${at}: duplicate-official-id: id ${o.id} also appears in officials/${first}`)
    } else seenOfficial.set(o.id, file)
  }

  const seen = new Set<string>()
  const seenSalnId = new Map<string, string>()
  for (const { file, value: r } of salns) {
    const at = `saln/${file}[${r.id}]`
    if (!personIds.has(r.personId)) {
      errors.push(`${at}: orphan-personId: no official with personId ${r.personId}`)
    }
    if (!r.sourceUrl) errors.push(`${at}: missing-sourceUrl: sourceUrl is required`)
    else if (!safeHref(r.sourceUrl)) {
      errors.push(`${at}: bad-source-url: record ${r.id} sourceUrl must be an http(s) URL`)
    }
    if (!r.status) errors.push(`${at}: missing-status: status is required`)
    else if (!(SALN_STATUSES as readonly string[]).includes(r.status)) {
      errors.push(`${at}: bad-status: status "${String(r.status)}" must be one of ${SALN_STATUSES.join(', ')}`)
    }
    if (!(SALN_SOURCE_TYPES as readonly string[]).includes(r.sourceType)) {
      errors.push(`${at}: bad-source-type: sourceType "${String(r.sourceType)}" must be one of ${SALN_SOURCE_TYPES.join(', ')}`)
    }
    if (!Number.isInteger(r.year) || r.year < 1987 || r.year > new Date().getFullYear() + 1) {
      errors.push(`${at}: bad-year: year ${String(r.year)} must be an integer between 1987 and next year`)
    }
    for (const k of ['totalAssets', 'totalLiabilities', 'netWorth'] as const) {
      if (typeof r[k] !== 'number' || !Number.isFinite(r[k])) {
        errors.push(`${at}: bad-amount: ${k} must be a finite number`)
      }
    }
    if (r.verifiedAt !== undefined && !validIsoDate(r.verifiedAt)) {
      errors.push(`${at}: bad-verifiedAt: verifiedAt "${String(r.verifiedAt)}" must be an ISO date (YYYY-MM-DD)`)
    }
    const prior = seenSalnId.get(r.id)
    if (prior !== undefined) {
      errors.push(`${at}: duplicate-saln-id: id ${r.id} also appears in saln/${prior}`)
    } else seenSalnId.set(r.id, file)
    if (!netWorthMatches(r)) {
      errors.push(`${at}: net-worth-mismatch: netWorth must equal totalAssets - totalLiabilities`)
    }
    if (r.status === 'verified') {
      if (!r.verifiedBy) errors.push(`${at}: verified-missing-verifiedBy: verified requires verifiedBy`)
      if (!r.verifiedAt) errors.push(`${at}: verified-missing-verifiedAt: verified requires verifiedAt`)
    }
    const key = `${r.personId}|${r.year}|${r.sourceType}`
    if (seen.has(key)) {
      errors.push(`${at}: duplicate-saln: duplicate (personId, year, sourceType) ${key}`)
    }
    seen.add(key)
  }
  return errors
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateData(resolve(process.argv[2] ?? 'data'), { strictGeoCounts: true })
  if (errors.length) {
    for (const e of errors) console.error(e)
    process.exit(1)
  }
  console.log('data ok')
}
