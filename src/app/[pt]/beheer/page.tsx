import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { BeheerPaneel } from '@/components/lifeos/pt-beheer/BeheerPaneel'

// /<beheerder>/beheer — alleen voor de beheerder (Kane); anderen krijgen een 404.
// De layout regelt het inloggen (via zijn hoofdaccount).

export const metadata: Metadata = { title: 'Beheer · Fit Factory PT' }

export default async function BeheerPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (s.link.rol !== 'beheerder') notFound()
  return (
    <>
      <FfHero boventitel="Fit Factory PT · beheer" titel="Beheer" />
      <BeheerPaneel />
    </>
  )
}
