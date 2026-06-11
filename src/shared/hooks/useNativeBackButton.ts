import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useNativeBackButton(): void {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    const listener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname !== '/login' && window.history.length > 1) {
        navigate(-1)
        return
      }

      void CapacitorApp.exitApp()
    })

    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [location.pathname, navigate])
}
