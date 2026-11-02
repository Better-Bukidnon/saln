import { useT } from '../lib/i18n'
import { formatPeso } from '../lib/money'
import type { ChartData } from '../lib/saln-view'

// The chart's numbers as a table: the text alternative to the chart, and what stays if the chart cannot load.
export default function ChartDataTable({ data }: { data: ChartData }) {
  const t = useT()
  return (
    <div className="overflow-x-auto rounded" role="region" tabIndex={0} aria-label={t('salnTableRegion')}>
      <table className="mt-2 w-full min-w-[420px] border-collapse type-body-sm">
        <thead>
          <tr>
            {['cols.year', 'cols.assets', 'cols.liabilities', 'cols.netWorth'].map((k) => (
              <th key={k} scope="col" className="border border-gray-300 bg-gray-100 px-3 py-2 text-left type-meta text-gray-900">
                {t(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.points.map((p) => (
            <tr key={p.year}>
              <th scope="row" className="border border-gray-300 px-3 py-2 text-left type-meta tabular-nums">{p.year}</th>
              <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.assets)}</td>
              <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.liabilities)}</td>
              <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.netWorth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
