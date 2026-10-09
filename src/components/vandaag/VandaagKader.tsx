// Het kader rond /1: woordmerk, één slot rechts, smalle leeskolom. Bewust kaal —
// de kaart is het product, er hoort niets omheen te schreeuwen.

import Link from 'next/link'
import type { ReactNode } from 'react'

interface VandaagKaderProps {
  rechts?: ReactNode
  children: ReactNode
}

export function VandaagKader({ rechts, children }: VandaagKaderProps) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', color: 'var(--text-1)', fontFamily: 'var(--font-grotesk), system-ui, sans-serif' }}>
      <header
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: 'max(16px, env(safe-area-inset-top)) 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
        }}
      >
        <Link href="/1" aria-label="MentaForce — Vandaag" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-1)', textDecoration: 'none' }}>
          MENTAFORCE<span style={{ color: 'var(--brand)' }}>.</span>
        </Link>
        {rechts}
      </header>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px calc(64px + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
    </div>
  )
}
