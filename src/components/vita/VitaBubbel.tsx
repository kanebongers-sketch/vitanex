'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaBubbel — Vita's gezicht (PandaFace) naast een spreekballon.
// Herbruikbaar buiten de onboarding: overal waar Vita iets "zegt".
// Strikt navy + cyan; het brein/PandaFace is het enige meerkleurige element.
// Beweging is klein (fade + lichte translate) en respecteert reduced-motion
// via de globale .mf-fade-in utility.
// ════════════════════════════════════════════════════════════════════════════

import { type ReactNode } from 'react'
import PandaFace, { type EmotionState } from './PandaFace'

interface VitaBubbelProps {
  /** Wat Vita zegt. Kan platte tekst of rich children zijn. */
  children: ReactNode
  /** Emotie op Vita's gezicht — stuurt de subtiele expressie. */
  emotion?: EmotionState
  /** Rustige ademhaling op het gezicht aanzetten. */
  animate?: boolean
  /** Grootte van Vita's gezicht in px. */
  size?: number
  /**
   * Zichtbaar label boven de bubbel. Default 'Vita'. Bij `null` verborgen
   * (blijft wel voor screenreaders via aria-label op de bubbel).
   */
  naam?: string | null
}

export default function VitaBubbel({
  children,
  emotion = 'calm',
  animate = true,
  size = 52,
  naam = 'Vita',
}: VitaBubbelProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {/* Vita's gezicht met een zachte cyan-halo eronder */}
      <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 1.5, height: size * 1.5, borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PandaFace emotion={emotion} size={size} animate={animate} />
        </div>
      </div>

      {/* Spreekballon */}
      <div
        className="mf-fade-in"
        aria-label={naam ? `${naam} zegt` : 'Vita zegt'}
        style={{
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '4px 18px 18px 18px',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '100%',
        }}
      >
        {naam && (
          <p
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--mentaforce-primary)',
              marginBottom: 4,
            }}
          >
            {naam}
          </p>
        )}
        <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-1)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
