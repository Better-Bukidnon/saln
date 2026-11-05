import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import '@fontsource-variable/figtree'
import './styles/index.css'
import App from './App'
import I18nProvider from './lib/I18nProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </MotionConfig>
  </StrictMode>,
)
