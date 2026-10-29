'use client'

import { useState } from 'react'
import { DoorClosed } from 'lucide-react'
import type { Afsluitronde as Ronde } from '@/lib/club/taken/typen'
import type { VandaagTaak } from '@/lib/club/taken/voortgang'
import { PERSOON_VELD_ID, useAfvinken } from './AfvinkContext'
import { TaakTegel } from './TaakTegel'
import { alsAfsluitronde, klok, vraag } from './vraag'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

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
  const taal = useTaal()
  const t = useTekst(TAKEN).afsluit
  const klaar = items.filter((i) => i.afgevinkt).length
  const open = items.length - klaar

  async function meldKlaar() {
    if (!persoon) {
      meld(t.kiesWie)
      document.getElementById(PERSOON_VELD_ID)?.focus()
      return
    }
    if (open > 0 && !bevestig) {
      setBevestig(true)
      return
    }
    setBezig(true)
    const r = await vraag('/api/club/taken/afsluitronde', 'POST', { vestiging, medewerkerId: persoon.medewerkerId, wie: persoon.wie }, taal)
    setBezig(false)
    setBevestig(false)
    const nieuw = r.ok ? alsAfsluitronde(r.data) : null
    if (nieuw) setRonde(nieuw)
    else meld(r.ok ? t.nietGelukt : r.fout)
  }

  return (
    <section className="club-taken-afsluit" aria-labelledby="club-taken-afsluit-kop" data-klaar={ronde ? '' : undefined}>
      <header className="club-taken-moment-kop">
        <h2 id="club-taken-afsluit-kop">{t.titel}</h2>
        <span className="club-getal">
          {t.telling(klaar, items.length)}
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
            {t.afgemeldDoor} <strong>{ronde.wie}</strong>{t.om(klok(ronde.op))}
            {ronde.openTaken > 0 ? t.metOpen(ronde.openTaken) : t.allesAf}
          </p>
        )}
        {bevestig && (
          <p className="club-taken-afsluit-vraag" role="alert">
            {t.nogOpen(open)}
          </p>
        )}
        <div className="club-acties">
          {bevestig && (
            <button type="button" className="club-knop club-knop--groot" onClick={() => setBevestig(false)}>
              {t.terug}
            </button>
          )}
          <button type="button" className="club-knop club-knop--primair club-knop--groot" onClick={() => void meldKlaar()} disabled={bezig}>
            <DoorClosed size={20} aria-hidden />
            {bezig ? t.bezig : bevestig ? t.jaKlaar : ronde ? t.opnieuw : t.klaar}
          </button>
        </div>
      </div>
    </section>
  )
}
