import { useT } from '../lib/i18n'

export default function UnverifiedBadge() {
  const t = useT()
  return (
    <span className="badge" title={t('unverifiedTitle')}>
      {t('unverified')}
    </span>
  )
}
