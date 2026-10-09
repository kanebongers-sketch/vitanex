import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { haalActieveLinks } from '@/lib/lifeos/leads/links'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { barlow, inter } from '@/app/fonts/fit-factory'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { PT_FAVICON } from '@/lib/fit-factory/domein'

// /FitFactoryPT (voorheen /lead) — de ingang voor het Fit Factory PT-team: tik je naam aan en je komt in
// je eigen app (/<naam>). Alleen voornamen; de gegevens zitten achter de pincode
// van elke PT'er.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fit Factory PT',
  description: 'De app van het Fit Factory Personal Training-team.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  icons: { icon: PT_FAVICON, apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default async function LeadStart() {
  const team = await haalActieveLinks(createLifeosAdminClient()).catch(() => null)

  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
      </header>
      <div className="ptd ff-smal">
        <FfHero boventitel="Personal Training · team-app" titel="Wie ben jij?">
          <p className="ff-hero-sub">
            Kies je naam. De eerste keer kies je een pincode van 6 cijfers; zodra Kane die goedkeurt, staat je app klaar.
          </p>
        </FfHero>

        {team === null ? (
          <p role="alert" className="ptd-leeg">Het team kon niet geladen worden. Vernieuw de pagina.</p>
        ) : team.length === 0 ? (
          <p className="ptd-leeg">Er staan nog geen PT&apos;ers klaar.</p>
        ) : (
          <nav aria-label="PT-team">
            <ul className="ptd-lijst">
              {team.map((p) => (
                <li key={p.code}>
                  <Link href={`/${p.code}`} className="lead-naam">
                    <span>{p.naam}</span>
                    <ChevronRight size={20} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
