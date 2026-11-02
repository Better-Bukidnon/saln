import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import { newestFirst, sourceTypeKey } from '../lib/saln-view'
import { safeHref } from '../lib/url'
import type { SalnRecord } from '../lib/types'
import { Badge } from './ui/Badge'
import type { BadgeVariant } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

export const STATUS_VARIANT: Record<SalnRecord['status'], BadgeVariant> = {
  submitted: 'gray',
  verified: 'verified',
  under_review: 'primary',
  flagged: 'danger',
}

function Figure({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <dt className="type-meta text-gray-700">{label}</dt>
      <dd className={`mt-1 tabular-nums ${strong ? 'type-figure text-primary-900' : 'type-figure text-gray-900'}`}>
        {formatPeso(value)}
      </dd>
    </div>
  )
}

// One card per filing year, newest first. Declared totals only: no itemised lists exist in the data.
export default function SalnCards({ records }: { records: SalnRecord[] }) {
  const t = useT()
  return (
    <ul className="space-y-4 sm:space-y-6" data-testid="saln-cards">
      {newestFirst(records).map((r) => {
        const href = safeHref(r.sourceUrl)
        return (
          <li key={r.id}>
            <Card data-testid="saln-card" aria-labelledby={`saln-${r.id}`} role="group">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 id={`saln-${r.id}`} className="type-section-title text-gray-900">
                    {t('salnYear', { year: r.year })}
                  </h4>
                  <p className="type-body-sm text-gray-700">
                    {t('cols.filingType')}: {r.filingType}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]} size="md" data-testid="status-badge">
                  {t(`salnStatuses.${r.status}`)}
                </Badge>
              </div>
              {r.status === 'verified' && r.verifiedBy && r.verifiedAt && (
                <p className="mt-2 type-body-sm text-gray-700">{t('verifiedBy', { by: r.verifiedBy, on: r.verifiedAt })}</p>
              )}
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Figure label={t('cols.assets')} value={r.totalAssets} />
                <Figure label={t('cols.liabilities')} value={r.totalLiabilities} />
                <Figure label={t('cols.netWorth')} value={r.netWorth} strong />
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <p className="type-body-sm text-gray-700">
                  <span className="font-medium">{t('dataSource')}:</span> {t(sourceTypeKey(r.sourceType))}
                </p>
                {href ? (
                  <Button href={href} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" className="text-primary-600">
                    {t('viewSource')}
                    <span className="sr-only"> ({t(sourceTypeKey(r.sourceType))}, {r.year})</span>
                  </Button>
                ) : (
                  <span className="type-body-sm text-gray-700">{t('sourceUnavailable')}</span>
                )}
              </div>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
