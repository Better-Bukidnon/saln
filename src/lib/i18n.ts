import { createContext, useContext } from 'react'
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

export function applyLang(
  lang: Lang,
  doc: { documentElement: { lang: string }; title: string } = document,
): void {
  doc.documentElement.lang = lang
  doc.title = translate(lang, 'docTitle')
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void }
export const I18nContext = createContext<Ctx>({ lang: 'en', setLang: () => {} })

export const useLang = () => useContext(I18nContext)

export function useT(): TFn {
  const { lang } = useContext(I18nContext)
  return (key, params) => translate(lang, key, params)
}
