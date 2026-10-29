'use client'

// De gedeelde staat van een takenpagina: wie er afvinkt (onthouden op dit
// apparaat), alle vinkjes van de week en het wisselen van een vakje.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Persoon } from '@/lib/club/taken/invoer'
import type { Afvinking } from '@/lib/club/taken/typen'
import { usePersoon } from './usePersoon'
import { useVinkjes } from './useVinkjes'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

export interface MedewerkerKeuze {
  id: string
  naam: string
}

interface AfvinkStaat {
  vestiging: string
  vandaag: string
  medewerkers: MedewerkerKeuze[]
  persoon: Persoon | null
  kiesPersoon: (p: Persoon | null) => void
  afvinkingen: Afvinking[]
  vak: (taakId: string, datum: string) => Afvinking | null
  isBezig: (taakId: string, datum: string) => boolean
  /** Wissel een vakje; `label` staat voor de taak in een eventuele foutmelding. */
  wissel: (taakId: string, datum: string, label: string) => void
  fout: string | null
  meld: (fout: string | null) => void
}

const Ctx = createContext<AfvinkStaat | null>(null)

/** Het id van de keuze "wie vinkt af", om er de focus op te zetten. */
export const PERSOON_VELD_ID = 'club-taken-persoon'

interface ProviderProps {
  vestiging: string
  vandaag: string
  medewerkers: MedewerkerKeuze[]
  begin: Afvinking[]
  children: ReactNode
}

export function AfvinkProvider({ vestiging, vandaag, medewerkers, begin, children }: ProviderProps) {
  const [persoon, kiesPersoon] = usePersoon(vestiging)
  const vinkjes = useVinkjes(begin)
  const [fout, setFout] = useState<string | null>(null)
  const t = useTekst(TAKEN)
  const { wissel: wisselVak } = vinkjes

  const wissel = useCallback(
    (taakId: string, datum: string, label: string) => {
      setFout(null)
      void wisselVak(taakId, datum, persoon).then((uit) => {
        if (uit === 'geen-persoon') {
          setFout(t.fout.kiesPersoon)
          document.getElementById(PERSOON_VELD_ID)?.focus()
        } else if (uit) setFout(`${label}: ${uit}`)
      })
    },
    [wisselVak, persoon, t],
  )

  const waarde = useMemo<AfvinkStaat>(
    () => ({
      vestiging,
      vandaag,
      medewerkers,
      persoon,
      kiesPersoon,
      afvinkingen: vinkjes.lijst,
      vak: vinkjes.vak,
      isBezig: vinkjes.isBezig,
      wissel,
      fout,
      meld: setFout,
    }),
    [vestiging, vandaag, medewerkers, persoon, kiesPersoon, vinkjes.lijst, vinkjes.vak, vinkjes.isBezig, wissel, fout],
  )
  return <Ctx.Provider value={waarde}>{children}</Ctx.Provider>
}

export function useAfvinken(): AfvinkStaat {
  const staat = useContext(Ctx)
  if (!staat) throw new Error('useAfvinken buiten AfvinkProvider')
  return staat
}
