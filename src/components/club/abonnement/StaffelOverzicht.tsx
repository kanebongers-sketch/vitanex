import { STAFFEL } from '@/lib/aiyourgym/taal/woorden/club/staffel'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { StaffelRegel } from '@/lib/aiyourgym/staffel-weergave'

// Staffel per vestiging (besluit Kane 31-10-2026): per vestiging het aantal
// actieve leden van nu en de staffel die daarbij hoort, plus het bedrag als
// Stripe het teruggaf. Daaronder de afspraak uit de voorwaarden in een regel en
// de laatste wijzigingen (ook als er geen mail kon worden gestuurd).

interface StaffelOverzichtProps {
  regels: readonly StaffelRegel[]
  /** Toon de kolom Bedrag bij Stripe (alleen met een echt Stripe-abonnement). */
  metBedrag: boolean
  /** Elke vestiging een eigen abonnement? Anders geen melding per vestiging. */
  metAbonnementen: boolean
  wijzigingen: readonly string[]
  taal: Taal
}

export function StaffelOverzicht({ regels, metBedrag, metAbonnementen, wijzigingen, taal }: StaffelOverzichtProps) {
  const t = STAFFEL[taal]
  const getal = new Intl.NumberFormat(taal === 'en' ? 'en-GB' : 'nl-NL')
  return (
    <section className="club-abo-staffel" aria-labelledby="abo-staffel">
      <div className="club-abo-pakketten-kop">
        <h2 id="abo-staffel">{t.kop}</h2>
        <p>{t.uitleg}</p>
      </div>
      <div className="club-abo-staffel-tabel" role="table" aria-labelledby="abo-staffel">
        <div className="club-abo-staffel-rij club-abo-staffel-rij--kop" role="row">
          <span role="columnheader">{t.vestiging}</span>
          <span role="columnheader">{t.leden}</span>
          <span role="columnheader">{t.staffel}</span>
          {metBedrag && <span role="columnheader">{t.bedrag}</span>}
        </div>
        {regels.map((r) => (
          <div key={r.sleutel} className="club-abo-staffel-rij" role="row">
            <span role="cell" className="club-abo-staffel-naam">{r.naam}</span>
            <span role="cell" className="club-abo-staffel-getal">{r.actieveLeden === null ? t.nogNietGeteld : getal.format(r.actieveLeden)}</span>
            <span role="cell">{r.staffel ?? t.nogNietGeteld}</span>
            {metBedrag && <span role="cell" className="club-abo-staffel-getal">{r.bedrag ?? (metAbonnementen && !r.abonnement ? t.geenAbonnement : '')}</span>}
          </div>
        ))}
      </div>
      <p className="club-hint club-abo-staffel-afspraak">{t.afspraak}</p>
      {wijzigingen.length > 0 && (
        <div className="club-abo-staffel-wijzigingen">
          <h3>{t.wijzigingen}</h3>
          <ul>
            {wijzigingen.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
