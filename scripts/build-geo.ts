import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Geo, GeoNode } from '../src/lib/types'

// Bukidnon in the PSA PSGC: region 10, province 013 -> 10-digit 1001300000.
const PREFIX = '10013'
const LEVELS: Record<string, GeoNode['type']> = {
  Prov: 'province',
  City: 'city',
  Mun: 'municipality',
  Bgy: 'barangay',
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f !== '')) rows.push(row)
  return rows
}

function parentOf(code: string, type: GeoNode['type']): string | undefined {
  if (type === 'province') return undefined
  if (type === 'barangay') return code.slice(0, 7) + '000'
  return code.slice(0, 5) + '00000'
}

export function buildGeo(csvText: string): GeoNode[] {
  const [header, ...rows] = parseCsv(csvText)
  const norm = (s: string) => s.trim().toLowerCase()
  const h = (header ?? []).map(norm)
  const codeIdx = h.findIndex((c) => c === '10-digit psgc' || c === 'psgc' || c === 'code')
  const nameIdx = h.indexOf('name')
  const levelIdx = h.indexOf('geographic level')
  if (codeIdx < 0 || nameIdx < 0 || levelIdx < 0) {
    throw new Error('Missing required column(s): need "10-digit PSGC", "Name", "Geographic Level"')
  }
  const nodes: GeoNode[] = []
  for (const r of rows) {
    const code = (r[codeIdx] ?? '').trim()
    const type = LEVELS[(r[levelIdx] ?? '').trim()]
    if (!type || !/^\d{10}$/.test(code) || !code.startsWith(PREFIX)) continue
    const node: GeoNode = { psgc: code, name: (r[nameIdx] ?? '').trim(), type }
    const parent = parentOf(code, type)
    if (parent) node.parent = parent
    nodes.push(node)
  }
  return nodes
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2]
  if (!input) {
    console.error('usage: tsx scripts/build-geo.ts <psgc.csv>')
    process.exit(1)
  }
  const geo: Geo = { nodes: buildGeo(readFileSync(resolve(input), 'utf8')) }
  writeFileSync(resolve('data/geo.json'), JSON.stringify(geo, null, 2) + '\n')
  const c = (t: string) => geo.nodes.filter((n) => n.type === t).length
  console.log(
    `wrote data/geo.json: ${c('province')} province, ${c('city')} cities, ${c('municipality')} municipalities, ${c('barangay')} barangays`,
  )
}
