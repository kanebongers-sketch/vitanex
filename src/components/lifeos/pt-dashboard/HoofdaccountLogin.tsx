'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/auth/auth-fetch'

// De ingang van de beheerder (Kane): geen pincode, maar zijn MentaForce-
// hoofdaccount. Is hij ingelogd, dan zet de server een sessie en ververst de
// pagina vanzelf. Zo niet, dan eerst inloggen op mentaforce.nl.

type Staat = 'bezig' | 'niet_ingelogd' | 'fout'

export function HoofdaccountLogin() {
  const router = useRouter()
  const [staat, setStaat] = useState<Staat>('bezig')

  useEffect(() => {
    let actief = true
    authFetch('/api/lifeos/pt-app/sessie', { method: 'POST' })
      .then((res) => {
        if (!actief) return
        if (res.ok) router.refresh()
        else setStaat(res.status === 401 || res.status === 403 ? 'niet_ingelogd' : 'fout')
      })
      .catch(() => actief && setStaat('fout'))
    return () => {
      actief = false
    }
  }, [router])

  return (
    <section className="ptd-form ptd-sectie" aria-live="polite">
      <h2>Inloggen met je hoofdaccount</h2>
      {staat === 'bezig' ? (
        <p className="ptd-hint">Even je account controleren…</p>
      ) : staat === 'niet_ingelogd' ? (
        <>
          <p className="ptd-hint">Log eerst in op MentaForce met je hoofdaccount; daarna open je de PT-app vanuit het menu.</p>
          <Link className="ptd-knop ptd-knop--primair" href="/login">Naar inloggen</Link>
        </>
      ) : (
        <p role="alert" className="ptd-hint">Inloggen lukte niet. Vernieuw de pagina en probeer het opnieuw.</p>
      )}
    </section>
  )
}
