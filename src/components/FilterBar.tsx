import { barangaysOf, lgus } from '../lib/geo'
import type { Dir, Filters, SortKey, Status } from '../lib/filter'
import { defaultFilters } from '../lib/filter'
import strings from '../lib/strings'
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
  const barangays = filters.lgu ? barangaysOf(geo, filters.lgu) : []
  return (
    <form className="filters" role="search" aria-label={strings.filtersHeading} onSubmit={(e) => e.preventDefault()}>
      <div className="field">
        <label htmlFor="f-q">{strings.search}</label>
        <input
          id="f-q"
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value }, true)}
        />
      </div>
      <div className="field">
        <label htmlFor="f-lgu">{strings.municipality}</label>
        <select
          id="f-lgu"
          value={filters.lgu ?? ''}
          onChange={(e) => onChange({ ...filters, lgu: e.target.value || undefined, barangay: undefined })}
        >
          <option value="">{strings.allMunicipalities}</option>
          {lgus(geo).map((n) => (
            <option key={n.psgc} value={n.psgc}>
              {n.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-brgy">{strings.barangay}</label>
        <select
          id="f-brgy"
          disabled={!filters.lgu}
          value={filters.barangay ?? ''}
          onChange={(e) => onChange({ ...filters, barangay: e.target.value || undefined })}
        >
          <option value="">{strings.allBarangays}</option>
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
        <label htmlFor="f-pw">{strings.includeProvinceWide}</label>
      </div>
      <div className="field">
        <label htmlFor="f-level">{strings.level}</label>
        <select
          id="f-level"
          value={filters.level ?? ''}
          onChange={(e) => onChange({ ...filters, level: (e.target.value || undefined) as Level | undefined })}
        >
          <option value="">{strings.allLevels}</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {strings.levels[l]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-status">{strings.term}</label>
        <select
          id="f-status"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as Status })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {strings.statuses[s]}
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
        <label htmlFor="f-saln">{strings.hasSaln}</label>
      </div>
      <div className="field">
        <label htmlFor="f-sort">{strings.sortBy}</label>
        <select
          id="f-sort"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {strings.sorts[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-dir">{strings.direction}</label>
        <select
          id="f-dir"
          value={filters.dir}
          onChange={(e) => onChange({ ...filters, dir: e.target.value as Dir })}
        >
          {DIRS.map((d) => (
            <option key={d} value={d}>
              {strings[d]}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={() => onChange({ ...defaultFilters })}>
        {strings.reset}
      </button>
    </form>
  )
}
