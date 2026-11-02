import { useT } from '../lib/i18n'
import portalConfig from '../../portal.config'

export default function AboutPage() {
  const t = useT()
  return (
    <>
      <h2>{t('aboutHeading')}</h2>
      <p>{t('aboutBody')}</p>
      <h3>{t('aboutSources')}</h3>
      <ul>
        {[1, 2, 3, 4].map((n) => (
          <li key={n}>{t(`aboutSourcesList.${n}`)}</li>
        ))}
      </ul>
      <h3>{t('aboutVerification')}</h3>
      {[1, 2].map((n) => (
        <p key={n}>{t(`aboutVerificationBody.${n}`)}</p>
      ))}
      <h3>{t('aboutRequest')}</h3>
      <p>{t('aboutRequestBody')}</p>
      <p>
        <a href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutRequestLink')}
        </a>
      </p>
      <h3>{t('aboutSubmit')}</h3>
      <p>{t('aboutSubmitBody')}</p>
      <p>
        <a href={portalConfig.submitUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutSubmitLink')}
        </a>
      </p>
    </>
  )
}
