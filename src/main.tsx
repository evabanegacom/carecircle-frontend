import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LoadingFallback } from './Loading'
import './styles.css'

const App = lazy(() => import('./App'))

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><Suspense fallback={<LoadingFallback label="Opening HealthStories" fullScreen/>}><App /></Suspense></BrowserRouter></React.StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'))
}
