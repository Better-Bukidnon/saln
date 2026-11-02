import { useT } from '../lib/i18n'

export default function Disclaimer({ textClass = 'text-gray-700', size = 'type-body-sm' }: { textClass?: string; size?: string }) {
  const t = useT()
  return (
    <p className={`${size} ${textClass}`} role="note">
      {t('disclaimer')}
    </p>
  )
}
