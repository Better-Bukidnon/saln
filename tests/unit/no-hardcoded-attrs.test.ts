import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..', '..', 'src')
const files = [
  join(root, 'App.tsx'),
  ...['pages', 'components', 'components/layout', 'components/ui'].flatMap((d) =>
    readdirSync(join(root, d)).filter((f) => f.endsWith('.tsx')).map((f) => join(root, d, f)),
  ),
]
// aria-label="x", title='x', placeholder="x", alt="x": a string literal, not {expression}
const literal = /\b(aria-label|aria-description|title|placeholder|alt)\s*=\s*(["'])/g

describe('no hard-coded accessible text', () => {
  it.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8')
    const hits = [...src.matchAll(literal)].map((m) => m[0])
    expect(hits).toEqual([])
  })
})
