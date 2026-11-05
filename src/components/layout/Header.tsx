import { Link, NavLink } from 'react-router'
import { Highlight } from '@animate-ui/react/primitives/effects/highlight'
import { useT } from '../../lib/i18n'
import LanguageSwitcher from '../LanguageSwitcher'

const navLink =
  'inline-flex min-h-11 items-center rounded-full px-3 type-nav text-gray-700 transition-colors hover:text-ink aria-[current=page]:bg-primary-50 aria-[current=page]:font-bold aria-[current=page]:text-primary-600 sm:px-4'

export default function Header() {
  const t = useT()
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 sm:py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80 sm:gap-4">
            <img src="/logo.svg" alt={t('logoAlt')} className="h-9 w-auto shrink-0 sm:h-12" />
            <div className="min-w-0">
              <h1 className="truncate type-header-title text-gray-900">{t('siteTitle')}</h1>
              <p className="truncate type-nav text-gray-600">{t('headerSubtitle')}</p>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-x-2 sm:gap-x-4">
            <nav aria-label={t('navMain')} className="flex items-center">
              <Highlight hover click={false} className="rounded-full bg-gray-100">
                <NavLink to="/" end className={navLink} data-value="home">
                  {t('navHome')}
                </NavLink>
                <NavLink to="/about" className={navLink} data-value="about">
                  {t('navAbout')}
                </NavLink>
              </Highlight>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
