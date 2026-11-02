import type { ReactNode } from 'react'
import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import { useT } from '../lib/i18n'
import type { Geo, Level } from '../lib/types'
import { Button } from './ui/Button'

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

const labelCls = 'text-sm font-bold text-gray-700'
const controlCls =
  'select-chevron block min-h-11 w-full max-w-full rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm text-ink transition-colors hover:border-primary-500 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:hover:border-gray-300'
const groupCls = 'min-w-0 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4'
const legendCls = 'mb-3 px-1 text-xs font-bold uppercase tracking-wide text-primary-500'
const chipCls =
  'inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-500 bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary-500 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-800'

const icon = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function FilterBar({
  geo,
  filters,
  onChange,
}: {
  geo: Geo
  filters: Filters
  onChange: (next: Filters, replace?: boolean) => void
}) {
  const t = useT()
  const barangays = filters.lgu ? barangaysOf(geo, filters.lgu) : []
  const active = [
    !!filters.q,
    !!filters.lgu,
    !!filters.barangay,
    !!filters.level,
    filters.provinceWide !== defaultFilters.provinceWide,
    filters.status !== defaultFilters.status,
    filters.hasSaln !== defaultFilters.hasSaln,
    filters.sort !== defaultFilters.sort,
    filters.dir !== defaultFilters.dir,
  ].filter(Boolean).length
  return (
    <form className="space-y-5" role="search" aria-label={t('filtersHeading')} onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-primary-500">
            <svg {...icon}>
              <path d="M3 5h18l-7 8v6l-4 2v-8z" />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-ink">{t('filtersHeading')}</h3>
          {active > 0 && (
            <span data-testid="filters-active" className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
              {t('filtersActive', { n: active })}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...defaultFilters })}>
          {t('reset')}
        </Button>
      </div>

      <Field id="f-q" label={t('search')}>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-600">
            <svg {...icon}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            id="f-q"
            type="search"
            className="block min-h-11 w-full rounded-lg border border-gray-500 bg-white py-2 pl-10 pr-3 text-sm text-ink transition-colors hover:border-primary-500"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value }, true)}
          />
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="filter-groups">
        <fieldset className={groupCls}>
          <legend className={legendCls}>{t('groupLocation')}</legend>
          <Field id="f-lgu" label={t('municipality')}>
            <select
              className={controlCls}
              id="f-lgu"
              value={filters.lgu ?? ''}
              onChange={(e) => onChange({ ...filters, lgu: e.target.value || undefined, barangay: undefined })}
            >
              <option value="">{t('allMunicipalities')}</option>
              {lgus(geo).map((n) => (
                <option key={n.psgc} value={n.psgc}>
                  {n.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-brgy" label={t('barangay')}>
            <select
              className={controlCls}
              id="f-brgy"
              disabled={!filters.lgu}
              value={filters.barangay ?? ''}
              onChange={(e) => onChange({ ...filters, barangay: e.target.value || undefined })}
            >
              <option value="">{t('allBarangays')}</option>
              {barangays.map((n) => (
                <option key={n.psgc} value={n.psgc}>
                  {n.name}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>

        <fieldset className={groupCls}>
          <legend className={legendCls}>{t('groupRefine')}</legend>
          <Field id="f-level" label={t('level')}>
            <select
              className={controlCls}
              id="f-level"
              value={filters.level ?? ''}
              onChange={(e) => onChange({ ...filters, level: (e.target.value || undefined) as Level | undefined })}
            >
              <option value="">{t('allLevels')}</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {t(`levels.${l}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-status" label={t('term')}>
            <select
              className={controlCls}
              id="f-status"
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value as Status })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.${s}`)}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>

        <fieldset className={`${groupCls} sm:col-span-2 lg:col-span-1`}>
          <legend className={legendCls}>{t('groupSort')}</legend>
          <Field id="f-sort" label={t('sortBy')}>
            <select
              className={controlCls}
              id="f-sort"
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sorts.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-dir" label={t('direction')}>
            <select
              className={controlCls}
              id="f-dir"
              value={filters.dir}
              onChange={(e) => onChange({ ...filters, dir: e.target.value as Dir })}
            >
              {DIRS.map((d) => (
                <option key={d} value={d}>
                  {t(d)}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      </div>

      <div className="flex flex-wrap gap-3" data-testid="filter-toggles">
        <label className={chipCls} htmlFor="f-pw">
          <input
            id="f-pw"
            type="checkbox"
            className="h-5 w-5 shrink-0 cursor-pointer accent-primary-500"
            checked={filters.provinceWide}
            onChange={(e) => onChange({ ...filters, provinceWide: e.target.checked })}
          />
          {t('includeProvinceWide')}
        </label>
        <label className={chipCls} htmlFor="f-saln">
          <input
            id="f-saln"
            type="checkbox"
            className="h-5 w-5 shrink-0 cursor-pointer accent-primary-500"
            checked={filters.hasSaln}
            onChange={(e) => onChange({ ...filters, hasSaln: e.target.checked })}
          />
          {t('hasSaln')}
        </label>
      </div>
    </form>
  )
}
