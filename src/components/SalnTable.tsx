import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import { safeHref } from '../lib/url'
import type { SalnRecord } from '../lib/types'

export default function SalnTable({ records }: { records: SalnRecord[] }) {
  const t = useT()
  const rows = [...records].sort((a, b) => b.year - a.year)
  return (
    <div className="table-wrap">
      <table className="saln">
        <caption>{t('salnCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('cols.year')}</th>
            <th scope="col">{t('cols.filingType')}</th>
            <th scope="col">{t('cols.assets')}</th>
            <th scope="col">{t('cols.liabilities')}</th>
            <th scope="col">{t('cols.netWorth')}</th>
            <th scope="col">{t('cols.source')}</th>
            <th scope="col">{t('cols.status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.year}</th>
              <td>{r.filingType}</td>
              <td className="num">{formatPeso(r.totalAssets)}</td>
              <td className="num">{formatPeso(r.totalLiabilities)}</td>
              <td className="num">
                <strong>{formatPeso(r.netWorth)}</strong>
              </td>
              <td>
                {safeHref(r.sourceUrl) ? (
                  <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {t(`sourceTypes.${r.sourceType}`)}
                  </a>
                ) : (
                  <span>{t('sourceUnavailable')}</span>
                )}
              </td>
              <td>
                <span>{t(`salnStatuses.${r.status}`)}</span>
                {r.status === 'verified' && r.verifiedBy && r.verifiedAt && (
                  <div className="verified">{t('verifiedBy', { by: r.verifiedBy, on: r.verifiedAt })}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
