import type { Metadata } from 'next'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { InstellingenOnderdeel } from '@/components/club/instellingen/InstellingenOnderdeel'

export const metadata: Metadata = { title: 'Weekrooster' }

export default async function WeekroosterPagina({ searchParams }: { searchParams: ZoekParams }) {
  return <InstellingenOnderdeel onderdeel="weekrooster" zoek={await searchParams} />
}
