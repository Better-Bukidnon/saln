import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ChartBoundary } from '../../src/components/LazySalnChart'

// There is no DOM in the unit environment, so the failure path is checked through the boundary's contract:
// a rejected dynamic import throws during render, getDerivedStateFromError flips it, and the fallback shows.
describe('ChartBoundary', () => {
  it('turns a render error (rejected lazy import) into the failed state', () => {
    expect(ChartBoundary.getDerivedStateFromError()).toEqual({ failed: true })
  })
  it('renders the children until it has failed', () => {
    expect(renderToString(<ChartBoundary fallback={<b>fallback</b>}><i>chart</i></ChartBoundary>)).toContain('chart')
  })
  it('renders the fallback once failed', () => {
    const b = new ChartBoundary({ fallback: <b>fallback</b>, children: <i>chart</i> })
    b.state = { failed: true }
    expect(renderToString(b.render() as never)).toContain('fallback')
  })
})
