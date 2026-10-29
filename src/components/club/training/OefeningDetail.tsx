import { Pencil } from 'lucide-react'
import type { Oefening } from '@/lib/club/training/rijen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { BeeldBron } from './OefeningBeeld'
import { OefeningVoorbeeld } from './repspeler/OefeningVoorbeeld'
import { repRenderVoor } from './repspeler/render-bron'
import { OefeningCoaching } from './coaching/OefeningCoaching'
import { SpierBlok } from './SpierChips'

interface OefeningDetailProps {
  oefening: Oefening
  onBewerk: () => void
}

/** Een oefening bekijken: de bewegende illustratie, de coaching (kernpunten, stappen, fouten) en de spieren. Bewerken is een klik verder. */
export function OefeningDetail({ oefening: o, onBewerk }: OefeningDetailProps) {
  const t = useTekst(CLUB_TRAINING).detail
  const l = useTekst(TRAINING_LABELS)
  const kenmerken = [
    [t.spiergroep, l.spiergroep[o.spiergroep]],
    [t.materiaal, l.materiaal[o.materiaal]],
    [t.niveau, l.niveau[o.niveau]],
    [t.patroon, o.patroon ? l.patroon[o.patroon] : t.geen],
  ] as const
  return (
    <div className="club-training-oefdetail">
      <OefeningVoorbeeld key={o.id} naam={o.naam} beeld={o.beeld} />
      {o.beeld && !repRenderVoor(o.naam) && <BeeldBron bronnen={[o.beeld.bron]} />}
      <OefeningCoaching key={o.id} naam={o.naam} uitleg={o.uitleg} aandachtspunten={o.aandachtspunten} leeg={t.leeg} oefeningId={o.id} />
      <dl className="club-training-defs club-training-defs--twee">
        {kenmerken.map(([label, waarde]) => (
          <div key={label} className="club-training-def">
            <dt>{label}</dt>
            <dd>{waarde}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="club-training-tussenkop">{t.spieren}</h3>
        <SpierBlok naam={o.naam} primair={o.spierenPrimair} secundair={o.spierenSecundair} />
      </section>
      {o.belast.length > 0 && <p className="club-training-belast">{t.belast(o.belast.map((z) => l.zone[z].toLowerCase()).join(', '))}</p>}
      {!o.actief && <p className="club-chip club-chip--uit">{t.inactief}</p>}
      <div className="club-acties">
        <button type="button" className="club-knop" onClick={onBewerk}>
          <Pencil aria-hidden size={15} /> {t.bewerken}
        </button>
      </div>
    </div>
  )
}
