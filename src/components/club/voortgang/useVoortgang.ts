'use client'

// Staat en acties van de Voortgangskaart: toevoegen, wijzigen en verwijderen
// via /api/club/voortgang. Elk antwoord bevat de verse voortgang van het lid.

import { useState } from 'react'
import { isVoortgangData, type VoortgangData } from '@/lib/club/voortgang/model'

export type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

type Antwoord = { ok: true; voortgang: VoortgangData } | { ok: false; fout: string }

async function stuur(pad: string, methode: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(`/api/club/voortgang${pad}`, {
      method: methode,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const json: unknown = await res.json().catch(() => null)
    const data = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {}
    if (!res.ok) return { ok: false, fout: typeof data.fout === 'string' ? data.fout : 'Er ging iets mis. Probeer het opnieuw.' }
    return isVoortgangData(data.voortgang) ? { ok: true, voortgang: data.voortgang } : { ok: false, fout: 'Opgeslagen, maar het overzicht kon niet worden ververst. Ververs de pagina.' }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer opnieuw.' }
  }
}

export function useVoortgang(begin: VoortgangData) {
  const [voortgang, setVoortgang] = useState(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)

  async function voer(pad: string, methode: 'POST' | 'PATCH' | 'DELETE', body: unknown, okTekst: string): Promise<boolean> {
    setBezig(true)
    setMelding(null)
    const uit = await stuur(pad, methode, body)
    setBezig(false)
    if (!uit.ok) {
      setMelding({ soort: 'fout', tekst: uit.fout })
      return false
    }
    setVoortgang(uit.voortgang)
    setMelding({ soort: 'ok', tekst: okTekst })
    return true
  }

  return {
    voortgang,
    bezig,
    melding,
    voegToe: (velden: Record<string, unknown>) => voer('', 'POST', { ...velden, lidId: voortgang.lidId }, 'Meting opgeslagen.'),
    wijzig: (id: string, velden: Record<string, unknown>) => voer(`/${encodeURIComponent(id)}`, 'PATCH', velden, 'Meting gewijzigd.'),
    verwijder: (id: string) => voer(`/${encodeURIComponent(id)}`, 'DELETE', undefined, 'Meting verwijderd.'),
  }
}
