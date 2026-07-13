'use client'

import { Check, Dumbbell, Brain, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import {
  PIJLER_LABELS,
  PIJLER_STIJL,
  targetOmschrijving,
  type Pijler,
  type TaakMetVoortgang,
} from '@/lib/coaching/taken'

export const PIJLER_ICOON: Record<Pijler, LucideIcon> = {
  body: Dumbbell,
  mind: Brain,
  performance: Zap,
}

export interface TaakKaartProps {
  taak: TaakMetVoortgang
  bezig: boolean
  onToggle: (gehaald: boolean) => void
}

/**
 * Klant-facing taakkaart met een afvink-toggle voor vandaag en een week-strip
 * die het ritme (voortgang t.o.v. het weekdoel) laat voelen. Puur presentational.
 */
export function TaakKaart({ taak, bezig, onToggle }: TaakKaartProps) {
  const stijl = PIJLER_STIJL[taak.pijler]
  const Icoon = PIJLER_ICOON[taak.pijler]
  const gevuld = Math.min(taak.deze_week_gehaald, taak.target_per_week)
  const gedaan = taak.vandaag_gehaald

  return (
    <Card
      style={{
        padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
        border: gedaan
          ? '1px solid color-mix(in srgb, var(--mf-green) 34%, var(--border))'
          : '1px solid var(--border)',
        background: gedaan
          ? 'color-mix(in srgb, var(--mf-green) 5%, var(--bg-card))'
          : 'var(--bg-card)',
        transition: 'border-color 0.2s var(--ease), background 0.2s var(--ease)',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: stijl.bg, color: stijl.color,
        }}
      >
        <Icoon size={19} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            {taak.titel}
          </p>
          <span
            style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
              background: stijl.bg, color: stijl.color,
            }}
          >
            {PIJLER_LABELS[taak.pijler]}
          </span>
        </div>

        {taak.beschrijving && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.5 }}>
            {taak.beschrijving}
          </p>
        )}

        {/* Week-strip: ritme t.o.v. het weekdoel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ display: 'inline-flex', gap: 4 }} aria-hidden>
            {Array.from({ length: taak.target_per_week }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: i < gevuld ? stijl.color : 'var(--border-strong)',
                }}
              />
            ))}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
            {taak.deze_week_gehaald}/{taak.target_per_week} deze week · {targetOmschrijving(taak)}
          </span>
        </div>
      </div>

      {/* Afvink-toggle voor vandaag */}
      <button
        type="button"
        role="checkbox"
        aria-checked={taak.vandaag_gehaald}
        aria-label={`${taak.titel} ${taak.vandaag_gehaald ? 'afvinken ongedaan maken' : 'afvinken voor vandaag'}`}
        disabled={bezig}
        onClick={() => onToggle(!taak.vandaag_gehaald)}
        className="mf-taak-toggle"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, padding: 0,
          cursor: bezig ? 'wait' : 'pointer',
          background: gedaan ? 'var(--mf-green)' : 'transparent',
          border: gedaan ? '1px solid var(--mf-green)' : '1.5px solid var(--border-strong)',
          color: gedaan ? 'var(--bg-app)' : 'var(--text-4)',
          boxShadow: gedaan ? '0 0 16px rgba(0,229,255,0.38)' : 'none',
          transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease), box-shadow 0.2s var(--ease), transform 0.1s var(--ease)',
        }}
      >
        <Check size={20} aria-hidden style={{ opacity: gedaan ? 1 : 0.35 }} />
      </button>

      <style>{`
        .mf-taak-toggle:hover:not(:disabled) { transform: scale(1.06); }
        .mf-taak-toggle:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-taak-toggle { transition: none; }
          .mf-taak-toggle:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </Card>
  )
}
