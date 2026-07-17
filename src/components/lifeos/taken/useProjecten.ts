'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesProjectenAntwoord, type Project } from '@/lib/lifeos/projecten/projecten'

// De projectenlijst voor de keuzelijst in het taak-detail.
//
// Bewust GEEN eigen fout-scherm: mislukt dit, dan blijft de takenlijst gewoon
// werken en mis je alleen de projectkeuze. Een taak niet kunnen afvinken omdat
// je projecten niet laadden, zou de fout veel groter maken dan hij is. De
// keuzelijst zegt zelf wel dat hij niets kon ophalen (zie `TaakDetail`).

export interface ProjectenBediening {
  projecten: Project[]
  /** Laden mislukt. De takenlijst werkt door; alleen de projectkeuze niet. */
  mislukt: boolean
  opnieuw: () => void
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

  return { projecten, mislukt, opnieuw }
}
