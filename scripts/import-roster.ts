import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lgus } from '../src/lib/geo'
import type { Geo, Official } from '../src/lib/types'

export const API_BASE = 'https://officials.bettergov.ph/api/v1'
export const PROVINCE_CODE = '1001300000'
export const DEFAULT_YEARS = [2016, 2019, 2022, 2025]
export const POSITIONS = [
  'governor',
  'vice governor',
  'representative',
  'board member',
  'mayor',
  'vice mayor',
  'councilor',
]
/** Positions the curated data/officials/seed.json already covers for the 2025 term. */
const SEEDED_2025 = new Set(['governor', 'vice-governor', 'board-member', 'representative'])

export interface DynastiesCandidate {
  person_id: string
  display_name: string
  party?: string
  won: number
}
export interface DynastiesContest {
  id: string
  year: number
  position: string // e.g. "GOVERNOR", "PROVINCIAL BOARD MEMBER", "MEMBER, HOUSE OF REPRESENTATIVES"
  district?: string // "FIRST".."FOURTH", "LONE" or ""
  city?: string | null
  city_slug?: string | null
  candidates: DynastiesCandidate[]
}

// Town names the API spells differently from PSGC, after normalisation. Add only when needed.
export const TOWN_ALIASES: Record<string, string> = {}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(city|municipality) of /, '')
    .replace(/[^a-z0-9]/g, '')

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv'])

