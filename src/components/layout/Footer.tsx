import { Link } from 'react-router'
import portalConfig from '../../../portal.config'
import { useT } from '../../lib/i18n'
import Disclaimer from '../Disclaimer'

const REPO_URL = 'https://github.com/Better-Bukidnon/saln'
const VOLUNTEER_MAIL = 'mailto:volunteer@betterbukidnon.org'

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const GithubIcon = () => (
  <svg {...svg}>
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </svg>
)
const MailIcon = () => (
  <svg {...svg}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

const heading = 'mb-3 text-[0.8125rem] font-semibold uppercase tracking-wide text-white/75'
const link =
  'inline-flex min-h-11 items-center rounded text-sm text-white/85 transition-colors hover:text-white hover:underline lg:min-h-8'
const social =
  'inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-primary-500 hover:text-white'
const pill =
  'inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm text-white/90 transition-colors hover:bg-white/20 hover:text-white'
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function Footer() {
  const t = useT()
  return (
    <footer className="mt-12 bg-linear-to-b from-[#1a1a1a] to-[#111111] text-white sm:mt-16">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 py-10 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12 lg:py-14">
          <section className="sm:col-span-2 lg:col-span-1" data-testid="footer-brand">
            <img src="/logo-white.svg" alt={t('logoAlt')} className="mb-4 h-14 w-auto" />
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/80">{t('footerTagline')}</p>
            <div className="flex gap-3">
              <a className={social} href={REPO_URL} {...ext} aria-label={t('footerGithubLabel')}>
                <GithubIcon />
              </a>
              <a className={social} href={VOLUNTEER_MAIL} aria-label={t('footerEmailLabel')}>
                <MailIcon />
              </a>
            </div>
          </section>
          <section data-testid="footer-quick">
            <h2 className={heading}>{t('footerQuickLinks')}</h2>
            <ul>
              <li><Link className={link} to="/">{t('navHome')}</Link></li>
              <li><Link className={link} to="/about">{t('navAbout')}</Link></li>
              <li><a className={link} href={portalConfig.mainSiteUrl} {...ext}>{t('footerMainSite')}</a></li>
              <li><a className={link} href={portalConfig.ombudsmanRequestUrl} {...ext}>{t('footerRequestSaln')}</a></li>
            </ul>
          </section>
          <section data-testid="footer-resources">
            <h2 className={heading}>{t('footerResources')}</h2>
            <ul>
              <li><a className={link} href="https://robertrleung.github.io/OpenHalalan/" {...ext}>{t('footerOpenHalalan')}</a></li>
              <li><a className={link} href="https://saln.bettergov.ph/" {...ext}>{t('footerBetterGovSaln')}</a></li>
              <li><a className={link} href="https://github.com/JHNLWHD/saln-tracker-ph" {...ext}>{t('footerDesignLink')}</a></li>
              <li><a className={link} href="https://www.ombudsman.gov.ph/" {...ext}>{t('footerOmbudsman')}</a></li>
            </ul>
          </section>
          <section data-testid="footer-contribute" className="flex flex-col items-start gap-3">
            <p className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5 text-xs text-white/90">
              {t('footerCostPrefix')} <span className="font-bold text-[#2fd9ad]">{'₱'}0</span>
            </p>
            <a className={pill} href={VOLUNTEER_MAIL}>
              <MailIcon />
              {t('footerVolunteer')}
            </a>
            <a className={pill} href={REPO_URL} {...ext}>
              <GithubIcon />
              {t('footerContribute')}
            </a>
            <a href="https://bettergov.ph" {...ext} className="mt-1 inline-flex rounded opacity-90 transition-opacity hover:opacity-100">
              <img src="/bettergov-footer.svg" alt={t('footerPartnerAlt')} className="h-16 w-auto" loading="lazy" />
            </a>
          </section>
        </div>
        <div className="space-y-3 py-6 text-[0.8125rem] text-white/75">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-white/85">{t('footerCopyright', { year: new Date().getFullYear() })}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{t('footerLicense')}</span>
          </div>
          <Disclaimer />
          <p>
            {t('footerBuiltBy')}{' '}
            <a className="rounded font-medium text-white underline underline-offset-2" href={portalConfig.mainSiteUrl} {...ext}>BetterBukidnon</a>
            {' '}&middot;{' '}
            <a className="rounded font-medium text-white underline underline-offset-2" href="https://bettergov.ph/" {...ext}>BetterGov.ph</a>
            {' '}&middot; {t('footerDesignBy')}{' '}
            <a className="rounded font-medium text-white underline underline-offset-2" href="https://github.com/JHNLWHD/saln-tracker-ph" {...ext}>{t('footerDesignLink')}</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
