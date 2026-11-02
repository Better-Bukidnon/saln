import type { ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useT } from '../lib/i18n'
import portalConfig from '../../portal.config'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
      <div className="space-y-3 text-gray-800">{children}</div>
    </Card>
  )
}

export default function AboutPage() {
  const t = useT()
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <Card className="border-2 border-primary-200 bg-primary-50 motion-safe:animate-fade-in">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t('aboutHeading')}</h2>
        <p className="text-gray-800">{t('aboutBody')}</p>
      </Card>
      <Section title={t('aboutSources')}>
        <ul className="list-disc space-y-2 pl-5">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`aboutSourcesList.${n}`)}</li>
          ))}
        </ul>
      </Section>
      <Section title={t('aboutVerification')}>
        {[1, 2].map((n) => (
          <p key={n}>{t(`aboutVerificationBody.${n}`)}</p>
        ))}
      </Section>
      <Section title={t('aboutRequest')}>
        <p>{t('aboutRequestBody')}</p>
        <Button href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutRequestLink')}
        </Button>
      </Section>
      <Section title={t('aboutSubmit')}>
        <p>{t('aboutSubmitBody')}</p>
        <Button href={portalConfig.submitUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutSubmitLink')}
        </Button>
      </Section>
    </div>
  )
}
