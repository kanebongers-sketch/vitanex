import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { instelGroepLabel, instelPagina, instelPaginaInTaal, type InstelId } from '@/lib/club/kern/instel-paginas'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// Boven elke instel-pagina: terug naar Instellingen en waar je bent
// (Instellingen › groep › pagina). Een plek per ding, altijd dezelfde weg terug.

interface InstelKruimelProps {
  /** Het id uit INSTEL_PAGINAS (src/lib/club/kern/instel-paginas.ts). */
  id: InstelId
  /** De gekozen vestiging, zodat je terugkomt bij dezelfde vestiging. */
  vestiging?: string | null
}

export async function InstelKruimel({ id, vestiging = null }: InstelKruimelProps) {
  const taal = await getTaal()
  const tekst = BEHEER[taal].algemeen
  const bron = instelPagina(id)
  const pagina = bron ? instelPaginaInTaal(bron, taal) : undefined
  const terug = vestiging ? `/club/beheer?v=${encodeURIComponent(vestiging)}` : '/club/beheer'
  return (
    <nav className="club-kruimel" aria-label={tekst.kruimelpad}>
      <ol>
        <li>
          <Link href={terug} className="club-kruimel-terug">
            <ArrowLeft size={16} aria-hidden /> {tekst.instellingen}
          </Link>
        </li>
        {pagina && (
          <>
            <li className="club-kruimel-groep">
              <ChevronRight size={14} aria-hidden />
              <span>{instelGroepLabel(pagina.groep, taal)}</span>
            </li>
            <li aria-current="page">
              <ChevronRight size={14} aria-hidden />
              <span>{pagina.titel}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
