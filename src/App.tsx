import { Route, Routes } from 'react-router'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'
import AboutPage from './pages/AboutPage'
import OfficialPage from './pages/OfficialPage'
import OfficialsPage from './pages/OfficialsPage'
import { useT } from './lib/i18n'

export default function App() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-primary-600"
        href="#main"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="main" className="container mx-auto flex-1 px-3 py-4 sm:px-4 sm:py-8 lg:px-8">
        <Routes>
          <Route path="/" element={<OfficialsPage />} />
          <Route path="/official/:id" element={<OfficialPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<OfficialsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
