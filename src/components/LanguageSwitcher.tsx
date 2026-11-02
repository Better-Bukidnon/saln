import { LANGS, LANG_NAMES, useLang, useT } from '../lib/i18n'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const t = useT()
  return (
    <div className="lang-switch" role="group" aria-label={t('language')}>
      {LANGS.map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => setLang(l)}>
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  )
}
