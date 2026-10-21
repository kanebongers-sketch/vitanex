import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { zietKleding } from '@/lib/lifeos/leads/links'
import { haalKleding } from '@/lib/lifeos/pt-dashboard/kleding-opslag'
import { haalTrainers } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { kledingTotalen } from '@/lib/lifeos/pt-dashboard/kleding'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { VoorraadTabel } from '@/components/lifeos/pt-kleding/VoorraadTabel'
import { BezitLijst } from '@/components/lifeos/pt-kleding/BezitLijst'
import { ArtikelFormulier, UitgifteFormulier } from '@/components/lifeos/pt-kleding/KledingFormulieren'

// /<eigenaar|beheerder>/kleding — welke kleding elke PT'er heeft en de voorraad
// in Eersel. Kane (beheerder) registreert; eigenaren kijken mee. Anderen: 404.
// De layout regelt het inloggen.

export const metadata: Metadata = { title: 'Kleding · Fit Factory PT' }

export default async function KledingPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (!zietKleding(s.link.rol)) notFound()

  const [kleding, team] = await Promise.all([haalKleding(s.admin, s.link.userId), haalTrainers(s.admin, s.link.userId)])
  if (!kleding || !team) return <Foutmelding bericht="De kleding kon niet geladen worden. Vernieuw de pagina." />
  const beheerder = s.link.rol === 'beheerder'
  const t = kledingTotalen(kleding.voorraad, kleding.uitgiftes)

  return (
    <>
      <FfHero boventitel="Fit Factory PT · kleding" titel="Kleding">
        <p className="ff-hero-sub">
          Welke kleding elke PT&apos;er heeft en wat er in Eersel op voorraad ligt.{beheerder ? '' : ' Kane houdt dit bij; jij kijkt mee.'}
        </p>
      </FfHero>
      <div className="ptd-tegels">
        <Tegel getal={String(t.opVoorraad)} label="Op voorraad" uitleg="in Eersel" />
        <Tegel getal={String(t.uitgegeven)} label="Bij PT'ers" uitleg="nog niet terug" />
        <Tegel getal={String(kleding.artikelen.length)} label="Artikelen" uitleg="soorten kleding" />
      </div>

      <section className="ptd-sectie" aria-labelledby="kl-voorraad-kop">
        <div className="ptd-sectiekop">
          <h2 id="kl-voorraad-kop">Voorraad Eersel</h2>
          <span>{beheerder ? 'pas een aantal aan en druk op Enter' : 'per artikel en maat'}</span>
        </div>
        <VoorraadTabel artikelen={kleding.artikelen} voorraad={kleding.voorraad} magBewerken={beheerder} />
        {beheerder ? <ArtikelFormulier /> : null}
      </section>

      {beheerder ? (
        <section className="ptd-sectie" aria-labelledby="kl-uit-sectie">
          <h2 id="kl-uit-sectie" className="sr-only">Uitgeven</h2>
          <UitgifteFormulier artikelen={kleding.artikelen} voorraad={kleding.voorraad} team={team} vandaag={dagSleutelNl(new Date())} />
        </section>
      ) : null}

      <section className="ptd-sectie" aria-labelledby="kl-bezit-kop">
        <div className="ptd-sectiekop">
          <h2 id="kl-bezit-kop">Per PT&apos;er</h2>
          <span>wat ze nu hebben</span>
        </div>
        <BezitLijst artikelen={kleding.artikelen} uitgiftes={kleding.uitgiftes} team={team} magBewerken={beheerder} />
      </section>
    </>
  )
}
