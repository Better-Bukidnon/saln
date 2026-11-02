import { useT } from '../lib/i18n'
import { Badge } from './ui/Badge'

export default function UnverifiedBadge() {
  const t = useT()
  return (
    <Badge variant="unverified" size="sm" data-testid="unverified-badge" title={t('unverifiedTitle')}>
      {t('unverified')}
    </Badge>
  )
}
