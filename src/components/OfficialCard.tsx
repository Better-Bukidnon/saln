import { Link } from 'react-router'
import { formatPeso } from '../lib/money'
import { latestSaln } from '../lib/data'
import { nodeByCode } from '../lib/geo'
import { useT } from '../lib/i18n'
import type { TFn } from '../lib/i18n'
import type { Geo, Official, SalnRecord } from '../lib/types'
import UnverifiedBadge from './UnverifiedBadge'

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

export default function OfficialCard({
  official,
  saln,
  geo,
}: {
  official: Official
  saln: SalnRecord[] | undefined
  geo: Geo
}) {
  const t = useT()
  const latest = latestSaln(saln)
  return (
    <li className="card">
      <h3>
        <Link to={`/official/${official.id}`}>{official.name}</Link>
      </h3>
      <p className="position">{official.position}</p>
      <p className="where">{location(geo, official, t)}</p>
      <p className="networth">
        {latest ? (
          <>
            <span className="label">{t('netWorthYear', { year: latest.year })}: </span>
            <strong>{formatPeso(latest.netWorth, true)}</strong>
          </>
        ) : (
          t('noSaln')
        )}
      </p>
      {!official.rosterVerified && <UnverifiedBadge />}
    </li>
  )
}
