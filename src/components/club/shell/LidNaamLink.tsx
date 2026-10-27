import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { lidKaartPad, type LidTab } from '@/lib/club/leden/hub/tabs'

// Vanuit het lid werken (besluit Kane 27-10-2026): waar Club een lid noemt, is
// de naam een link naar de ledenkaart, op het tabblad dat bij dat scherm past.
// Mag deze persoon Leden niet zien (of is er geen lid), dan gewone tekst: geen
// link naar een 404. magLeden komt van de server:
// moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden').

interface LidNaamLinkProps {
  lidId: string | null
  vestiging: Vestiging
  magLeden: boolean
  tab?: LidTab
  className?: string
  children: ReactNode
}

export function LidNaamLink({ lidId, vestiging, magLeden, tab, className, children }: LidNaamLinkProps) {
  if (!magLeden || !lidId) return className ? <span className={className}>{children}</span> : <>{children}</>
  return (
    <Link href={lidKaartPad(lidId, vestiging, tab)} className={className}>
      {children}
    </Link>
  )
}
