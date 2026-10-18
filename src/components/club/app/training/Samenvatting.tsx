'use client'

import { Award, Check } from 'lucide-react'
import { toonDuur, type Samenvatting as Telling } from '@/lib/club/app/sets'

interface SamenvattingProps {
  dagLetter: string
  telling: Telling
  duurSec: number
  onSluit: () => void
}

/** Na "training klaar": wat je deed, eerlijk opgeteld. Records alleen als je echt zwaarder of vaker tilde dan ooit. */
export function TrainingSamenvatting({ dagLetter, telling, duurSec, onSluit }: SamenvattingProps) {
  return (
    <section className="club-lidapp-klaar" aria-labelledby="klaar-kop">
      <span className="club-lidapp-klaar-vink" aria-hidden><Check size={30} strokeWidth={3} /></span>
      <h2 id="klaar-kop" className="club-lidapp-kop">Dag {dagLetter} klaar</h2>
      <dl className="club-lidapp-klaar-cijfers">
        <div><dt>Tijd</dt><dd>{toonDuur(duurSec)}</dd></div>
        <div><dt>Sets</dt><dd>{telling.sets}</dd></div>
        <div><dt>Herhalingen</dt><dd>{telling.herhalingen}</dd></div>
        <div><dt>Totaal getild</dt><dd>{telling.volumeKg.toLocaleString('nl-NL')} <small>kg</small></dd></div>
      </dl>
      {telling.records.length > 0 && (
        <div className="club-lidapp-klaar-records">
          <Award aria-hidden size={18} />
          <p>
            <strong>{telling.records.length === 1 ? 'Nieuw record' : `${telling.records.length} nieuwe records`}</strong>
            <span>{telling.records.join(', ')}</span>
          </p>
        </div>
      )}
      <p className="club-lidapp-klaar-tekst">Opgeslagen. Je trainer ziet per oefening wat je deed en wat de volgende stap is.</p>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={onSluit}>
        Terug naar je schema
      </button>
    </section>
  )
}
