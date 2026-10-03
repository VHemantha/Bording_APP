import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AuthModalProvider } from './context/AuthModalContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthModalProvider>
          <LanguageProvider>
            {/* Scroll/entrance animations are skipped for people who ask their OS for less motion. */}
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
          </LanguageProvider>
        </AuthModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
