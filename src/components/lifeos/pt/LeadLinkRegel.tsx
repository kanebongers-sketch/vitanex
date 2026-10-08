'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { leadRegel } from '@/lib/lifeos/leads/leads'
import type { PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { pinActie } from './PinGoedkeuren'

// Per PT'er: hoe het met de leads staat, de lead-link (kopiëren) en de stand
// van de pincode. Goedkeuren gebeurt bovenaan de kaart (PinGoedkeuren).

const PIN_TEKST = { geen: 'nog geen pincode gekozen', wacht: 'pincode wacht op jou', actief: 'pincode actief' } as const

export function LeadLinkRegel({ pt, onVernieuw }: { pt: PtStatus; onVernieuw: () => Promise<void> }) {
  const link = pt.extra?.leadLink
  const [gekopieerd, setGekopieerd] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  if (!link) return null
  const pad = `/lead/${link.code}`

  async function kopieer() {
    const url = `${window.location.origin}${pad}`
    try {
      await navigator.clipboard.writeText(url)
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 1800)
    } catch {
      setMelding(`Kopiëren lukte niet. De link: ${url}`)
    }
  }

  async function reset() {
    if (!window.confirm(`Pincode van ${pt.naam} resetten? ${pt.naam} wordt overal uitgelogd en kiest daarna een nieuwe.`)) return
    const f = await pinActie(pt.id, 'resetten')
    if (f) setMelding(f)
    else await onVernieuw()
  }

  return (
    <div style={{ display: 'grid', gap: 3, marginTop: 4 }}>
      {pt.extra?.leads ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Leads:</span> {leadRegel(pt.extra.leads)}
        </p>
      ) : null}
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-4)' }}>
        <button type="button" onClick={() => void kopieer()} aria-label={`Lead-link van ${pt.naam} kopiëren`} style={linkKnop}>
          {gekopieerd ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
          {gekopieerd ? 'Gekopieerd' : pad}
        </button>
        · {PIN_TEKST[link.pinStatus]}
        {link.pinStatus === 'actief' ? (
          <button type="button" onClick={() => void reset()} style={{ ...linkKnop, color: 'var(--text-4)' }}>resetten</button>
        ) : null}
      </p>
      {melding ? <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{melding}</p> : null}
    </div>
  )
}

const linkKnop: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--brand)',
  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
}
