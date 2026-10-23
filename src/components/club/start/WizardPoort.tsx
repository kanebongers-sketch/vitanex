'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { openTijdensWizard } from '@/lib/club/start/poort'

// Zolang de startwizard niet is afgerond: alleen de wizard, hulp en het
// abonnement zijn open. Elke andere Club-pagina gaat meteen naar de wizard en
// laat niets van zichzelf zien. De regel wie dit krijgt staat in poort.ts.

interface WizardPoortProps {
  children: ReactNode
}

export function WizardPoort({ children }: WizardPoortProps) {
  const pad = usePathname()
  const router = useRouter()
  const open = openTijdensWizard(pad)

  useEffect(() => {
    if (!open) router.replace('/club/start')
  }, [open, router])

  if (open) return children
  return (
    <p className="club-start-poort" role="status">
      Eerst je startwizard. Even geduld, je gaat verder waar je was.
    </p>
  )
}
