import Link from 'next/link'
import type { LedenappTabblad } from '@/lib/club/ledenlogin/contract'
import { sectiesVan, type AppScherm } from '@/lib/club/app/tabs'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// De schakelaar bovenaan Boeken (Lessen | Afspraken) en Schema (Schema |
// Voortgang). Gewone links (?tab=<sectie>), zodat elke sectie een eigen adres
// houdt. Staat er maar een sectie aan, dan is er geen schakelaar.

interface SectieKiezerProps {
  scherm: AppScherm
  tabsUit: readonly string[]
  tabPad: (sectie: string) => string
}

export async function SectieKiezer({ scherm, tabsUit, tabPad }: SectieKiezerProps) {
  const secties = sectiesVan(scherm.balk, tabsUit)
  if (secties.length < 2) return null
  const t = LEDENAPP[await getTaal()].tabs
  const label = scherm.balk === 'boeken' ? t.sectieBoeken : t.sectieSchema
  return (
    <nav className="club-lidapp-secties" aria-label={label}>
      {secties.map((s: LedenappTabblad) => (
        <Link key={s} href={tabPad(s)} aria-current={s === scherm.sectie ? 'page' : undefined} scroll={false} prefetch={false}>
          {t[s]}
        </Link>
      ))}
    </nav>
  )
}
