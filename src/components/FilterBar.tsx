import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import { useT } from '../lib/i18n'
import type { Geo, Level } from '../lib/types'

const LEVELS: Level[] = ['province', 'district', 'city', 'municipality', 'barangay']
const STATUSES: Status[] = ['current', 'former', 'all']
const SORTS: SortKey[] = ['name', 'netWorth', 'assets', 'liabilities']
const DIRS: Dir[] = ['asc', 'desc']

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
    <form className="filters" role="search" aria-label={t('filtersHeading')} onSubmit={(e) => e.preventDefault()}>
      <div className="field">
        <label htmlFor="f-q">{t('search')}</label>
        <input
          id="f-q"
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value }, true)}
        />
      </div>
      <div className="field">
        <label htmlFor="f-lgu">{t('municipality')}</label>
        <select
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
      <div className="field">
        <label htmlFor="f-brgy">{t('barangay')}</label>
        <select
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
      <div className="field check">
        <input
          id="f-pw"
          type="checkbox"
          checked={filters.provinceWide}
          onChange={(e) => onChange({ ...filters, provinceWide: e.target.checked })}
        />
        <label htmlFor="f-pw">{t('includeProvinceWide')}</label>
      </div>
      <div className="field">
        <label htmlFor="f-level">{t('level')}</label>
        <select
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
      <div className="field">
        <label htmlFor="f-status">{t('term')}</label>
        <select
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
      <div className="field check">
        <input
          id="f-saln"
          type="checkbox"
          checked={filters.hasSaln}
          onChange={(e) => onChange({ ...filters, hasSaln: e.target.checked })}
        />
        <label htmlFor="f-saln">{t('hasSaln')}</label>
      </div>
      <div className="field">
        <label htmlFor="f-sort">{t('sortBy')}</label>
        <select
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
      <div className="field">
        <label htmlFor="f-dir">{t('direction')}</label>
        <select
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
      <button type="button" onClick={() => onChange({ ...defaultFilters })}>
        {t('reset')}
      </button>
    </form>
  )
}
