'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import {
  leesProjectAntwoord,
  leesProjectenAntwoord,
  type Project,
} from '@/lib/lifeos/projecten/projecten'

// De projectenlijst voor de keuzelijst in het taak-detail — én het aanmaken van
// een nieuw project vandaaruit.
//
// Bewust GEEN eigen fout-scherm voor het laden: mislukt dat, dan blijft de
// takenlijst gewoon werken en mis je alleen de projectkeuze. Een taak niet kunnen
// afvinken omdat je projecten niet laadden, zou de fout veel groter maken dan hij
// is. De keuzelijst zegt zelf wel dat hij niets kon ophalen (zie `TaakDetail`).

/**
 * De uitkomst van een aanmaak-poging. Een unie, geen `Project | null`: bij een
 * fout hoort de gebruiker de reden (bv. "Je hebt al een project met die naam"),
 * niet een stille terugval. Het aanroepende veld toont die melding zelf.
 */
export type ProjectMaakUitkomst =
  | { ok: true; project: Project }
  | { ok: false; fout: string }

export interface ProjectenBediening {
  projecten: Project[]
  /** Laden mislukt. De takenlijst werkt door; alleen de projectkeuze niet. */
  mislukt: boolean
  opnieuw: () => void
  /** Maak een nieuw project en voeg het meteen aan de keuzelijst toe. */
  voegToe: (naam: string) => Promise<ProjectMaakUitkomst>
}

export function useProjecten(): ProjectenBediening {
  const [projecten, setProjecten] = useState<Project[]>([])
  const [mislukt, setMislukt] = useState(false)

  // Zelfde generatieteller als in `useTaken`: een vlucht die bij unmount nog
  // loopt mag niets meer zetten.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/projecten?actief=1', leesProjectenAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return
      if (uitkomst.ok) {
        setProjecten(uitkomst.waarde)
        setMislukt(false)
        return
      }
      // Leeg laten én het zeggen: een lege keuzelijst zonder melding zou
      // betekenen "je hebt geen projecten", en dat weten we niet.
      setProjecten([])
      setMislukt(true)
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie `useTaken`. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    void laad()
  }, [laad])

  const voegToe = useCallback(async (naam: string): Promise<ProjectMaakUitkomst> => {
    const uitkomst = await haalJson('/api/lifeos/projecten', leesProjectAntwoord, {
      method: 'POST',
      body: JSON.stringify({ naam }),
    })
    if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout }

    // Een net aangemaakt project is actief; het hoort meteen in de keuzelijst,
    // zodat de gebruiker het zónder herlaad kan kiezen. Functioneel toevoegen: een
    // gelijktijdige (her)laad mag deze toevoeging niet overschrijven.
    const nieuw = uitkomst.waarde
    setProjecten((huidig) =>
      huidig.some((p) => p.id === nieuw.id) ? huidig : [...huidig, nieuw],
    )
    setMislukt(false)
    return { ok: true, project: nieuw }
  }, [])

  return { projecten, mislukt, opnieuw, voegToe }
}
