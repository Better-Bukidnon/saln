import { Link } from 'react-router'
import portalConfig from '../../../portal.config'
import { useT } from '../../lib/i18n'
import ContactMenu from '../ContactMenu'
import Disclaimer from '../Disclaimer'

const REPO_URL = portalConfig.repoUrl

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

const heading = 'mb-5 type-footer-heading text-white/65'
const link =
  'inline-flex min-h-11 items-center rounded type-footer-text text-white/80 transition-colors hover:text-white hover:underline lg:min-h-6'
const social =
  'inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/10 text-white/80 transition-all hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white motion-reduce:hover:translate-y-0 lg:h-10 lg:w-10'
const pill =
  'inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-4 py-2 type-footer-text text-white/80 transition-colors hover:bg-white/10 hover:text-white'
const credit = 'rounded type-meta text-white/85 underline underline-offset-2 hover:text-white'
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function Footer() {
  const t = useT()
  return (
    <footer className="mt-12 bg-linear-to-b from-ink to-ink-deep text-white sm:mt-16">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 pt-10 text-center sm:grid-cols-2 sm:gap-10 sm:text-left lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12 lg:pb-10 lg:pt-[60px]">
          <section className="flex flex-col items-center sm:col-span-2 sm:items-start lg:col-span-1 lg:max-w-xs" data-testid="footer-brand">
            <img src="/logo-white.svg" alt={t('logoAlt')} className="mb-4 h-14 w-auto" />
            <p className="mb-6 max-w-sm type-body-sm text-white/70">{t('footerTagline')}</p>
            <div className="flex gap-3">
              <a className={social} href={REPO_URL} {...ext} aria-label={t('footerGithubLabel')}>
                <GithubIcon />
              </a>
              <ContactMenu className={social} ariaLabel={t('footerEmailLabel')} openUp>
                <MailIcon />
              </ContactMenu>
            </div>
          </section>
          <section data-testid="footer-quick" className="flex flex-col items-center sm:items-start">
            <h2 className={heading}>{t('footerQuickLinks')}</h2>
            <ul>
              <li><Link className={link} to="/">{t('navHome')}</Link></li>
              <li><Link className={link} to="/about">{t('navAbout')}</Link></li>
              <li><a className={link} href={portalConfig.ombudsmanRequestUrl} {...ext}>{t('footerRequestSaln')}</a></li>
              <li><a className={link} href={portalConfig.submitUrl} {...ext}>{t('footerSubmit')}</a></li>
              <li><a className={link} href={portalConfig.mainSiteUrl} {...ext}>{t('footerMainSite')}</a></li>
            </ul>
          </section>
          <section data-testid="footer-resources" className="flex flex-col items-center sm:items-start">
            <h2 className={heading}>{t('footerResources')}</h2>
            <ul>
              <li><a className={link} href={portalConfig.openHalalanUrl} {...ext}>{t('footerOpenHalalan')}</a></li>
              <li><a className={link} href={portalConfig.betterGovSalnUrl} {...ext}>{t('footerBetterGovSaln')}</a></li>
              <li><a className={link} href={portalConfig.designCreditUrl} {...ext}>{t('footerDesignLink')}</a></li>
              <li><a className={link} href={portalConfig.ombudsmanUrl} {...ext}>{t('footerOmbudsman')}</a></li>
              <li><a className={link} href={portalConfig.openDataUrl} {...ext}>{t('footerOpenData')}</a></li>
              <li><a className={link} href={portalConfig.foiUrl} {...ext}>{t('footerFoi')}</a></li>
            </ul>
          </section>
          <section data-testid="footer-contribute" className="flex flex-col items-center gap-3 sm:items-start">
            <p className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5 type-badge text-white/80">
              {t('footerCostPrefix')} <span className="font-bold text-success-light">{'₱'}0</span>
            </p>
            <ContactMenu className={pill} openUp>
              <MailIcon />
              {t('footerVolunteer')}
            </ContactMenu>
            <a className={pill} href={REPO_URL} {...ext}>
              <GithubIcon />
              {t('footerContribute')}
            </a>
            <a href={portalConfig.betterGovUrl} {...ext} className="mt-1 inline-flex rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100">
              <img src="/bettergov-footer.svg" alt={t('footerPartnerAlt')} width={120} height={28} className="block h-[54px] w-auto" loading="lazy" />
            </a>
          </section>
        </div>
        <div className="flex flex-col items-center gap-x-4 gap-y-2 py-6 text-center type-footer-text text-white/70 lg:flex-row lg:items-center lg:text-left" data-testid="footer-bottom">
          <div className="flex flex-col items-center gap-x-3 gap-y-1 lg:flex-row lg:flex-wrap">
            <span className="text-white/80">{t('footerCopyright', { year: new Date().getFullYear() })}</span>
            <span>{t('footerLicense')}</span>
            <Disclaimer textClass="text-white/70" size="type-footer-text" />
          </div>
          <span data-testid="footer-version" className="lg:ml-auto lg:whitespace-nowrap">{t('footerVersion', { v: __APP_VERSION__ })}</span>
        </div>
        <p className="pb-6 text-center type-badge text-white/65 lg:text-left">
          {t('footerBuiltBy')}{' '}
          <a className={credit} href={portalConfig.mainSiteUrl} {...ext}>BetterBukidnon</a>
          {' '}&middot;{' '}
          <a className={credit} href={portalConfig.betterGovUrl} {...ext}>BetterGov.ph</a>
          {' '}&middot; {t('footerDesignBy')}{' '}
          <a className={credit} href={portalConfig.designCreditUrl} {...ext}>{t('footerDesignLink')}</a>
        </p>
      </div>
    </footer>
  )
}
