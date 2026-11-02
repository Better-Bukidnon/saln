import strings from '../lib/strings'
import portalConfig from '../../portal.config'

export default function AboutPage() {
  return (
    <>
      <h2>{strings.aboutHeading}</h2>
      <p>{strings.aboutBody}</p>
      <h3>{strings.aboutSources}</h3>
      <ul>
        {strings.aboutSourcesList.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <h3>{strings.aboutVerification}</h3>
      {strings.aboutVerificationBody.map((s) => (
        <p key={s}>{s}</p>
      ))}
      <h3>{strings.aboutRequest}</h3>
      <p>{strings.aboutRequestBody}</p>
      <p>
        <a href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
          {strings.aboutRequestLink}
        </a>
      </p>
      <h3>{strings.aboutSubmit}</h3>
      <p>{strings.aboutSubmitBody}</p>
      <p>
        <a href={portalConfig.submitUrl} target="_blank" rel="noopener noreferrer">
          {strings.aboutSubmitLink}
        </a>
      </p>
    </>
  )
}
