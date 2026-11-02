import strings from '../lib/strings'

export default function UnverifiedBadge() {
  return (
    <span className="badge" title={strings.unverifiedTitle}>
      {strings.unverified}
    </span>
  )
}
