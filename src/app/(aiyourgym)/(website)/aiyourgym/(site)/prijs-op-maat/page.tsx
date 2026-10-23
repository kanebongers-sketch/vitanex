import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import '@/components/aiyourgym/demo-aanvraag/demo-aanvraag.css'
import { PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'
import { PrijsFormulier } from '@/components/aiyourgym/prijs/PrijsFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { AANMELDEN } from '@/components/aiyourgym/site/paden'

// /aiyourgym/prijs-op-maat: een prijs op maat aanvragen in drie stappen, zonder
// bedragen (besluit Kane). Uitleg hoe de prijs werkt staat ernaast. De aanvraag
// komt in ayg_demo_aanvragen en bij Kane op /club/platform; er gaat geen mail
// naar buiten. De poort zit in ../../layout.tsx.

export const metadata: Metadata = {
  title: 'Vraag een prijs op maat',
  description: 'Vraag in drie korte stappen een prijs op maat aan voor je sportschool. Per vestiging per maand, met een jaarcontract en nu zonder opstartkosten.',
}

/** Hoe de prijs werkt, zonder bedragen. Zelfde afspraken als VRAAG_CONTRACT. */
const HOE = [
  { titel: 'Per vestiging, per maand', tekst: 'Je betaalt per vestiging. Het pakket bepaalt wat erin zit.' },
  { titel: 'Jaarcontract, maandelijks betaald', tekst: 'Het abonnement loopt een jaar, je betaalt elke maand.' },
  { titel: 'Nu geen opstartkosten', tekst: 'Inrichten kost je nu niets extra. In Club en Keten helpen we je er persoonlijk bij.' },
  { titel: 'Altijd vooraf duidelijk', tekst: 'Je ziet het bedrag voordat je iets betaalt.' },
] as const

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

export default async function PrijsOpMaatPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const startPakket = vindPakket(typeof zoek.pakket === 'string' ? zoek.pakket : null)?.sleutel ?? null
  return (
    <div className="ayg-wrap aan-pagina">
      <header className="aan-intro ayg-intro">
        <p className="ayg-label ayg-label--accent">Prijs op maat</p>
        <h1 className="aan-titel">Een prijs die past bij je sportschool.</h1>
        <p className="ayg-lead">Drie korte vragen over je club, dan sturen we je een prijs op maat. Vrijblijvend, binnen een werkdag.</p>
      </header>
      <div className="aan-raster">
        <PrijsFormulier startPakket={startPakket} />
        <aside className="aan-samen ayg-podium dem-samen" aria-labelledby="prijs-hoe-titel">
          <p className="aan-samen-label" id="prijs-hoe-titel">
            Zo werkt de prijs
          </p>
          <ol className="dem-stappen">
            {HOE.map((h, i) => (
              <li key={h.titel}>
                <span className="dem-stap-nr" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h2>{h.titel}</h2>
                  <p>{h.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="dem-anders">
            <p>Eerst zelf zien of het past?</p>
            <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
              Probeer {PROEFDAGEN} dagen gratis <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <Geruststelling aantal={3} />
        </aside>
      </div>
    </div>
  )
}
