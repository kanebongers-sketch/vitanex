'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { WACHTRIJ_SLEUTEL, leesWachtrij, naPoging, uitkomstVan, voegToe, wachttijd, zonder, type WachtendVerzoek } from '@/lib/club/app/wachtrij'
import { stuur } from '../verzoek'
import { useOnline } from './toestel'

// Afgeronde trainingen die nog niet bij de server zijn. Staan op het toestel
// (localStorage) en gaan vanzelf de deur uit zodra er verbinding is, ook na
// het herstarten van de app. Een verzoek tegelijk, in volgorde.

const SEIN = 'club-training-wachtrij'

function abonneer(melden: () => void): () => void {
  const opslag = (e: StorageEvent) => e.key === WACHTRIJ_SLEUTEL && melden()
  window.addEventListener(SEIN, melden)
  window.addEventListener('storage', opslag)
  return () => {
    window.removeEventListener(SEIN, melden)
    window.removeEventListener('storage', opslag)
  }
}

function leesRuw(): string | null {
  try {
    return window.localStorage.getItem(WACHTRIJ_SLEUTEL)
  } catch {
    return null
  }
}

/** Schrijft de rij weg. Lukt dat niet (opslag vol of uit), dan `false`. */
function schrijf(rij: readonly WachtendVerzoek[]): boolean {
  try {
    if (rij.length === 0) window.localStorage.removeItem(WACHTRIJ_SLEUTEL)
    else window.localStorage.setItem(WACHTRIJ_SLEUTEL, JSON.stringify(rij))
    window.dispatchEvent(new Event(SEIN))
    return true
  } catch {
    return false
  }
}

export interface Wachtrij {
  aantal: number
  online: boolean
  /** Een training die de server weigerde (niet opnieuw te proberen). */
  fout: string | null
  /** Zet een training klaar om te versturen. `false`: kon niet op het toestel worden bewaard. */
  zetErin: (v: Omit<WachtendVerzoek, 'id' | 'pogingen' | 'gemaakt'>) => boolean
  sluitFout: () => void
}

export function useWachtrij(onVerstuurd: () => void): Wachtrij {
  const ruw = useSyncExternalStore(abonneer, leesRuw, () => null)
  const [nu] = useState(() => Date.now())
  const rij = useMemo(() => leesWachtrij(ruw, nu), [ruw, nu])
  const online = useOnline()
  const [fout, setFout] = useState<string | null>(null)
  const bezig = useRef(false)
  const [poging, setPoging] = useState(0)

  useEffect(() => {
    const eerste = rij[0]
    if (!eerste || !online || bezig.current) return
    const wacht = eerste.pogingen === 0 ? 0 : wachttijd(eerste.pogingen - 1)
    const klok = window.setTimeout(async () => {
      bezig.current = true
      const r = await stuur(eerste.url, 'POST', eerste.body)
      bezig.current = false
      const huidig = leesWachtrij(leesRuw(), Date.now())
      const uitkomst = uitkomstVan(r.ok, r.ok ? 200 : r.status)
      if (uitkomst === 'opnieuw') schrijf(naPoging(huidig, eerste.id))
      else schrijf(zonder(huidig, eerste.id))
      if (uitkomst === 'verstuurd') onVerstuurd()
      if (!r.ok && uitkomst === 'geweigerd') setFout(`${eerste.omschrijving} kon niet worden opgeslagen: ${r.fout}`)
      setPoging((p) => p + 1)
    }, wacht)
    return () => window.clearTimeout(klok)
  }, [rij, online, poging, onVerstuurd])

  const zetErin = useCallback((v: Omit<WachtendVerzoek, 'id' | 'pogingen' | 'gemaakt'>) => {
    const gemaakt = Date.now()
    const id = `${gemaakt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    return schrijf(voegToe(leesWachtrij(leesRuw(), gemaakt), { ...v, id, gemaakt, pogingen: 0 }))
  }, [])

  const sluitFout = useCallback(() => setFout(null), [])
  return { aantal: rij.length, online, fout, zetErin, sluitFout }
}
