import { describe, expect, it } from 'vitest'
import { safeHref } from '../../src/lib/url'

describe('safeHref', () => {
  it.each(['https://example.org/a?b=1', 'http://example.org/'])('allows %s', (u) =>
    expect(safeHref(u)).toBe(u),
  )
  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'not a url', '/relative', ''])(
    'rejects %j',
    (u) => expect(safeHref(u)).toBeNull(),
  )
})
