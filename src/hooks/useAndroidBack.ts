'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ROOT_ROUTES = ['/home', '/hr', '/admin', '/login']

export function useAndroidBack() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cleanup: (() => void) | null = null

    async function init() {
      try {
        // Dynamic import — graceful fallback in browser
        const { App } = await import('@capacitor/app')
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else if (ROOT_ROUTES.some(r => pathname.startsWith(r))) {
            // At a root route — minimize instead of exit
            App.minimizeApp()
          } else {
            router.push('/home')
          }
        })
        cleanup = () => handle.remove()
      } catch {
        // Not in Capacitor context (browser) — do nothing
      }
    }

    init()
    return () => { cleanup?.() }
  }, [router, pathname])
}
