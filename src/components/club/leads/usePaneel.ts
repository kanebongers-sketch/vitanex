'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { historieUitRij, leadUitJson, type HistorieRegel, type Lead } from '@/lib/club/leads/model'
import { stuur, type Antwoord } from './stuur'

export type Doe = (url: string, method: 'POST' | 'PATCH', body: unknown) => Promise<Antwoord>

export interface PaneelStaat {
  lead: Lead | null
  historie: HistorieRegel[]
  laadfout: string | null
  fout: string | null
  bezig: boolean
  doe: Doe
}

function leesDetail(data: Record<string, unknown>): { lead: Lead | null; historie: HistorieRegel[] } {
  const historie = Array.isArray(data.historie) ? data.historie.map(historieUitRij).filter((h): h is HistorieRegel => h !== null) : []
  return { lead: leadUitJson(data.lead), historie }
}

// Het zijpaneel laadt zijn eigen lead en historie. Na elke actie: opnieuw laden
// en de pagina (pijplijn, cijfers, vandaag) op de achtergrond verversen.
export function usePaneel(leadId: string): PaneelStaat {
  const router = useRouter()
  const [, startOverdracht] = useTransition()
  const [detail, setDetail] = useState<{ lead: Lead | null; historie: HistorieRegel[] }>({ lead: null, historie: [] })
  const [laadfout, setLaadfout] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  const verwerk = useCallback((uit: Antwoord) => {
    if (!uit.ok) {
      setLaadfout(uit.fout)
      return
    }
    setLaadfout(null)
    setDetail(leesDetail(uit.data))
  }, [])

  const laad = useCallback(async () => verwerk(await stuur(`/api/club/leads/${leadId}`, 'GET')), [leadId, verwerk])

  useEffect(() => {
    let actief = true
    void stuur(`/api/club/leads/${leadId}`, 'GET').then((uit) => {
      if (actief) verwerk(uit)
    })
    return () => {
      actief = false
    }
  }, [leadId, verwerk])

  const doe = useCallback<Doe>(
    async (url, method, body) => {
      setBezig(true)
      setFout(null)
      const uit = await stuur(url, method, body)
      setBezig(false)
      if (!uit.ok) {
        setFout(uit.fout)
        return uit
      }
      await laad()
      startOverdracht(() => router.refresh())
      return uit
    },
    [laad, router],
  )

  return { ...detail, laadfout, fout, bezig, doe }
}
