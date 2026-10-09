import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { PtNav } from '@/components/lifeos/pt-dashboard/PtNav'
import { PinPoort } from '@/components/lifeos/pt-dashboard/PinPoort'
import { HoofdaccountLogin } from '@/components/lifeos/pt-dashboard/HoofdaccountLogin'
import { kijktMee } from '@/lib/lifeos/leads/links'
import { UitlogKnop } from '@/components/lifeos/pt-dashboard/UitlogKnop'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { manifestPad } from '@/lib/lifeos/pt-dashboard/manifest'
import { barlow, inter } from '@/app/fonts/fit-factory'
import { PAD_HEADER, PT_FAVICON, ptDoorsturen, ptUrl } from '@/lib/fit-factory/domein'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'

// fitfactorypt.nl/<naam> — de app van één Fit Factory PT'er (bv. /joey): overzicht,
// leads, klanten, coachgesprek en de kennisbank met de Fit Factory PT-documenten.
// Een eigenaar (rol `eigenaar`, bv. /ruben) krijgt dezelfde app over het hele team,
// alleen lezen — de pagina's kiezen zelf welke weergave. De beheerder (Kane) ziet
// dat ook, plus Beheer, en logt in via zijn hoofdaccount in plaats van een pincode.
// In de huisstijl van Fit Factory Personal Training (zie FIT_FACTORY in theme.ts).
// Vaste pagina's (/login, /lead, …) winnen altijd van dit dynamische segment; een
// onbekende naam geeft een 404. Alles achter de pincode die de PT'er zelf kiest
// en Kane goedkeurt.

interface Props {
  children: ReactNode
  params: Promise<{ pt: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const s = await ptSessie((await params).pt)
  return {
    title: s ? `${s.link.naam} · Fit Factory PT` : 'Fit Factory PT',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
    icons: { icon: PT_FAVICON, apple: '/icons/apple-touch-icon.png' },
    // Op het beginscherm zetten: eigen manifest per PT'er (start op /<naam>).
    ...(s
      ? {
          manifest: manifestPad(s.link.code),
          appleWebApp: { capable: true, title: 'Fit Factory PT', statusBarStyle: 'black' as const },
          other: { 'apple-mobile-web-app-capable': 'yes' },
        }
      : {}),
  }
}

const ROL_LABEL = { pt: 'jouw app', eigenaar: 'eigenaar', beheerder: 'beheerder' } as const

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default async function PtLayout({ children, params }: Props) {
  const { pt } = await params
  // /fitfactorypt, /FITFACTORYPT, … → de echte ingang (pagina-routes zijn wél hoofdlettergevoelig).
  if (pt.toLowerCase() === 'fitfactorypt') redirect('/FitFactoryPT')
  const s = await ptSessie(pt)
  if (!s) notFound()

  // Oude link (mentaforce.nl/<naam>/…)? Met de schakelaar aan door naar het eigen
  // domein, met pad en query — de proxy gaf het volledige pad mee in een header.
  const h = await headers()
  if (ptDoorsturen(h.get('x-forwarded-host') ?? h.get('host'), process.env.FIT_FACTORY_DOMEIN_ACTIEF === '1')) {
    permanentRedirect(ptUrl(h.get(PAD_HEADER) ?? `/${pt}`))
  }
  const eigenaar = kijktMee(s.link.rol)

  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
        <div className="ff-balk-rechts">
          <span className="ff-wie">{s.link.naam}</span>
          {s.ingelogd ? <UitlogKnop code={s.link.code} /> : null}
        </div>
      </header>
      {s.ingelogd ? <PtNav code={s.link.code} rol={s.link.rol} /> : null}
      <div className="ptd ff-inhoud">
        {s.ingelogd ? (
          children
        ) : (
          <>
            <FfHero boventitel={`Personal Training · ${ROL_LABEL[s.link.rol]}`} titel={`Hoi ${s.link.naam}`} />
            {s.link.rol === 'beheerder' ? <HoofdaccountLogin /> : <PinPoort code={s.link.code} pinStatus={s.link.pinStatus} />}
          </>
        )}
        <footer className="ff-voet">
          {s.link.rol === 'beheerder' ? (
            <span>Je beheert de PT-app van het hele team. Ga zorgvuldig om met de gegevens van leads en klanten. Gegevens staan in de EU.</span>
          ) : eigenaar ? (
            <span>
              Je kijkt mee met wat het PT-team invult; aanpassen doen de PT&apos;ers zelf. Ga zorgvuldig om met de gegevens van
              leads en klanten. Gegevens staan in de EU.
            </span>
          ) : (
            <span>
              Alleen zichtbaar voor jou, Kane en de eigenaren van Fit Factory. Vul van leads alleen in wat nodig is om op te
              volgen, en vraag of je diegene mag benaderen. Gegevens staan in de EU.
            </span>
          )}
          <span>Fit Factory Personal Training</span>
          <FfMaker />
        </footer>
      </div>
    </main>
  )
}
