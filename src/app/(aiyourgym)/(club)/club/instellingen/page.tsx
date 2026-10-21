import { redirect } from 'next/navigation'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { INSTELLINGEN_ONDERDELEN } from '@/components/club/instellingen/InstellingenOnderdeel'

// Vroeger een pagina Instellingen met tabbladen. Elk tabblad is nu een eigen
// instel-pagina in het instellingencentrum. Oude links blijven werken:
// ?tab=zalen gaat naar /club/instellingen/zalen, zonder tab naar het
// instellingencentrum. De vestiging (?v=) gaat mee.

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function InstellingenDoorsturen({ searchParams }: { searchParams: ZoekParams }) {
  const zoek = await searchParams
  const tab = eerste(zoek.tab)
  const v = eerste(zoek.v)
  const vraag = v ? `?v=${encodeURIComponent(v)}` : ''
  const doel = INSTELLINGEN_ONDERDELEN.find((x) => x === tab)
  redirect(doel ? `/club/instellingen/${doel}${vraag}` : `/club/beheer${vraag}`)
}
