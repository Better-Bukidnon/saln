import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from 'recharts'
import { formatPeso } from '../lib/money'
import { useT } from '../lib/i18n'
import { compactPeso } from '../lib/saln-view'
import type { ChartData } from '../lib/saln-view'
import { CHART_HEIGHT } from './ChartSkeleton'
import { Card } from './ui/Card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from './ui/chart'
import type { ChartConfig } from './ui/chart'

const GROUP_W = 150 // px per year when there is room; the region scrolls rather than squeezing the bars
const BAR_W = 34
const CHAR_W = 6.4 // approx width of one 11px bold digit, used only to hide labels wider than their bar allows
const KEYS = ['assets', 'liabilities', 'netWorth'] as const

// Colours come from the project tokens; ChartStyle exposes them to Recharts as --color-assets etc.
const COLORS = { assets: 'var(--color-chart-assets)', liabilities: 'var(--color-chart-liabilities)', netWorth: 'var(--color-chart-networth)' }

interface ValueLabelProps {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: unknown
}

// Value label above a positive bar and below a negative one; dropped when it would be much wider than the bar.
function ValueLabel({ x, y, width, height, value }: ValueLabelProps) {
  const [nx, ny, nw, nh, v] = [Number(x), Number(y), Number(width), Number(height), Number(value)]
  if (![nx, ny, nw, nh, v].every(Number.isFinite)) return null
  const text = compactPeso(v)
  if (text.length * CHAR_W > nw * 2.2) return null
  const top = Math.min(ny, ny + nh)
  const bottom = Math.max(ny, ny + nh)
  return (
    <text
      x={nx + nw / 2}
      y={v >= 0 ? top - 5 : bottom + 14}
      textAnchor="middle"
      className="fill-ink stroke-white type-chart-value"
      strokeWidth={3}
      strokeLinejoin="round"
      style={{ paintOrder: 'stroke' }}
      data-testid="chart-value"
    >
      {text}
    </text>
  )
}

// Grouped bar chart of declared totals by year, built on the shadcn/ui chart primitives (Recharts).
// Colour is never the only cue: value labels, legend text, tooltip and the data table carry the same numbers.
export default function SalnChart({ data, headingId }: { data: ChartData; headingId: string }) {
  const t = useT()
  const n = data.points.length
  const rotate = n > 5
  const config: ChartConfig = {
    assets: { label: t('chartSeries.assets'), color: COLORS.assets },
    liabilities: { label: t('chartSeries.liabilities'), color: COLORS.liabilities },
    netWorth: { label: t('chartSeries.netWorth'), color: COLORS.netWorth },
  }

  return (
    <Card data-testid="saln-chart" aria-labelledby={headingId} role="region">
      <h4 id={headingId} className="type-card-title text-gray-900">
        {t('chartHeading')}
      </h4>
      <div className="mt-3 overflow-x-auto rounded" role="region" tabIndex={0} aria-label={t('chartRegion')}>
        <div role="img" aria-label={t('chartAlt', { from: data.from, to: data.to })} style={{ minWidth: Math.min(n * GROUP_W + 90, 360 + n * 80), height: CHART_HEIGHT }}>
          <ChartContainer config={config} className="h-full w-full">
            <BarChart data={data.points} accessibilityLayer margin={{ top: 28, right: 16, left: 0, bottom: 0 }} barGap={3} barCategoryGap={rotate ? '18%' : '24%'}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} interval={0} angle={rotate ? -45 : 0} textAnchor={rotate ? 'end' : 'middle'} height={rotate ? 56 : 32} tickMargin={8} />
              <YAxis width={76} tickLine={false} axisLine tickFormatter={compactPeso} />
              <ChartTooltip cursor={{ fill: 'var(--color-gray-100)' }} content={<ChartTooltipContent indicator="dot" valueFormatter={formatPeso} />} />
              <ChartLegend verticalAlign="bottom" align="left" wrapperStyle={{ left: 0 }} content={<ChartLegendContent className="justify-start pl-3 sm:pl-[76px]" />} />
              <ReferenceLine y={0} stroke="var(--color-gray-700)" strokeWidth={1.5} ifOverflow="visible" />
              {KEYS.map((k) => (
                <Bar key={k} dataKey={k} fill={`var(--color-${k})`} maxBarSize={BAR_W} radius={[5, 5, 0, 0]} isAnimationActive={false}>
                  <LabelList dataKey={k} content={ValueLabel} />
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
      <p className="mt-2 text-center type-body-sm text-gray-700">{t('chartRange', { from: data.from, to: data.to })}</p>
      <details className="mt-3 type-body-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center type-meta text-primary-600">{t('chartTable')}</summary>
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
      </details>
    </Card>
  )
}
