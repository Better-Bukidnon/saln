import { Component, lazy, Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../lib/i18n'
import type { ChartData } from '../lib/saln-view'
import ChartDataTable from './ChartDataTable'
import { ChartSkeleton } from './ChartSkeleton'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface BoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

// Catches a failed chunk load (offline, stale deploy) so the profile page keeps working.
export class ChartBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const load = () => lazy(() => import('./SalnChart'))
let Chart = load()

// Recharts (~356 kB, ~105 kB gzip) is loaded only for profiles that have a chart. If the chunk fails to
// load, a short message and a Retry button replace it (a new lazy() is needed: React caches the failure).
export default function LazySalnChart({ data, headingId }: { data: ChartData; headingId: string }) {
  const t = useT()
  const [attempt, setAttempt] = useState(0)
  return (
    <ChartBoundary key={attempt} fallback={<ChartError data={data} onRetry={() => {
          Chart = load()
          setAttempt((a) => a + 1)
        }} message={t('chartError')} retry={t('chartRetry')} />}>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart data={data} headingId={headingId} />
      </Suspense>
    </ChartBoundary>
  )
}

export function ChartError({ data, message, retry, onRetry }: { data: ChartData; message: string; retry: string; onRetry: () => void }) {
  return (
    <Card data-testid="saln-chart-error">
      <p role="alert" className="type-body text-gray-900">
        {message}
      </p>
      <Button type="button" variant="ghost" className="mt-3" onClick={onRetry}>
        {retry}
      </Button>
      <ChartDataTable data={data} />
    </Card>
  )
}
