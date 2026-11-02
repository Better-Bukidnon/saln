import { describe, expect, it } from 'vitest'
import { defaultFilters, type Filters } from '../../src/lib/filter'
import { activeFilterPills } from '../../src/lib/pills'
import { translate } from '../../src/lib/i18n'
import type { Geo } from '../../src/lib/types'

const geo: Geo = {
  nodes: [
    { psgc: 'P', name: 'Bukidnon', type: 'province' },
    { psgc: 'A', name: 'Alpha', type: 'municipality', parent: 'P' },
    { psgc: 'A1', name: 'A One', type: 'barangay', parent: 'A' },
  ],
}
const t = (k: string, p?: Record<string, string | number>) => translate('en', k, p)
const f = (o: Partial<Filters>): Filters => ({ ...defaultFilters, ...o })

describe('activeFilterPills', () => {
  it('is empty for the default filters', () => {
    expect(activeFilterPills(defaultFilters, geo, t)).toEqual([])
  })
  it('omits defaults: current term, name sort, ascending order', () => {
    expect(activeFilterPills(f({ status: 'current', sort: 'name', dir: 'asc' }), geo, t)).toEqual([])
  })
  it('labels and orders every active filter', () => {
    const p = activeFilterPills(
      f({ q: 'juan', lgu: 'A', barangay: 'A1', level: 'barangay', status: 'all', sort: 'netWorth', dir: 'desc', provinceWide: true, hasSaln: true }),
      geo,
      t,
    )
    expect(p.map((x) => x.key)).toEqual(['q', 'lgu', 'barangay', 'level', 'status', 'sort', 'dir', 'provinceWide', 'hasSaln'])
    expect(p.map((x) => x.label)).toEqual([
      'Search: juan',
      'Municipality: Alpha',
      'Barangay: A One',
      'Level: Barangay',
      'Term: All',
      'Sort by: Net worth',
      'Order: Descending',
      'Include province-wide officials',
      'Only officials with SALN data',
    ])
  })
  it('removing the municipality also clears the barangay', () => {
    const base = f({ lgu: 'A', barangay: 'A1' })
    const p = activeFilterPills(base, geo, t).find((x) => x.key === 'lgu')!
    expect(p.remove(base)).toMatchObject({ lgu: undefined, barangay: undefined })
  })
  it('removing one pill changes only that filter', () => {
    const base = f({ q: 'x', hasSaln: true, status: 'former' })
    const pills = activeFilterPills(base, geo, t)
    expect(pills.find((x) => x.key === 'q')!.remove(base)).toEqual({ ...base, q: '' })
    expect(pills.find((x) => x.key === 'status')!.remove(base).status).toBe('current')
    expect(pills.find((x) => x.key === 'hasSaln')!.remove(base).hasSaln).toBe(false)
  })
})
