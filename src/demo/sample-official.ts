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

// Made-up figures for 2017 to 2024 (still fake), so the chart has enough years to be worth previewing.
const FIGURES: [number, number, number][] = [
  [2017, 2_150_000.0, 450_000.5],
  [2018, 2_480_250.75, 520_000],
  [2019, 2_990_000, 910_400.25],
  [2020, 3_410_800.2, 1_250_000],
  [2021, 3_800_000, 980_000.8],
  [2022, 4_250_000.5, 800_000.25],
  [2023, 5_100_000, 650_000.75],
  [2024, 6_320_500.4, 400_100.1],
]

export const sampleSaln: SalnRecord[] = FIGURES.map(([year, assets, liabilities]) =>
  year === 2023
    ? record(year, assets, liabilities, { status: 'verified', verifiedBy: 'Demo Maintainer', verifiedAt: '2026-01-15' })
    : record(year, assets, liabilities),
)
