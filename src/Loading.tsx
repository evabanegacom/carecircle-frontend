import { useEffect, useState } from 'react'
import { useApiRequestCount } from './apiActivity'

export function LoadingFallback({ label = 'Preparing your space', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return <div className={`loading-fallback${fullScreen ? ' loading-fallback-full' : ''}`} role="status" aria-live="polite">
    <span className="loading-emblem" aria-hidden="true"><span/><span/><span/></span>
    <span className="loading-fallback-copy"><strong>{label}</strong><small>Thoughtful support, just a moment away.</small></span>
  </div>
}

export function ApiActivityIndicator() {
  const activeRequests = useApiRequestCount()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (activeRequests === 0) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), 180)
    return () => window.clearTimeout(timer)
  }, [activeRequests > 0])

  if (!visible) return null

  return <div className="api-activity-indicator" role="status" aria-live="polite" aria-atomic="true">
    <span className="api-activity-spinner" aria-hidden="true"/>
    <span><strong>Just a moment</strong><small>Loading your care circle securely</small></span>
  </div>
}
