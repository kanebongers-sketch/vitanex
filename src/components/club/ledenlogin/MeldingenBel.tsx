import Link from 'next/link'
import { Bell } from 'lucide-react'

// De bel rechts in de kop van de ledenapp: opent de meldingen. Het rondje
// toont hoeveel er ongelezen zijn (boven de 9: "9+").

interface MeldingenBelProps {
  href: string
  ongelezen: number
  /** De meldingen staan nu open. */
  open: boolean
}

export function belLabel(ongelezen: number): string {
  if (ongelezen <= 0) return 'Meldingen'
  return ongelezen === 1 ? 'Meldingen, 1 ongelezen' : `Meldingen, ${ongelezen} ongelezen`
}

export function MeldingenBel({ href, ongelezen, open }: MeldingenBelProps) {
  return (
    <Link href={href} className="club-mijn-bel" aria-label={belLabel(ongelezen)} aria-current={open ? 'page' : undefined} scroll={false} prefetch={false}>
      <Bell size={22} aria-hidden />
      {ongelezen > 0 && (
        <span className="club-mijn-bel-teller" aria-hidden>
          {ongelezen > 9 ? '9+' : ongelezen}
        </span>
      )}
    </Link>
  )
}
