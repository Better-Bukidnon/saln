import { describe, expect, it } from 'vitest'
import { LANGS, applyLang, readStoredLang, strings, translate, writeStoredLang } from '../../src/lib/i18n'
import type { Lang } from '../../src/lib/i18n'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
const others: Lang[] = ['fil', 'ceb']

describe('dictionaries', () => {
  it('has exactly en, fil, ceb', () => {
    expect([...LANGS].sort()).toEqual(['ceb', 'en', 'fil'])
    expect(Object.keys(strings).sort()).toEqual(['ceb', 'en', 'fil'])
  })
  it.each(others)('every en key exists in %s and vice versa', (lang) => {
    expect(Object.keys(strings[lang]).sort()).toEqual(Object.keys(strings.en).sort())
  })
  it.each(LANGS)('%s has no empty values', (lang) => {
    for (const [k, v] of Object.entries(strings[lang])) expect(v.trim(), `${lang}.${k}`).not.toBe('')
  })
  it.each(others)('placeholders match en for every key in %s', (lang) => {
    for (const [k, v] of Object.entries(strings.en)) {
      expect(placeholders(strings[lang][k]), `${lang}.${k}`).toEqual(placeholders(v))
    }
  })
  it('keeps the English strings the e2e suite relies on', () => {
    expect(strings.en.noSaln).toBe('No SALN data yet')
    expect(strings.en.disclaimer).toBe('Aggregator, not the original source; not an official government website.')
  })
  it('actually translates something (fil and ceb differ from en)', () => {
    expect(strings.ceb.noSaln).not.toBe(strings.en.noSaln)
    expect(strings.fil.noSaln).not.toBe(strings.en.noSaln)
  })
})

describe('translate', () => {
  it('substitutes {name} placeholders', () => {
    expect(translate('en', 'verifiedBy', { by: 'Ana', on: '2026-01-02' })).toBe('Verified by Ana on 2026-01-02')
    expect(translate('en', 'resultCount.other', { n: 5 })).toBe('5 officials')
  })
  it('falls back to en when a key is missing in the language', () => {
    const saved = strings.ceb.noSaln
    delete strings.ceb.noSaln
    try {
      expect(translate('ceb', 'noSaln')).toBe(strings.en.noSaln)
    } finally {
      strings.ceb.noSaln = saved
    }
  })
  it('falls back to the key when missing everywhere', () => {
    expect(translate('fil', 'no.such.key')).toBe('no.such.key')
  })
  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'verifiedBy', { by: 'Ana' })).toBe('Verified by Ana on {on}')
  })
})

describe('persistence', () => {
  const throwing = () => {
    throw new Error('storage disabled')
  }
  const memory = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  }
  it('defaults to en when nothing stored', () => {
    expect(readStoredLang(() => memory())).toBe('en')
  })
  it('round-trips a language', () => {
    const s = memory()
    writeStoredLang('ceb', () => s)
    expect(readStoredLang(() => s)).toBe('ceb')
  })
  it('ignores an invalid stored value', () => {
    const s = memory()
    s.setItem('saln-lang', 'xx')
    expect(readStoredLang(() => s)).toBe('en')
  })
  it('does not throw when getItem/setItem throw', () => {
    const bad = { getItem: throwing, setItem: throwing }
    expect(readStoredLang(() => bad)).toBe('en')
    expect(() => writeStoredLang('fil', () => bad)).not.toThrow()
  })
  it('does not throw when the storage accessor itself throws', () => {
    expect(readStoredLang(throwing)).toBe('en')
    expect(() => writeStoredLang('fil', throwing)).not.toThrow()
  })
})

describe('applyLang', () => {
  it.each(LANGS)('sets document.documentElement.lang to %s', (lang) => {
    const doc = { documentElement: { lang: '' } }
    applyLang(lang, doc)
    expect(doc.documentElement.lang).toBe(lang)
  })
})
