import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const files = walk('src').filter((f) => /\.tsx?$/.test(f))

describe('type scale guard', () => {
  it('components use the type-* tokens, not raw text-size classes or arbitrary px/rem sizes', () => {
    const bad: string[] = []
    const raw = /(?<![\w-])(?:[a-z]+:)*text-(?:\[[^\]]+\]|xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(raw)) bad.push(`${f}: ${m[0]}`)
    }
    expect(bad).toEqual([])
  })
  it('the token file defines every role used', () => {
    const css = readFileSync('src/styles/index.css', 'utf8')
    const defined = new Set([...css.matchAll(/@utility (type-[\w-]+)/g)].map((m) => m[1]))
    const used = new Set<string>()
    for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/(?<![\w-])(type-[a-z-]+)/g)) used.add(m[1])
    for (const u of used) expect(defined.has(u), u).toBe(true)
  })
})
