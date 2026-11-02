import { Link, NavLink } from 'react-router'
import portalConfig from '../../../portal.config'
import { useT } from '../../lib/i18n'
import LanguageSwitcher from '../LanguageSwitcher'

const navLink =
  'inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 aria-[current=page]:font-semibold aria-[current=page]:text-primary-600 sm:px-3'

export default function Header() {
  const t = useT()
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <Link to="/" className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80 sm:gap-3">
            <img src="/logo.svg" alt={t('logoAlt')} className="h-9 w-auto shrink-0 sm:h-11" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-xl">{t('siteTitle')}</h1>
              <p className="hidden text-xs text-gray-600 sm:block">{portalConfig.provinceName}</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-4">
            <nav aria-label={t('navMain')} className="flex items-center">
              <NavLink to="/" end className={navLink}>
                {t('navHome')}
              </NavLink>
              <NavLink to="/about" className={navLink}>
                {t('navAbout')}
              </NavLink>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
