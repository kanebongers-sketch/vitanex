'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Apple, Calendar, CalendarCheck, CalendarClock, CalendarDays, Dumbbell, House, LayoutGrid, ListChecks, PhoneCall, ScanLine, StickyNote, UserPlus, Users, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import type { Onderdeel } from './onderdelen'

// De onderbalk op de telefoon en de tablet staand (besluit Kane 20-10-2026):
// de vier onderdelen die deze persoon het meest nodig heeft, onder de duim,
// plus Meer voor het menupaneel met alles. Meer licht op als je in een
// onderdeel bent dat niet in de balk staat, zodat je altijd ziet waar je bent.

const ICOON: Record<string, LucideIcon> = {
  vandaag: House,
  checkin: ScanLine,
  leden: Users,
  schemas: Dumbbell,
  rooster: CalendarDays,
  taken: ListChecks,
  personeel: CalendarClock,
  afspraken: CalendarCheck,
  opvolgen: PhoneCall,
  leads: UserPlus,
  agenda: Calendar,
  voeding: Apple,
  notities: StickyNote,
}

interface OnderbalkProps {
  onderdelen: readonly Onderdeel[]
  /** Het menu-onderdeel waar je nu bent; null in de hulpbalk (die staat onder Meer). */
  huidig: Onderdeel | null
  href: (pad: string) => string
  menuOpen: boolean
  onMeer: () => void
  /** Een onderdeel gekozen: sluit het menupaneel als dat open stond. */
  onKies: () => void
}

export function Onderbalk({ onderdelen, huidig, href, menuOpen, onMeer, onKies }: OnderbalkProps) {
  const t = useTekst(MENU)
  const inBalk = huidig !== null && onderdelen.some((o) => o.sleutel === huidig?.sleutel)
  return (
    <nav className="club-onderbalk" aria-label={t.onderbalk.label}>
      {onderdelen.map((o) => {
        const Icoon = ICOON[o.sleutel] ?? LayoutGrid
        const hier = !menuOpen && o.sleutel === huidig?.sleutel
        return (
          <Link key={o.sleutel} href={href(o.pad)} aria-current={hier ? 'page' : undefined} onClick={onKies}>
            <Icoon aria-hidden size={22} strokeWidth={hier ? 2.25 : 1.75} />
            <span>{o.label}</span>
          </Link>
        )
      })}
      <button type="button" onClick={onMeer} aria-haspopup="dialog" aria-expanded={menuOpen} data-actief={menuOpen || !inBalk ? 'true' : undefined}>
        {menuOpen ? <X aria-hidden size={22} /> : <LayoutGrid aria-hidden size={22} strokeWidth={!inBalk ? 2.25 : 1.75} />}
        <span>{menuOpen ? t.onderbalk.sluiten : t.onderbalk.meer}</span>
      </button>
    </nav>
  )
}
