'use client'

// ─── PremiumSlot ──────────────────────────────────────────────────────────────
// Rustige, eerlijke premium-kaart: legt uit wat de feature doet en bij welk
// plan hij hoort. Geen nep-urgentie, geen countdowns — HR-beheerders krijgen
// een directe link naar het abonnement, medewerkers een neutrale verwijzing.

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface PremiumSlotProps {
  titel: string
  omschrijving: string
  /** Toon de directe upgrade-link (alleen zinvol voor hr/admin-rollen). */
  kanUpgraden?: boolean
}

export function PremiumSlot({ titel, omschrijving, kanUpgraden = false }: PremiumSlotProps) {
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '28px 16px' }}>
        <div aria-hidden style={{
          width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--mf-green-light)', color: 'var(--mentaforce-primary)',
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{titel}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            {omschrijving}
          </p>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Onderdeel van het Groei-plan.</p>
        {kanUpgraden ? (
          <Link href="/hr/abonnement" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--bg-app)',
            background: 'var(--mentaforce-primary)', borderRadius: 'var(--radius-btn)',
            padding: '10px 18px', textDecoration: 'none',
          }}>
            Bekijk plannen
          </Link>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Vraag je HR-team naar het Groei-plan van MentaForce.
          </p>
        )}
      </div>
    </Card>
  )
}
