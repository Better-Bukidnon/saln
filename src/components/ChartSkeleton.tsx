import { Card } from './ui/Card'

export const CHART_HEIGHT = 380

// Placeholder shown while the chart chunk loads: same plot height, so the page does not jump.
export function ChartSkeleton() {
  return (
    <Card data-testid="saln-chart-loading" aria-busy="true">
      <div className="h-[22px] w-2/3 max-w-sm rounded bg-gray-100" />
      <div className="mt-3 rounded bg-gray-100 motion-safe:animate-pulse" style={{ height: CHART_HEIGHT }} />
    </Card>
  )
}
