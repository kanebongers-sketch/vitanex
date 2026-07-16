'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesSuggesties, type Suggestie } from '@/lib/lifeos/inbox/analyse'
import type { TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import { berichtenVoorAnalyse } from './suggestie-actie'

// ─── FUNCTIE 2 — het analyse-verzoek, één keer per geladen mail-set ──────────
// De inbox-kaart heeft de triage al opgehaald. Deze hook stuurt díé metadata —
// afzender + onderwerp, meer niet — naar `POST /api/lifeos/inbox/analyseer` en
// levert per mail de suggestie op. GEEN nieuwe Gmail-call: `berichtenVoorAnalyse`
// bouwt het verzoek uit wat de client al in handen had.
//
// De suggesties zijn een extraatje bovenop de mail-lijst: lukt de analyse niet,
// dan blijven de mails gewoon staan (met hun Gmail-link) en verschijnt er alleen
// geen knop. Daarom is 'fout' een aparte status en géén lege lijst — een lege
// map zou zeggen "geen enkele mail vraagt om een taak" terwijl we niet gekeken
// hebben. Fout ≠ leeg, ook hier.
//
// We zetten state ALLEEN in de `.then`-callback, nooit synchroon in de
// effect-body: dat is de vorm die React bedoelt (geen cascaderende renders) en
// dezelfde afweging als in `Top3Kaart`/`InboxKaart`. Een aparte "laden"-status
// voegt niets toe — de kaart toont geen spinner, de knoppen verschijnen gewoon
// zodra ze er zijn — dus die laten we weg.

export type AnalyseStatus = 'inactief' | 'klaar' | 'fout'

export interface SuggestiesResultaat {
  status: AnalyseStatus
  /** De suggestie voor één mail, of null als er (nog) geen bruikbare is. */
  suggestieVoor: (externId: string) => Suggestie | null
}

/** Stabiele lege map, zodat een render zonder suggesties geen nieuwe referentie maakt. */
const GEEN_SUGGESTIES: ReadonlyMap<string, Suggestie> = new Map()

export function useSuggesties(mails: readonly TriageMailJson[]): SuggestiesResultaat {
  const [status, setStatus] = useState<AnalyseStatus>('inactief')
  const [kaart, setKaart] = useState<ReadonlyMap<string, Suggestie>>(GEEN_SUGGESTIES)

  // Generatieteller: `mails` verandert bij elke (her)laadbeurt van de inbox.
  // Zonder deze teller kan een trage analyse van een vorige lading een verse
  // overschrijven. Zelfde patroon als `InboxKaart`/`Top3Kaart`.
  const generatie = useRef(0)

  // Eigen functie i.p.v. `generatie.current++` in de cleanup-body: exhaustive-deps
  // waarschuwt daar dat de ref "veranderd kan zijn" — een regel voor DOM-refs.
  // Deze vorm zegt wat het is: verklaar wat nu in de lucht is ongeldig.
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    // Geen post = niets te analyseren. Geen fetch, en geen synchrone setState:
    // de begintoestand ('inactief', lege map) is al correct, en een verouderde
    // 'fout'/'klaar' van een vorige set wordt in de lege-lijst-weergave nooit
    // getoond.
    if (mails.length === 0) return

    const mijn = ++generatie.current
    const berichten = berichtenVoorAnalyse(mails)

    void haalJson('/api/lifeos/inbox/analyseer', leesSuggesties, {
      method: 'POST',
      body: JSON.stringify({ berichten }),
    }).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld

      if (!uitkomst.ok) {
        setStatus('fout')
        setKaart(GEEN_SUGGESTIES)
        return
      }

      const nieuw = new Map<string, Suggestie>()
      for (const suggestie of uitkomst.waarde) nieuw.set(suggestie.externId, suggestie)
      setKaart(nieuw)
      setStatus('klaar')
    })

    return verval
  }, [mails, verval])

  const suggestieVoor = useCallback(
    (externId: string): Suggestie | null => kaart.get(externId) ?? null,
    [kaart],
  )

  return { status, suggestieVoor }
}
