import type { Geo, Official } from './types'
import { isFormer } from './filter'
import { nodeByCode } from './geo'

export type GroupKind = 'provincial' | 'sp' | 'house' | 'lgu' | 'barangay'

export interface OfficialGroup {
  /** Stable id: 'provincial' | 'sp' | 'house' | 'lgu:<psgc>' | 'barangay:<psgc>'. */
  key: string
  kind: GroupKind
  /** City/municipality PSGC code for 'lgu' and 'barangay' groups ('' when the barangay is unknown). */
  code?: string
  officials: Official[]
}

export interface GroupedOfficials {
  current: OfficialGroup[]
  former: OfficialGroup[]
}

// Governor and vice governor, also acting / OIC; anchored so "Governor's Secretary" does not match.
const HEADS = /^(?:(?:acting|oic|officer[- ]in[- ]charge)\s+)?(?:vice[ -])?governor$/i

function build(officials: Official[], geo: Geo): OfficialGroup[] {
  const fixed: Record<'provincial' | 'sp' | 'house', OfficialGroup> = {
    provincial: { key: 'provincial', kind: 'provincial', officials: [] },
    sp: { key: 'sp', kind: 'sp', officials: [] },
    house: { key: 'house', kind: 'house', officials: [] },
  }
  const lgu = new Map<string, OfficialGroup>()
  const brgy = new Map<string, OfficialGroup>()
  const add = (m: Map<string, OfficialGroup>, kind: 'lgu' | 'barangay', code: string, o: Official) => {
    const key = `${kind}:${code}`
    let g = m.get(key)
    if (!g) m.set(key, (g = { key, kind, code, officials: [] }))
    g.officials.push(o)
  }
  for (const o of officials) {
    if (o.level === 'province') (HEADS.test(o.position.trim()) ? fixed.provincial : fixed.sp).officials.push(o)
    else if (o.level === 'district') fixed.house.officials.push(o)
    else if (o.level === 'barangay') add(brgy, 'barangay', nodeByCode(geo, o.geoCode)?.parent ?? '', o)
    else add(lgu, 'lgu', o.geoCode, o)
  }
  const name = (g: OfficialGroup) => (g.code ? (nodeByCode(geo, g.code)?.name ?? g.code) : '')
  // Unknown parents ('' code) sort last.
  const byName = (a: OfficialGroup, b: OfficialGroup) =>
    !a.code !== !b.code ? (a.code ? -1 : 1) : name(a).localeCompare(name(b))
  return [
    fixed.provincial,
    fixed.sp,
    fixed.house,
    ...[...lgu.values()].sort(byName),
    ...[...brgy.values()].sort(byName),
  ].filter((g) => g.officials.length > 0)
}

/**
 * Split already filtered/sorted officials into the sections of the list page.
 * Order inside a group is the input order. Former = term ended before `today`;
 * everything else (including terms not yet started) counts as current.
 */
export function groupOfficials(officials: Official[], geo: Geo, today: Date): GroupedOfficials {
  const past = officials.filter((o) => isFormer(o, today))
  const pastSet = new Set(past)
  return { current: build(officials.filter((o) => !pastSet.has(o)), geo), former: build(past, geo) }
}
