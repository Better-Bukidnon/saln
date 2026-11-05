import { Effect } from '@animate-ui/react/primitives/effects/effect'
import type { ReactNode } from 'react'
import HelpBanner from '../components/HelpBanner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useDocTitle, useT } from '../lib/i18n'
import portalConfig from '../../portal.config'

const h3 = 'mb-3 type-section-title text-gray-900'
const h4 = 'mb-1 type-group-title text-gray-900'
const body = 'type-body text-gray-800'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} role="region">
      <h3 id={id} className={h3}>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

const LEGAL = ['constitution', 'ra6713', 'ra3019', 'eo2'] as const

export default function AboutPage() {
  const t = useT()
  useDocTitle('title.about')
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <Effect asChild fade blur={{ initialBlur: 8, blur: 0 }} slide={{ direction: 'up', offset: 28 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
<section className="overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-700 text-white shadow-md">
        <div className="px-4 py-6 text-center sm:px-6 sm:py-8">
          <h2 data-testid="about-hero-title" className="mb-3 type-page-title sm:mb-4">
            {t('aboutHeading')}
          </h2>
          <p className="mx-auto mb-5 max-w-2xl type-lead text-white">{t('aboutBody')}</p>
          <p className="inline-block rounded-lg border border-white/30 bg-white/10 px-4 py-2 type-meta text-accent-300">
            {portalConfig.hashtags}
          </p>
        </div>
      </section>
</Effect>

      <HelpBanner />

      <Section id="about-what" title={t('aboutWhatTitle')}>
        {[1, 2].map((n) => (
          <p key={n} className={body}>
            {t(`aboutWhat.${n}`)}
          </p>
        ))}
      </Section>

      <Section id="about-mission" title={t('aboutMissionTitle')}>
        <p className={body}>{t('aboutMissionIntro')}</p>
        <ul className={`list-disc space-y-2 pl-5 ${body}`}>
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`aboutMission.${n}`)}</li>
          ))}
        </ul>
      </Section>

      <Section id="about-data" title={t('aboutDataTitle')}>
        <div data-testid="about-important" className="rounded-lg border-2 border-accent-700 bg-accent-50 p-4">
          <p className="mb-1 inline-block rounded-full bg-accent-700 px-2.5 py-0.5 type-badge uppercase tracking-wide text-white">
            {t('aboutImportant')}
          </p>
          <p className="type-body text-gray-900">{t('aboutDataBody')}</p>
        </div>
        <h4 className={h4}>{t('aboutSources')}</h4>
        <ul className={`list-disc space-y-2 pl-5 ${body}`}>
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`aboutSourcesList.${n}`)}</li>
          ))}
        </ul>
        <h4 className={`${h4} pt-2`}>{t('aboutVerification')}</h4>
        {[1, 2].map((n) => (
          <p key={n} className={body}>
            {t(`aboutVerificationBody.${n}`)}
          </p>
        ))}
        <p className={body}>{t('aboutSubmitBody')}</p>
        <Button href={portalConfig.submitUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutSubmitLink')}
        </Button>
      </Section>

      <Section id="about-request" title={t('aboutRequest')}>
        {[1, 2].map((n) => (
          <p key={n} className={body}>
            {t(`aboutRequestBody.${n}`)}
          </p>
        ))}
        <Button href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
          {t('aboutRequestLink')}
        </Button>
      </Section>

      <Section id="about-legal" title={t('aboutLegalTitle')}>
        <p className={body}>{t('aboutLegalIntro')}</p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {LEGAL.map((k) => (
            <div key={k} className="rounded-lg bg-gray-50 p-4">
              <h4 className={h4}>{t(`aboutLegal.${k}.title`)}</h4>
              <p className="type-body-sm text-gray-800">{t(`aboutLegal.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="about-support" title={t('aboutSupportTitle')}>
        <p className={body}>{t('aboutSupportBody')}</p>
        <p className={body}>
          {t('aboutSupportTags')}:{' '}
          <strong className="text-primary-700">{portalConfig.hashtags} #TransparencyPH</strong>
        </p>
      </Section>
    </div>
  )
}
