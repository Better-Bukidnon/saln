import type { Geo, Level, Official, SalnRecord } from './types'
import { nodeByCode } from './geo'

export type Status = 'current' | 'former' | 'all'
export type SortKey = 'name' | 'netWorth' | 'assets' | 'liabilities'
export type Dir = 'asc' | 'desc'

export interface Filters {
  lgu?: string
  barangay?: string
  provinceWide: boolean
  level?: Level
  status: Status
  hasSaln: boolean
  q: string
  sort: SortKey
  dir: Dir
}

export const defaultFilters: Filters = {
  provinceWide: false,
  status: 'current',
  hasSaln: false,
  q: '',
  sort: 'name',
  dir: 'asc',
}

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

// Calendar day is computed in fixed UTC+8 (Asia/Manila, no DST), independent of
// the machine timezone, and compared as YYYY-MM-DD strings. An Invalid Date has
// no calendar day: day() returns null and such a date is neither current nor
// former (no throw).
function day(d: Date): string | null {
  const t = d.getTime()
  if (Number.isNaN(t)) return null
  return new Date(t + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export function isCurrent(o: Official, today: Date): boolean {
  const t = day(today)
  if (t === null) return false
  return o.termStart <= t && (o.termEnd === null || t <= o.termEnd)
}

export function isFormer(o: Official, today: Date): boolean {
  const t = day(today)
  return t !== null && o.termEnd !== null && o.termEnd < t
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function filterOfficials(
  officials: Official[],
  salnByPerson: Map<string, SalnRecord[]>,
  geo: Geo,
  f: Filters,
  today: Date,
): Official[] {
  const q = norm(f.q.trim())
  return officials.filter((o) => {
    if (f.lgu) {
      const provinceWide = o.level === 'province' || o.level === 'district'
      if (f.barangay) {
        if (o.geoCode !== f.barangay) return false
      } else if (provinceWide) {
        if (!f.provinceWide) return false
      } else if (o.geoCode !== f.lgu) {
        const n = o.level === 'barangay' ? nodeByCode(geo, o.geoCode) : undefined
        if (!n || n.parent !== f.lgu) return false
      }
    }
    if (f.level && o.level !== f.level) return false
    if (f.status === 'current' && !isCurrent(o, today)) return false
    if (f.status === 'former' && !isFormer(o, today)) return false
    if (f.hasSaln && !(salnByPerson.get(o.personId)?.length)) return false
    if (q && !norm(o.name).includes(q)) return false
    return true
  })
}

function latest(records: SalnRecord[] | undefined): SalnRecord | undefined {
  if (!records?.length) return undefined
  return records.reduce((a, b) => (b.year > a.year ? b : a))
}

const FIELD = { netWorth: 'netWorth', assets: 'totalAssets', liabilities: 'totalLiabilities' } as const

export function sortOfficials(
  officials: Official[],
  salnByPerson: Map<string, SalnRecord[]>,
  f: Filters,
): Official[] {
  const sign = f.dir === 'desc' ? -1 : 1
  const byId = (a: Official, b: Official) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const out = [...officials]
  if (f.sort === 'name') {
    const keys = new Map(out.map((o) => [o.id, norm(o.name)]))
    return out.sort((a, b) => {
      const ka = keys.get(a.id)!
      const kb = keys.get(b.id)!
      return ka === kb ? byId(a, b) : sign * (ka < kb ? -1 : 1)
    })
  }
  const field = FIELD[f.sort]
  const val = (o: Official) => latest(salnByPerson.get(o.personId))?.[field]
  return out.sort((a, b) => {
    const va = val(a)
    const vb = val(b)
    if (va === undefined && vb === undefined) return byId(a, b)
    if (va === undefined) return 1
    if (vb === undefined) return -1
    return va === vb ? byId(a, b) : sign * (va - vb)
  })
}

const bool = (v: string | null) => v === '1' || v === 'true'
const pick = <T extends string>(v: string | null, allowed: T[], d: T): T =>
  allowed.includes(v as T) ? (v as T) : d

export function parseFilters(params: URLSearchParams, geo: Geo): Filters {
  const f: Filters = { ...defaultFilters }
  const lgu = params.get('lgu')
  const lguNode = lgu ? nodeByCode(geo, lgu) : undefined
  if (lgu && lguNode && (lguNode.type === 'city' || lguNode.type === 'municipality')) {
    f.lgu = lgu
    const b = params.get('barangay')
    const bNode = b ? nodeByCode(geo, b) : undefined
    if (b && bNode && bNode.type === 'barangay' && bNode.parent === lgu) f.barangay = b
  }
  f.provinceWide = bool(params.get('pw'))
  const level = params.get('level')
  if (level && LEVELS.includes(level as Level)) f.level = level as Level
  f.status = pick(params.get('status'), STATUSES, defaultFilters.status)
  f.hasSaln = bool(params.get('saln'))
  f.q = params.get('q') ?? ''
  f.sort = pick(params.get('sort'), SORTS, defaultFilters.sort)
  f.dir = pick(params.get('dir'), DIRS, defaultFilters.dir)
  return f
}

export function serializeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.lgu) p.set('lgu', f.lgu)
  if (f.lgu && f.barangay) p.set('barangay', f.barangay)
  if (f.provinceWide) p.set('pw', '1')
  if (f.level) p.set('level', f.level)
  if (f.status !== defaultFilters.status) p.set('status', f.status)
  if (f.hasSaln) p.set('saln', '1')
  if (f.q) p.set('q', f.q)
  if (f.sort !== defaultFilters.sort) p.set('sort', f.sort)
  if (f.dir !== defaultFilters.dir) p.set('dir', f.dir)
  return p
}
