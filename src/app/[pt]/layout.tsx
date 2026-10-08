import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { PtNav } from '@/components/lifeos/pt-dashboard/PtNav'
import { PinPoort } from '@/components/lifeos/pt-dashboard/PinPoort'
import { UitlogKnop } from '@/components/lifeos/pt-dashboard/UitlogKnop'
import { COLORS } from '@/components/marketing/theme'
import { manifestPad } from '@/lib/lifeos/pt-dashboard/manifest'

// mentaforce.nl/<naam> — het dashboard van één Fit Factory PT'er (bv. /joey):
// overzicht, leads en PT-klanten met abonnement. Vaste pagina's (/login, /lead, …)
// winnen altijd van dit dynamische segment; een onbekende naam geeft een 404.
// Alles achter de pincode die de PT'er zelf kiest en Kane goedkeurt.

interface Props {
  children: ReactNode
  params: Promise<{ pt: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const s = await ptSessie((await params).pt)
  return {
    title: s ? `${s.link.naam} · PT-dashboard` : 'PT-dashboard',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
    // Op het beginscherm zetten: eigen manifest per PT'er (start op /<naam>).
    ...(s
      ? {
          manifest: manifestPad(s.link.code),
          appleWebApp: { capable: true, title: s.link.naam, statusBarStyle: 'black' as const },
          icons: { apple: '/icons/apple-touch-icon.png' },
          other: { 'apple-mobile-web-app-capable': 'yes' },
        }
      : {}),
  }
}

export const viewport: Viewport = { themeColor: COLORS.navy }

export default async function PtLayout({ children, params }: Props) {
  const { pt } = await params
  // /fitfactorypt, /FITFACTORYPT, … → de echte ingang (pagina-routes zijn wél hoofdlettergevoelig).
  if (pt.toLowerCase() === 'fitfactorypt') redirect('/FitFactoryPT')
  const s = await ptSessie(pt)
  if (!s) notFound()

  return (
    <main className="lifeos-root" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <div className="ptd">
        <header className="ptd-kop">
          <div>
            <p className="ptd-merk">MENTAFORCE<b>.</b> · FIT FACTORY PT</p>
            <h1 className="ptd-titel">Hoi {s.link.naam}</h1>
          </div>
          {s.ingelogd ? <UitlogKnop code={s.link.code} /> : null}
        </header>
        {s.ingelogd ? (
          <>
            <PtNav code={s.link.code} />
            {children}
          </>
        ) : (
          <PinPoort code={s.link.code} pinStatus={s.link.pinStatus} />
        )}
        <footer className="ptd-hint ptd-voet">
          Alleen zichtbaar voor jou en Kane. Vul van leads alleen in wat nodig is om op te volgen, en vraag of je diegene mag
          benaderen. Gegevens staan in de EU.
        </footer>
      </div>
    </main>
  )
}
