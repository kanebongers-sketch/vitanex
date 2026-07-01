'use client'

// ════════════════════════════════════════════════════════════════════════════
// Branded keuze-primitieven voor het Vita-intakegesprek.
// Strikt navy + cyan, tokens uit globals.css. Toetsenbord-bedienbaar met een
// zichtbare cyan focus-ring. Geen groene hardcodes, geen emoji-iconen.
// ════════════════════════════════════════════════════════════════════════════

import { type ReactNode } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// Gedeelde knoppenrij (terug / volgende / overslaan). Token-based, cyan focus.
// Leeft in dit leaf-bestand zodat álle stap-componenten hem kunnen importeren
// zonder een circulaire import met VitaIntakeGesprek.
// ════════════════════════════════════════════════════════════════════════════
export function GesprekKnoppen({
  onTerug, onVolgende, volgendeLabel = 'Volgende', volgendeDisabled, bezig, overslaan, verbergTerug,
}: {
  onTerug?: () => void
  onVolgende: () => void
  volgendeLabel?: string
  volgendeDisabled?: boolean
  bezig?: boolean
  overslaan?: { onClick: () => void; label: string }
  verbergTerug?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
      {verbergTerug ? <span /> : (
        <button type="button" onClick={onTerug} className="vita-knop vita-knop-ghost">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden /> Terug
        </button>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onVolgende}
          disabled={volgendeDisabled}
          className="vita-knop vita-knop-primary"
        >
          {bezig && <span className="mf-spinner-white" aria-hidden style={{ marginRight: 2 }} />}
          {volgendeLabel}
          {!bezig && <ArrowRight size={16} strokeWidth={2.25} aria-hidden />}
        </button>
        {overslaan && (
          <button type="button" onClick={overslaan.onClick} className="vita-overslaan">
            {overslaan.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Grote keuzekaart ─────────────────────────────────────────────────────────
export interface KaartOptie<T extends string> {
  value: T
  titel: string
  sub?: string
  Icon?: LucideIcon
  aanbevolen?: boolean
}

interface VitaKaartKeuzeProps<T extends string> {
  opties: readonly KaartOptie<T>[]
  waarde: T | ''
  onKies: (value: T) => void
  /** Aantal kolommen op desktop; op smalle schermen altijd 1. */
  kolommen?: 1 | 2
  /** Toegankelijk groepslabel (verplicht voor screenreaders). */
  legenda: string
}

export function VitaKaartKeuze<T extends string>({
  opties, waarde, onKies, kolommen = 1, legenda,
}: VitaKaartKeuzeProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={legenda}
      className="vita-kaart-grid"
      style={{ gridTemplateColumns: kolommen === 2 ? 'repeat(2, 1fr)' : '1fr' }}
    >
      {opties.map((opt) => {
        const actief = waarde === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={actief}
            onClick={() => onKies(opt.value)}
            className="vita-keuze-kaart"
            data-actief={actief}
          >
            {opt.aanbevolen && (
              <span className="vita-kaart-badge">Aanbevolen</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {opt.Icon && (
                <span className="vita-kaart-icoon" aria-hidden>
                  <opt.Icon size={18} strokeWidth={1.75} />
                </span>
              )}
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{opt.titel}</span>
                {opt.sub && (
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.35 }}>{opt.sub}</span>
                )}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Chip-selectie (single of multi) ──────────────────────────────────────────
interface VitaChipsProps {
  opties: readonly string[]
  /** Bij multi: array van gekozen labels. Bij single: index-nummer of label. */
  geselecteerd: string[] | number | string | null
  onToggle: (waarde: string, index: number) => void
  multi?: boolean
  max?: number
  legenda: string
}

export function VitaChips({
  opties, geselecteerd, onToggle, multi = false, max, legenda,
}: VitaChipsProps) {
  function isActief(opt: string, index: number): boolean {
    if (multi) return Array.isArray(geselecteerd) && geselecteerd.includes(opt)
    if (typeof geselecteerd === 'number') return geselecteerd === index
    return geselecteerd === opt
  }

  return (
    <div
      role={multi ? 'group' : 'radiogroup'}
      aria-label={legenda}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
    >
      {opties.map((opt, i) => {
        const actief = isActief(opt, i)
        const limietBereikt =
          multi && max !== undefined && Array.isArray(geselecteerd) && geselecteerd.length >= max && !actief
        return (
          <button
            key={opt}
            type="button"
            role={multi ? undefined : 'radio'}
            aria-checked={multi ? undefined : actief}
            aria-pressed={multi ? actief : undefined}
            disabled={limietBereikt}
            onClick={() => { if (!limietBereikt) onToggle(opt, i) }}
            className="vita-chip"
            data-actief={actief}
            style={{ opacity: limietBereikt ? 0.4 : 1, cursor: limietBereikt ? 'not-allowed' : 'pointer' }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Emoji-schaal (Likert 1-5 met karakter-labels) ────────────────────────────
interface VitaSchaalProps {
  emojis: readonly string[]
  labels?: readonly string[]
  waarde: number | null
  onKies: (v: number) => void
  legenda: string
}

export function VitaSchaal({ emojis, labels, waarde, onKies, legenda }: VitaSchaalProps) {
  return (
    <div role="radiogroup" aria-label={legenda} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      {emojis.map((emoji, i) => {
        const val = i + 1
        const actief = waarde === val
        const label = labels?.[i] ?? `Optie ${val}`
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={actief}
            aria-label={label}
            onClick={() => onKies(val)}
            className="vita-schaal-knop"
            data-actief={actief}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>{emoji}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Veld-wrapper met gekoppeld label ─────────────────────────────────────────
export function VitaVeld({ label, sub, htmlFor, children }: {
  label: string; sub?: string; htmlFor?: string; children: ReactNode
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label
        htmlFor={htmlFor}
        style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: sub ? 2 : 8 }}
      >
        {label}
      </label>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4 }}>{sub}</p>}
      {children}
    </div>
  )
}

// ─── Tekst-invoer (navy/cyan, cyan focus-ring) ────────────────────────────────
export function VitaInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return <input {...rest} className={`vita-input${className ? ` ${className}` : ''}`} />
}
