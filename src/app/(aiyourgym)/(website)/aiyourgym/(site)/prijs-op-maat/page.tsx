import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import '@/components/aiyourgym/demo-aanvraag/demo-aanvraag.css'
import { PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { PRIJS_OP_MAAT } from '@/lib/aiyourgym/taal/woorden/website/prijs-op-maat'
import { PrijsFormulier } from '@/components/aiyourgym/prijs/PrijsFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// /aiyourgym/prijs-op-maat: een prijs op maat aanvragen in drie stappen, zonder
// bedragen (besluit Kane). Uitleg hoe de prijs werkt staat ernaast (zelfde
// afspraken als VRAAG_CONTRACT). De aanvraag komt in ayg_demo_aanvragen en bij
// Kane op /club/platform; er gaat geen mail naar buiten. De poort zit in ../../layout.tsx.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(PRIJS_OP_MAAT)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

export default async function PrijsOpMaatPagina({ searchParams }: PaginaProps) {
  const [zoek, taal] = await Promise.all([searchParams, getSiteTaal()])
  const t = PRIJS_OP_MAAT[taal]
  const startPakket = vindPakket(typeof zoek.pakket === 'string' ? zoek.pakket : null)?.sleutel ?? null
  return (
    <div className="ayg-wrap aan-pagina">
      <header className="aan-intro ayg-intro">
        <p className="ayg-label ayg-label--accent">{t.label}</p>
        <h1 className="aan-titel">{t.titel}</h1>
        <p className="ayg-lead">{t.lead}</p>
      </header>
      <div className="aan-raster">
        <PrijsFormulier startPakket={startPakket} />
        <aside className="aan-samen ayg-podium dem-samen" aria-labelledby="prijs-hoe-titel">
          <p className="aan-samen-label" id="prijs-hoe-titel">
            {t.hoeTitel}
          </p>
          <ol className="dem-stappen">
            {t.hoe.map((h, i) => (
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
            <p>{t.eerstZien}</p>
            <Link href={SITE_PADEN.AANMELDEN} className="ayg-knop ayg-knop--accent">
              {ACTIE[taal].probeerDagen(PROEFDAGEN)} <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <Geruststelling aantal={3} />
        </aside>
      </div>
    </div>
  )
}
