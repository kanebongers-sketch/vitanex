'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import type { AfspraakType } from '@/lib/club/afspraken/model'
import { AfspraakFormulier, type Persoon } from '@/components/club/afspraken/AfspraakFormulier'
import { Paneel } from '@/components/club/afspraken/Paneel'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'

// Een afspraak plannen vanaf de kaart: het gewone formulier van Afspraken,
// met het lid alvast gekozen. Na opslaan blijf je op het profiel.

interface AfspraakPlannenProps {
  lid: { id: string; naam: string }
  vestiging: string
  typen: readonly AfspraakType[]
  typeTrainers: Readonly<Record<string, readonly string[]>>
  trainers: readonly Persoon[]
  vandaag: string
}

export function AfspraakPlannen({ lid, vestiging, typen, typeTrainers, trainers, vandaag }: AfspraakPlannenProps) {
  const w = useTekst(LEDENKAART).planning
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const sluit = useCallback(() => setOpen(false), [])
  const actief = typen.some((t) => t.actief)

  function klaar(tekst: string) {
    setOpen(false)
    setMelding(tekst)
    startTransition(() => router.refresh())
  }

  return (
    <div className="club-lidhub-afspraak">
      <button type="button" className="club-knop club-knop--primair" onClick={() => { setMelding(null); setOpen(true) }} disabled={!actief}>
        <CalendarClock aria-hidden size={16} /> {w.afspraakPlannen}
      </button>
      {!actief && <p className="club-hint">{w.geenTypen}</p>}
      {melding && <p className="club-melding club-melding--ok" role="status">{melding}</p>}
      {open && (
        <Paneel label={w.afspraakPlannen} onSluit={sluit}>
          <AfspraakFormulier
            vestiging={vestiging}
            typen={typen}
            typeTrainers={typeTrainers}
            trainers={trainers}
            leads={[]}
            start={{ datum: vandaag, medewerkerId: null }}
            vandaag={vandaag}
            onKlaar={klaar}
            onSluit={sluit}
            beginLid={lid}
          />
        </Paneel>
      )}
    </div>
  )
}
