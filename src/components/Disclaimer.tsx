import { useT } from '../lib/i18n'

export default function Disclaimer() {
  const t = useT()
  return (
    <p className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-700" role="note">
      {t('disclaimer')}
    </p>
  )
}
