'use client'

import { useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'

// Eén-tik-bevestigingen op de PT-kaart ("zet op actief", "voeg toe", "verbeter
// titel"). Doet de schrijf(s), zegt eerlijk wat misging, en laat de kaart daarna
// opnieuw laden zodat het voorstel verdwijnt. Eén actie tegelijk.

export interface Schrijf {
  pad: string
  methode: 'POST' | 'PATCH'
  body: Record<string, unknown>
}

export interface Bevestig {
  /** De sleutel van de actie die nu loopt, of null. */
  bezig: string | null
  fout: string | null
  voerUit: (sleutel: string, schrijven: readonly Schrijf[]) => Promise<void>
}

export function useBevestig(onKlaar: () => Promise<void>): Bevestig {
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  async function voerUit(sleutel: string, schrijven: readonly Schrijf[]) {
    if (bezig !== null) return
    setBezig(sleutel)
    setFout(null)
    for (const s of schrijven) {
      const uitkomst = await haalJson(s.pad, leesNiets, { method: s.methode, body: JSON.stringify(s.body) })
      if (!uitkomst.ok) {
        setBezig(null)
        setFout(uitkomst.fout)
        // Een deel kan al gelukt zijn (bv. 1 van 2 afspraken hernoemd): herlaad dan toch.
        await onKlaar()
        return
      }
    }
    setBezig(null)
    await onKlaar()
  }

  return { bezig, fout, voerUit }
}
