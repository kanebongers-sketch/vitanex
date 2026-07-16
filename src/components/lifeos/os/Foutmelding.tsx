'use client'

import { TriangleAlert } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'

// De fout-staat. Nadrukkelijk NIET `NogNiets`.
//
// Dit is de belangrijkste regel uit de README, in één component: een netwerkfout
// mag nooit "je hebt niets" tonen. "Geen afspraken vandaag" is een dag; "we
// konden je agenda niet ophalen" is een storing. Wie die twee hetzelfde rendert,
// vertelt de gebruiker iets onwaars over zijn eigen leven.
//
// LET OP — hoort op termijn in `src/components/os/` (README noemt 'm LaadFout).
// Staat hier omdat de agenda 'm het eerst nodig had; `taken/` gebruikt 'm
// hiervandaan.

interface FoutmeldingProps {
  bericht: string
  /** Weglaten = geen weg terug. Doe dat niet. */
  opnieuw?: () => void
}

export function Foutmelding({ bericht, opnieuw }: FoutmeldingProps) {
  return (
    <div role="alert" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <TriangleAlert
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ color: 'var(--status-laag)', flexShrink: 0, marginTop: 2 }}
        />
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
          {bericht}
        </p>
      </div>
      {opnieuw ? <Knop onClick={opnieuw}>Opnieuw proberen</Knop> : null}
    </div>
  )
}
