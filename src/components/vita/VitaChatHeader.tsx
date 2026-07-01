'use client'

import PandaFace, { type EmotionState } from '@/components/vita/PandaFace'

interface VitaChatHeaderProps {
  /** Emotie voor de panda in de header — beweegt mee met de gesprekstoestand. */
  emotion: EmotionState
  /** Toont het cyaan geheugen-detail als Vita het profiel van de gebruiker kent. */
  kentProfiel: boolean
  /** True zolang Vita aan het typen is (subtiele "denkt na"-status). */
  aanHetTypen: boolean
}

// Presentational: de vaste gesprekskop. Vita's gezicht + naam + rustige status.
// Puur props in → UI uit; geen state, geen effects.
export default function VitaChatHeader({ emotion, kentProfiel, aanHetTypen }: VitaChatHeaderProps) {
  return (
    <header
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: aanHetTypen
                ? 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 24%, transparent) 0%, transparent 70%)'
                : 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 14%, transparent) 0%, transparent 70%)',
              transition: 'background 0.4s var(--ease)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-subtle)',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PandaFace emotion={emotion} size={44} animate />
          </div>
        </div>

        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Vita
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Altijd bij je · Vertrouwelijk
            {kentProfiel && ' · Kent jouw profiel'}
          </p>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--mentaforce-primary)',
              boxShadow: '0 0 8px var(--mentaforce-primary)',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {aanHetTypen ? 'Vita typt…' : 'Online'}
          </span>
        </div>
      </div>
    </header>
  )
}
