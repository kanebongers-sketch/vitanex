'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'

// Opent het Stripe Customer Portal (facturen, betaalgegevens, opzeggen). De
// server maakt de sessie; wij sturen de browser alleen naar de url van Stripe.

function urlUit(json: unknown): string | null {
  const url = (json as { url?: unknown } | null)?.url
  return typeof url === 'string' && url.startsWith('https://') ? url : null
}

function foutUit(json: unknown, standaard: string): string {
  const fout = (json as { fout?: unknown } | null)?.fout
  return typeof fout === 'string' ? fout : standaard
}

export function PortaalKnop() {
  const [bezig, setBezig] = useState(false)
  const t = useTekst(PLATFORM).portaal
  const [fout, setFout] = useState<string | null>(null)

  async function open() {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/aiyourgym/portaal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const json: unknown = await res.json().catch(() => null)
      const url = res.ok ? urlUit(json) : null
      if (url) {
        window.location.assign(url)
        return
      }
      setFout(foutUit(json, t.fout))
    } catch {
      setFout(t.geenVerbinding)
    }
    setBezig(false)
  }

  return (
    <div className="club-abo-actie">
      <button type="button" className="club-knop club-knop--primair club-knop--groot" onClick={open} disabled={bezig} aria-busy={bezig}>
        {bezig ? t.bezig : t.knop}
        {!bezig && <ExternalLink size={18} aria-hidden />}
      </button>
      <p className="club-hint">{t.uitleg}</p>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}
