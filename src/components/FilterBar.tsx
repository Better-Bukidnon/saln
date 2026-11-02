import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import { activeFilterPills } from '../lib/pills'
import { useT } from '../lib/i18n'
import type { Geo, Level } from '../lib/types'
import { Button } from './ui/Button'

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

const labelCls = 'text-sm font-medium leading-none text-gray-900'
const controlCls =
  'select-chevron block h-11 w-full max-w-full rounded-md border border-gray-500 bg-white px-3 text-base md:h-10 md:text-sm text-ink shadow-xs transition-colors hover:border-gray-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:shadow-none disabled:hover:border-gray-300'
const groupCls = 'min-w-0 space-y-3 rounded-md border border-gray-200 bg-white p-3 sm:p-4'
const legendCls = 'px-1 text-xs font-medium uppercase tracking-wide text-gray-700'
const chipCls =
  'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md sm:inline-flex sm:w-auto md:min-h-10 border border-gray-500 bg-white px-3 py-2 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-gray-50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-800'
const pillCls =
  'inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white py-1 pl-3 pr-1 text-xs font-medium text-gray-800 shadow-xs'

const icon = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
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
  const pills = activeFilterPills(filters, geo, t)
  const active = pills.length
  // Phones: the controls fold away behind a toggle (open when filters are active). Desktop ignores this.
  const [open, setOpen] = useState(active > 0)
  const bodyId = useId()
  return (
    <form className="space-y-4" role="search" aria-label={t('filtersHeading')} onSubmit={(e) => e.preventDefault()}>
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div className="flex items-center gap-2">
          <span className="text-primary-500">
            <svg {...icon}>
              <path d="M3 5h18l-7 8v6l-4 2v-8z" />
            </svg>
          </span>
          <h3 className="text-base font-semibold text-ink">{t('filtersHeading')}</h3>
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
            className="block h-11 w-full rounded-md border border-gray-500 bg-white pl-10 pr-3 text-base md:h-10 md:text-sm text-ink shadow-xs transition-colors hover:border-gray-700"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value }, true)}
          />
        </div>
      </Field>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
        data-testid="filters-toggle"
        className="flex h-11 w-full items-center gap-2 rounded-md border border-gray-500 bg-white px-3 text-base font-medium text-ink shadow-xs md:hidden"
      >
        <span className="text-primary-500">
          <svg {...icon}>
            <path d="M3 5h18l-7 8v6l-4 2v-8z" />
          </svg>
        </span>
        <span className="flex-1 text-left">{t('filtersHeading')}</span>
        {active > 0 && (
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800">{t('filtersActive', { n: active })}</span>
        )}
        <svg {...icon} className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div id={bodyId} className={open ? 'space-y-4' : 'hidden space-y-4 md:block'} data-testid="filter-body">
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
      <div className="flex flex-wrap gap-2" data-testid="filter-toggles">
        <label className={chipCls} htmlFor="f-pw">
          <input
            id="f-pw"
            type="checkbox"
            className="h-4 w-4 shrink-0 cursor-pointer accent-primary-500"
            checked={filters.provinceWide}
            onChange={(e) => onChange({ ...filters, provinceWide: e.target.checked })}
          />
          {t('includeProvinceWide')}
        </label>
        <label className={chipCls} htmlFor="f-saln">
          <input
            id="f-saln"
            type="checkbox"
            className="h-4 w-4 shrink-0 cursor-pointer accent-primary-500"
            checked={filters.hasSaln}
            onChange={(e) => onChange({ ...filters, hasSaln: e.target.checked })}
          />
          {t('hasSaln')}
        </label>
      </div>

      </div>

      {pills.length > 0 && (
        <div role="group" aria-label={t('pillsGroup', { n: pills.length })} data-testid="filter-pills" className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
          {pills.map((p) => (
            <span key={p.key} className={pillCls} data-testid="filter-pill">
              {p.label}
              <button
                type="button"
                aria-label={t('pillRemove', { label: p.label })}
                onClick={() => onChange(p.remove(filters))}
                className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-gray-100 hover:text-gray-900"
              >
                <svg {...icon} width={14} height={14}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...defaultFilters })}
            className="inline-flex h-8 items-center rounded-full bg-accent-100 px-3 text-xs font-semibold text-accent-800 transition-colors hover:bg-accent-200"
          >
            {t('clearAll')}
          </button>
        </div>
      )}
    </form>
  )
}
