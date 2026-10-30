'use client'

import { useEffect, useRef, useState } from 'react'
import { leesTellers, moetVerversen, type Tellers } from '@/lib/club/menu/tellers'

// De tellers in het menu ophalen (GET /api/club/menu/tellers): bij openen, bij
// een andere vestiging, bij een andere pagina en bij terugkomen naar het
// tabblad, maar hoogstens eens per VERS_MS (tellers.ts). Een ander onderdeel
// kan na een wijziging (taak afgevinkt, lead gebeld) meteen laten verversen
// met verversTellers(). Een fout laat de laatste tellers staan; zonder tellers
// staat er gewoon niets.

const VERVERS = 'club:tellers'

/** Vraag de balk de tellers nu opnieuw op te halen. */
export function verversTellers(): void {
  window.dispatchEvent(new Event(VERVERS))
}

export function useTellers(vestiging: string | null, pad: string, aan: boolean): Tellers {
  const [tellers, setTellers] = useState<{ vestiging: string; tellers: Tellers } | null>(null)
  const vorige = useRef<{ vestiging: string; op: number } | null>(null)

  useEffect(() => {
    if (!aan || !vestiging) return
    let stop: AbortController | null = null
    const haal = async (dwingend: boolean) => {
      if (document.visibilityState === 'hidden' || !moetVerversen(vorige.current, vestiging, Date.now(), dwingend)) return
      stop?.abort()
      const nu = new AbortController()
      stop = nu
      try {
        const res = await fetch(`/api/club/menu/tellers?v=${encodeURIComponent(vestiging)}`, { signal: nu.signal, cache: 'no-store' })
        if (!res.ok) return
        // Pas na een antwoord onthouden: een afgebroken vraag (andere pagina) telt niet als vers.
        vorige.current = { vestiging, op: Date.now() }
        setTellers({ vestiging, tellers: leesTellers(await res.json().catch(() => null)) })
      } catch (fout) {
        // Afgebroken (nieuwe vraag) of geen verbinding: de vorige tellers blijven staan.
        if (!nu.signal.aborted) console.warn('[club-menu] tellers ophalen mislukt', fout instanceof Error ? fout.message : fout)
      }
    }
    void haal(false)
    const opZicht = () => void haal(false)
    const opVraag = () => void haal(true)
    document.addEventListener('visibilitychange', opZicht)
    window.addEventListener(VERVERS, opVraag)
    return () => {
      stop?.abort()
      document.removeEventListener('visibilitychange', opZicht)
      window.removeEventListener(VERVERS, opVraag)
    }
  }, [aan, vestiging, pad])

  // Tellers van een andere vestiging tonen we nooit, ook niet even.
  return tellers && tellers.vestiging === vestiging ? tellers.tellers : {}
}
