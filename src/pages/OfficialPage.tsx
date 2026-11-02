import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { LEVEL_VARIANT } from '../components/OfficialCard'
import { ChartSkeleton } from '../components/ChartSkeleton'
import SalnCards from '../components/SalnCards'
import UnverifiedBadge from '../components/UnverifiedBadge'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { latestSaln, loadAll } from '../lib/data'
import { chartSeries } from '../lib/saln-view'
import { nodeByCode } from '../lib/geo'
import { useT } from '../lib/i18n'
import type { TFn } from '../lib/i18n'
import type { Geo, Official } from '../lib/types'
import portalConfig from '../../portal.config'

// Recharts is ~half a megabyte of JS: only profiles with a chart pay for it.
const SalnChart = lazy(() => import('../components/SalnChart'))

const data = loadAll()

function location(geo: Geo, o: Official, t: TFn): string {
  if (o.level === 'province' || o.level === 'district') return t('provinceWide')
  const n = nodeByCode(geo, o.geoCode)
  if (!n) return ''
  if (n.type === 'barangay') {
    const parent = n.parent ? nodeByCode(geo, n.parent) : undefined
    return parent ? `${n.name}, ${parent.name}` : n.name
  }
  return n.name
}

export default function OfficialPage() {
  const t = useT()
  const { id } = useParams()
  const o = data.officials.find((x) => x.id === id)
  const backLink = 'inline-flex min-h-11 items-center rounded-lg type-button text-primary-600 hover:text-primary-800'
  if (!o) {
    return (
      <Card>
        <h2 className="type-section-title text-gray-900">{t('notFound')}</h2>
        <p className="mt-2 text-gray-700">{t('notFoundBody')}</p>
        <Link to="/" className={`${backLink} mt-2 underline underline-offset-2`}>
          {t('back')}
        </Link>
      </Card>
    )
  }
  const terms = data.officials
    .filter((x) => x.personId === o.personId)
    .sort((a, b) => b.termStart.localeCompare(a.termStart))
  const current = terms[0]
  const saln = data.salnByPerson.get(o.personId)
  const latest = latestSaln(saln)
  const series = saln ? chartSeries(saln) : null
  return (
    <div className="space-y-6 sm:space-y-8">
      <p>
        <Link to="/" className={backLink}>
          <span aria-hidden="true">&larr;&nbsp;</span>
          {t('back')}
        </Link>
      </p>
      {o.sample && (
        <p
          data-testid="sample-banner"
          className="rounded-xl border-2 border-dashed border-accent-700 bg-accent-100 px-4 py-3 type-body font-semibold text-accent-900"
        >
          {o.sample.notice}
        </p>
      )}
      <Card className="motion-safe:animate-slide-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="type-entity-title text-gray-900">{o.name}</h2>
            <p className="mt-1 type-body text-gray-700">
              {current.position}, {location(data.geo, current, t)}
            </p>
          </div>
          <Badge variant={LEVEL_VARIANT[current.level]} size="md" data-testid="level-badge">
            {t(`levels.${current.level}`)}
          </Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="flex flex-col rounded-lg bg-primary-50 p-3 text-center" data-testid="stat-records">
            <dt className="order-2 type-meta text-primary-800">{t('statRecords')}</dt>
            <dd className="order-1 type-stat text-primary-900">{saln?.length ?? 0}</dd>
          </div>
          <div className="flex flex-col rounded-lg bg-primary-50 p-3 text-center" data-testid="stat-latest">
            <dt className="order-2 type-meta text-primary-800">{t('statLatestYear')}</dt>
            <dd className="order-1 type-stat text-primary-900">{latest ? latest.year : '\u2014'}</dd>
          </div>
        </dl>
        <h3 className="mb-2 mt-5 type-group-title text-gray-900">{t('termsHeading')}</h3>
        <ul aria-label={t('termsHeading')} className="space-y-2">
          {terms.map((term) => (
            <li key={term.id} className="rounded-lg bg-gray-50 px-3 py-2 type-body-sm text-gray-800">
              <strong>{term.position}</strong>, {location(data.geo, term, t)}.{' '}
              {t('termRange', { start: term.termStart, end: term.termEnd ?? t('present') })}{' '}
              {!term.rosterVerified && <UnverifiedBadge />}
            </li>
          ))}
        </ul>
      </Card>
      <section aria-labelledby="saln-records-heading" className="space-y-4 sm:space-y-6">
        <div>
          <h3 id="saln-records-heading" className="type-section-title text-gray-900">{t('salnHeading')}</h3>
          {saln?.length ? (
            <p className="type-body-sm text-gray-700">
              {saln.length === 1 ? t('recordsCount.one') : t('recordsCount.other', { n: saln.length })}
            </p>
          ) : null}
        </div>
        {saln?.length ? (
          <>
            {series && (
              <Suspense fallback={<ChartSkeleton />}>
                <SalnChart data={series} headingId="saln-chart-heading" />
              </Suspense>
            )}
            <SalnCards records={saln} />
            <p className="type-body-sm text-gray-700">{t('salnNote')}</p>
          </>
        ) : (
          <Card
            data-testid="empty-state"
            className="border-2 border-primary-200 bg-primary-50"
          >
            <p className="type-lead text-gray-900">
              <strong>{t('noSaln')}</strong>
            </p>
            <p className="mt-2 text-gray-800">{t('requestExplain')}</p>
            <div className="mt-4">
              <Button href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
                {t('requestOmbudsman')}
              </Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
