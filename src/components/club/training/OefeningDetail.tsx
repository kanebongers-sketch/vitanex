import { Pencil } from 'lucide-react'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL, NIVEAU_LABEL, PATROON_LABEL, SPIERGROEP_LABEL, ZONE_LABEL } from '@/lib/club/training/typen'
import { BeeldBron, OefeningBeeld } from './OefeningBeeld'

interface OefeningDetailProps {
  oefening: Oefening
  onBewerk: () => void
}

/** Een oefening bekijken: grote tekening, uitvoering en aandachtspunten. Bewerken is een klik verder. */
export function OefeningDetail({ oefening: o, onBewerk }: OefeningDetailProps) {
  const kenmerken = [
    ['Spiergroep', SPIERGROEP_LABEL[o.spiergroep]],
    ['Materiaal', MATERIAAL_LABEL[o.materiaal]],
    ['Niveau', NIVEAU_LABEL[o.niveau]],
    ['Patroon', o.patroon ? PATROON_LABEL[o.patroon] : 'Geen'],
  ] as const
  return (
    <div className="club-training-oefdetail">
      <OefeningBeeld naam={o.naam} beeld={o.beeld} formaat="groot" />
      {o.beeld && <BeeldBron />}
      <dl className="club-training-defs club-training-defs--twee">
        {kenmerken.map(([label, waarde]) => (
          <div key={label} className="club-training-def">
            <dt>{label}</dt>
            <dd>{waarde}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="club-training-tussenkop">Uitvoering</h3>
        <p className="club-training-tekst">{o.uitleg ?? 'Nog geen uitleg. Voeg die toe via Bewerken.'}</p>
      </section>
      {o.aandachtspunten && (
        <section>
          <h3 className="club-training-tussenkop">Aandachtspunten</h3>
          <p className="club-training-tekst">{o.aandachtspunten}</p>
        </section>
      )}
      {o.belast.length > 0 && <p className="club-training-belast">Belast: {o.belast.map((z) => ZONE_LABEL[z].toLowerCase()).join(', ')}</p>}
      {!o.actief && <p className="club-chip club-chip--uit">Inactief</p>}
      <div className="club-acties">
        <button type="button" className="club-knop" onClick={onBewerk}>
          <Pencil aria-hidden size={15} /> Bewerken
        </button>
      </div>
    </div>
  )
}
