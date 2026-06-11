'use client'

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

const STATUS_STIJL: Record<DienstStatus, { bg: string; border: string; text: string; badge: string; badgeTxt: string }> = {
  actief:   { bg: '#E1F5EE', border: '#1D9E75', text: '#0F6E56', badge: '#1D9E75', badgeTxt: '#fff' },
  komend:   { bg: '#EEF4FF', border: '#3B82F6', text: '#1E40AF', badge: '#3B82F6', badgeTxt: '#fff' },
  verleden: { bg: '#F5F5F5', border: '#D1D5DB', text: '#6B7280', badge: '#D1D5DB', badgeTxt: '#6B7280' },
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

  if (compact) {
    return (
      <div
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '4px 7px',
          marginBottom: 4,
          cursor: 'default',
        }}
        title={dienst.notitie ?? undefined}
      >
        {toonNaam && dienst.user_naam && (
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dienst.user_naam}
          </div>
        )}
        <div style={{ fontSize: 11, color: s.text, fontWeight: 500 }}>
          {formatTijd(dienst.start_tijd)}–{formatTijd(dienst.eind_tijd)}
        </div>
        {dienst.rol_label && (
          <div style={{ fontSize: 10, color: s.text, opacity: 0.75, marginTop: 1 }}>{dienst.rol_label}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border"
      style={{
        background: s.bg,
        borderColor: s.border,
        padding: '14px 18px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: s.badge,
              color: s.badgeTxt,
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {status === 'actief' ? 'Vandaag' : status === 'komend' ? 'Komend' : 'Geweest'}
          </span>
          {dienst.rol_label && (
            <span style={{ fontSize: 12, color: s.text, opacity: 0.8 }}>{dienst.rol_label}</span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.text }}>
          {formatTijd(dienst.start_tijd)} – {formatTijd(dienst.eind_tijd)}
        </span>
      </div>

      {toonNaam && dienst.user_naam && (
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 2 }}>
          {dienst.user_naam}
        </div>
      )}

      <div style={{ fontSize: 13, color: s.text, opacity: 0.85 }}>
        {new Date(dienst.datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      {dienst.notitie && (
        <div style={{ marginTop: 8, fontSize: 12, color: s.text, opacity: 0.7, fontStyle: 'italic' }}>
          {dienst.notitie}
        </div>
      )}
    </div>
  )
}
