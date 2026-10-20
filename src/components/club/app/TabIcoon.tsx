'use client'

import type { ReactNode } from 'react'
import { useLinkStatus } from 'next/link'

// Het icoon van een tabblad in de onderbalk van de ledenapp. De tabbladen zijn
// dynamisch en worden niet vooraf geladen; zonder dit gebeurt er na een tik
// even niets zichtbaars. Tijdens het laden ademt het icoon zacht (alleen
// opacity, zie ledenapp.css). Moet binnen een <Link> staan.

export function TabIcoon({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus()
  return (
    <span className="club-mijn-tab-icoon" data-laden={pending || undefined} aria-hidden>
      {children}
    </span>
  )
}
