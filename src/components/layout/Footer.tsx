import portalConfig from '../../../portal.config'
import { useT } from '../../lib/i18n'
import Disclaimer from '../Disclaimer'

const link =
  'rounded font-medium text-primary-600 underline underline-offset-2 hover:text-primary-800'

export default function Footer() {
  const t = useT()
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white sm:mt-16">
      <div className="h-1 bg-flag-gradient" aria-hidden="true" />
      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt={''} className="h-9 w-auto shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900 sm:text-base">
              {t('siteTitle')}: {portalConfig.provinceName}
            </p>
            <p className="text-xs text-gray-600 sm:text-sm">{t('footerTagline')}</p>
          </div>
        </div>
        <Disclaimer />
        <div className="mt-4 space-y-1 text-xs text-gray-600 sm:text-sm">
          <p>
            {t('footerBuiltBy')}{' '}
            <a className={link} href={portalConfig.mainSiteUrl} target="_blank" rel="noopener noreferrer">
              BetterBukidnon
            </a>{' '}
            &middot;{' '}
            <a className={link} href="https://bettergov.ph/" target="_blank" rel="noopener noreferrer">
              BetterGov.ph
            </a>
          </p>
          <p>
            {t('footerDesignBy')}{' '}
            <a
              className={link}
              href="https://github.com/JHNLWHD/saln-tracker-ph"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('footerDesignLink')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
