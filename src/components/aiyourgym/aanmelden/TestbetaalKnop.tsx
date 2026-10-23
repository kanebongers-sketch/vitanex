'use client'

import { useState } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'

// Rondt de testbetaling af en gaat door naar de welkomstpagina. Dubbel klikken
// kan geen kwaad: de server richt de sportschool precies een keer in.

export function TestbetaalKnop({ sessie }: { sessie: string }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function rondAf() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/aiyourgym/testbetaling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessie }) })
      const json = (await res.json().catch(() => null)) as { url?: unknown; fout?: unknown } | null
      if (res.ok && typeof json?.url === 'string' && json.url.startsWith('/')) {
        window.location.assign(json.url)
        return
      }
      setFout(typeof json?.fout === 'string' ? json.fout : 'Afronden lukte niet. Probeer het opnieuw.')
    } catch {
      setFout('Geen verbinding. Controleer je internet en probeer het opnieuw.')
    }
    setBezig(false)
  }

  return (
    <div className="aan-test-actie">
      <button type="button" className="ayg-knop ayg-knop--accent" onClick={() => void rondAf()} disabled={bezig} aria-busy={bezig}>
        {bezig ? (
          <>
            Je sportschool wordt klaargezet <LoaderCircle size={18} aria-hidden="true" className="aan-draai" />
          </>
        ) : (
          <>
            Proefperiode starten <ArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>
      {fout && (
        <p className="aan-melding" role="alert">
          {fout}
        </p>
      )}
    </div>
  )
}
