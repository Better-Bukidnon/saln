import { useT } from '../lib/i18n'

export default function Disclaimer({ textClass = 'text-gray-700' }: { textClass?: string }) {
  const t = useT()
  return (
    <p className={`text-sm ${textClass}`} role="note">
      {t('disclaimer')}
    </p>
  )
}
