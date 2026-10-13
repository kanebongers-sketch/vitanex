import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { haalIngangen } from '@/lib/lifeos/leads/links'
import { clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { barlow, inter } from '@/app/fonts/fit-factory'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { PT_FAVICON } from '@/lib/fit-factory/domein'

// /FitFactoryPT (op fitfactorypt.nl de homepage) — de ingang van de PT-app.
// Eerst je rol (PT'er, clubmanager, eigenaar, manager PT), dan je naam; daarna
// je eigen pagina (/<naam>) met je pincode. Manager PT (Kane) gaat direct naar
// zijn beheerderspagina en logt in met zijn hoofdaccount. Alleen voornamen; de
// gegevens zitten achter de pincode.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fit Factory PT',
  description: 'De app van het Fit Factory Personal Training-team.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  icons: { icon: PT_FAVICON, apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

const ROLLEN = [
  { rol: 'pt', titel: "PT'er", uitleg: 'Je eigen leads, klanten en dossiers.' },
  { rol: 'clubmanager', titel: 'Clubmanager', uitleg: "De PT in jouw club: leads, klanten en prestaties per PT'er." },
  { rol: 'eigenaar', titel: 'Eigenaar', uitleg: 'Het hele PT-team, alle clubs.' },
] as const

interface Props {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}

export default async function LeadStart({ searchParams }: Props) {
  const ruw = (await searchParams).rol
  const gekozen = ROLLEN.find((r) => r.rol === ruw) ?? null
  const iedereen = gekozen ? await haalIngangen(createLifeosAdminClient()).catch(() => null) : []
  const lijst = iedereen?.filter((p) => p.rol === gekozen?.rol) ?? null

  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
      </header>
      <div className="ptd ff-smal">
        <FfHero boventitel="Personal Training · team-app" titel={gekozen ? `${gekozen.titel}: wie ben jij?` : 'Wie ben jij?'}>
          <p className="ff-hero-sub">
            {gekozen
              ? 'Kies je naam. De eerste keer kies je een pincode van 6 cijfers; zodra Kane die goedkeurt, staat je app klaar.'
              : 'Kies eerst wat je doet bij Fit Factory Personal Training.'}
          </p>
        </FfHero>

        {!gekozen ? (
          <nav aria-label="Kies je rol">
            <ul className="ptd-lijst">
              {ROLLEN.map((r) => (
                <li key={r.rol}>
                  <Link href={`?rol=${r.rol}`} className="lead-naam">
                    <span>{r.titel}<small className="lead-uitleg">{r.uitleg}</small></span>
                    <ChevronRight size={20} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={PT_APP_BEHEER} className="lead-naam" prefetch={false}>
                  <span>Manager PT<small className="lead-uitleg">Beheer van de PT-app; inloggen met je hoofdaccount.</small></span>
                  <ChevronRight size={20} strokeWidth={2.2} aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>
        ) : lijst === null ? (
          <p role="alert" className="ptd-leeg">De namen konden niet geladen worden. Vernieuw de pagina.</p>
        ) : (
          <>
            {lijst.length === 0 ? (
              <p className="ptd-leeg">Hier staat nog niemand klaar. Vraag Kane om je toe te voegen.</p>
            ) : (
              <nav aria-label={gekozen.titel}>
                <ul className="ptd-lijst">
                  {lijst.map((p) => (
                    <li key={p.code}>
                      <Link href={`/${p.code}`} className="lead-naam">
                        <span>{p.naam}{p.clubs.length > 0 ? <small className="lead-uitleg">{clubsLabel(p.clubs)}</small> : null}</span>
                        <ChevronRight size={20} strokeWidth={2.2} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <p className="ptd-hint"><Link href="?" className="ptd-link">← Andere rol kiezen</Link></p>
          </>
        )}

        <p className="ptd-hint">
          Zet je eigen pagina op je beginscherm (fitfactorypt.nl/jouwnaam) — dan opent hij als app.
        </p>
        <footer className="ff-voet">
          <span>Fit Factory Personal Training</span>
          <FfMaker />
        </footer>
      </div>
    </main>
  )
}
