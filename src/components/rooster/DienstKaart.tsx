'use client'

import { Clock } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/Badge'

export type DienstStatus = 'actief' | 'komend' | 'verleden'

export type Dienst = {
  id: string
  datum: string
  start_tijd: string
  eind_tijd: string
  rol_label?: string | null
  notitie?: string | null
  user_naam?: string        // alleen zichtbaar voor HR
  afdeling_kleur?: string   // optioneel kleur-override per afdeling
}

function bepaalStatus(datum: string): DienstStatus {
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const d = new Date(datum)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() === vandaag.getTime()) return 'actief'
  if (d > vandaag) return 'komend'
  return 'verleden'
}

/** Visuele staat per status: badge-variant + label + kaart-accent. Alles via tokens. */
const STATUS_STIJL: Record<
  DienstStatus,
  { label: string; badge: BadgeProps['variant']; accent: string; surface: string }
> = {
  actief:   { label: 'Vandaag', badge: 'accent',  accent: 'var(--mentaforce-primary)', surface: 'var(--mentaforce-primary-light)' },
  komend:   { label: 'Komend',  badge: 'neutral', accent: 'var(--border-strong)',      surface: 'var(--bg-subtle)' },
  verleden: { label: 'Geweest', badge: 'neutral', accent: 'var(--border)',             surface: 'var(--bg-subtle)' },
}

function formatTijd(t: string) {
  // t = "09:00:00" of "09:00"
  return t.slice(0, 5)
}

interface DienstKaartProps {
  dienst: Dienst
  toonNaam?: boolean   // HR-view: toon medewerkersnaam
  compact?: boolean    // kleine variant voor week-grid cel
}

export default function DienstKaart({ dienst, toonNaam = false, compact = false }: DienstKaartProps) {
  const status = bepaalStatus(dienst.datum)
  const s = STATUS_STIJL[status]
  const isActief = status === 'actief'

  if (compact) {
    return (
      <div
        style={{
          background: s.surface,
          border: `1px solid ${s.accent}`,
          borderRadius: 'var(--radius-xs)',
          padding: '4px 7px',
          marginBottom: 4,
        }}
        title={dienst.notitie ?? undefined}
      >
        {toonNaam && dienst.user_naam && (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dienst.user_naam}
          </div>
        )}
        <div style={{ fontSize: 11, color: isActief ? 'var(--mentaforce-primary)' : 'var(--text-2)', fontWeight: 600 }}>
          {formatTijd(dienst.start_tijd)}–{formatTijd(dienst.eind_tijd)}
        </div>
        {dienst.rol_label && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{dienst.rol_label}</div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${s.accent}`,
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '14px 18px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Badge variant={s.badge}>{s.label}</Badge>
          {dienst.rol_label && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dienst.rol_label}
            </span>
          )}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isActief ? 'var(--mentaforce-primary)' : 'var(--text-1)', whiteSpace: 'nowrap' }}>
          <Clock size={14} aria-hidden />
          {formatTijd(dienst.start_tijd)} – {formatTijd(dienst.eind_tijd)}
        </span>
      </div>

      {toonNaam && dienst.user_naam && (
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
          {dienst.user_naam}
        </div>
      )}

      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
        {new Date(dienst.datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      {dienst.notitie && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
          {dienst.notitie}
        </div>
      )}
    </div>
  )
}
