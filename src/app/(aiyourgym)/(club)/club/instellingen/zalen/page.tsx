import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel, instellingenMetadata } from '@/components/club/instellingen/InstellingenOnderdeel'

export async function generateMetadata(): Promise<Metadata> {
  return instellingenMetadata('zalen')
}

export default async function ZalenPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="zalen" zoek={await searchParams} />
}
