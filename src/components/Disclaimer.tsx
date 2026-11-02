import { useT } from '../lib/i18n'

export default function Disclaimer() {
  const t = useT()
  return (
    <p className="text-sm text-white/80" role="note">
      {t('disclaimer')}
    </p>
  )
}
