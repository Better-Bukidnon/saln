import { LANGS, LANG_NAMES, useLang, useT } from '../lib/i18n'
import { Button } from './ui/Button'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const t = useT()
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={t('language')}>
      {LANGS.map((l) => (
        <Button
          key={l}
          lang={l}
          size="sm"
          variant={l === lang ? 'primary' : 'ghost'}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
        >
          {LANG_NAMES[l]}
        </Button>
      ))}
    </div>
  )
}
