import { formatPeso } from '../lib/money'
import strings from '../lib/strings'
import { safeHref } from '../lib/url'
import type { SalnRecord } from '../lib/types'

export default function SalnTable({ records }: { records: SalnRecord[] }) {
  const rows = [...records].sort((a, b) => b.year - a.year)
  return (
    <div className="table-wrap">
      <table className="saln">
        <caption>{strings.salnCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{strings.cols.year}</th>
            <th scope="col">{strings.cols.filingType}</th>
            <th scope="col">{strings.cols.assets}</th>
            <th scope="col">{strings.cols.liabilities}</th>
            <th scope="col">{strings.cols.netWorth}</th>
            <th scope="col">{strings.cols.source}</th>
            <th scope="col">{strings.cols.status}</th>
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
                    {strings.sourceTypes[r.sourceType]}
                  </a>
                ) : (
                  <span>{strings.sourceUnavailable}</span>
                )}
              </td>
              <td>
                <span>{strings.salnStatuses[r.status]}</span>
                {r.status === 'verified' && r.verifiedBy && r.verifiedAt && (
                  <div className="verified">{strings.verifiedBy(r.verifiedBy, r.verifiedAt)}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
