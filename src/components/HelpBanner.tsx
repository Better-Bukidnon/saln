import { Link } from 'react-router'
import portalConfig from '../../portal.config'
import { useT } from '../lib/i18n'

const HASHTAGS = '#OpenSALN #PublicSALNNow'
const base =
  'inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors lg:w-auto'
const solid = `${base} bg-white text-primary-500 shadow-sm hover:bg-primary-50`
const tint = `${base} bg-white/15 text-white hover:bg-white/25`
const ghost = `${base} text-white underline-offset-4 hover:underline`

// Call-to-action banner (list page only), laid out like the SALN Tracker PH one.
export default function HelpBanner() {
  const t = useT()
  return (
    <section
      aria-labelledby="help-banner-title"
      className="on-dark rounded-xl bg-linear-to-br from-primary-500 to-primary-700 p-5 text-white shadow-md sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-8"
    >
      <div className="min-w-0 space-y-2">
        <h3 id="help-banner-title" className="text-xl font-bold tracking-tight">
          {t('bannerTitle')}
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed sm:text-base">{t('bannerBody')}</p>
        <p className="inline-block rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-semibold text-accent-300">
          {HASHTAGS}
        </p>
        <p className="text-sm sm:text-base">
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
        <a className={tint} href="mailto:volunteer@betterbukidnon.org">
          {t('bannerContact')}
        </a>
        <Link className={ghost} to="/about">
          {t('bannerLearn')}
        </Link>
      </div>
    </section>
  )
}
