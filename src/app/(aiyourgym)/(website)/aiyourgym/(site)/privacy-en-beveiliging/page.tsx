import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GROEPEN, KERN, SUBVERWERKERS } from '@/components/aiyourgym/inhoud/beveiliging'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { DEMO_AANVRAGEN, aygPad } from '@/components/aiyourgym/site/paden'

// Privacy en beveiliging in gewone taal. Alleen wat echt zo is gebouwd (bronnen
// in inhoud/beveiliging.ts); geen keurmerken die we niet hebben. De
// verwerkersovereenkomst is nog een concept en staat niet als download online:
// daarom "op aanvraag".

export const metadata: Metadata = {
  title: 'Privacy en beveiliging',
  description:
    'Hoe AI Your Gym de gegevens van je sportschool en je leden beschermt: opslag in Frankfurt, gescheiden per sportschool, AVG-rechten van leden in de software en bewaartermijnen die je zelf instelt.',
}

export default function PrivacyBeveiligingPagina() {
  return (
    <>
      <PaginaKop
        label="Privacy en beveiliging"
        titel="De gegevens van je leden, goed bewaard."
        tekst="Wat we doen om de gegevens van je sportschool en je leden te beschermen. In gewone taal, en alleen wat echt zo is gebouwd."
      />
      <section className="ayg-sectie--krap" aria-label="In het kort">
        <div className="ayg-podium ayg-podium--rond">
          <ul className="ayg-wrap ayg-pb-kern">
            {KERN.map((k, i) => (
              <li key={k.titel}>
                <span className="ayg-pb-kern-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <strong className="ayg-pb-kern-woord">{k.titel}</strong>
                <span>{k.tekst}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {GROEPEN.map((g) => (
        <section key={g.sleutel} className="ayg-sectie--krap ayg-pb-groep" aria-labelledby={`pb-${g.sleutel}`}>
          <div className="ayg-wrap ayg-pb-rij">
            <div className="ayg-stapel">
              <p className="ayg-label ayg-label--accent">{g.label}</p>
              <h2 className="ayg-h2 ayg-pb-titel" id={`pb-${g.sleutel}`}>
                {g.titel}
              </h2>
            </div>
            <ul className="ayg-pb-punten">
              {g.punten.map((p) => (
                <li key={p.titel}>
                  <h3 className="ayg-h3">{p.titel}</h3>
                  <p>{p.tekst}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <section className="ayg-sectie--krap ayg-pb-groep" aria-labelledby="pb-afspraken">
        <div className="ayg-wrap ayg-pb-rij">
          <div className="ayg-stapel">
            <p className="ayg-label ayg-label--accent">Afspraken</p>
            <h2 className="ayg-h2 ayg-pb-titel" id="pb-afspraken">
              Op papier.
            </h2>
          </div>
          <div className="ayg-stapel">
            <div className="ayg-kaart ayg-pb-dpa">
              <h3 className="ayg-h3">Verwerkersovereenkomst</h3>
              <p>
                Jij bent verantwoordelijk voor de gegevens van je leden, wij verwerken ze in jouw opdracht. Die afspraken leggen we vast in
                een verwerkersovereenkomst. Die is op aanvraag beschikbaar: vraag ernaar bij een demo-aanvraag, of via Hulp in je eigen
                omgeving als je al begonnen bent.
              </p>
              <Link href={DEMO_AANVRAGEN} className="ayg-pijllink">
                Vraag een demo aan <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="ayg-pb-sub">
              <h3 className="ayg-pb-sub-kop">Diensten die we gebruiken</h3>
              <dl>
                {SUBVERWERKERS.map((s) => (
                  <div key={s.titel}>
                    <dt>{s.titel}</dt>
                    <dd>{s.tekst}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="ayg-klein">
              Meer over de gegevens op deze website zelf staat in de{' '}
              <Link href={aygPad('/privacy')}>privacyverklaring</Link>.
            </p>
          </div>
        </div>
      </section>
      <AanmeldBand titel="Probeer het in je eigen, afgeschermde omgeving." />
    </>
  )
}
