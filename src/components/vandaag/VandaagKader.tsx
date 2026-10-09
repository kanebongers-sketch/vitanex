// Het kader rond de Vandaag-kaart: de gewone MentaForce-navigatie, één slot
// rechtsboven (bv. "Weekplan") en een smalle leeskolom. De kaart is het
// product; er hoort niets omheen te schreeuwen.

import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'

interface VandaagKaderProps {
  rechts?: ReactNode
  children: ReactNode
}

export function VandaagKader({ rechts, children }: VandaagKaderProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-1)' }}>
      <Navbar />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 20px calc(96px + env(safe-area-inset-bottom))' }}>
        {rechts && <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 40, marginBottom: 8 }}>{rechts}</div>}
        {children}
      </main>
    </div>
  )
}
