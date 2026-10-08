import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalKennisItem } from '@/lib/lifeos/pt-dashboard/kennis-opslag'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { KennisLezer } from '@/components/lifeos/pt-dashboard/kennis/KennisLezer'

// /<naam>/bibliotheek/<slug> — één kennisitem lezen. De layout regelt de
// pincode; zonder sessie rendert dit niets (en lekt ook de titel niet).

interface Props {
  params: Promise<{ pt: string; slug: string }>
}

async function laad(pt: string, slug: string) {
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  return { code: s.link.code, item: await haalKennisItem(s.admin, s.link.userId, slug) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pt, slug } = await params
  const g = await laad(pt, slug)
  // Pas na de pincode de echte titel: interne documenttitels horen niet in een open tabblad.
  return g?.item.ok && g.item.waarde ? { title: `${g.item.waarde.titel} · Kennisbank` } : {}
}

export default async function KennisPagina({ params }: Props) {
  const { pt, slug } = await params
  const g = await laad(pt, slug)
  if (!g) return null
  if (!g.item.ok) return <Foutmelding bericht="Dit onderdeel kon niet geladen worden. Vernieuw de pagina." />
  if (!g.item.waarde) notFound()
  return <KennisLezer code={g.code} item={g.item.waarde} />
}
