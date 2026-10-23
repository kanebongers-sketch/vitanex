import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { magAandachtspuntenBeheren } from '@/lib/lifeos/leads/links'
import { haalTrainers } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { beheerOverzicht } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { haalAandachtspunten, haalAlleKledingmaten, haalGedaanPerPunt } from '@/lib/lifeos/pt-dashboard/belangrijk-opslag'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { BeheerPaneel } from '@/components/lifeos/pt-beheer/BeheerPaneel'
import { BelangrijkBeheer } from '@/components/lifeos/pt-beheer/BelangrijkBeheer'

// /<beheerder>/beheer — alleen voor de beheerder (Kane); anderen krijgen een 404.
// De layout regelt het inloggen (via zijn hoofdaccount). Bovenaan "Belangrijk":
// de algemene punten op het startscherm van elke PT'er.

export const metadata: Metadata = { title: 'Beheer · Fit Factory PT' }

export default async function BeheerPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (s.link.rol !== 'beheerder') notFound()
  return (
    <>
      <FfHero boventitel="Fit Factory PT · beheer" titel="Beheer" />
      <BelangrijkSectie code={s.link.code} />
      <BeheerPaneel code={s.link.code} />
    </>
  )
}

async function BelangrijkSectie({ code }: { code: string }) {
  const s = await ptSessie(code)
  if (!s?.ingelogd || !magAandachtspuntenBeheren(s.link.rol)) return null
  // Alleen de PT'ers: Kane zelf krijgt geen "Belangrijk" op een startscherm.
  const [punten, pts, maten] = await Promise.all([
    haalAandachtspunten(s.admin, s.link.userId),
    haalTrainers(s.admin, s.link.userId, { metBeheerder: false }),
    haalAlleKledingmaten(s.admin, s.link.userId),
  ])
  const gedaanPerPunt = punten ? await haalGedaanPerPunt(s.admin, punten.map((p) => p.id)) : null
  if (!punten || !pts || !maten || !gedaanPerPunt) return <Foutmelding bericht="De belangrijke punten konden niet geladen worden. Vernieuw de pagina." />
  const o = beheerOverzicht(punten, gedaanPerPunt, pts, maten)
  return <BelangrijkBeheer code={code} punten={punten} gedaan={o.gedaan} aantalPts={pts.length} zonderMaten={o.zonderMaten} />
}
