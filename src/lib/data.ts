import { comparePreferred } from './saln-view'
import type { Geo, Official, SalnRecord } from './types'

// '@data' is aliased in vite.config.ts: ./data normally, tests/fixtures/e2e-data in mode e2e.
const geoFiles = import.meta.glob<Geo>('@data/geo.json', { eager: true, import: 'default' })
const officialFiles = import.meta.glob<Official | Official[]>('@data/officials/*.json', {
  eager: true,
  import: 'default',
})
const salnFiles = import.meta.glob<SalnRecord | SalnRecord[]>('@data/saln/*.json', {
  eager: true,
  import: 'default',
})

// Opt-in preview data (npm run dev:demo). The flag is a build-time constant, so a normal build
// drops this branch together with the eagerly imported demo module.
const demo =
  import.meta.env.VITE_DEMO_DATA === '1' ? await import('../demo/sample-official') : undefined

const flat = <T>(files: Record<string, T | T[]>): T[] =>
  Object.keys(files)
    .sort()
    .flatMap((k) => files[k])

export function latestSaln(records: SalnRecord[] | undefined): SalnRecord | undefined {
  if (!records?.length) return undefined
  return records.reduce((a, b) => (comparePreferred(b, a) > 0 ? b : a))
}

export function loadAll(): { geo: Geo; officials: Official[]; salnByPerson: Map<string, SalnRecord[]> } {
  const geo = Object.values(geoFiles)[0] ?? { nodes: [] }
  const officials = flat(officialFiles)
  if (demo) officials.push(demo.sampleOfficial)
  const salnByPerson = new Map<string, SalnRecord[]>()
  for (const r of [...flat(salnFiles), ...(demo ? demo.sampleSaln : [])]) {
    const list = salnByPerson.get(r.personId)
    if (list) list.push(r)
    else salnByPerson.set(r.personId, [r])
  }
  return { geo, officials, salnByPerson }
}
