import { nodeByCode } from './geo'
import { defaultFilters } from './filter'
import type { Filters } from './filter'
import type { TFn } from './i18n'
import type { Geo } from './types'

export interface FilterPill {
  key: string
  label: string
  /** The filters with just this one reset to its default (removing a municipality also drops its barangay). */
  remove: (f: Filters) => Filters
}

/** One pill per active, non-default filter, in a fixed order. */
export function activeFilterPills(f: Filters, geo: Geo, t: TFn): FilterPill[] {
  const out: FilterPill[] = []
  const add = (key: string, label: string, remove: (f: Filters) => Filters) => out.push({ key, label, remove })
  const name = (code: string) => nodeByCode(geo, code)?.name ?? code
  if (f.q) add('q', t('pill.search', { v: f.q }), (x) => ({ ...x, q: '' }))
  if (f.lgu) add('lgu', t('pill.municipality', { v: name(f.lgu) }), (x) => ({ ...x, lgu: undefined, barangay: undefined }))
  if (f.lgu && f.barangay) add('barangay', t('pill.barangay', { v: name(f.barangay) }), (x) => ({ ...x, barangay: undefined }))
  if (f.level) add('level', t('pill.level', { v: t(`levels.${f.level}`) }), (x) => ({ ...x, level: undefined }))
  if (f.status !== defaultFilters.status) add('status', t('pill.status', { v: t(`statuses.${f.status}`) }), (x) => ({ ...x, status: defaultFilters.status }))
  if (f.sort !== defaultFilters.sort) add('sort', t('pill.sort', { v: t(`sorts.${f.sort}`) }), (x) => ({ ...x, sort: defaultFilters.sort }))
  if (f.dir !== defaultFilters.dir) add('dir', t('pill.dir', { v: t(f.dir) }), (x) => ({ ...x, dir: defaultFilters.dir }))
  if (f.provinceWide) add('provinceWide', t('includeProvinceWide'), (x) => ({ ...x, provinceWide: false }))
  if (f.hasSaln) add('hasSaln', t('hasSaln'), (x) => ({ ...x, hasSaln: false }))
  return out
}
