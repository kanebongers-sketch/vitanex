'use client'

import { stuur, type Antwoord } from '@/components/club/rooster/vraag'

// Opslaan van een instellingen-item: nieuw (POST) of wijzigen (PATCH).

export type InstellingSoort = 'zalen' | 'lestypen' | 'weekrooster' | 'medewerkers'

export function bewaarItem(soort: InstellingSoort, vestiging: string, id: string | null, velden: Record<string, unknown>): Promise<Antwoord> {
  const body = { ...velden, vestiging }
  return id ? stuur(`/api/club/instellingen/${soort}/${id}`, 'PATCH', body) : stuur(`/api/club/instellingen/${soort}`, 'POST', body)
}
