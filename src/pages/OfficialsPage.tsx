import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import FilterBar from '../components/FilterBar'
import OfficialCard from '../components/OfficialCard'
import { loadAll } from '../lib/data'
import { filterOfficials, parseFilters, serializeFilters, sortOfficials } from '../lib/filter'
import type { Filters } from '../lib/filter'
import { useT } from '../lib/i18n'

const data = loadAll()

export default function OfficialsPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params, data.geo), [params])
  const shown = useMemo(
    () =>
      sortOfficials(
        filterOfficials(data.officials, data.salnByPerson, data.geo, filters, new Date()),
        data.salnByPerson,
        filters,
      ),
    [filters],
  )
  const onChange = (next: Filters, replace = false) => setParams(serializeFilters(next), { replace })

  return (
    <>
      <h2>{t('officialsHeading')}</h2>
      <FilterBar geo={data.geo} filters={filters} onChange={onChange} />
      <p className="count" role="status">
        {shown.length === 1 ? t('resultCount.one') : t('resultCount.other', { n: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <ul className="cards">
          {shown.map((o) => (
            <OfficialCard key={o.id} official={o} saln={data.salnByPerson.get(o.personId)} geo={data.geo} />
          ))}
        </ul>
      )}
    </>
  )
}
