// PREVIEW AID ONLY. One obviously fake official with three fake SALN years so the profile page, the
// over-time chart and the verified styling can be seen. Loaded only when VITE_DEMO_DATA=1
// (`npm run dev:demo`); never part of data/ and never part of a normal build.
import type { Official, SalnRecord } from '../lib/types'

const PERSON = 'sample-juan-dela-cruz'
const SOURCE = 'https://example.com/sample-saln'

export const sampleOfficial: Official = {
  id: PERSON,
  personId: PERSON,
  name: 'Juan Dela Cruz (SAMPLE)',
  position: 'Mayor',
  level: 'municipality',
  geoCode: '1001301000', // Baungon
  termStart: '2025-06-30',
  termEnd: '2028-06-30',
  rosterSource: 'manual',
  rosterVerified: true,
  sample: {
    badge: 'Sample',
    notice: 'SAMPLE DATA — not a real official. These records are made up to preview the layout.',
  },
}

function record(year: number, assets: number, liabilities: number, extra: Partial<SalnRecord> = {}): SalnRecord {
  return {
    id: `${PERSON}-${year}`,
    personId: PERSON,
    year,
    filingType: 'annual',
    totalAssets: assets,
    totalLiabilities: liabilities,
    netWorth: Math.round(assets * 100 - liabilities * 100) / 100,
    sourceType: 'submitted',
    sourceUrl: SOURCE,
    status: 'submitted',
    ...extra,
  }
}

export const sampleSaln: SalnRecord[] = [
  record(2022, 4250000.5, 800000.25),
  record(2023, 5100000, 650000.75, { status: 'verified', verifiedBy: 'Demo Maintainer', verifiedAt: '2026-01-15' }),
  record(2024, 6320500.4, 400100.1),
]
