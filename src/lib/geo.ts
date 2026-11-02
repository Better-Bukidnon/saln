import type { Geo, GeoNode } from './types'

export type { Geo }

export function lgus(geo: Geo): GeoNode[] {
  return geo.nodes
    .filter((n) => n.type === 'city' || n.type === 'municipality')
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function barangaysOf(geo: Geo, lguCode: string): GeoNode[] {
  return geo.nodes
    .filter((n) => n.type === 'barangay' && n.parent === lguCode)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function nodeByCode(geo: Geo, code: string): GeoNode | undefined {
  return geo.nodes.find((n) => n.psgc === code)
}
