import { Link } from 'react-router'
import { formatPeso } from '../lib/money'
import { latestSaln } from '../lib/data'
import { nodeByCode } from '../lib/geo'
import strings from '../lib/strings'
import type { Geo, Official, SalnRecord } from '../lib/types'
import UnverifiedBadge from './UnverifiedBadge'

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

export default function OfficialCard({
  official,
  saln,
  geo,
}: {
  official: Official
  saln: SalnRecord[] | undefined
  geo: Geo
}) {
  const latest = latestSaln(saln)
  return (
    <li className="card">
      <h3>
        <Link to={`/official/${official.id}`}>{official.name}</Link>
      </h3>
      <p className="position">{official.position}</p>
      <p className="where">{location(geo, official)}</p>
      <p className="networth">
        {latest ? (
          <>
            <span className="label">{strings.netWorth} ({latest.year}): </span>
            <strong>{formatPeso(latest.netWorth, true)}</strong>
          </>
        ) : (
          strings.noSaln
        )}
      </p>
      {!official.rosterVerified && <UnverifiedBadge />}
    </li>
  )
}
