import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { netWorthMatches } from '../src/lib/money'
import type { Geo, Official, SalnRecord } from '../src/lib/types'

function readJsonDir<T>(dir: string): { file: string; value: T }[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, value: JSON.parse(readFileSync(join(dir, f), 'utf8')) as T }))
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

  for (const { file, value: o } of officials) {
    if (!geoCodes.has(o.geoCode)) {
      errors.push(`officials/${file}: unknown-geoCode: ${o.geoCode} is not in geo.json`)
    }
    if (o.termEnd !== null && o.termEnd < o.termStart) {
      errors.push(`officials/${file}: term-order: termEnd ${o.termEnd} is before termStart ${o.termStart}`)
    }
  }

  const seen = new Set<string>()
  for (const { file, value: r } of salns) {
    if (!personIds.has(r.personId)) {
      errors.push(`saln/${file}: orphan-personId: no official with personId ${r.personId}`)
    }
    if (!r.sourceUrl) errors.push(`saln/${file}: missing-sourceUrl: sourceUrl is required`)
    if (!r.status) errors.push(`saln/${file}: missing-status: status is required`)
    if (!netWorthMatches(r)) {
      errors.push(`saln/${file}: net-worth-mismatch: netWorth must equal totalAssets - totalLiabilities`)
    }
    if (r.status === 'verified') {
      if (!r.verifiedBy) errors.push(`saln/${file}: verified-missing-verifiedBy: verified requires verifiedBy`)
      if (!r.verifiedAt) errors.push(`saln/${file}: verified-missing-verifiedAt: verified requires verifiedAt`)
    }
    const key = `${r.personId}|${r.year}|${r.sourceType}`
    if (seen.has(key)) {
      errors.push(`saln/${file}: duplicate-saln: duplicate (personId, year, sourceType) ${key}`)
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
