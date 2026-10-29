import type { Metadata } from 'next'
import { instelPagina, instelPaginaInTaal, type InstelId } from '@/lib/club/kern/instel-paginas'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

/** De titel van een instel-pagina in de gekozen taal, voor generateMetadata. */
export async function instelMetadata(id: InstelId): Promise<Metadata> {
  const taal = await getTaal()
  const bron = instelPagina(id)
  return { title: bron ? instelPaginaInTaal(bron, taal).titel : BEHEER[taal].algemeen.instellingen }
}

/** De titel en uitleg van een instel-pagina in de gekozen taal, voor de paginakop. */
export async function instelKop(id: InstelId): Promise<{ titel: string; uitleg: string }> {
  const taal = await getTaal()
  const bron = instelPagina(id)
  return bron ? instelPaginaInTaal(bron, taal) : { titel: BEHEER[taal].algemeen.instellingen, uitleg: '' }
}
