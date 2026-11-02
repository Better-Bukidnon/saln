import { Link, Route, Routes } from 'react-router'
import Disclaimer from './components/Disclaimer'
import AboutPage from './pages/AboutPage'
import OfficialPage from './pages/OfficialPage'
import OfficialsPage from './pages/OfficialsPage'
import portalConfig from '../portal.config'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useT } from './lib/i18n'
import './styles.css'

export default function App() {
  const t = useT()
  return (
    <>
      <a className="skip" href="#main">{t('skipToContent')}</a>
      <header className="site-header">
        <h1>
          {t('siteTitle')}: {portalConfig.provinceName}
        </h1>
        <nav aria-label="Main">
          <Link to="/">{t('navOfficials')}</Link>
          <Link to="/about">{t('navAbout')}</Link>
        </nav>
        <LanguageSwitcher />
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<OfficialsPage />} />
          <Route path="/official/:id" element={<OfficialPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<OfficialsPage />} />
        </Routes>
      </main>
      <footer>
        <Disclaimer />
      </footer>
    </>
  )
}
