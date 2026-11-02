import { Link, useParams } from 'react-router'
import SalnTable from '../components/SalnTable'
import UnverifiedBadge from '../components/UnverifiedBadge'
import { loadAll } from '../lib/data'
import { nodeByCode } from '../lib/geo'
import strings from '../lib/strings'
import type { Geo, Official } from '../lib/types'
import portalConfig from '../../portal.config'

const data = loadAll()

function location(geo: Geo, o: Official): string {
  if (o.level === 'province' || o.level === 'district') return strings.provinceWide
  const n = nodeByCode(geo, o.geoCode)
  if (!n) return ''
  if (n.type === 'barangay') {
    const parent = n.parent ? nodeByCode(geo, n.parent) : undefined
    return parent ? `${n.name}, ${parent.name}` : n.name
  }
  return n.name
}

export default function OfficialPage() {
  const { id } = useParams()
  const o = data.officials.find((x) => x.id === id)
  if (!o) {
    return (
      <>
        <h2>{strings.notFound}</h2>
        <p>{strings.notFoundBody}</p>
        <Link to="/">{strings.back}</Link>
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
        <Link to="/">{strings.back}</Link>
      </p>
      <h2>{o.name}</h2>
      <p className="position">
        {current.position}, {location(data.geo, current)}
      </p>
      <h3>{strings.termsHeading}</h3>
      <ul aria-label={strings.termsHeading} className="terms">
        {terms.map((t) => (
          <li key={t.id}>
            <strong>{t.position}</strong>, {location(data.geo, t)}.{' '}
            {strings.termRange(t.termStart, t.termEnd ?? strings.present)}{' '}
            {!t.rosterVerified && <UnverifiedBadge />}
          </li>
        ))}
      </ul>
      <h3>{strings.salnHeading}</h3>
      {saln?.length ? (
        <>
          <SalnTable records={saln} />
          <p className="note">{strings.salnNote}</p>
        </>
      ) : (
        <div className="empty">
          <p>
            <strong>{strings.noSaln}</strong>
          </p>
          <p>{strings.requestExplain}</p>
          <p>
            <a href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
              {strings.requestOmbudsman}
            </a>
          </p>
        </div>
      )}
    </>
  )
}
