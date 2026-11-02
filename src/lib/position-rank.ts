import type { Official } from './types'

// One table for "who outranks whom" on every list. Lower = higher position.
// Governor, vice governor, House representatives (by district), elected board members, the ex-officio
// board seats, mayor, vice mayor, councilors, barangay captain. Acting / OIC holders rank as the post.
const RANKS = {
  governor: 10,
  viceGovernor: 20,
  representative: 30, // + district number (1..9), so 31..39
  boardMember: 40,
  pcl: 51,
  abc: 52,
  sk: 53,
  ipmr: 54,
  mayor: 60,
  viceMayor: 70,
  councilor: 80,
  barangayCaptain: 90,
} as const

/** Rank given to a position nobody has classified; tests and validate-data forbid it appearing in data. */
export const UNRANKED = 999

const ACTING = /^(?:(?:acting|oic|officer[- ]in[- ]charge)\s+)/i

/** Rank of a position string, or null when it is not one we know. */
export function rankOfPosition(position: string): number | null {
  const p = position.trim().replace(ACTING, '').trim()
  const rep = /^representative,?\s+(\d)(?:st|nd|rd|th)\s+district$/i.exec(p)
  if (rep) return RANKS.representative + Number(rep[1])
  if (/^governor$/i.test(p)) return RANKS.governor
  if (/^vice[ -]governor$/i.test(p)) return RANKS.viceGovernor
  if (/^(?:sangguniang panlalawigan |board )member$/i.test(p)) return RANKS.boardMember
  if (/\(PCL\) president$/i.test(p)) return RANKS.pcl
  if (/\(ABC\) president$/i.test(p)) return RANKS.abc
  if (/^SK provincial federation president$/i.test(p)) return RANKS.sk
  if (/\(IPMR\)$/i.test(p)) return RANKS.ipmr
  if (/^(?:city |municipal )?mayor$/i.test(p)) return RANKS.mayor
  if (/^(?:city |municipal )?vice[ -]mayor$/i.test(p)) return RANKS.viceMayor
  if (/^(?:councilor|(?:sangguniang (?:bayan|panlungsod)(?:\/panlungsod)? )member)$/i.test(p)) return RANKS.councilor
  if (/^(?:barangay captain|punong barangay)$/i.test(p)) return RANKS.barangayCaptain
  return null
}

/** Rank of an official's post; UNRANKED for an unknown position (never silently equal to a known one). */
export function positionRank(o: Pick<Official, 'position'>): number {
  return rankOfPosition(o.position) ?? UNRANKED
}
