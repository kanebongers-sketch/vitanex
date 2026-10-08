import type { Metadata } from 'next'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalKennisLijst, haalZoekbron } from '@/lib/lifeos/pt-dashboard/kennis-opslag'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { KennisZoek } from '@/components/lifeos/pt-dashboard/kennis/KennisZoek'
import { DocumentenKaart, KennisKaarten } from '@/components/lifeos/pt-dashboard/kennis/KennisKaarten'

// /<naam>/bibliotheek — de kennisbank: zoeken door alles, de originele
// documenten, en de leesbare Fit Factory PT-documenten per categorie. De layout
// regelt de pincode; zonder sessie rendert dit niets.

export const metadata: Metadata = { title: 'Kennisbank · Fit Factory PT' }

export default async function BibliotheekPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null

  const [lijst, zoekbron] = await Promise.all([haalKennisLijst(s.admin, s.link.userId), haalZoekbron(s.admin, s.link.userId)])
  const code = s.link.code

  return (
    <>
      <FfHero boventitel="Fit Factory PT · naslag" titel="Kennisbank">
        <p className="ff-hero-sub">Het protocol, de intake, de abonnementen, de Fit Guide, de PT Academy en de handleiding, op één plek.</p>
      </FfHero>
      {lijst.ok && zoekbron.ok && lijst.waarde.length > 0 ? <KennisZoek code={code} docs={zoekbron.waarde} /> : null}
      <DocumentenKaart code={code} />
      {!lijst.ok ? (
        <Foutmelding bericht="De kennisbank kon niet geladen worden. Vernieuw de pagina." />
      ) : lijst.waarde.length === 0 ? (
        <p className="ptd-leeg">Kane zet de kennisbank binnenkort klaar.</p>
      ) : (
        <KennisKaarten code={code} items={lijst.waarde} />
      )}
    </>
  )
}
