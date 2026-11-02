import { Link, useParams } from 'react-router'
import { loadAll } from '../lib/data'
import strings from '../lib/strings'

const data = loadAll()

// Placeholder: Task 6 builds the full detail page.
export default function OfficialPage() {
  const { id } = useParams()
  const o = data.officials.find((x) => x.id === id)
  return (
    <>
      <h2>{o ? o.name : strings.notFound}</h2>
      {o && <p>{o.position}</p>}
      <p>{strings.officialPlaceholder}</p>
      <Link to="/">{strings.back}</Link>
    </>
  )
}
