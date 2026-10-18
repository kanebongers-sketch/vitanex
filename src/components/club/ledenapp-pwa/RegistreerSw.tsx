'use client'

import { useEffect } from 'react'

// Registreert de service worker van de ledenapp (public/club-app/sw.js) voor
// /mijn. Alleen in productie en op https: lokaal zou een cache oude code laten
// zien. Rendert niets.

export const SW_PAD = '/club-app/sw.js'
export const SW_SCOPE = '/mijn'

export function RegistreerSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (window.location.protocol !== 'https:' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register(SW_PAD, { scope: SW_SCOPE, updateViaCache: 'none' })
      .catch((fout: unknown) => console.error('[club-app] service worker registreren mislukt', fout instanceof Error ? fout.message : fout))
  }, [])
  return null
}
