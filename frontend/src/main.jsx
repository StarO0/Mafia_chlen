import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SetupProvider } from './context/SetupContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <SetupProvider>
          <App />
        </SetupProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
