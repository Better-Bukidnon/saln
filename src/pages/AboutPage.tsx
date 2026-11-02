import strings from '../lib/strings'

export default function AboutPage() {
  return (
    <>
      <h2>{strings.aboutHeading}</h2>
      <p>{strings.aboutBody}</p>
    </>
  )
}
