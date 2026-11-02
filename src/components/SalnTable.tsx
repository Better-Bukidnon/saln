import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import { safeHref } from '../lib/url'
import type { SalnRecord } from '../lib/types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

const th = 'border border-gray-300 bg-gray-100 px-3 py-2 text-left text-sm font-semibold text-gray-900'
const td = 'border border-gray-300 px-3 py-2 align-top text-sm text-gray-800'
const num = `${td} whitespace-nowrap text-right tabular-nums`

export default function SalnTable({ records }: { records: SalnRecord[] }) {
  const t = useT()
  const rows = [...records].sort((a, b) => b.year - a.year)
  return (
    <Card padding="none">
      <div className="overflow-x-auto rounded-xl" role="region" tabIndex={0} aria-label={t('salnTableRegion')}>
        <table className="w-full min-w-[640px] border-collapse [overflow-wrap:normal]">
          <caption className="p-3 text-left text-sm text-gray-700 sm:p-4">{t('salnCaption')}</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>{t('cols.year')}</th>
              <th scope="col" className={th}>{t('cols.filingType')}</th>
              <th scope="col" className={th}>{t('cols.assets')}</th>
              <th scope="col" className={th}>{t('cols.liabilities')}</th>
              <th scope="col" className={th}>{t('cols.netWorth')}</th>
              <th scope="col" className={th}>{t('cols.source')}</th>
              <th scope="col" className={th}>{t('cols.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className={`${td} text-left font-semibold tabular-nums`}>{r.year}</th>
                <td className={td}>{r.filingType}</td>
                <td className={num}>{formatPeso(r.totalAssets)}</td>
                <td className={num}>{formatPeso(r.totalLiabilities)}</td>
                <td className={num}>
                  <strong>{formatPeso(r.netWorth)}</strong>
                </td>
                <td className={td}>
                  {safeHref(r.sourceUrl) ? (
                    <Button
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      size="sm"
                      className="text-primary-600"
                    >
                      {t(`sourceTypes.${r.sourceType}`)}
                    </Button>
                  ) : (
                    <span>{t('sourceUnavailable')}</span>
                  )}
                </td>
                <td className={td}>
                  <span>{t(`salnStatuses.${r.status}`)}</span>
                  {r.status === 'verified' && r.verifiedBy && r.verifiedAt && (
                    <div className="mt-1 text-xs text-gray-600">{t('verifiedBy', { by: r.verifiedBy, on: r.verifiedAt })}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
