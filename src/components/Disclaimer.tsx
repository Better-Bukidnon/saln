import portalConfig from '../../portal.config'

export default function Disclaimer() {
  return (
    <p className="disclaimer" role="note">
      {portalConfig.disclaimer}
    </p>
  )
}
