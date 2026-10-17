import { Pencil } from 'lucide-react'
import type { Oefening } from '@/lib/club/training/rijen'
import { MATERIAAL_LABEL, NIVEAU_LABEL, PATROON_LABEL, SPIERGROEP_LABEL, ZONE_LABEL } from '@/lib/club/training/typen'
import { BeeldBron } from './OefeningBeeld'
import { OefeningSpeler } from './coaching/OefeningSpeler'
import { OefeningCoaching } from './coaching/OefeningCoaching'
import { SpierBlok } from './SpierChips'

interface OefeningDetailProps {
  oefening: Oefening
  onBewerk: () => void
}

/** Een oefening bekijken: de bewegende illustratie, de coaching (kernpunten, stappen, fouten) en de spieren. Bewerken is een klik verder. */
export function OefeningDetail({ oefening: o, onBewerk }: OefeningDetailProps) {
  const kenmerken = [
    ['Spiergroep (grof)', SPIERGROEP_LABEL[o.spiergroep]],
    ['Materiaal', MATERIAAL_LABEL[o.materiaal]],
    ['Niveau', NIVEAU_LABEL[o.niveau]],
    ['Patroon', o.patroon ? PATROON_LABEL[o.patroon] : 'Geen'],
  ] as const
  return (
    <div className="club-training-oefdetail">
      <OefeningSpeler key={o.id} naam={o.naam} beeld={o.beeld} />
      {o.beeld && <BeeldBron bronnen={[o.beeld.bron]} />}
      <OefeningCoaching key={o.id} naam={o.naam} uitleg={o.uitleg} aandachtspunten={o.aandachtspunten} leeg="Nog geen uitleg. Voeg die toe via Bewerken." oefeningId={o.id} />
      <dl className="club-training-defs club-training-defs--twee">
        {kenmerken.map(([label, waarde]) => (
          <div key={label} className="club-training-def">
            <dt>{label}</dt>
            <dd>{waarde}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="club-training-tussenkop">Spieren</h3>
        <SpierBlok naam={o.naam} primair={o.spierenPrimair} secundair={o.spierenSecundair} />
      </section>
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
