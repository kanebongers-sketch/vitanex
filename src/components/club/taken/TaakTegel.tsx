'use client'

import { Check } from 'lucide-react'
import { kortWie } from '@/lib/club/taken/typen'
import type { VandaagTaak } from '@/lib/club/taken/voortgang'
import { useAfvinken } from './AfvinkContext'
import { Teller } from './TakenRaster'
import { klok } from './vraag'

// Een taak van vandaag als groot tikvlak voor de tablet aan de balie.
// Afgevinkt: groen met wie en hoe laat. Nogmaals tikken haalt het weg.

interface TegelProps {
  item: VandaagTaak
  /** Waar de taak vandaan komt ("Poetsrooster"), klein erboven. */
  bron: string
}

export function TaakTegel({ item, bron }: TegelProps) {
  const { wissel, isBezig, vandaag } = useAfvinken()
  const { taak, afgevinkt, teller } = item
  const status = afgevinkt ? `gedaan door ${afgevinkt.wie} om ${klok(afgevinkt.afgevinktOp)}` : 'nog open'
  return (
    <li>
      <button
        type="button"
        className="club-taken-tegel"
        aria-pressed={afgevinkt !== null}
        aria-busy={isBezig(taak.id, vandaag) || undefined}
        aria-label={`${taak.naam}: ${status}`}
        onClick={() => wissel(taak.id, vandaag, taak.naam)}
      >
        <span className="club-taken-tegel-vink" aria-hidden>
          {afgevinkt ? <Check size={22} strokeWidth={3} /> : null}
        </span>
        <span className="club-taken-tegel-tekst">
          <span className="club-taken-tegel-bron">{bron}</span>
          <span className="club-taken-tegel-naam">{taak.naam}</span>
          {afgevinkt ? (
            <span className="club-taken-tegel-wie">
              {kortWie(afgevinkt.wie)} · {klok(afgevinkt.afgevinktOp)}
            </span>
          ) : (
            teller && <Teller teller={teller} />
          )}
        </span>
      </button>
    </li>
  )
}
