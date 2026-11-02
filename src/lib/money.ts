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
  const abs = Math.abs(amount)
  const cents = Math.round(abs * 100)
  const neg = amount < 0 && cents > 0
  let body: string
  if (short && abs >= 1000) {
    const units: [number, string][] = [
      [1e3, 'K'],
      [1e6, 'M'],
      [1e9, 'B'],
    ]
    let i = 0
    while (i < units.length - 1 && abs >= units[i + 1][0]) i++
    let scaled = Math.round((abs / units[i][0]) * 100) / 100
    // rounding may reach 1000 of the current unit: promote to the next one
    if (scaled >= 1000 && i < units.length - 1) {
      i++
      scaled = Math.round((abs / units[i][0]) * 100) / 100
    }
    body = `₱${scaled.toFixed(2)}${units[i][1]}`
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
