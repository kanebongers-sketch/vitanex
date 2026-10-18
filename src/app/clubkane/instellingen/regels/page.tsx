import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel } from '@/components/club/instellingen/InstellingenOnderdeel'

export const metadata: Metadata = { title: 'Regels en openingstijden' }

export default async function RegelsPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="regels" zoek={await searchParams} />
}
