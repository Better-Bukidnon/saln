import type { ReactNode } from 'react'
import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import { useT } from '../lib/i18n'
import { activeFilterPills } from '../lib/pills'
import type { Geo, Level } from '../lib/types'
import { Button } from './ui/Button'

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

const icon = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const pillCls =
  'inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white py-1 pl-3 pr-1 type-badge text-gray-800 shadow-xs'

interface Option {
  value: string
  label: string
}

// A dropdown pill: the visible face (label + value + chevron) sits over a real <select> that is
// transparent but fills the pill, so clicks, keyboard and screen readers all use the native control.
// A non-default value turns the pill primary-blue and the face reads "Label: value".
function PillSelect({
  id,
  label,
  value,
  allLabel,
  options,
  disabled,
  filled,
  onChange,
}: {
  id: string
  label: string
  value: string
  allLabel: string
  options: Option[]
  disabled?: boolean
  filled: boolean
  onChange: (v: string) => void
}) {
  const shown = options.find((o) => o.value === value)?.label ?? allLabel
  const tone = disabled
    ? 'border-gray-300 bg-gray-100 text-gray-600'
    : filled
      ? 'border-primary-500 bg-primary-500 text-white'
      : 'border-gray-500 bg-white text-gray-800 hover:border-gray-700'
  return (
    <div
      className={`relative inline-flex h-11 max-w-full items-center gap-1.5 rounded-full border px-4 type-label shadow-xs transition-colors has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-primary-500 md:h-9 ${tone}`}
      data-testid="filter-pill-select"
      data-filled={filled ? 'true' : 'false'}
    >
      <span aria-hidden="true" className="truncate">
        {filled ? `${label}: ` : `${label} `}
        <span className={filled ? '' : 'font-semibold text-gray-900'}>{shown}</span>
      </span>
      <svg {...icon} width={16} height={16} className="shrink-0">
        <path d="m6 9 6 6 6-6" />
      </svg>
      <select
        id={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] cursor-pointer appearance-none rounded-full opacity-0 type-control disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Check({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-2 type-label text-gray-900 md:min-h-9">
      <input id={id} type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer accent-primary-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
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
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const clear = () => onChange({ ...defaultFilters })
  return (
    <form
      className="space-y-3"
      role="search"
      aria-label={t('filtersHeading')}
      onSubmit={(e) => {
        e.preventDefault()
        document.getElementById('results-status')?.focus() // the list already filters live; Search jumps to the result count
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-600">
            <svg {...icon}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            id="f-q"
            type="search"
            aria-label={t('search')}
            placeholder={t('search')}
            className="block h-11 w-full rounded-full border border-gray-500 bg-gray-50 pl-11 pr-4 type-control text-ink shadow-xs transition-colors placeholder:text-gray-600 hover:border-gray-700"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value }, true)} // replace: one history entry, not one per keystroke
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          {t('searchButton')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="filter-dropdowns">
        <PillSelect
          id="f-lgu"
          label={t('municipality')}
          value={filters.lgu ?? ''}
          allLabel={t('filterAll')}
          filled={!!filters.lgu}
          options={[{ value: '', label: t('allMunicipalities') }, ...lgus(geo).map((n) => ({ value: n.psgc, label: n.name }))]}
          onChange={(v) => set({ lgu: v || undefined, barangay: undefined })}
        />
        <PillSelect
          id="f-brgy"
          label={t('barangay')}
          value={filters.barangay ?? ''}
          allLabel={t('filterAll')}
          filled={!!filters.barangay}
          disabled={!filters.lgu}
          options={[{ value: '', label: t('allBarangays') }, ...barangays.map((n) => ({ value: n.psgc, label: n.name }))]}
          onChange={(v) => set({ barangay: v || undefined })}
        />
        <PillSelect
          id="f-level"
          label={t('level')}
          value={filters.level ?? ''}
          allLabel={t('filterAll')}
          filled={!!filters.level}
          options={[{ value: '', label: t('allLevels') }, ...LEVELS.map((l) => ({ value: l, label: t(`levels.${l}`) }))]}
          onChange={(v) => set({ level: (v || undefined) as Level | undefined })}
        />
        <PillSelect
          id="f-sort"
          label={t('sortBy')}
          value={filters.sort}
          allLabel={t('sorts.name')}
          filled={filters.sort !== defaultFilters.sort}
          options={SORTS.map((s) => ({ value: s, label: t(`sorts.${s}`) }))}
          onChange={(v) => set({ sort: v as SortKey })}
        />
        <PillSelect
          id="f-dir"
          label={t('direction')}
          value={filters.dir}
          allLabel={t('asc')}
          filled={filters.dir !== defaultFilters.dir}
          options={DIRS.map((d) => ({ value: d, label: t(d) }))}
          onChange={(v) => set({ dir: v as Dir })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-gray-200 pt-3" data-testid="filter-options">
        <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <legend className="sr-only">{t('term')}</legend>
          {STATUSES.map((s) => (
            <label key={s} htmlFor={`f-status-${s}`} className="inline-flex min-h-11 cursor-pointer items-center gap-2 type-label text-gray-900 md:min-h-9">
              <input
                id={`f-status-${s}`}
                type="radio"
                name="status"
                value={s}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary-500"
                checked={filters.status === s}
                onChange={() => set({ status: s })}
              />
              {t(`statusRadio.${s}`)}
            </label>
          ))}
        </fieldset>
        <Check id="f-pw" checked={filters.provinceWide} onChange={(v) => set({ provinceWide: v })}>
          {t('includeProvinceWide')}
        </Check>
        <Check id="f-saln" checked={filters.hasSaln} onChange={(v) => set({ hasSaln: v })}>
          {t('hasSaln')}
        </Check>
        <button
          type="button"
          onClick={clear}
          disabled={active === 0}
          data-testid="clear-filters"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded type-label text-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:text-gray-600 md:min-h-9"
        >
          {t('clearFilters')}
          <span data-testid="filters-active" className={`inline-flex min-w-6 justify-center rounded-full px-2 type-badge ${active ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}>
            {active}
          </span>
        </button>
      </div>

      {pills.length > 0 && (
        <div role="group" aria-label={t('pillsGroup', { n: pills.length })} data-testid="filter-pills" className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
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
          <button type="button" onClick={clear} className="inline-flex h-11 items-center rounded-full bg-accent-100 px-3 type-badge text-accent-800 transition-colors hover:bg-accent-200 md:h-9">
            {t('clearAll')}
          </button>
        </div>
      )}
    </form>
  )
}
