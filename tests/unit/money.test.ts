import { describe, expect, it } from 'vitest'
import { formatPeso, netWorthMatches } from '../../src/lib/money'

describe('formatPeso', () => {
  it('formats long', () => expect(formatPeso(24957188.98)).toBe('₱24,957,188.98'))
  it('formats short M', () => expect(formatPeso(24957188.98, true)).toBe('₱24.96M'))
  it('formats negative short', () => expect(formatPeso(-1500000, true)).toBe('-₱1.50M'))
  it('formats zero', () => expect(formatPeso(0)).toBe('₱0.00'))
  it('short under 1000 uses long', () => expect(formatPeso(999.5, true)).toBe('₱999.50'))
  it('short K and B', () => {
    expect(formatPeso(12345, true)).toBe('₱12.35K')
    expect(formatPeso(2500000000, true)).toBe('₱2.50B')
  })
  it('promotes at unit boundaries', () => {
    expect(formatPeso(999999.999, true)).toBe('₱1.00M')
    expect(formatPeso(999995, true)).toBe('₱1.00M')
    expect(formatPeso(999994.99, true)).toBe('₱999.99K')
    expect(formatPeso(999999999.99, true)).toBe('₱1.00B')
  })
  it('exact thresholds', () => {
    expect(formatPeso(1000, true)).toBe('₱1.00K')
    expect(formatPeso(1e6, true)).toBe('₱1.00M')
    expect(formatPeso(1e9, true)).toBe('₱1.00B')
    expect(formatPeso(0, true)).toBe('₱0.00')
  })
  it('sign comes from rounded value', () => {
    expect(formatPeso(-0.001)).toBe('₱0.00')
    expect(formatPeso(-999999.999, true)).toBe('-₱1.00M')
  })
  it('negative long', () => expect(formatPeso(-1234.5)).toBe('-₱1,234.50'))
})

describe('netWorthMatches', () => {
  it('matches', () =>
    expect(netWorthMatches({ totalAssets: 16366487.45, totalLiabilities: 6507000, netWorth: 9859487.45 })).toBe(true))
  it('off by 0.01', () =>
    expect(netWorthMatches({ totalAssets: 16366487.45, totalLiabilities: 6507000, netWorth: 9859487.46 })).toBe(false))
  it('allows negative', () =>
    expect(netWorthMatches({ totalAssets: 100, totalLiabilities: 250.5, netWorth: -150.5 })).toBe(true))
})
