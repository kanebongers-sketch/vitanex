'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { LifeBuoy, Plug, Settings2, Smartphone, Sparkles } from 'lucide-react'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { ongelezenPunten, tellerTekst } from '@/lib/aiyourgym/nieuw'
import { clubHref, hulpItemOp, hulpItems, hulpToets, type HulpSleutel } from './hulpbalk-items'
import { useGezien } from './nieuw-gezien'
import { useVestigingen } from './VestigingenContext'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import './hulpbalk.css'

// De hulpbalk onderaan Club (idee Kane 23-10-2026, op onze eigen manier).
// Pc en tablet liggend: een balk over de volle breedte onder de inhoud, nooit
// over de inhoud heen. Telefoon en tablet staand: dezelfde vijf onderaan in het
// menupaneel (HulpLinks in MenuPaneel). Wat is nieuw toont hoeveel updates je
// nog niet zag.

const ICOON: Record<HulpSleutel, LucideIcon> = {
  instellingen: Settings2,
  koppelingen: Plug,
  ledenapp: Smartphone,
  nieuw: Sparkles,
  hulp: LifeBuoy,
}

/** Het aantal updates dat deze persoon nog niet zag, als badge. Niets zolang het niet bekend is. */
export function NieuwTeller({ persoon }: { persoon: string }) {
  const ruw = useGezien(persoon)
  const t = useTekst(MENU)
  if (ruw === undefined) return null
  const aantal = ongelezenPunten(ruw).length
  const tekst = tellerTekst(aantal)
  if (!tekst) return null
  return (
    <span className="club-hulp-teller">
      <span aria-hidden>{tekst}</span>
      <span className="club-sr">, {t.hulp.ongelezen(aantal)}</span>
    </span>
  )
}

interface HulpLinksProps {
  sleutels: readonly HulpSleutel[]
  persoon: string
  /** Het huidige pad, voor de actieve stand. */
  pad: string
  href: (pad: string) => string
  /** Met uitleg onder het label (de balk op de pc). */
  uitleg?: boolean
  onKies?: () => void
}

/** De items als lijst met links; gedeeld door de balk en het menupaneel. */
export function HulpLinks({ sleutels, persoon, pad, href, uitleg = false, onKies }: HulpLinksProps) {
  const hier = hulpItemOp(pad)
  const taal = useTaal()
  return (
    <ul className="club-hulp-lijst">
      {hulpItems(sleutels, taal).map((i) => {
        const Icoon = ICOON[i.sleutel]
        const toets = hulpToets(i)
        return (
          <li key={i.sleutel}>
            <Link href={href(i.pad)} aria-current={hier === i.sleutel ? 'page' : undefined} title={toets ? `${i.uitleg} (${toets})` : i.uitleg} onClick={onKies}>
              <span className="club-hulp-icoon" aria-hidden>
                <Icoon size={18} strokeWidth={1.75} />
              </span>
              <span className="club-hulp-tekst">
                <span className="club-hulp-label">{i.label}</span>
                {uitleg && <span className="club-hulp-uitleg">{i.uitleg}</span>}
              </span>
              {i.sleutel === 'nieuw' && <NieuwTeller persoon={persoon} />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

interface HulpbalkProps {
  sleutels: readonly HulpSleutel[]
  /** Wie er kijkt, voor wat hij al zag bij Wat is nieuw (alleen in deze browser). */
  persoon: string
}

export function Hulpbalk({ sleutels, persoon }: HulpbalkProps) {
  const pad = usePathname()
  const vestiging = kiesUit(useVestigingen(), useSearchParams().get(VESTIGING_PARAM))
  const t = useTekst(MENU)
  if (sleutels.length === 0) return null
  return (
    <nav className="club-hulpbalk" aria-label={t.hulp.label}>
      <HulpLinks sleutels={sleutels} persoon={persoon} pad={pad} href={(p) => clubHref(p, vestiging)} uitleg />
    </nav>
  )
}
