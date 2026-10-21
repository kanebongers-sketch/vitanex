import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, MessagesSquare, PhoneCall } from 'lucide-react'
import '@/components/aiyourgym/aanmelden/aanmelden.css'
import '@/components/aiyourgym/demo-aanvraag/demo-aanvraag.css'
import { DEMO_SOORTEN, type DemoSoort } from '@/lib/aiyourgym/demo-aanvraag'
import { AYG_CONTACT, telLink } from '@/lib/aiyourgym/contact'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { DemoFormulier } from '@/components/aiyourgym/demo-aanvraag/DemoFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'

// /aiyourgym/demo-aanvragen: een persoonlijke, vrijblijvende demo aanvragen.
// De tweede route naast zelf gratis proberen. De aanvraag komt bij Kane op
// /club/platform; er gaat geen mail naar buiten. De poort (alleen Kane
// zolang de website uit staat) zit in ../../layout.tsx.

export const metadata: Metadata = {
  title: 'Plan een gratis demo',
  description: 'Vraag een gratis, vrijblijvende demo van AI Your Gym aan. We nemen binnen een werkdag contact op en laten zien hoe het werkt voor jouw sportschool.',
}

const STAPPEN = [
  { Icoon: PhoneCall, titel: 'We nemen contact op', tekst: 'Binnen een werkdag bellen of mailen we je, op het moment dat jij aangeeft.' },
  { Icoon: CalendarCheck, titel: 'We plannen de demo', tekst: 'Op een moment dat jou uitkomt. Neem gerust je clubmanager of een trainer mee.' },
  { Icoon: MessagesSquare, titel: 'We laten het zien', tekst: 'Toegespitst op jouw soort sportschool, met ruimte voor al je vragen. Daarna beslis je zelf.' },
] as const

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function startSoort(waarde: string | string[] | undefined): DemoSoort | null {
  return DEMO_SOORTEN.find((s) => s.sleutel === waarde)?.sleutel ?? null
}

export default async function DemoAanvragenPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const telefoon = AYG_CONTACT.telefoon?.trim() || null
  const email = AYG_CONTACT.email?.trim() || null
  return (
    <div className="ayg-wrap aan-pagina">
      <header className="aan-intro ayg-intro">
        <p className="ayg-label ayg-label--accent">Gratis en vrijblijvend</p>
        <h1 className="aan-titel">Plan een gratis demo.</h1>
        <p className="ayg-lead">
          Liever eerst samen kijken? We laten je AI Your Gym persoonlijk zien, ingericht op jouw soort sportschool. We nemen binnen een werkdag contact op.
        </p>
      </header>
      <div className="aan-raster">
        <DemoFormulier startSoort={startSoort(zoek.soort)} />
        <aside className="aan-samen ayg-podium dem-samen" aria-labelledby="dem-zo-titel">
          <p className="aan-samen-label" id="dem-zo-titel">
            Zo gaat het
          </p>
          <ol className="dem-stappen">
            {STAPPEN.map(({ Icoon, titel, tekst }, i) => (
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
            ))}
          </ol>
          {(telefoon || email) && (
            <p className="dem-direct">
              Liever direct contact?{' '}
              {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
              {telefoon && email && ' · '}
              {email && <a href={`mailto:${email}`}>{email}</a>}
            </p>
          )}
          <div className="dem-anders">
            <p>Liever meteen zelf proberen?</p>
            <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
              Probeer {PROEFDAGEN} dagen gratis <ArrowRight size={17} aria-hidden />
            </Link>
            <Link href={DEMO} className="ayg-pijllink">
              Of bekijk de live demo <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <Geruststelling aantal={3} />
        </aside>
      </div>
    </div>
  )
}
