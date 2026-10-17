import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { PAKKETTEN, PROEFDAGEN, type Pakket } from '@/lib/aiyourgym/pakketten'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN } from '@/components/aiyourgym/site/paden'

// Besluit Kane: geen bedragen op de website. De pakketten en wat erin zit komen
// uit src/lib/aiyourgym/pakketten.ts; de prijs is altijd op maat.

export const metadata: Metadata = {
  title: 'Prijzen',
  description: `De pakketten van AI Your Gym: Start, Club en Keten. Scherp geprijsd, met een prijs die past bij je sportschool. Probeer ${PROEFDAGEN} dagen gratis.`,
}

function vestigingen(max: number | null): string {
  if (max === null) return 'Onbeperkt vestigingen'
  return max === 1 ? '1 vestiging' : `Tot ${max} vestigingen`
}

function PakketKaart({ pakket }: { pakket: Pakket }) {
  return (
    <article className="ayg-pakket" data-aanbevolen={pakket.aanbevolen ? '' : undefined} aria-labelledby={`pakket-${pakket.sleutel}`}>
      <div className="ayg-stapel">
        <div className="ayg-pakket-kop">
          <h2 className="ayg-pakket-naam" id={`pakket-${pakket.sleutel}`}>
            {pakket.naam}
          </h2>
          {pakket.aanbevolen && <span className="ayg-badge">Aanbevolen</span>}
        </div>
        <p className="ayg-klein">{pakket.voorWie}</p>
      </div>
      <div className="ayg-pakket-prijs">
        <strong>Prijs op maat</strong>
        <span>{vestigingen(pakket.maxVestigingen)}</span>
      </div>
      <ul className="ayg-vinklijst">
        {pakket.inbegrepen.map((i) => (
          <li key={i}>
            <Check size={16} aria-hidden />
            <span>{i}</span>
          </li>
        ))}
      </ul>
      <div className="ayg-knoppen">
        <Knop href={`${AANMELDEN}?pakket=${pakket.sleutel}`} soort={pakket.aanbevolen ? 'accent' : 'inkt'} pijl>
          Probeer gratis
        </Knop>
        <Knop href={`${AANMELDEN}?pakket=${pakket.sleutel}&soort=prijs`} soort="rand">
          Vraag een prijs op maat
        </Knop>
      </div>
    </article>
  )
}

const VRAGEN = [
  {
    vraag: 'Wat kost AI Your Gym?',
    antwoord:
      'Dat hangt af van het pakket en het aantal vestigingen. Vraag een prijs op maat aan, dan krijg je een prijs die past bij je sportschool.',
  },
  {
    vraag: 'Hoe werkt de proefperiode?',
    antwoord: `Je probeert AI Your Gym ${PROEFDAGEN} dagen gratis, met je eigen logo, kleuren en team. Zo zie je in je eigen club of het past.`,
  },
  {
    vraag: 'Zitten incasso en abonnementen erin?',
    antwoord:
      'Nee. AI Your Gym werkt naast je ledenadministratie. Incasso en abonnementen blijven daar, je leden lees je in met een CSV-bestand.',
  },
  {
    vraag: 'Komen er nieuwe functies bij?',
    antwoord: 'Ja. Elke maand nieuwe functies, automatisch voor iedereen. Je hoeft niets te installeren.',
  },
] as const

export default function PrijzenPagina() {
  return (
    <>
      <PaginaKop
        label="Prijzen"
        titel="Een prijs die past bij je sportschool."
        tekst={`Scherp geprijsd en op maat, voor een vestiging of een hele keten. Probeer eerst ${PROEFDAGEN} dagen gratis.`}
      />
      <section className="ayg-sectie--krap" aria-label="Pakketten">
        <div className="ayg-wrap">
          <div className="ayg-prijzen">
            {PAKKETTEN.map((p) => (
              <PakketKaart key={p.sleutel} pakket={p} />
            ))}
          </div>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="prijs-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="prijs-vragen-titel" label="Vragen" titel="Over pakketten en proberen." />
          <Vragen vragen={VRAGEN} />
        </div>
      </section>
      <AanmeldBand />
    </>
  )
}
