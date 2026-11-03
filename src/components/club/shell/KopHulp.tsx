'use client'

import Link from 'next/link'
import { CircleHelp } from 'lucide-react'
import { ongelezenPunten, tellerTekst } from '@/lib/aiyourgym/nieuw'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { useGezien } from './nieuw-gezien'

// Het vraagteken rechtsboven (ontwerp "Club in 10 minuten"): Hulp, met
// bovenaan Wat is nieuw. Op elk scherm een tik weg, zonder balk onderaan. De
// teller laat zien hoeveel updates van AI Your Gym je nog niet zag; die telt
// per persoon in deze browser (nieuw-gezien.ts) en gaat naar nul als je Hulp of
// Wat is nieuw opent. Sneltoets G H.

/** Het aantal updates dat deze persoon nog niet zag. undefined zolang het niet bekend is. */
export function useOngelezen(persoon: string): number | undefined {
  const ruw = useGezien(persoon)
  return ruw === undefined ? undefined : ongelezenPunten(ruw).length
}

/** Het aantal als kleine pil, met een zin voor de screenreader. Niets bij 0 of zolang het niet bekend is. */
export function NieuwTeller({ persoon }: { persoon: string }) {
  const aantal = useOngelezen(persoon)
  const t = useTekst(MENU)
  const tekst = aantal === undefined ? null : tellerTekst(aantal)
  if (!tekst || aantal === undefined) return null
  return (
    <span className="club-teller club-teller--klein club-kophulp-teller">
      <span aria-hidden>{tekst}</span>
      <span className="club-sr">, {t.hulp.ongelezen(aantal)}</span>
    </span>
  )
}

interface KopHulpProps {
  persoon: string
  /** De link naar Hulp, met de vestiging erbij. */
  href: string
  /** Ben je nu op Hulp of Wat is nieuw? */
  hier: boolean
}

export function KopHulp({ persoon, href, hier }: KopHulpProps) {
  const t = useTekst(MENU)
  return (
    <Link href={href} className="club-kophulp" aria-current={hier ? 'page' : undefined} title={`${t.hulp.label} (G H)`}>
      <CircleHelp aria-hidden size={20} strokeWidth={hier ? 2.25 : 1.75} />
      <span className="club-sr">{t.hulp.label}</span>
      <NieuwTeller persoon={persoon} />
    </Link>
  )
}
