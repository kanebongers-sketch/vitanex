import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { PtNav } from '@/components/lifeos/pt-dashboard/PtNav'
import { PinPoort } from '@/components/lifeos/pt-dashboard/PinPoort'
import { UitlogKnop } from '@/components/lifeos/pt-dashboard/UitlogKnop'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { FIT_FACTORY } from '@/components/marketing/theme'
import { manifestPad } from '@/lib/lifeos/pt-dashboard/manifest'
import { barlow, inter } from '@/app/fonts/fit-factory'

// mentaforce.nl/<naam> — de app van één Fit Factory PT'er (bv. /joey): overzicht,
// leads, klanten, coachgesprek en de kennisbank met de Fit Factory PT-documenten.
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
    // Op het beginscherm zetten: eigen manifest per PT'er (start op /<naam>).
    ...(s
      ? {
          manifest: manifestPad(s.link.code),
          appleWebApp: { capable: true, title: 'Fit Factory PT', statusBarStyle: 'black' as const },
          icons: { apple: '/icons/apple-touch-icon.png' },
          other: { 'apple-mobile-web-app-capable': 'yes' },
        }
      : {}),
  }
}

export const viewport: Viewport = { themeColor: FIT_FACTORY.zwart }

export default async function PtLayout({ children, params }: Props) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s) notFound()

  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
        <div className="ff-balk-rechts">
          <span className="ff-wie">{s.link.naam}</span>
          {s.ingelogd ? <UitlogKnop code={s.link.code} /> : null}
        </div>
      </header>
      {s.ingelogd ? <PtNav code={s.link.code} /> : null}
      <div className="ptd ff-inhoud">
        {s.ingelogd ? (
          children
        ) : (
          <>
            <FfHero boventitel="Personal Training · jouw app" titel={`Hoi ${s.link.naam}`} />
            <PinPoort code={s.link.code} pinStatus={s.link.pinStatus} />
          </>
        )}
        <footer className="ff-voet">
          <span>
            Alleen zichtbaar voor jou en Kane. Vul van leads alleen in wat nodig is om op te volgen, en vraag of je diegene mag
            benaderen. Gegevens staan in de EU.
          </span>
          <span>Fit Factory Personal Training · app door MentaForce</span>
        </footer>
      </div>
    </main>
  )
}
