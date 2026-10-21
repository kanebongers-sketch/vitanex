import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel } from '@/components/club/instellingen/InstellingenOnderdeel'

export const metadata: Metadata = { title: 'Vestigingen' }

export default async function VestigingenPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="vestigingen" zoek={await searchParams} />
}
