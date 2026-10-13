import Link from 'next/link'
import { CLUBS, type Club } from '@/lib/lifeos/pt-dashboard/clubs'

// Een rij filterchips als links: de filter staat in de URL (?pt=…&toon=…), zodat
// terug, vernieuwen en delen op dezelfde plek uitkomen. Puur.

export interface FilterOptie {
  label: string
  href: string
  actief: boolean
  aantal?: number
}

export function FilterRij({ label, opties }: { label: string; opties: readonly FilterOptie[] }) {
  return (
    <nav className="ptd-filters" aria-label={label}>
      {opties.map((o) => (
        <Link key={o.href} href={o.href} className="ptd-chip" aria-current={o.actief ? 'true' : undefined} scroll={false}>
          {o.label}
          {o.aantal !== undefined ? <small>{o.aantal}</small> : null}
        </Link>
      ))}
    </nav>
  )
}

/** Querystring uit de gezette waarden (lege/standaardwaarden vallen weg). */
export function metFilters(basis: string, filters: Record<string, string | null>): string {
  const q = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => !!e[1])).toString()
  return q ? `${basis}?${q}` : basis
}

/** Eén waarde uit de searchParams. */
export function param(zoek: { [k: string]: string | string[] | undefined }, sleutel: string): string | null {
  const v = zoek[sleutel]
  return typeof v === 'string' && v.length > 0 && v.length <= 60 ? v : null
}

/**
 * De clubs om op te filteren: voor een clubmanager zijn eigen clubs, voor
 * eigenaren en de beheerder de clubs die in de gegevens voorkomen (in vaste
 * volgorde). Eén of geen club = geen filter nodig.
 */
export function filterClubs(rolClubs: readonly Club[], inGegevens: Iterable<Club | null>): Club[] {
  if (rolClubs.length > 0) return rolClubs.length > 1 ? [...rolClubs] : []
  const aanwezig = new Set<Club | null>(inGegevens)
  const clubs = CLUBS.filter((c) => aanwezig.has(c))
  return clubs.length > 1 ? clubs : []
}

/** De gekozen club uit de URL, maar alleen als die in de lijst staat. */
export function gekozenClub(ruw: string | null, clubs: readonly Club[]): Club | null {
  return clubs.find((c) => c === ruw) ?? null
}
