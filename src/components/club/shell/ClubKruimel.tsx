import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

// Kruimelpad boven een dieper scherm (een ledenkaart, een schema, een
// voedingsplan): waar je bent en de weg terug, altijd op dezelfde plek en in
// dezelfde vorm als bij de instel-pagina's (InstelKruimel).
// Pc en tablet: "← Leden › Anna de Vries › Schema". Telefoon: alleen de stap
// direct erboven, met pijl ("← Anna de Vries"), zodat terug een tik is.

export interface KruimelStap {
  label: string
  href: string
}

interface ClubKruimelProps {
  /** Van het onderdeel naar de stap direct boven deze pagina. */
  stappen: readonly KruimelStap[]
  /** De naam van deze pagina. */
  huidig: string
}

export async function ClubKruimel({ stappen, huidig }: ClubKruimelProps) {
  const t = await clubTekst(MENU)
  const laatste = stappen.length - 1
  return (
    <nav className="club-kruimel" aria-label={t.kruimel.label}>
      <ol>
        {stappen.map((s, n) => (
          <li key={s.href} className={n === laatste ? 'club-kruimel-ouder' : 'club-kruimel-groep'}>
            {n > 0 && <ChevronRight size={14} aria-hidden className="club-kruimel-schuin" />}
            <Link href={s.href} className={n === 0 || n === laatste ? 'club-kruimel-terug' : 'club-kruimel-link'}>
              {(n === 0 || n === laatste) && <ArrowLeft size={16} aria-hidden className={n === 0 ? 'club-kruimel-pijl-eerst' : 'club-kruimel-pijl'} />}
              {s.label}
            </Link>
          </li>
        ))}
        <li aria-current="page" className="club-kruimel-hier">
          <ChevronRight size={14} aria-hidden />
          <span>{huidig}</span>
        </li>
      </ol>
    </nav>
  )
}

/**
 * De weg naar een lid: Leden › naam. Alleen als deze persoon Leden mag zien;
 * anders leeg (de pagina kiest dan zelf een andere weg terug).
 */
export function stappenNaarLid(magLeden: boolean, lid: { id: string; naam: string }, vestiging: string, taal: Taal = 'nl'): KruimelStap[] {
  if (!magLeden) return []
  const v = `v=${encodeURIComponent(vestiging)}`
  return [
    { label: MENU[taal].kruimel.leden, href: `/club/leden?${v}` },
    { label: lid.naam, href: `/club/leden/${encodeURIComponent(lid.id)}?${v}` },
  ]
}
