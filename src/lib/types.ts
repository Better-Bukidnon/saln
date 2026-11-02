export type Level = 'province' | 'district' | 'city' | 'municipality' | 'barangay'

export interface GeoNode {
  psgc: string
  name: string
  type: 'province' | 'city' | 'municipality' | 'barangay'
  parent?: string
}

export interface Geo {
  nodes: GeoNode[]
}

export interface Official {
  id: string
  personId: string
  name: string
  position: string
  level: Level
  geoCode: string
  district?: 1 | 2 | 3 | 4
  termStart: string // YYYY-MM-DD
  termEnd: string | null // YYYY-MM-DD
  rosterSource: 'openhalalan' | 'comelec' | 'dilg' | 'community' | 'manual'
  rosterVerified: boolean
  party?: string
  /** Set only on the opt-in demo official (src/demo); carries its own visible labels. */
  sample?: { badge: string; notice: string }
}

export const SALN_SOURCE_TYPES = ['house-summary', 'ombudsman', 'lgu', 'submitted'] as const
export const SALN_STATUSES = ['submitted', 'verified', 'under_review', 'flagged'] as const

export interface SalnRecord {
  id: string
  personId: string
  year: number
  filingType: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  sourceType: (typeof SALN_SOURCE_TYPES)[number]
  sourceUrl: string
  status: (typeof SALN_STATUSES)[number]
  verifiedBy?: string
  verifiedAt?: string
}
