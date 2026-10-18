import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { DOELGROEPEN, type Doelgroep, type DoelgroepSleutel } from '@/components/aiyourgym/inhoud/doelgroepen'
import { PersoneelScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur, RepdbBron } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { CheckinScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'

export const metadata: Metadata = {
  title: 'Voor wie',
  description:
    'AI Your Gym voor een zelfstandige sportschool, een boutique studio, een PT-studio of een keten: wat elk soort sportschool aan de software heeft.',
}

const BEELD: Record<DoelgroepSleutel, { label: string; inhoud: ReactNode; bron?: ReactNode }> = {
  zelfstandig: { label: 'De check-in met de leden die net binnen zijn en hun status', inhoud: <CheckinScherm /> },
  boutique: { label: 'Een week van het lesrooster met de bezetting per les en volle lessen met wachtlijst', inhoud: <RoosterScherm /> },
  'pt-studio': { label: 'Een oefening met bewegende illustratie, genummerde kernpunten, ademhaling en tempo', inhoud: <Oefening />, bron: <RepdbBron /> },
  keten: { label: 'Het personeelsrooster met diensten en de status van de uren', inhoud: <PersoneelScherm /> },
}

const AANPASSEN = [
  { titel: 'Onderdelen aan of uit', tekst: 'Wat je niet gebruikt zet je uit. Dan zien je team en je leden het nergens.' },
  { titel: 'Eigen oefeningen en coaching', tekst: 'Begin met onze bibliotheek en voeg je eigen oefeningen en coachteksten toe.' },
  { titel: 'Lessen, zalen en regels', tekst: 'Jouw lestypen, zalen, openingstijden en regels voor reserveren en annuleren.' },
  { titel: 'Jouw huisstijl', tekst: 'Naam, logo en accentkleur in de software en in de ledenapp.' },
] as const

function Groep({ doel, nr }: { doel: Doelgroep; nr: number }) {
  const beeld = BEELD[doel.sleutel]
  const pakket = vindPakket(doel.pakket)
  const donker = doel.sleutel === 'pt-studio'
  return (
    <section id={doel.sleutel} className={donker ? 'ayg-sectie ayg-podium ayg-groep' : 'ayg-sectie ayg-groep'} aria-labelledby={`${doel.sleutel}-titel`}>
      <div className="ayg-wrap ayg-groep-raster">
        <div className="ayg-groep-kop">
          <span className="ayg-groep-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </span>
          <p className="ayg-label ayg-label--accent">{doel.naam}</p>
          <h2 className="ayg-h2" id={`${doel.sleutel}-titel`}>
            {doel.kop}
          </h2>
          <p className="ayg-lead">{doel.wie}</p>
        </div>
        <div className="ayg-stapel">
          <ul className="ayg-vinklijst ayg-vinklijst--groot">
            {doel.punten.map((p) => (
              <li key={p}>
                <Check size={16} aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {pakket && (
            <p className="ayg-past">
              Past meestal bij <strong>{pakket.naam}</strong>
              <span aria-hidden> · </span>
              <Link href={`${AANMELDEN}?pakket=${pakket.sleutel}`}>Probeer {pakket.naam} gratis</Link>
            </p>
          )}
          <Figuur className="ayg-groep-beeld ayg-onthul" label={beeld.label} bijschrift={beeld.bron}>
            {beeld.inhoud}
          </Figuur>
        </div>
      </div>
    </section>
  )
}

export default function VoorWiePagina() {
  return (
    <>
      <PaginaKop
        label="Voor wie"
        titel="Voor elke sportschool die het goed wil regelen."
        tekst="Een zelfstandige gym, een boutique studio, een PT-studio of een keten: dezelfde software, ingericht op jouw manier."
      >
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Probeer {PROEFDAGEN} dagen gratis
          </Knop>
          <Knop href={DEMO} soort="rand">
            Bekijk de demo
          </Knop>
        </div>
        <nav aria-label="Soorten sportscholen op deze pagina" className="ayg-ruim-boven">
          <ul className="ayg-inhoudsopgave">
            {DOELGROEPEN.map((d) => (
              <li key={d.sleutel}>
                <a href={`#${d.sleutel}`}>{d.naam}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PaginaKop>
      {DOELGROEPEN.map((d, i) => (
        <Groep key={d.sleutel} doel={d} nr={i + 1} />
      ))}
      <section className="ayg-sectie" aria-labelledby="aanpassen-titel">
        <div className="ayg-wrap">
          <SectieKop
            naast
            id="aanpassen-titel"
            label="Alles aan te passen"
            titel="Onze basis als start. Jouw club als eindresultaat."
            tekst="Je begint niet met een leeg scherm, maar met een ingerichte basis. Daarna maak je het helemaal van jezelf."
          />
          <ul className="ayg-aanpassen">
            {AANPASSEN.map((a, i) => (
              <li key={a.titel}>
                <span className="ayg-aanpassen-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="ayg-h3">{a.titel}</h3>
                <p>{a.tekst}</p>
              </li>
            ))}
          </ul>
          <SectieActie />
        </div>
      </section>
      <AanmeldBand titel="Welke sportschool je ook hebt: probeer het zelf." />
    </>
  )
}
