'use client'

import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import type { VrijBlokJson } from '@/lib/lifeos/agenda/agenda'
import { tijdLabel } from '@/lib/lifeos/datum/datum'

// Eén knop naast één vrij blok: "plan dit blok". Presentationeel op één ding na —
// hij houdt zijn eigen bezig/fout-staat vast, want die is lokaal aan déze knop.
// Er staan er meerdere op het scherm, en een fout op het blok van 13:00 hoort
// niet naast dat van 09:00 te verschijnen. De echte POST doet de container.
//
// De fout staat bewust ONDER de knop en niet in een toast: hij hoort bij dit blok,
// en een melding die wegvliegt is een melding die je mist.

interface PlanBlokKnopProps {
  blok: VrijBlokJson
  onPlan: (blok: VrijBlokJson) => Promise<{ ok: true } | { ok: false; fout: string }>
}

export function PlanBlokKnop({ blok, onPlan }: PlanBlokKnopProps) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function plan() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uitkomst = await onPlan(blok)
    setBezig(false)
    if (!uitkomst.ok) setFout(uitkomst.fout)
  }

  return (
    <span style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
      <Knop
        onClick={() => void plan()}
        disabled={bezig}
        aria-label={`Plan een focusblok om ${tijdLabel(new Date(blok.startOp))}`}
      >
        <CalendarClock size={13} strokeWidth={2.2} aria-hidden="true" />
        {bezig ? 'Bezig…' : 'Plan dit blok'}
      </Knop>
      {fout ? (
        <span role="alert" style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
          {fout}
        </span>
      ) : null}
    </span>
  )
}
