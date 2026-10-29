import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// Een groep in het instellingencentrum: per onderdeel wat het is, de huidige
// stand en een klik naar de plek waar je het aanpast. Puur (server component).

export interface InstellingRegel {
  titel: string
  uitleg: string
  /** De huidige stand in een paar woorden ("3 vestigingen", "Nog niet gekozen"). */
  stand: string
  /** Waar je het aanpast; null = nog niet beschikbaar. */
  href: string | null
  /** Vraagt aandacht (bijvoorbeeld nog niet ingesteld). */
  let?: boolean
  /** Niet beschikbaar (onderdeel uit of nog geen vestiging). */
  uit?: boolean
}

export async function InstellingenGroep({ titel, regels }: { titel: string; regels: InstellingRegel[] }) {
  const tekst = await clubTekst(BEHEER)
  return (
    <section className="club-beheer-groep" aria-label={titel}>
      <h2 className="club-beheer-groepkop">{titel}</h2>
      <ul className="club-beheer-lijst" role="list">
        {regels.map((r) => {
          const beschikbaar = r.href !== null && !r.uit
          const inhoud = (
            <>
              <span className="club-beheer-tekst">
                <strong>{r.titel}</strong>
                <span>{r.uitleg}</span>
              </span>
              <span className={`club-beheer-stand${r.let ? ' is-let' : ''}`}>{r.uit ? tekst.algemeen.nietBeschikbaar : r.stand}</span>
              {beschikbaar && <ChevronRight aria-hidden size={18} className="club-beheer-pijl" />}
            </>
          )
          return (
            <li key={r.titel}>
              {beschikbaar ? (
                <Link href={r.href!} className="club-beheer-regel">
                  {inhoud}
                </Link>
              ) : (
                <div className="club-beheer-regel is-uit">{inhoud}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
