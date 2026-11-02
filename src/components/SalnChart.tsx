import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import { chartScale, compactPeso, placeLabels } from '../lib/saln-view'
import type { ChartData, LabelBox } from '../lib/saln-view'
import { Card } from './ui/Card'

const PLOT_H = 240
const PAD = { l: 76, r: 16, t: 28 }
const BAR_W = 34
const BAR_GAP = 3
const GROUP_GAP = 36
const GROUP_W = 3 * BAR_W + 2 * BAR_GAP + GROUP_GAP
const LABEL_H = 12
const CHAR_W = 6.4 // approx width of one 11px bold digit, used only to detect label collisions

const SERIES = [
  { key: 'assets', label: 'chartSeries.assets', fill: 'fill-chart-assets', bg: 'bg-chart-assets' },
  { key: 'liabilities', label: 'chartSeries.liabilities', fill: 'fill-chart-liabilities', bg: 'bg-chart-liabilities' },
  { key: 'netWorth', label: 'chartSeries.netWorth', fill: 'fill-chart-networth', bg: 'bg-chart-networth' },
] as const

// Bar with the two corners on its free end rounded (top for positive values, bottom for negative).
function barPath(x: number, y0: number, y1: number, w: number): string {
  const r = Math.min(5, w / 2, Math.abs(y1 - y0))
  if (y0 === y1) return ''
  if (y1 < y0) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`
}

// Dependency-free grouped bar chart of declared totals by year (assets, liabilities, net worth).
// Colour is never the only cue: value labels, legend text and the data table carry the same numbers.
export default function SalnChart({ data, headingId }: { data: ChartData; headingId: string }) {
  const t = useT()
  const sc = chartScale(data, PLOT_H)
  const n = data.points.length
  const rotate = n > 5
  const padB = rotate ? 64 : 36
  const W = PAD.l + PAD.r + n * GROUP_W
  const H = PAD.t + PLOT_H + padB
  const yy = (v: number) => PAD.t + sc.y(v)
  const y0 = yy(0)

  const bars = data.points.flatMap((p, i) =>
    SERIES.map((s, k) => {
      const v = p[s.key]
      const x = PAD.l + i * GROUP_W + GROUP_GAP / 2 + k * (BAR_W + BAR_GAP)
      const text = compactPeso(v)
      const w = text.length * CHAR_W
      const ly = v >= 0 ? yy(v) - 5 : yy(v) + 14
      return { id: `${p.year}-${s.key}`, year: p.year, s, v, x, text, w, ly, box: { id: `${p.year}-${s.key}`, x: x + BAR_W / 2, y: ly, w, h: LABEL_H } as LabelBox }
    }),
  )
  const shown = placeLabels(bars.map((b) => b.box))

  return (
    <Card data-testid="saln-chart" aria-labelledby={headingId} role="region">
      <h4 id={headingId} className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
        {t('chartHeading')}
      </h4>
      <div className="mt-3 overflow-x-auto rounded" role="region" tabIndex={0} aria-label={t('chartRegion')}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t('chartAlt', { from: data.from, to: data.to })}
          className="h-auto w-full"
          style={{ minWidth: Math.min(W, 360 + n * 40) }}
        >
          {sc.ticks.map((v) => (
            <g key={v}>
              {v !== 0 && <line x1={PAD.l} x2={W - PAD.r} y1={yy(v)} y2={yy(v)} className="stroke-gray-300" strokeDasharray="4 4" strokeWidth={1} />}
              <text x={PAD.l - 8} y={yy(v)} textAnchor="end" dominantBaseline="middle" className="fill-gray-700 text-[11px]">
                {compactPeso(v)}
              </text>
            </g>
          ))}
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PAD.t + PLOT_H} className="stroke-gray-500" strokeWidth={1} />
          {bars.map((b) => (
            <path key={b.id} d={barPath(b.x, y0, yy(b.v), BAR_W)} className={b.s.fill} data-testid="chart-bar" data-series={b.s.key} data-year={b.year} />
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={y0} y2={y0} className="stroke-gray-700" strokeWidth={1.5} />
          {bars.filter((b) => shown.has(b.id)).map((b) => (
            <text key={b.id} x={b.x + BAR_W / 2} y={b.ly} textAnchor="middle" className="fill-ink stroke-white text-[11px] font-bold" strokeWidth={3} strokeLinejoin="round" style={{ paintOrder: 'stroke' }} data-testid="chart-value">
              {b.text}
            </text>
          ))}
          {data.points.map((p, i) => {
            const cx = PAD.l + i * GROUP_W + GROUP_W / 2
            const ty = PAD.t + PLOT_H + 20
            return (
              <text
                key={p.year}
                x={cx}
                y={ty}
                textAnchor={rotate ? 'end' : 'middle'}
                transform={rotate ? `rotate(-45 ${cx} ${ty})` : undefined}
                className="fill-gray-700 text-[12px]"
              >
                {p.year}
              </text>
            )
          })}
        </svg>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-gray-800 sm:text-sm" data-testid="chart-legend">
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${s.bg}`} />
            {t(s.label)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-xs text-gray-700 sm:text-sm">{t('chartRange', { from: data.from, to: data.to })}</p>
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
