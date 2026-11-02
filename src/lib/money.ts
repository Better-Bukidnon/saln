import type { SalnRecord } from './types'

function group(intPart: string): string {
  let out = ''
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) out += ','
    out += intPart[i]
  }
  return out
}

function long(abs: number): string {
  const cents = Math.round(abs * 100)
  const whole = Math.floor(cents / 100)
  const frac = String(cents % 100).padStart(2, '0')
  return `₱${group(String(whole))}.${frac}`
}

export function formatPeso(amount: number, short = false): string {
  const neg = amount < 0
  const abs = Math.abs(amount)
  let body: string
  if (short && abs >= 1000) {
    const units: [number, string][] = [
      [1e9, 'B'],
      [1e6, 'M'],
      [1e3, 'K'],
    ]
    const [div, suffix] = units.find(([d]) => abs >= d)!
    body = `₱${(abs / div).toFixed(2)}${suffix}`
  } else {
    body = long(abs)
  }
  return neg ? `-${body}` : body
}

export function netWorthMatches(
  r: Pick<SalnRecord, 'totalAssets' | 'totalLiabilities' | 'netWorth'>,
): boolean {
  return (
    Math.round(r.netWorth * 100) ===
    Math.round(r.totalAssets * 100) - Math.round(r.totalLiabilities * 100)
  )
}
