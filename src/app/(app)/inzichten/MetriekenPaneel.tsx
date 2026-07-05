// ─── Metrieken-paneel — de cijfers van deze week, met duiding ─────────────────
// Presentational: krijgt echte weekstats en rendert ringen + korte NL-duiding
// per metriek. Geen data zonder betekenis; geen data → eerlijk een '–'.
// Ringen vullen pas ná de eerste paint (animKlaar), zodat de stroke zacht
// inloopt (0.4s, alleen stroke-dashoffset — zie Ring).

import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/ui/Ring'
import {
  activiteitDuiding, checkinsKleur, dankbaarheidKleur, formatteerGetal,
  metrieken, type Metriek, type WeekStats,
} from './weekrapport'

interface MetriekenPaneelProps {
  stats: WeekStats
  /** Ringwaarden pas vullen ná eerste paint, zodat ze zacht inlopen. */
  animKlaar: boolean
}

function MetriekRing({ metriek, animKlaar }: { metriek: Metriek; animKlaar: boolean }) {
  const heeftData = metriek.waarde !== null
  const display = heeftData ? `${formatteerGetal(metriek.waarde ?? 0)}${metriek.eenheid}` : '–'
  const ariaLabel = heeftData
    ? `${metriek.label}: gemiddeld ${display} deze week`
    : `${metriek.label}: nog geen data deze week`

  return (
    <Ring
      value={animKlaar ? (metriek.waarde ?? 0) : 0}
      max={metriek.max}
      color={metriek.kleur}
      size={80}
      thickness={7}
      ariaLabel={ariaLabel}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          fontSize: 17, fontWeight: 800, color: metriek.kleur, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {display}
        </span>
        <span style={{
          fontSize: 9, color: 'var(--text-4)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3,
        }}>
          {metriek.label}
        </span>
      </span>
    </Ring>
  )
}

function DuidingRegel({ kleur, tekst }: { kleur: string; tekst: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span aria-hidden="true" style={{
        width: 6, height: 6, borderRadius: '50%', background: kleur,
        flexShrink: 0, transform: 'translateY(-1px)',
      }} />
      <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{tekst}</span>
    </li>
  )
}

function StatKaart({ waarde, label, kleur }: { waarde: number; label: string; kleur: string }) {
  return (
    <Card style={{ padding: '14px 12px', textAlign: 'center', flex: 1 }}>
      <p style={{
        fontSize: 22, fontWeight: 800, color: kleur, margin: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {waarde}
      </p>
      <p style={{
        fontSize: 9, color: 'var(--text-4)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
      }}>
        {label}
      </p>
    </Card>
  )
}

export default function MetriekenPaneel({ stats, animKlaar }: MetriekenPaneelProps) {
  const items = metrieken(stats)

  return (
    <section aria-label="Weekcijfers">
      <Card style={{ padding: '20px 16px 16px', marginBottom: 14 }}>
        <p className="mf-section-label" style={{ paddingLeft: 4 }}>Gemiddelden deze week</p>
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          marginBottom: 16,
        }}>
          {items.map(m => <MetriekRing key={m.key} metriek={m} animKlaar={animKlaar} />)}
        </div>
        <ul style={{
          listStyle: 'none', margin: 0, padding: '12px 4px 0',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {items.map(m => <DuidingRegel key={m.key} kleur={m.kleur} tekst={m.duiding} />)}
        </ul>
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatKaart
          waarde={stats.aantal_checkins}
          label="Check-ins"
          kleur={checkinsKleur(stats.aantal_checkins)}
        />
        <StatKaart
          waarde={stats.dankbaarheid_items}
          label="Dankbaarheid"
          kleur={dankbaarheidKleur(stats.dankbaarheid_items)}
        />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 8, marginBottom: 14, lineHeight: 1.5 }}>
        {activiteitDuiding(stats.aantal_checkins, stats.dankbaarheid_items)}
      </p>
    </section>
  )
}
