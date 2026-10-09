'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authFetch } from '@/lib/auth/auth-fetch'

// LifeOS is Kane's persoonlijke systeem — het hoort niet zichtbaar te zijn voor
// een medewerker van een klantbedrijf die per ongeluk op /lifeos belandt. Deze
// poort vraagt de server (via dezelfde founder-gate als de data-routes) of je
// erin mag. Zo niet → inloggen, of terug naar de startpagina.
//
// De echte beveiliging zit server-side: élke /api/lifeos-route 403't een
// niet-founder. Deze poort is de nette UX ervoor — geen muur van foutmeldingen,
// maar een dichte deur.

type Staat = 'controleren' | 'toegang' | 'geweigerd'

export function FounderPoort({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [staat, setStaat] = useState<Staat>('controleren')

  const pad = usePathname()

  useEffect(() => {
    let actief = true
    authFetch('/api/lifeos/toegang')
      .then((res) => {
        if (!actief) return
        if (res.ok) setStaat('toegang')
        else {
          setStaat('geweigerd')
          // Niet ingelogd → eerst inloggen en dan terug; wel ingelogd maar niet
          // Kane → naar de startpagina van het domein.
          router.replace(res.status === 401 ? `/login?next=${encodeURIComponent(pad)}` : '/')
        }
      })
      .catch(() => {
        if (!actief) return
        // Een netwerkfout is geen toestemming. Bij twijfel: dicht.
        setStaat('geweigerd')
        router.replace('/')
      })
    return () => {
      actief = false
    }
  }, [router, pad])

  if (staat !== 'toegang') {
    return <div style={{ minHeight: '60vh' }} aria-hidden="true" />
  }
  return <>{children}</>
}
