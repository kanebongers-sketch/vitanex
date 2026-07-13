'use client'

// ─── Coaching — gedeelde premium UI-laag (KBHP) ─────────────────────────────
// Eén samenhangende, high-end taal voor alle coaching-schermen: editoriale
// koppen met cyaan-aura, hero-stats, ontworpen lege/laad-staten. Donker navy +
// één cyaan-accent + Space Grotesk. Alles via bestaande tokens/utilities uit
// globals.css (mf-h1, mf-overline, mf-number-large, mf-animate-*, mf-coach-*).

import Link from 'next/link'
import type { ReactNode, CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

// ── Terug-link ──────────────────────────────────────────────────────────────
export function BackLink({ href, label = 'Terug' }: { href: string; label?: string }) {
  return (
    <Link href={href} className="mf-coach-back">
      <ArrowLeft size={15} aria-hidden /> {label}
    </Link>
  )
}

// ── Editoriale paginakop ────────────────────────────────────────────────────
interface CoachHeaderProps {
  eyebrow?: string
  titel: string
  subtitel?: string
  backHref?: string
  backLabel?: string
  rechts?: ReactNode
}

export function CoachHeader({ eyebrow, titel, subtitel, backHref, backLabel, rechts }: CoachHeaderProps) {
  return (
    <header className="mf-animate-up" style={{ position: 'relative', marginBottom: 34 }}>
      <span className="mf-coach-aura" aria-hidden style={{ top: -160, left: -120 }} />
      <div style={{ position: 'relative' }}>
        {backHref && <BackLink href={backHref} label={backLabel} />}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <p className="mf-overline" style={{ color: 'var(--mf-green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 18, height: 1.5, background: 'var(--mf-green)', display: 'inline-block' }} />
                {eyebrow}
              </p>
            )}
            <h1 className="mf-h1">{titel}</h1>
            {subtitel && <p className="mf-subtitle" style={{ marginTop: 8, maxWidth: '54ch' }}>{subtitel}</p>}
          </div>
          {rechts && <div style={{ flexShrink: 0 }}>{rechts}</div>}
        </div>
      </div>
    </header>
  )
}

// ── Hero-stat ───────────────────────────────────────────────────────────────
interface CoachStatProps {
  label: string
  waarde: ReactNode
  accent?: string
  hint?: string
  glow?: boolean
}

export function CoachStat({ label, waarde, accent = 'var(--text-1)', hint, glow = false }: CoachStatProps) {
  return (
    <div
      className={glow ? 'mf-card-glow' : undefined}
      style={{
        padding: '20px 22px', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      }}
    >
      <p className="mf-number-large" style={{ color: accent, lineHeight: 1 }}>{waarde}</p>
      <p className="mf-overline" style={{ marginTop: 10 }}>{label}</p>
      {hint && <p className="mf-caption" style={{ marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

// ── Sectie met overline-kop ─────────────────────────────────────────────────
export function CoachSection({ titel, actie, children, style }: { titel: string; actie?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{ marginBottom: 24, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 className="mf-overline" style={{ color: 'var(--text-3)' }}>{titel}</h2>
        {actie}
      </div>
      {children}
    </section>
  )
}

// ── Premium lege staat ──────────────────────────────────────────────────────
interface CoachEmptyProps {
  icon: LucideIcon
  titel: string
  tekst?: string
  actie?: ReactNode
  toon?: 'neutraal' | 'wacht'
}

export function CoachEmpty({ icon: Icon, titel, tekst, actie, toon = 'neutraal' }: CoachEmptyProps) {
  const kleur = toon === 'wacht' ? 'var(--mf-amber)' : 'var(--mf-green)'
  const bg = toon === 'wacht' ? 'var(--mf-amber-light)' : 'var(--mf-green-light)'
  return (
    <div className="mf-animate-scale" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: 14, padding: '56px 28px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
    }}>
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 60, height: 60, borderRadius: '50%', background: bg, color: kleur,
        boxShadow: toon === 'wacht' ? 'none' : '0 0 32px rgba(0,229,255,0.22)',
      }}>
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div style={{ maxWidth: '42ch' }}>
        <h3 className="mf-h3" style={{ marginBottom: 6 }}>{titel}</h3>
        {tekst && <p className="mf-body" style={{ color: 'var(--text-3)' }}>{tekst}</p>}
      </div>
      {actie && <div style={{ marginTop: 6 }}>{actie}</div>}
    </div>
  )
}

// ── Laad-skeleton (shimmer i.p.v. spinner) ──────────────────────────────────
export function CoachSkeleton({ rijen = 3 }: { rijen?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-hidden>
      <div className="mf-skeleton" style={{ height: 92, borderRadius: 'var(--radius-lg)' }} />
      {Array.from({ length: rijen }, (_, i) => (
        <div key={i} className="mf-skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  )
}