export function titleCaseName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => {
      const bare = w.replace(/\./g, '')
      if (SUFFIXES.has(bare.toLowerCase())) return bare.toUpperCase()
      return w
        .toLowerCase()
        .replace(/(^|[-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    })
    .join(' ')
}

const ORDINALS: Record<string, [number, string]> = {
  FIRST: [1, '1st'],
  SECOND: [2, '2nd'],
  THIRD: [3, '3rd'],
  FOURTH: [4, '4th'],
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface PosInfo {
  slug: string
  label: string
  local: boolean
}
function positionInfo(apiPos: string): PosInfo | null {
  const p = apiPos.toUpperCase()
  if (p === 'GOVERNOR') return { slug: 'governor', label: 'Governor', local: false }
  if (p === 'VICE GOVERNOR' || p === 'VICE-GOVERNOR')
    return { slug: 'vice-governor', label: 'Vice Governor', local: false }
  if (p.includes('BOARD MEMBER')) return { slug: 'board-member', label: 'Board Member', local: false }
  if (p.includes('REPRESENTATIVE')) return { slug: 'representative', label: 'Representative', local: false }
  if (p === 'MAYOR') return { slug: 'mayor', label: 'Mayor', local: true }
  if (p === 'VICE MAYOR' || p === 'VICE-MAYOR') return { slug: 'vice-mayor', label: 'Vice Mayor', local: true }
  if (p === 'COUNCILOR') return { slug: 'councilor', label: 'Councilor', local: true }
  return null
}

export function contestsToOfficials(
  contests: DynastiesContest[],
  geo: Geo,
  termStartYear: number,
): { officials: Official[]; unmapped: string[] } {
  const byName = new Map(lgus(geo).map((n) => [norm(n.name), n.psgc]))
  const termStart = `${termStartYear}-06-30`
  const termEnd = `${termStartYear + 3}-06-30`
  const officials: Official[] = []
  const unmapped = new Set<string>()

  for (const c of contests) {
    const info = positionInfo(c.position)
    if (!info) {
      unmapped.add(`position:${c.position}`)
      continue
    }
    if (termStartYear === 2025 && SEEDED_2025.has(info.slug)) continue
    const winners = c.candidates.filter((x) => x.won === 1)
    if (!winners.length) continue

    let level: Official['level'] = 'province'
    let geoCode = PROVINCE_CODE
    let townPart = 'province'
    let position = info.label
    let district: Official['district']
    const ord = ORDINALS[(c.district ?? '').toUpperCase()]
    if (ord) district = ord[0] as 1 | 2 | 3 | 4

    if (info.local) {
      const townName = c.city ?? ''
      const code = byName.get(norm(TOWN_ALIASES[norm(townName)] ?? townName))
      if (!code) {
        unmapped.add(townName || `(no town) ${c.id}`)
        continue
      }
      geoCode = code
      level = lgus(geo).find((n) => n.psgc === code)!.type as 'city' | 'municipality'
      townPart = c.city_slug || slug(townName)
    } else if (info.slug === 'representative') {
      level = 'district'
      if (ord) position = `Representative, ${ord[1]} District`
    }

    for (const w of winners) {
      const o: Official = {
        id: `${termStartYear}-${townPart}-${info.slug}-${w.person_id}`,
        personId: `oh-${w.person_id}`,
        name: titleCaseName(w.display_name),
        position,
        level,
        geoCode,
        ...(district ? { district } : {}),
        termStart,
        termEnd,
        rosterSource: 'openhalalan',
        rosterVerified: false,
        ...(w.party ? { party: w.party } : {}),
      }
      officials.push(o)
    }
  }
  officials.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { officials, unmapped: [...unmapped].sort() }
}

export interface HttpOpts {
  fetchFn?: typeof fetch
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
}

export async function getJson(url: string, opts: HttpOpts = {}): Promise<unknown> {
  const fetchFn = opts.fetchFn ?? fetch
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchFn(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000) })
      if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${url}`)
      return await res.json()
    } catch (e) {
      lastErr = e
      if (attempt < 2) await sleep(1000 * 2 ** attempt)
    }
  }
  throw new Error(`failed after 3 attempts for ${url}: ${(lastErr as Error).message}`)
}

export async function fetchContests(
  year: number,
  position: string,
  opts: HttpOpts = {},
): Promise<DynastiesContest[]> {
  const limit = 50
  const all: DynastiesContest[] = []
  for (let page = 1; ; page++) {
    const q = new URLSearchParams({
      province: 'bukidnon',
      year: String(year),
      position,
      candidates: '1',
      page: String(page),
      limit: String(limit),
    })
    const body = (await getJson(`${API_BASE}/contests?${q}`, opts)) as {
      data: { contests: DynastiesContest[] }
    }
    all.push(...body.data.contests)
    if (body.data.contests.length < limit) break
  }
  return all
}

export function serialize(officials: Official[]): string {
  return JSON.stringify(officials, null, 2) + '\n'
}

async function main(argv: string[]) {
  const arg = (name: string) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const years = arg('--years')?.split(',').map(Number) ?? DEFAULT_YEARS
  const fixture = arg('--from-fixture')
  const geo = JSON.parse(readFileSync(resolve('data/geo.json'), 'utf8')) as Geo
  const outDir = resolve('data/officials')
  mkdirSync(outDir, { recursive: true })
  const allUnmapped: string[] = []
  for (const year of years) {
    let contests: DynastiesContest[]
    if (fixture) {
      const f = JSON.parse(readFileSync(resolve(fixture), 'utf8')) as {
        data?: { contests: DynastiesContest[] }
      } | DynastiesContest[]
      contests = (Array.isArray(f) ? f : f.data!.contests).filter((c) => c.year === year)
    } else {
      contests = []
      for (const p of POSITIONS) contests.push(...(await fetchContests(year, p)))
    }
    const { officials, unmapped } = contestsToOfficials(contests, geo, year)
    writeFileSync(join(outDir, `openhalalan-${year}.json`), serialize(officials))
    const counts: Record<string, number> = {}
    for (const o of officials) counts[o.position] = (counts[o.position] ?? 0) + 1
    console.log(`${year}: ${officials.length} officials`, counts)
    allUnmapped.push(...unmapped.map((u) => `${year}: ${u}`))
  }
  if (allUnmapped.length) {
    console.error('UNMAPPED (not imported):')
    for (const u of allUnmapped) console.error(`  ${u}`)
  } else console.log('unmapped: none')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
