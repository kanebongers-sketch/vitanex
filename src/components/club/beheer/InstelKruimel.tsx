import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { instelGroepLabel, instelPagina, type InstelId } from '@/lib/club/kern/instel-paginas'

// Boven elke instel-pagina: terug naar Instellingen en waar je bent
// (Instellingen › groep › pagina). Een plek per ding, altijd dezelfde weg terug.

interface InstelKruimelProps {
  /** Het id uit INSTEL_PAGINAS (src/lib/club/kern/instel-paginas.ts). */
  id: InstelId
  /** De gekozen vestiging, zodat je terugkomt bij dezelfde vestiging. */
  vestiging?: string | null
}

export function InstelKruimel({ id, vestiging = null }: InstelKruimelProps) {
  const pagina = instelPagina(id)
  const terug = vestiging ? `/clubkane/beheer?v=${encodeURIComponent(vestiging)}` : '/clubkane/beheer'
  return (
    <nav className="club-kruimel" aria-label="Kruimelpad">
      <ol>
        <li>
          <Link href={terug} className="club-kruimel-terug">
            <ArrowLeft size={16} aria-hidden /> Instellingen
          </Link>
        </li>
        {pagina && (
          <>
            <li className="club-kruimel-groep">
              <ChevronRight size={14} aria-hidden />
              <span>{instelGroepLabel(pagina.groep)}</span>
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
