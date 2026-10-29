'use client'

// Vinkjes van de week met optimistisch wisselen. Een tik zet het vinkje meteen;
// lukt het opslaan niet, dan gaat het terug en komt er een melding. Komt de
// server met nieuwe gegevens (verversen), dan worden die leidend.

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { Persoon } from '@/lib/club/taken/invoer'
import type { Afvinking } from '@/lib/club/taken/typen'
import { afvinkIndex, vakSleutel } from '@/lib/club/taken/voortgang'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { alsAfvinking, vraag } from './vraag'

type ZetLijst = Dispatch<SetStateAction<Afvinking[]>>

/** Vinkje weghalen; mislukt = terugzetten. Geeft een foutmelding of null. */
async function haalWeg(huidig: Afvinking, setLijst: ZetLijst, taal: Taal): Promise<string | null> {
  setLijst((l) => l.filter((a) => a.id !== huidig.id))
  const r = await vraag(`/api/club/taken/afvinken?taak=${encodeURIComponent(huidig.taakId)}&datum=${huidig.datum}`, 'DELETE', undefined, taal)
  if (r.ok) return null
  setLijst((l) => [...l, huidig])
  return r.fout
}

/** Vinkje zetten; eerst tijdelijk, dan het echte uit de API. Geeft een foutmelding of null. */
async function zet(taakId: string, datum: string, wie: Persoon, setLijst: ZetLijst, taal: Taal): Promise<string | null> {
  const tijdelijk: Afvinking = { id: `nieuw-${taakId}-${datum}`, taakId, datum, afgevinktOp: new Date().toISOString(), medewerkerId: wie.medewerkerId, wie: wie.wie, notitie: null }
  setLijst((l) => [...l, tijdelijk])
  const r = await vraag('/api/club/taken/afvinken', 'POST', { taakId, datum, medewerkerId: wie.medewerkerId, wie: wie.wie }, taal)
  const echt = r.ok ? alsAfvinking(r.data) : null
  setLijst((l) => {
    const zonder = l.filter((a) => a.id !== tijdelijk.id)
    return echt ? [...zonder.filter((a) => a.id !== echt.id), echt] : zonder
  })
  if (echt) return null
  return r.ok ? TAKEN[taal].fout.opslaan : r.fout
}

export interface Vinkjes {
  lijst: Afvinking[]
  vak: (taakId: string, datum: string) => Afvinking | null
  isBezig: (taakId: string, datum: string) => boolean
  /** Wissel een vakje. Geeft een foutmelding, 'geen-persoon' of null. */
  wissel: (taakId: string, datum: string, persoon: Persoon | null) => Promise<string | null>
}

export function useVinkjes(begin: Afvinking[]): Vinkjes {
  const [lijst, setLijst] = useState(begin)
  const taal = useTaal()
  const [vorigeBegin, setVorigeBegin] = useState(begin)
  const [bezig, setBezig] = useState<ReadonlySet<string>>(() => new Set())
  if (begin !== vorigeBegin) {
    setVorigeBegin(begin)
    setLijst(begin)
  }
  const index = useMemo(() => afvinkIndex(lijst), [lijst])
  const vak = useCallback((taakId: string, datum: string) => index.get(vakSleutel(taakId, datum)) ?? null, [index])
  const isBezig = useCallback((taakId: string, datum: string) => bezig.has(vakSleutel(taakId, datum)), [bezig])

  const wissel = useCallback(
    async (taakId: string, datum: string, persoon: Persoon | null) => {
      const k = vakSleutel(taakId, datum)
      if (bezig.has(k)) return null
      const huidig = index.get(k) ?? null
      if (!huidig && !persoon) return 'geen-persoon'
      setBezig((oud) => new Set(oud).add(k))
      const fout = huidig ? await haalWeg(huidig, setLijst, taal) : persoon ? await zet(taakId, datum, persoon, setLijst, taal) : null
      setBezig((oud) => new Set([...oud].filter((x) => x !== k)))
      return fout
    },
    [bezig, index, taal],
  )
  return { lijst, vak, isBezig, wissel }
}
