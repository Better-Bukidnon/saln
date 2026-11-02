import { createContext, useContext, useEffect } from 'react'
import { strings } from './strings'
import type { Lang } from './strings'

export { strings }
export type { Lang }

export const LANGS: Lang[] = ['en', 'fil', 'ceb']
export const LANG_NAMES: Record<Lang, string> = { en: 'English', fil: 'Filipino', ceb: 'Cebuano (Binisaya)' }
const STORAGE_KEY = 'saln-lang'

export type TFn = (key: string, params?: Record<string, string | number>) => string

const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as string[]).includes(v)

/** Look up `key` in `lang`, then `en`, then fall back to the key itself; fill {name} placeholders. */
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const raw = strings[lang]?.[key] ?? strings.en[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (Object.hasOwn(params, name) ? String(params[name]) : m))
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const browserStorage = (): StorageLike => window.localStorage

export function readStoredLang(getStorage: () => StorageLike = browserStorage): Lang {
  try {
    const v = getStorage().getItem(STORAGE_KEY)
    return isLang(v) ? v : 'en'
  } catch {
    return 'en'
  }
}

export function writeStoredLang(lang: Lang, getStorage: () => StorageLike = browserStorage): void {
  try {
    getStorage().setItem(STORAGE_KEY, lang)
  } catch {
    // storage disabled: the choice just lasts for this visit
  }
}

/** Mirror the language onto <html lang>. The document title is owned by each page (useDocTitle). */
export function applyLang(lang: Lang, doc: { documentElement: { lang: string } } = document): void {
  doc.documentElement.lang = lang
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void }
export const I18nContext = createContext<Ctx>({ lang: 'en', setLang: () => {} })

export const useLang = () => useContext(I18nContext)

export function useT(): TFn {
  const { lang } = useContext(I18nContext)
  return (key, params) => translate(lang, key, params)
}

/** Set document.title from a dictionary key (re-runs when the language or params change). */
export function useDocTitle(key: string, params?: Record<string, string | number>): void {
  const { lang } = useContext(I18nContext)
  const title = translate(lang, key, params)
  useEffect(() => {
    document.title = title
  }, [title])
}
