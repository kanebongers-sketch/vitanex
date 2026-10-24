'use client'

import { useState } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TESTBETALING } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { kiesMeldingen } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// Rondt de testbetaling af en gaat door naar de welkomstpagina. Dubbel klikken
// kan geen kwaad: de server richt de sportschool precies een keer in.

export function TestbetaalKnop({ sessie }: { sessie: string }) {
  const taal = useTaal()
  const t = TESTBETALING[taal]
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function rondAf() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/aiyourgym/testbetaling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessie }) })
      const json = (await res.json().catch(() => null)) as { url?: unknown } | null
      if (res.ok && typeof json?.url === 'string' && json.url.startsWith('/')) {
        window.location.assign(json.url)
        return
      }
      setFout(kiesMeldingen(json, taal).fout ?? t.mislukt)
    } catch {
      setFout(t.geenVerbinding)
    }
    setBezig(false)
  }

  return (
    <div className="aan-test-actie">
      <button type="button" className="ayg-knop ayg-knop--accent" onClick={() => void rondAf()} disabled={bezig} aria-busy={bezig}>
        {bezig ? (
          <>
            {t.bezig} <LoaderCircle size={18} aria-hidden="true" className="aan-draai" />
          </>
        ) : (
          <>
            {t.starten} <ArrowRight size={18} aria-hidden="true" />
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
