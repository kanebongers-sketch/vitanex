'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'

interface OpenKnopProps {
  id: string
  naam: string
  /** Deze sportschool staat al open: dan gewoon naar Vandaag. */
  actief: boolean
}

// Wisselt naar een sportschool en laadt heel Club opnieuw: menu, huisstijl en
// vestigingen horen bij de gekozen sportschool (de data is strikt gescheiden).
export function OpenKnop({ id, naam, actief }: OpenKnopProps) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function open() {
    setBezig(true)
    setFout(null)
    if (!actief) {
      const uit = await stuur('/api/club/organisatie/wissel', 'POST', { id })
      if (!uit.ok) {
        setBezig(false)
        return setFout(uit.fout)
      }
    }
    window.location.assign('/club')
  }

  return (
    <span className="club-platform-open">
      <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => void open()} disabled={bezig} aria-label={`${naam} openen`}>
        {bezig ? 'Openen…' : 'Openen'} <ArrowRight size={14} aria-hidden />
      </button>
      {fout && <span className="club-fout" role="alert">{fout}</span>}
    </span>
  )
}
