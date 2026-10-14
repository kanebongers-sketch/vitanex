'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Lead, LeadStatus, PaneelStap } from '@/lib/club/leads/model'
import { stuur } from './stuur'

export interface LeadsActies {
  fout: string | null
  bezig: string | null
  wisFout: () => void
  open: (id: string, stap?: PaneelStap) => void
  sluit: () => void
  verplaats: (lead: Lead, status: LeadStatus) => void
  gedaan: (lead: Lead) => void
  uitkomst: (lead: Lead, actie: 'geweest' | 'niet_gekomen') => void
}

// De acties van de leadspagina: het paneel openen via de URL (deelbaar, terug
// werkt) en snelle mutaties vanuit de lijst, daarna de servergegevens verversen.
export function useLeadsActies(vestiging: Vestiging, zoek: Record<string, string>): LeadsActies {
  const router = useRouter()
  const [, startOverdracht] = useTransition()
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)

  const ga = useCallback(
    (extra: Record<string, string>) => router.push(clubPad('/leads', vestiging, { ...zoek, ...extra }), { scroll: false }),
    [router, vestiging, zoek],
  )

  const voerUit = useCallback(
    async (leadId: string, url: string, method: 'POST' | 'PATCH', body: unknown) => {
      setBezig(leadId)
      setFout(null)
      const uit = await stuur(url, method, body)
      setBezig(null)
      if (!uit.ok) setFout(uit.fout)
      else startOverdracht(() => router.refresh())
    },
    [router],
  )

  const open = useCallback((id: string, stap?: PaneelStap) => ga(stap ? { lead: id, stap } : { lead: id }), [ga])

  const verplaats = useCallback(
    (lead: Lead, status: LeadStatus) => {
      if (status === lead.status) return
      if (status === 'proefles' || status === 'lid' || status === 'verloren') {
        open(lead.id, status)
        return
      }
      void voerUit(lead.id, `/api/club/leads/${lead.id}`, 'PATCH', { status })
    },
    [open, voerUit],
  )

  return {
    fout,
    bezig,
    wisFout: () => setFout(null),
    open,
    sluit: () => ga({}),
    verplaats,
    gedaan: (lead) =>
      void voerUit(lead.id, `/api/club/leads/${lead.id}/historie`, 'POST', { soort: 'notitie', tekst: 'Opvolging afgerond.', opvolgenOp: null }),
    uitkomst: (lead, actie) => void voerUit(lead.id, `/api/club/leads/${lead.id}/proefles`, 'POST', { actie }),
  }
}
