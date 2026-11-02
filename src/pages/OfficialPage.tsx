import { Link, useParams } from 'react-router'
import SalnTable from '../components/SalnTable'
import UnverifiedBadge from '../components/UnverifiedBadge'
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
  if (!o) {
    return (
      <>
        <h2>{t('notFound')}</h2>
        <p>{t('notFoundBody')}</p>
        <Link to="/">{t('back')}</Link>
      </>
    )
  }
  const terms = data.officials
    .filter((x) => x.personId === o.personId)
    .sort((a, b) => b.termStart.localeCompare(a.termStart))
  const current = terms[0]
  const saln = data.salnByPerson.get(o.personId)
  return (
    <>
      <p>
        <Link to="/">{t('back')}</Link>
      </p>
      <h2>{o.name}</h2>
      <p className="position">
        {current.position}, {location(data.geo, current, t)}
      </p>
      <h3>{t('termsHeading')}</h3>
      <ul aria-label={t('termsHeading')} className="terms">
        {terms.map((term) => (
          <li key={term.id}>
            <strong>{term.position}</strong>, {location(data.geo, term, t)}.{' '}
            {t('termRange', { start: term.termStart, end: term.termEnd ?? t('present') })}{' '}
            {!term.rosterVerified && <UnverifiedBadge />}
          </li>
        ))}
      </ul>
      <h3>{t('salnHeading')}</h3>
      {saln?.length ? (
        <>
          <SalnTable records={saln} />
          <p className="note">{t('salnNote')}</p>
        </>
      ) : (
        <div className="empty">
          <p>
            <strong>{t('noSaln')}</strong>
          </p>
          <p>{t('requestExplain')}</p>
          <p>
            <a href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
              {t('requestOmbudsman')}
            </a>
          </p>
        </div>
      )}
    </>
  )
}
