import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import SchoolSelectionProvider from './components/compare/SchoolSelectionProvider'
import ReferenceLabelsProvider from './i18n/ReferenceLabelsProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReferenceLabelsProvider>
      <SchoolSelectionProvider>
        <App />
      </SchoolSelectionProvider>
    </ReferenceLabelsProvider>
  </StrictMode>,
)
