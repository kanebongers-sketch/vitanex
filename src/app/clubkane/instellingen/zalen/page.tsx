import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel } from '@/components/club/instellingen/InstellingenOnderdeel'

export const metadata: Metadata = { title: 'Zalen' }

export default async function ZalenPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="zalen" zoek={await searchParams} />
}
