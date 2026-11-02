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

const flat = <T>(files: Record<string, T | T[]>): T[] =>
  Object.keys(files)
    .sort()
    .flatMap((k) => files[k])

export function latestSaln(records: SalnRecord[] | undefined): SalnRecord | undefined {
  if (!records?.length) return undefined
  return records.reduce((a, b) => (b.year > a.year ? b : a))
}

export function loadAll(): { geo: Geo; officials: Official[]; salnByPerson: Map<string, SalnRecord[]> } {
  const geo = Object.values(geoFiles)[0] ?? { nodes: [] }
  const officials = flat(officialFiles)
  const salnByPerson = new Map<string, SalnRecord[]>()
  for (const r of flat(salnFiles)) {
    const list = salnByPerson.get(r.personId)
    if (list) list.push(r)
    else salnByPerson.set(r.personId, [r])
  }
  return { geo, officials, salnByPerson }
}
