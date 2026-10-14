'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/club/leads/model'
import type { Doe } from './usePaneel'

interface VerlorenBlokProps {
  lead: Lead
  bezig: boolean
  doe: Doe
  onKlaar: () => void
}

const REDENEN = ['Te duur', 'Andere sportschool', 'Geen tijd', 'Niet bereikbaar', 'Geen interesse meer', 'Verhuisd']

// Verloren kan alleen met een reden: daar leren we van (welke bron, welk bezwaar).
export function VerlorenBlok({ lead, bezig, doe, onKlaar }: VerlorenBlokProps) {
  const [reden, setReden] = useState('')
  return (
    <form
      className="club-leads-stapblok"
      onSubmit={async (e) => {
        e.preventDefault()
        const uit = await doe(`/api/club/leads/${lead.id}`, 'PATCH', { status: 'verloren', verlorenReden: reden })
        if (uit.ok) onKlaar()
      }}
    >
      <div className="club-acties" role="group" aria-label="Veelvoorkomende redenen">
        {REDENEN.map((r) => (
          <button key={r} type="button" className="club-knop club-knop--klein" aria-pressed={reden === r} onClick={() => setReden(r)}>
            {r}
          </button>
        ))}
      </div>
      <label className="club-veld">
        <span>Reden (verplicht)</span>
        <input className="club-invoer" required maxLength={200} value={reden} onChange={(e) => setReden(e.target.value)} />
      </label>
      <button type="submit" className="club-knop club-knop--gevaar" disabled={bezig || reden.trim() === ''}>
        Zet op verloren
      </button>
    </form>
  )
}
