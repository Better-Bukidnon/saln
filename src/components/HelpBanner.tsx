import { Link } from 'react-router'
import { Effect } from '@animate-ui/react/primitives/effects/effect'
import ContactMenu from './ContactMenu'
import portalConfig from '../../portal.config'
import { useT } from '../lib/i18n'

const base =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 py-2.5 type-button-pill transition-colors lg:w-auto'
const solid = `${base} bg-white text-primary-500 shadow-sm hover:bg-primary-50`
const tint = `${base} bg-white/15 text-white hover:bg-white/25`
const ghost = `${base} text-white underline-offset-4 hover:underline`

// Call-to-action banner (shown on the list and About pages), laid out like the SALN Tracker PH one.
export default function HelpBanner() {
  const t = useT()
  return (
    <Effect asChild fade slide={{ direction: 'up', offset: 24 }} inView inViewOnce>
    <section
      aria-labelledby="help-banner-title"
      className="on-dark rounded-lg bg-linear-to-br from-primary-500 to-primary-700 p-5 text-white shadow-md sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-8"
    >
      <div className="min-w-0 space-y-2">
        <h3 id="help-banner-title" className="type-card-title">
          {t('bannerTitle')}
        </h3>
        <p className="max-w-3xl type-body-sm">{t('bannerBody')}</p>
        <p className="inline-block rounded-md border border-white/30 bg-white/10 px-2.5 py-1 type-badge text-accent-300">
          {portalConfig.hashtags}
        </p>
        <p className="type-body-sm">
          {t('bannerOmbudsman')}{' '}
          <a className="rounded underline" href={portalConfig.ombudsmanRequestUrl} target="_blank" rel="noopener noreferrer">
            {portalConfig.ombudsmanRequestUrl}
          </a>
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3 lg:mt-0 lg:shrink-0 lg:flex-row lg:items-center">
        <a className={solid} href={portalConfig.submitUrl} target="_blank" rel="noopener noreferrer">
          {t('bannerSubmit')}
        </a>
        <ContactMenu className={`${tint} w-full`}>{t('bannerContact')}</ContactMenu>
        <Link className={ghost} to="/about">
          {t('bannerLearn')}
        </Link>
      </div>
    </section>
    </Effect>
  )
}
