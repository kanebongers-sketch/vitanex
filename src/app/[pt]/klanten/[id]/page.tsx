import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptGegevens, ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalIntake, haalMetingen, haalNotities } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { kijktMee } from '@/lib/lifeos/leads/links'
import { Dossier } from '@/components/lifeos/pt-dashboard/dossier/Dossier'
import { leesDossierTab } from '@/components/lifeos/pt-dashboard/dossier/tabs'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarDossier } from '@/components/lifeos/pt-eigenaar/EigenaarDossier'

// /<naam>/klanten/<id> — het dossier van één PT-klant: traject, intake,
// metingen, logboek en vaste notitie. Alleen klanten van de ingelogde PT'er; een onbekende
// of andermans klant geeft een 404. Een eigenaar ziet elk dossier van het team, alleen lezen.

interface Props {
  params: Promise<{ pt: string; id: string }>
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}

// Geen klantnaam in de titel: die belandt in tabbladen, geschiedenis en schermdeling.
export const metadata: Metadata = { title: 'Klantdossier · Fit Factory PT' }

export default async function KlantDossierPagina({ params, searchParams }: Props) {
  const [{ pt, id }, zoek] = await Promise.all([params, searchParams])
  const [g, s] = await Promise.all([ptGegevens(pt), ptSessie(pt)])
  if (s?.ingelogd && kijktMee(s.link.rol)) return <EigenaarDossier code={s.link.code} id={id} startTab={leesDossierTab(zoek.tab)} />
  if (!g || !s) return null
  if (!g.klanten) return <Foutmelding bericht="Je klanten konden niet geladen worden. Vernieuw de pagina." />
  const klant = isUuid(id) ? g.klanten.find((k) => k.id === id) : undefined
  if (!klant) notFound()

  const [intake, metingen, notities] = await Promise.all([haalIntake(s.admin, g.link, klant.id), haalMetingen(s.admin, g.link, klant.id), haalNotities(s.admin, g.link, klant.id)])
  if (!intake.ok || !metingen.ok || !notities.ok) return <Foutmelding bericht="Het dossier kon niet geladen worden. Vernieuw de pagina." />

  return (
    <Dossier
      key={klant.id}
      code={g.link.code}
      vandaag={g.vandaag}
      klant={klant}
      intake={intake.waarde}
      metingen={metingen.waarde}
      notities={notities.waarde}
      startTab={leesDossierTab(zoek.tab)}
    />
  )
}
