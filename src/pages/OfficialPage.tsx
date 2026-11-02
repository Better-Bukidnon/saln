import { Link, useParams } from 'react-router'
import SalnTable from '../components/SalnTable'
import UnverifiedBadge from '../components/UnverifiedBadge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { loadAll } from '../lib/data'
import { nodeByCode } from '../lib/geo'
import { useT } from '../lib/i18n'
import type { TFn } from '../lib/i18n'
import type { Geo, Official } from '../lib/types'
import portalConfig from '../../portal.config'

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
  const backLink = 'inline-flex min-h-11 items-center rounded-lg font-medium text-primary-600 hover:text-primary-800'
  if (!o) {
    return (
      <Card>
        <h2 className="text-xl font-bold text-gray-900">{t('notFound')}</h2>
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
  return (
    <div className="space-y-6 sm:space-y-8">
      <p>
        <Link to="/" className={backLink}>
          <span aria-hidden="true">&larr;&nbsp;</span>
          {t('back')}
        </Link>
      </p>
      <Card className="motion-safe:animate-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{o.name}</h2>
        <p className="mt-1 text-gray-700">
          {current.position}, {location(data.geo, current, t)}
        </p>
        <h3 className="mb-2 mt-5 text-base font-semibold text-gray-900">{t('termsHeading')}</h3>
        <ul aria-label={t('termsHeading')} className="space-y-2">
          {terms.map((term) => (
            <li key={term.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">
              <strong>{term.position}</strong>, {location(data.geo, term, t)}.{' '}
              {t('termRange', { start: term.termStart, end: term.termEnd ?? t('present') })}{' '}
              {!term.rosterVerified && <UnverifiedBadge />}
            </li>
          ))}
        </ul>
      </Card>
      <section>
        <h3 className="mb-3 text-xl font-bold tracking-tight text-gray-900">{t('salnHeading')}</h3>
        {saln?.length ? (
          <>
            <SalnTable records={saln} />
            <p className="mt-3 text-sm text-gray-700">{t('salnNote')}</p>
          </>
        ) : (
          <Card
            data-testid="empty-state"
            className="border-2 border-primary-200 bg-primary-50"
          >
            <p className="text-lg text-gray-900">
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
