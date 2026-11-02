import { Link } from 'react-router'
import { Card } from '../components/ui/Card'
import { useDocTitle, useT } from '../lib/i18n'

export default function NotFoundPage() {
  const t = useT()
  useDocTitle('title.notFound')
  return (
    <Card data-testid="not-found-page">
      <h2 className="type-section-title text-gray-900">{t('notFoundPage.title')}</h2>
      <p className="mt-2 type-body text-gray-700">{t('notFoundPage.body')}</p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-lg type-button text-primary-600 underline underline-offset-2 hover:text-primary-800"
      >
        {t('notFoundPage.home')}
      </Link>
    </Card>
  )
}
