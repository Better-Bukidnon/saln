import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import HelpBanner from '../components/HelpBanner'
import FilterBar from '../components/FilterBar'
import OfficialGroupSection from '../components/OfficialGroupSection'
import { loadAll } from '../lib/data'
import { filterOfficials, parseFilters, serializeFilters, sortOfficials } from '../lib/filter'
import type { Filters } from '../lib/filter'
import { groupOfficials } from '../lib/group'
import type { OfficialGroup } from '../lib/group'
import { useT } from '../lib/i18n'
import portalConfig from '../../portal.config'
import { Badge } from '../components/ui/Badge'
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
  const grouped = useMemo(() => groupOfficials(shown, data.geo, new Date()), [shown])
  // A location, level or name filter narrows the list enough to open every group.
  const autoOpen = Boolean(filters.lgu || filters.barangay || filters.q.trim() || filters.level)
  const onChange = (next: Filters, replace = false) => setParams(serializeFilters(next), { replace })

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-white shadow-md motion-safe:animate-fade-in">
        <div className="px-4 py-8 text-center sm:px-6 sm:py-12">
          <h2 data-testid="hero-title" className="mb-3 text-2xl font-bold leading-tight tracking-tight sm:mb-4 sm:text-4xl sm:leading-10">
            {t('heroTitle')}
          </h2>
          <p className="mx-auto mb-2 max-w-2xl text-base text-white sm:text-xl">{t('heroPurpose')}</p>
          <p data-testid="hero-summary" className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white sm:text-base">
            {t('heroSummary')}
          </p>
          <p data-testid="hero-hashtags" className="inline-block rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-accent-300 sm:text-sm">
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
        <>
          <GroupSet title={t('currentHeading')} id="current" groups={grouped.current} former={false} autoOpen={autoOpen} />
          <GroupSet title={t('formerHeading')} id="former" groups={grouped.former} former autoOpen={autoOpen} />
        </>
      )}
    </div>
  )
}

type Level = 'provincial' | 'sp' | 'house' | 'municipal' | 'barangay'
const LEVEL_ORDER: Level[] = ['provincial', 'sp', 'house', 'municipal', 'barangay']
const levelOf = (g: OfficialGroup): Level =>
  g.kind === 'lgu' ? 'municipal' : g.kind

function GroupSet({
  title,
  id,
  groups,
  former,
  autoOpen,
}: {
  title: string
  id: string
  groups: OfficialGroup[]
  former: boolean
  autoOpen: boolean
}) {
  const t = useT()
  if (groups.length === 0) return null
  const cities = data.geo.nodes.filter((n) => n.type === 'city').length
  const municipalities = data.geo.nodes.filter((n) => n.type === 'municipality').length
  const barangays = data.geo.nodes.filter((n) => n.type === 'barangay').length
  const desc: Record<Level, string> = {
    provincial: t('levelDesc.provincial'),
    sp: t('levelDesc.sp'),
    house: t('levelDesc.house'),
    municipal: t('levelDesc.municipal', { cities, municipalities }),
    barangay: t('levelDesc.barangay', { n: barangays }),
  }
  const titles: Record<Level, string> = {
    provincial: t('groupProvincial'),
    sp: t('groupSp'),
    house: t('groupHouse'),
    municipal: t('levelMunicipal'),
    barangay: t('levelBarangay'),
  }
  return (
    <section aria-labelledby={`${id}-heading`} data-testid={`${id}-officials`} className="space-y-4">
      <h2 id={`${id}-heading`} className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-6">
        {LEVEL_ORDER.map((level) => {
          const rows = groups.filter((g) => levelOf(g) === level)
          if (rows.length === 0) return null
          const row = (g: OfficialGroup, single: boolean) => (
            <OfficialGroupSection
              key={`${g.key}:${autoOpen}`}
              group={g}
              geo={data.geo}
              salnByPerson={data.salnByPerson}
              defaultOpen={autoOpen || (!former && g.kind === 'provincial')}
              description={single ? desc[level] : undefined}
            />
          )
          // Provincial heads, board, House: the level is a single row that carries its own description.
          if (level !== 'municipal' && level !== 'barangay') return <ul key={level} data-level={level}>{row(rows[0], true)}</ul>
          const total = rows.reduce((s, g) => s + g.officials.length, 0)
          const hid = `${id}-${level}-heading`
          return (
            <div key={level} data-level={level} className="space-y-3">
              <div className="flex items-start justify-between gap-3 py-1">
                <div className="min-w-0">
                  <h3 id={hid} className="text-base font-bold text-gray-900 sm:text-lg">
                    {titles[level]}
                  </h3>
                  <p className="text-sm text-gray-700">{desc[level]}</p>
                </div>
                <Badge variant="gray" size="md" className="shrink-0" data-testid="level-total">
                  {total === 1 ? t('groupCount.one') : t('groupCount.other', { n: total })}
                </Badge>
              </div>
              <ul className="space-y-3 sm:space-y-4">{rows.map((g) => row(g, false))}</ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
