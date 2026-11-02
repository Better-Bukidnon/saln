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
}

export interface SalnRecord {
  id: string
  personId: string
  year: number
  filingType: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  sourceType: 'house-summary' | 'ombudsman' | 'lgu' | 'submitted'
  sourceUrl: string
  status: 'submitted' | 'verified' | 'under_review' | 'flagged'
  verifiedBy?: string
  verifiedAt?: string
}
