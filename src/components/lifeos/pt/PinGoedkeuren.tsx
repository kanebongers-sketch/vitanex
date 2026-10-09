'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import type { PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import type { PinActie } from '@/lib/lifeos/leads/leads'

// PT'ers die op hun lead-pagina een pincode kozen: die werkt pas na jouw
// goedkeuring. Keur alleen goed als de PT'er bevestigt dat die 'm zelf koos —
// anders kan iemand die /lead/<naam> raadt als eerste een pin zetten.

const MOMENT = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Pin-actie naar de server; geeft een foutmelding terug of null. */
export async function pinActie(persoonId: string, actie: PinActie): Promise<string | null> {
  const uit = await haalJson('/api/lifeos/leads/pin', leesNiets, { method: 'POST', body: JSON.stringify({ persoonId, actie }) })
  return uit.ok ? null : uit.fout
}

export function PinGoedkeuren({ pts, onVernieuw }: { pts: PtStatus[]; onVernieuw: () => Promise<void> }) {
  const wachtend = pts.filter((p) => p.extra?.leadLink?.pinStatus === 'wacht')
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  if (wachtend.length === 0) return null

  async function doe(persoonId: string, actie: PinActie) {
    setBezig(persoonId)
    setFout(null)
    const f = await pinActie(persoonId, actie)
    setBezig(null)
    if (f) setFout(f)
    else await onVernieuw()
  }

  return (
    <div style={{ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid color-mix(in srgb, var(--brand) 35%, var(--line))', background: 'color-mix(in srgb, var(--brand) 6%, transparent)' }}>
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand)' }}>
        <KeyRound size={14} strokeWidth={2.2} aria-hidden />
        Pincode goedkeuren · {wachtend.length}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45 }}>
        Keur alleen goed als de PT&apos;er je dezelfde controlecode noemt: dan koos die de pincode echt zelf.
      </p>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {wachtend.map((p) => (
          <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-1)' }}>
              <strong style={{ fontWeight: 600 }}>{p.naam}</strong>
              {p.extra?.leadLink?.controle ? (
                <span style={{ color: 'var(--text-2)' }}> · controlecode <strong style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em' }}>{p.extra.leadLink.controle}</strong></span>
              ) : null}
              {p.extra?.leadLink?.pinAangevraagdOp ? (
                <span style={{ color: 'var(--text-3)' }}> · gekozen {MOMENT.format(new Date(p.extra.leadLink.pinAangevraagdOp))}</span>
              ) : null}
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <Knop variant="primair" disabled={bezig !== null} onClick={() => void doe(p.id, 'goedkeuren')}>Goedkeuren</Knop>
              <Knop disabled={bezig !== null} onClick={() => void doe(p.id, 'afwijzen')}>Afwijzen</Knop>
            </span>
          </li>
        ))}
      </ul>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </div>
  )
}
