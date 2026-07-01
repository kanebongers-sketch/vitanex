'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaLeegScherm — een lege staat waar Vita aanwezig blijft.
// Geen kille "geen data"-melding, maar Vita's gezicht (PandaFace) die je warm
// uitnodigt de eerste stap te zetten. Herbruikbaar en presentational: props in,
// UI uit, geen data-loading of side-effects.
//
// Strikt navy + cyan via tokens; PandaFace is het enige meerkleurige element.
// Beweging is klein (fade + lichte translate via .mf-fade-in) en respecteert
// prefers-reduced-motion. De CTA is een echte <a> naar een bestaande route,
// met de globale zichtbare focus-ring.
// ════════════════════════════════════════════════════════════════════════════

import Link from 'next/link'
import { type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import PandaFace, { type EmotionState } from './PandaFace'

interface VitaLeegSchermProps {
  /** Korte, duidelijke titel boven Vita's boodschap. */
  titel: string
  /** Wat Vita zegt — één warme, eerlijke uitnodiging. */
  boodschap: string
  /** Label van de primaire actie (route-CTA). Zonder label + href geen knop. */
  actieLabel?: string
  /** Bestemming van de primaire actie (echte route). */
  actieHref?: string
  /**
   * Eigen actie-element (bv. een knop die een in-page formulier opent). Gebruik
   * dit i.p.v. actieLabel/actieHref wanneer de actie geen navigatie is.
   */
  children?: ReactNode
  /** Emotie op Vita's gezicht — default een warme, nieuwsgierige blik. */
  emotion?: EmotionState
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

export default function VitaLeegScherm({
  titel,
  boodschap,
  actieLabel,
  actieHref,
  children,
  emotion = 'curious',
  size = 88,
}: VitaLeegSchermProps) {
  const heeftLinkActie = Boolean(actieLabel && actieHref)

  return (
    <section
      className="mf-fade-in"
      aria-label={titel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 18,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl, 20px)',
        padding: '56px 32px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Vita's gezicht met een zachte cyan-halo eronder */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PandaFace emotion={emotion} size={size} animate />
        </div>
      </div>

      {/* Titel + boodschap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '42ch' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--mentaforce-primary)',
            margin: 0,
          }}
        >
          Vita
        </p>
        <h2
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: 'var(--text-1)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {titel}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
          {boodschap}
        </p>
      </div>

      {/* Primaire actie — route-CTA of een eigen actie-element (children). */}
      {heeftLinkActie ? (
        <Link
          href={actieHref as string}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--mentaforce-primary)',
            color: 'var(--bg-app)',
            borderRadius: 12,
            padding: '11px 20px',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'transform 0.15s var(--ease), opacity 0.15s var(--ease)',
          }}
        >
          {actieLabel}
          <ArrowRight size={15} strokeWidth={2.5} aria-hidden />
        </Link>
      ) : (
        children
      )}
    </section>
  )
}
