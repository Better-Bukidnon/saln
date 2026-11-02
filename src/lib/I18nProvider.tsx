import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext, applyLang, readStoredLang, writeStoredLang } from './i18n'
import type { Lang } from './i18n'

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang())
  useEffect(() => applyLang(lang), [lang])
  const setLang = (l: Lang) => {
    writeStoredLang(l)
    setLangState(l)
  }
  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>
}
