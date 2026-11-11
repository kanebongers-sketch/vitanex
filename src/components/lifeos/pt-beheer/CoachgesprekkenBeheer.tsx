'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { PinGoedkeuren } from '@/components/lifeos/pt/PinGoedkeuren'
import { haalJson } from '@/lib/lifeos/api/http'
import { COACH_AGENDA_NAAM } from '@/lib/lifeos/pt-gesprek/coach-agenda'
import { leesPtGesprekken, type PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { CoachgesprekkenVerplaatsen } from './CoachgesprekkenVerplaatsen'

// Container voor de beheerder op de Coach-pagina: haalt een keer de stand per
// PT'er op (voor inplannen, verslag invullen, lead-link en pincode) en deelt die
// met de rijen via context. Bovenaan alleen iets als het nodig is (pincodes die
// wachten, een laadfout); onderaan, ingeklapt, het verplaatsen naar de coachagenda.

type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'los' } | { fase: 'ok'; pts: PtStatus[] }

interface CoachBeheerWaarde {
  pt: (id: string) => PtStatus | null
  vernieuw: () => Promise<void>
}

const CoachBeheerContext = createContext<CoachBeheerWaarde | null>(null)

export function useCoachBeheer(): CoachBeheerWaarde | null {
  return useContext(CoachBeheerContext)
}

export function CoachgesprekkenBeheer({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/pt-gesprekken', leesPtGesprekken).then((uit) => {
      if (mijn !== generatie.current) return
      if (!uit.ok) setStaat({ fase: 'fout', bericht: uit.fout })
      else setStaat(uit.waarde.gekoppeld ? { fase: 'ok', pts: uit.waarde.pts } : { fase: 'los' })
    })
  }, [])

  useEffect(() => {
    void laad()
    const teller = generatie
    return () => {
      teller.current++
    }
  }, [laad])

  const vernieuw = useCallback(async () => {
    await laad()
    router.refresh()
  }, [laad, router])

  const waarde = useMemo<CoachBeheerWaarde>(() => {
    const map = new Map(staat.fase === 'ok' ? staat.pts.map((p) => [p.id, p] as const) : [])
    return { pt: (id) => map.get(id) ?? null, vernieuw }
  }, [staat, vernieuw])

  return (
    <CoachBeheerContext.Provider value={waarde}>
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} /> : null}
      {staat.fase === 'ok' ? <PinGoedkeuren pts={staat.pts} onVernieuw={vernieuw} /> : null}
      {children}
      <details className="ptd-kaart ptd-details ptd-coach-hulp">
        <summary>Coachgesprekken naar {COACH_AGENDA_NAAM}</summary>
        <div className="ptd-details-inhoud">
          <CoachgesprekkenVerplaatsen />
        </div>
      </details>
    </CoachBeheerContext.Provider>
  )
}
