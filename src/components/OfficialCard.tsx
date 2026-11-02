import { Link } from 'react-router'
import { formatPeso } from '../lib/money'
import { latestSaln } from '../lib/data'
import { nodeByCode } from '../lib/geo'
import { useT } from '../lib/i18n'
import type { TFn } from '../lib/i18n'
import type { Geo, Level, Official, SalnRecord } from '../lib/types'
import UnverifiedBadge from './UnverifiedBadge'
import { Badge } from './ui/Badge'
import type { BadgeVariant } from './ui/Badge'
import { Card } from './ui/Card'

const LEVEL_VARIANT: Record<Level, BadgeVariant> = {
  province: 'ph-blue',
  district: 'ph-yellow',
  city: 'ph-red',
  municipality: 'ph-red',
  barangay: 'gray',
}

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
    <li>
      <Card
        hoverable
        padding="sm"
        className="relative flex h-full flex-col gap-3 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight text-gray-900">
              <Link to={`/official/${official.id}`} className="rounded after:absolute after:inset-0 after:content-['']">
                {official.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-gray-700">{official.position}</p>
            <p className="text-sm text-gray-600">{location(geo, official, t)}</p>
          </div>
          <Badge variant={LEVEL_VARIANT[official.level]} size="sm" className="shrink-0" data-testid="level-badge">
            {t(`levels.${official.level}`)}
          </Badge>
        </div>
        <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800">
          {latest ? (
            <>
              <span>{t('netWorthYear', { year: latest.year })}: </span>
              <strong className="block text-lg font-bold text-primary-900">{formatPeso(latest.netWorth, true)}</strong>
            </>
          ) : (
            t('noSaln')
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span>{!official.rosterVerified && <UnverifiedBadge />}</span>
          <span aria-hidden="true" className="text-sm font-medium text-primary-600">
            {t('viewProfile')} &rarr;
          </span>
        </div>
      </Card>
    </li>
  )
}
