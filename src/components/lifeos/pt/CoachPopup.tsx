'use client'

import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { Dialoog } from '@/components/lifeos/crm/Dialoog'
import type { PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { CoachingAfronden } from './CoachingAfronden'

// Open je het dashboard tíjdens een coachgesprek (of tot een uur erna), dan springt
// het verslagformulier van dat teamlid vanzelf open. Wegklikken = voor dít gesprek
// niet meer vanzelf openen (onthouden per browsertab); via de kaart kan het altijd.

const SLEUTEL = 'lifeos-coachpopup-weg'

function leesWeg(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SLEUTEL) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function bewaarWeg(sleutel: string) {
  try {
    const weg = leesWeg()
    weg.add(sleutel)
    sessionStorage.setItem(SLEUTEL, JSON.stringify([...weg]))
  } catch {
    // Opslag geblokkeerd: dan opent hij bij de volgende keer laden opnieuw — geen ramp.
  }
}

interface Props {
  pts: readonly PtStatus[]
  onKlaar: () => Promise<void>
}

export function CoachPopup({ pts, onKlaar }: Props) {
  const labelId = useId()
  // Lazy init: sessionStorage bestaat alleen in de browser (dit eiland is client-only).
  const [weg, setWeg] = useState<Set<string>>(() => (typeof window === 'undefined' ? new Set() : leesWeg()))
  const pt = pts.find((p) => p.extra?.nuBezigOp && !weg.has(`${p.id}:${p.extra.nuBezigOp}`))
  if (!pt || !pt.extra?.nuBezigOp) return null
  const sleutel = `${pt.id}:${pt.extra.nuBezigOp}`

  function sluit() {
    bewaarWeg(sleutel)
    setWeg((w) => new Set(w).add(sleutel))
  }

  async function klaar() {
    sluit()
    await onKlaar()
  }

  return (
    <Dialoog labelId={labelId} onSluit={sluit}>
      <div style={{ display: 'grid', gap: 4, padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 id={labelId} style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>
            Coachgesprek met {pt.naam}
          </h2>
          <button
            type="button"
            onClick={sluit}
            aria-label="Sluiten"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
          Vul het verslag in terwijl het vers is. Het volgende gesprek staat al klaar om goed te keuren.
        </p>
      </div>
      <div style={{ padding: '4px 20px 20px', overflowY: 'auto' }}>
        <CoachingAfronden pt={pt} onKlaar={klaar} onAnnuleer={sluit} />
      </div>
    </Dialoog>
  )
}
