'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/auth/auth-fetch'

// LifeOS is Kane's persoonlijke systeem — het hoort niet zichtbaar te zijn voor
// een medewerker van een klantbedrijf die per ongeluk op /lifeos belandt. Deze
// poort vraagt de server (via dezelfde founder-gate als de data-routes) of je
// erin mag. Zo niet → terug naar /home.
//
// De echte beveiliging zit server-side: élke /api/lifeos-route 403't een
// niet-founder. Deze poort is de nette UX ervoor — geen muur van foutmeldingen,
// maar een dichte deur.

type Staat = 'controleren' | 'toegang' | 'geweigerd'

export function FounderPoort({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [staat, setStaat] = useState<Staat>('controleren')

  useEffect(() => {
    let actief = true
    authFetch('/api/lifeos/toegang')
      .then((res) => {
        if (!actief) return
        if (res.ok) setStaat('toegang')
        else {
          setStaat('geweigerd')
          router.replace('/home')
        }
      })
      .catch(() => {
        if (!actief) return
        // Een netwerkfout is geen toestemming. Bij twijfel: dicht.
        setStaat('geweigerd')
        router.replace('/home')
      })
    return () => {
      actief = false
    }
  }, [router])

  if (staat !== 'toegang') {
    return <div style={{ minHeight: '60vh' }} aria-hidden="true" />
  }
  return <>{children}</>
}
