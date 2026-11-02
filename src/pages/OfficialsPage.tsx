import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import HelpBanner from '../components/HelpBanner'
import FilterBar from '../components/FilterBar'
import OfficialCard from '../components/OfficialCard'
import { loadAll } from '../lib/data'
import { filterOfficials, parseFilters, serializeFilters, sortOfficials } from '../lib/filter'
import type { Filters } from '../lib/filter'
import { useT } from '../lib/i18n'
import portalConfig from '../../portal.config'
import { Card } from '../components/ui/Card'

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
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-white shadow-md motion-safe:animate-fade-in">
        <div className="px-4 py-8 text-center sm:px-6 sm:py-12">
          <h2 data-testid="hero-title" className="mb-3 text-2xl font-bold leading-tight tracking-tight sm:mb-4 sm:text-4xl">
            {t('heroTitle')}
          </h2>
          <p className="mx-auto mb-2 max-w-2xl text-base text-white sm:text-xl">{t('heroPurpose')}</p>
          <p data-testid="hero-summary" className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white sm:text-base">
            {t('heroSummary')}
          </p>
          <p data-testid="hero-hashtags" className="inline-block rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-accent-300">
            {portalConfig.hashtags}
          </p>
        </div>
      </section>
      <HelpBanner />
      <Card padding="sm" className="sm:p-6">
        <FilterBar geo={data.geo} filters={filters} onChange={onChange} />
      </Card>
      <p className="text-sm font-semibold text-gray-700" role="status">
        {shown.length === 1 ? t('resultCount.one') : t('resultCount.other', { n: shown.length })}
      </p>
      {shown.length === 0 ? (
        <Card>
          <p className="text-gray-700">{t('noResults')}</p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {shown.map((o) => (
            <OfficialCard key={o.id} official={o} saln={data.salnByPerson.get(o.personId)} geo={data.geo} />
          ))}
        </ul>
      )}
    </div>
  )
}
