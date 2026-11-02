import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import type { ChartData } from '../lib/saln-view'
import { Card } from './ui/Card'

const W = 640
const H = 280
const PAD = { l: 76, r: 20, t: 16, b: 36 }

const SERIES = [
  { key: 'assets', label: 'cols.assets', stroke: 'stroke-primary-500', fill: 'fill-primary-500', bg: 'bg-primary-500', dash: undefined },
  { key: 'liabilities', label: 'cols.liabilities', stroke: 'stroke-danger-500', fill: 'fill-danger-500', bg: 'bg-danger-500', dash: '6 4' },
  { key: 'netWorth', label: 'cols.netWorth', stroke: 'stroke-ink', fill: 'fill-ink', bg: 'bg-ink', dash: '2 3' },
] as const

// Dependency-free line chart of declared totals by year. Series are told apart by dash pattern as well as colour.
export default function SalnChart({ data, headingId }: { data: ChartData; headingId: string }) {
  const t = useT()
  const lo = Math.min(0, data.min)
  const hi = Math.max(0, data.max)
  const span = hi - lo || 1
  const n = data.points.length
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1)
  const y = (v: number) => PAD.t + ((hi - v) * (H - PAD.t - PAD.b)) / span
  const ticks = [...new Set([hi, lo, 0])]
  return (
    <Card data-testid="saln-chart" aria-labelledby={headingId} role="region">
      <h4 id={headingId} className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
        {t('chartHeading')}
      </h4>
      <p className="mb-3 text-xs text-gray-600 sm:text-sm">{t('chartRange', { from: data.from, to: data.to })}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('chartAlt', { from: data.from, to: data.to })}
        className="h-auto w-full"
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className={v === 0 ? 'stroke-gray-500' : 'stroke-gray-200'} strokeWidth={1} />
            <text x={PAD.l - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-gray-700 text-[12px]">
              {formatPeso(v, true)}
            </text>
          </g>
        ))}
        {data.points.map((p, i) => (
          <text key={p.year} x={x(i)} y={H - 10} textAnchor="middle" className="fill-gray-700 text-[12px]">
            {p.year}
          </text>
        ))}
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              className={s.stroke}
              strokeWidth={2.5}
              strokeDasharray={s.dash}
              strokeLinejoin="round"
              points={data.points.map((p, i) => `${x(i)},${y(p[s.key])}`).join(' ')}
            />
            {data.points.map((p, i) => (
              <circle key={p.year} cx={x(i)} cy={y(p[s.key])} r={4} className={s.fill} />
            ))}
          </g>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-800 sm:text-sm">
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={`h-1 w-5 rounded-full ${s.bg}`} />
            {t(s.label)}
          </li>
        ))}
      </ul>
      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-primary-600">{t('chartTable')}</summary>
        <div className="overflow-x-auto rounded" role="region" tabIndex={0} aria-label={t('salnTableRegion')}>
          <table className="mt-2 w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr>
                {['cols.year', 'cols.assets', 'cols.liabilities', 'cols.netWorth'].map((k) => (
                  <th key={k} scope="col" className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold text-gray-900">
                    {t(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.points.map((p) => (
                <tr key={p.year}>
                  <th scope="row" className="border border-gray-300 px-3 py-2 text-left font-semibold tabular-nums">{p.year}</th>
                  <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.assets)}</td>
                  <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.liabilities)}</td>
                  <td className="border border-gray-300 px-3 py-2 tabular-nums">{formatPeso(p.netWorth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  )
}
