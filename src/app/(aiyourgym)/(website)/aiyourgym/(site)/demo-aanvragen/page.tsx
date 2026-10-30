import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, MessagesSquare, PhoneCall } from 'lucide-react'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import '@/components/aiyourgym/demo-aanvraag/demo-aanvraag.css'
import { DEMO_SOORTEN, type DemoSoort } from '@/lib/aiyourgym/demo-aanvraag'
import { AYG_CONTACT, telLink } from '@/lib/aiyourgym/contact'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { DEMO_AANVRAAG } from '@/lib/aiyourgym/taal/woorden/website/demo-aanvraag'
import { DemoFormulier } from '@/components/aiyourgym/demo-aanvraag/DemoFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// /aiyourgym/demo-aanvragen: een persoonlijke, vrijblijvende demo aanvragen.
// De tweede route naast meteen aanmelden. De aanvraag komt bij Kane op
// /club/platform; er gaat geen mail naar buiten. De poort (alleen Kane
// zolang de website uit staat) zit in ../../layout.tsx. Teksten in de taal van
// de pagina (DEMO_AANVRAAG).

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(DEMO_AANVRAAG)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

const ICONEN = [PhoneCall, CalendarCheck, MessagesSquare] as const

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function startSoort(waarde: string | string[] | undefined): DemoSoort | null {
  return DEMO_SOORTEN.find((s) => s.sleutel === waarde)?.sleutel ?? null
}

export default async function DemoAanvragenPagina({ searchParams }: PaginaProps) {
  const [zoek, taal] = await Promise.all([searchParams, getSiteTaal()])
  const t = DEMO_AANVRAAG[taal]
  const actie = ACTIE[taal]
  const { AANMELDEN, DEMO } = SITE_PADEN
  const telefoon = AYG_CONTACT.telefoon?.trim() || null
  const email = AYG_CONTACT.email?.trim() || null
  return (
    <div className="ayg-wrap aan-pagina">
      <header className="aan-intro ayg-intro">
        <p className="ayg-label ayg-label--accent">{t.label}</p>
        <h1 className="aan-titel">{t.titel}</h1>
        <p className="ayg-lead">{t.lead}</p>
      </header>
      <div className="aan-raster">
        <DemoFormulier startSoort={startSoort(zoek.soort)} />
        <aside className="aan-samen ayg-podium dem-samen" aria-labelledby="dem-zo-titel">
          <p className="aan-samen-label" id="dem-zo-titel">
            {t.zoGaatHet}
          </p>
          <ol className="dem-stappen">
            {t.stappen.map(({ titel, tekst }, i) => {
              const Icoon = ICONEN[i] ?? PhoneCall
              return (
                <li key={titel}>
                  <span className="dem-stap-nr" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h2>
                      <Icoon size={16} aria-hidden /> {titel}
                    </h2>
                    <p>{tekst}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          {(telefoon || email) && (
            <p className="dem-direct">
              {t.direct}{' '}
              {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
              {telefoon && email && ' · '}
              {email && <a href={`mailto:${email}`}>{email}</a>}
            </p>
          )}
          <div className="dem-anders">
            <p>{t.zelfProberen}</p>
            <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
              {actie.start} <ArrowRight size={17} aria-hidden />
            </Link>
            <Link href={DEMO} className="ayg-pijllink">
              {actie.ofLiveDemo} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <Geruststelling aantal={3} />
        </aside>
      </div>
    </div>
  )
}
