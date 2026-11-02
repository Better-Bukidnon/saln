import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import { useT } from '../lib/i18n'
import { Button } from './ui/Button'
import type { Geo, Level } from '../lib/types'

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

const fieldCls = 'flex flex-col gap-1.5'
const checkRow = 'flex min-h-11 items-center gap-3'
const labelCls = 'text-sm font-semibold text-gray-900'
const controlCls =
  'block min-h-11 w-full max-w-full rounded-lg border border-gray-500 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600'

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
  return (
    <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="search" aria-label={t('filtersHeading')} onSubmit={(e) => e.preventDefault()}>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-q">{t('search')}</label>
        <input
          id="f-q"
          className={controlCls}
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value }, true)}
        />
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-lgu">{t('municipality')}</label>
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
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-brgy">{t('barangay')}</label>
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
      </div>
      <div className={checkRow}>
        <input
          id="f-pw"
          className="h-5 w-5 shrink-0 cursor-pointer accent-primary-500"
          type="checkbox"
          checked={filters.provinceWide}
          onChange={(e) => onChange({ ...filters, provinceWide: e.target.checked })}
        />
        <label className="flex-1 cursor-pointer py-2.5 text-sm font-medium text-gray-900" htmlFor="f-pw">{t('includeProvinceWide')}</label>
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-level">{t('level')}</label>
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
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-status">{t('term')}</label>
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
      </div>
      <div className={checkRow}>
        <input
          id="f-saln"
          className="h-5 w-5 shrink-0 cursor-pointer accent-primary-500"
          type="checkbox"
          checked={filters.hasSaln}
          onChange={(e) => onChange({ ...filters, hasSaln: e.target.checked })}
        />
        <label className="flex-1 cursor-pointer py-2.5 text-sm font-medium text-gray-900" htmlFor="f-saln">{t('hasSaln')}</label>
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-sort">{t('sortBy')}</label>
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
      </div>
      <div className={fieldCls}>
        <label className={labelCls} htmlFor="f-dir">{t('direction')}</label>
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
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button variant="ghost" onClick={() => onChange({ ...defaultFilters })}>
          {t('reset')}
        </Button>
      </div>
    </form>
  )
}
