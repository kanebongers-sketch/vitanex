'use client'

import { useState } from 'react'
import { DoorClosed } from 'lucide-react'
import type { Afsluitronde as Ronde } from '@/lib/club/taken/typen'
import type { VandaagTaak } from '@/lib/club/taken/voortgang'
import { PERSOON_VELD_ID, useAfvinken } from './AfvinkContext'
import { TaakTegel } from './TaakTegel'
import { alsAfsluitronde, klok, vraag } from './vraag'

// De afsluitronde als checklist met een duidelijke eindknop. "Afsluitronde
// klaar" legt vast wie er afsloot en hoe laat (en hoeveel er nog open stond).
// Staat er nog iets open, dan vraagt de knop eerst of het toch klaar is.

interface AfsluitProps {
  items: VandaagTaak[]
  bron: Record<string, string>
  begin: Ronde | null
  /** Alleen de eindknop en de stand, zonder tegels (de dagweergave toont de taken al in de tabel). */
  zonderTegels?: boolean
}

export function Afsluitronde({ items, bron, begin, zonderTegels = false }: AfsluitProps) {
  const { persoon, vestiging, meld } = useAfvinken()
  const [ronde, setRonde] = useState(begin)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const klaar = items.filter((i) => i.afgevinkt).length
  const open = items.length - klaar

  async function meldKlaar() {
    if (!persoon) {
      meld('Kies eerst wie er afsluit.')
      document.getElementById(PERSOON_VELD_ID)?.focus()
      return
    }
    if (open > 0 && !bevestig) {
      setBevestig(true)
      return
    }
    setBezig(true)
    const r = await vraag('/api/club/taken/afsluitronde', 'POST', { vestiging, medewerkerId: persoon.medewerkerId, wie: persoon.wie })
    setBezig(false)
    setBevestig(false)
    const nieuw = r.ok ? alsAfsluitronde(r.data) : null
    if (nieuw) setRonde(nieuw)
    else meld(r.ok ? 'Afmelden is niet gelukt.' : r.fout)
  }

  return (
    <section className="club-taken-afsluit" aria-labelledby="club-taken-afsluit-kop" data-klaar={ronde ? '' : undefined}>
      <header className="club-taken-moment-kop">
        <h2 id="club-taken-afsluit-kop">Afsluitronde</h2>
        <span className="club-getal">
          {klaar} van {items.length}
        </span>
      </header>
      {!zonderTegels && (
        <ul className="club-taken-tegels">
          {items.map((i) => (
            <TaakTegel key={i.taak.id} item={i} bron={bron[i.taak.lijstId] ?? ''} />
          ))}
        </ul>
      )}
      <div className="club-taken-afsluit-voet" aria-live="polite">
        {ronde && (
          <p className="club-taken-afsluit-status">
            Afgemeld door <strong>{ronde.wie}</strong> om {klok(ronde.op)}
            {ronde.openTaken > 0 ? `, met ${ronde.openTaken} open` : ', alles afgevinkt'}.
          </p>
        )}
        {bevestig && (
          <p className="club-taken-afsluit-vraag" role="alert">
            Nog {open} {open === 1 ? 'taak' : 'taken'} open. Toch afsluiten?
          </p>
        )}
        <div className="club-acties">
          {bevestig && (
            <button type="button" className="club-knop club-knop--groot" onClick={() => setBevestig(false)}>
              Terug
            </button>
          )}
          <button type="button" className="club-knop club-knop--primair club-knop--groot" onClick={() => void meldKlaar()} disabled={bezig}>
            <DoorClosed size={20} aria-hidden />
            {bezig ? 'Bezig' : bevestig ? 'Ja, afsluitronde klaar' : ronde ? 'Opnieuw afmelden' : 'Afsluitronde klaar'}
          </button>
        </div>
      </div>
    </section>
  )
}
