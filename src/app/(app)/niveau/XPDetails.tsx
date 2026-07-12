// ─── XP-details — recente activiteit en de spelregels ─────────────────────────
// Onderaan de pagina: wat er recent gebeurde (echte events uit de history) en
// hoe XP werkt. Feitelijk en compact — naslagwerk, geen reclame.

import { Card } from '@/components/ui/Card'
import type { XPEvent } from '@/lib/xp/xp'
import SectieKop from './SectieKop'

const TYPE_KLEUR: Record<string, string> = {
  checkin: 'var(--mf-green)', goal: 'var(--mf-blue)', streak: 'var(--mf-red)',
  achievement: 'var(--mf-amber)',
}
const TYPE_LABEL: Record<string, string> = {
  checkin: 'Check-in', goal: 'Doel', streak: 'Reeks', achievement: 'Mijlpaal',
}

const XP_BRONNEN = [
  { label: 'Wekelijkse check-in', xp: '+75', kleur: 'var(--mf-green)' },
  { label: 'Uitstekende score (≥ 4,5)', xp: '+25', kleur: 'var(--mf-green)' },
  { label: 'Dagelijkse doelregistratie', xp: '+15', kleur: 'var(--mf-blue)' },
  { label: '7-daagse reeks', xp: '+75', kleur: 'var(--mf-red)' },
  { label: '30-daagse reeks', xp: '+250', kleur: 'var(--mf-red)' },
  { label: 'Doel succesvol bereikt', xp: '+150', kleur: 'var(--mf-purple)' },
  { label: 'Mijlpalen', xp: '+50–500', kleur: 'var(--mf-amber)' },
]

function ActiviteitRij({ evt }: { evt: XPEvent }) {
  const kleur = evt.xp > 0 ? (TYPE_KLEUR[evt.type] ?? 'var(--mf-green)') : 'var(--text-3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div aria-hidden="true" style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: kleur,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{evt.reden}</p>
        <p style={{ fontSize: 10, color: 'var(--text-4)' }}>
          {TYPE_LABEL[evt.type] ?? evt.type} · {evt.datum}
        </p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {evt.xp > 0 ? '+' : '−'}{Math.abs(evt.xp)} XP
      </span>
    </div>
  )
}

export default function XPDetails({ history }: { history: readonly XPEvent[] }) {
  return (
    <>
      {history.length > 0 && (
        <Card style={{ padding: '22px 24px', marginBottom: 16 }}>
          <SectieKop>Recente activiteit</SectieKop>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.slice(0, 8).map((evt, i) => (
              <ActiviteitRij key={`${evt.datum}-${evt.reden}-${i}`} evt={evt} />
            ))}
          </div>
        </Card>
      )}

      <Card style={{ background: 'var(--bg-subtle)', padding: '22px 24px' }}>
        <SectieKop>Hoe XP werkt</SectieKop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {XP_BRONNEN.map(bron => (
            <div key={bron.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{bron.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: bron.kleur, fontVariantNumeric: 'tabular-nums' }}>
                {bron.xp} XP
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
              Je XP raak je nooit kwijt — ook niet in een rustige week.
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}
