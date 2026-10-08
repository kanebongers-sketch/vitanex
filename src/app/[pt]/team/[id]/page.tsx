import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { EigenaarPt } from '@/components/lifeos/pt-eigenaar/EigenaarPt'

// /<eigenaar>/team/<id> — één PT'er door de ogen van de eigenaar (alleen lezen).
// Alleen voor een eigenaar; een PT'er krijgt hier een 404. De layout regelt de pincode.

interface Props {
  params: Promise<{ pt: string; id: string }>
}

export const metadata: Metadata = { title: 'PT\'er · Fit Factory PT' }

export default async function TeamLidPagina({ params }: Props) {
  const { pt, id } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (s.link.rol !== 'eigenaar') notFound()
  return <EigenaarPt code={s.link.code} id={id} />
}
