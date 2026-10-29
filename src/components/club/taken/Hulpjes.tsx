'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// Kleine client-eilandjes voor de takenpagina's.

/** De week afdrukken als papieren reserve (de printstijl staat in taken.css). */
export function PrintKnop() {
  const t = useTekst(TAKEN).pagina
  return (
    <button type="button" className="club-knop club-knop--klein" onClick={() => window.print()}>
      <Printer size={16} aria-hidden />
      {t.afdrukken}
    </button>
  )
}

/**
 * Ververs de gegevens om de zoveel minuten zolang het scherm zichtbaar is.
 * Een tablet aan de balie staat de hele dag open: zo komen vinkjes van andere
 * apparaten binnen en springt "vandaag" na middernacht naar de nieuwe dag.
 */
export function AutoVerversen({ minuten = 2 }: { minuten?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, minuten * 60_000)
    const zichtbaar = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', zichtbaar)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', zichtbaar)
    }
  }, [router, minuten])
  return null
}
