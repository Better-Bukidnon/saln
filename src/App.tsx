import { Link, Route, Routes } from 'react-router'
import Disclaimer from './components/Disclaimer'
import AboutPage from './pages/AboutPage'
import OfficialPage from './pages/OfficialPage'
import OfficialsPage from './pages/OfficialsPage'
import portalConfig from '../portal.config'
import strings from './lib/strings'
import './styles.css'

export default function App() {
  return (
    <>
      <a className="skip" href="#main">{strings.skipToContent}</a>
      <header className="site-header">
        <h1>
          {strings.siteTitle}: {portalConfig.provinceName}
        </h1>
        <nav aria-label="Main">
          <Link to="/">{strings.navOfficials}</Link>
          <Link to="/about">{strings.navAbout}</Link>
        </nav>
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
