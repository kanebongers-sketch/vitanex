// ─── XP-details — recente activiteit en de spelregels ─────────────────────────
// Onderaan de pagina: wat er recent gebeurde (echte events uit de history) en
// hoe XP werkt. Feitelijk en compact — naslagwerk, geen reclame.

import { Card } from '@/components/ui/Card'
import type { XPEvent } from '@/lib/xp/xp'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import SectieKop from './SectieKop'

const TYPE_KLEUR: Record<string, string> = {
  checkin: 'var(--mf-green)', goal: 'var(--mf-blue)', streak: 'var(--mf-red)',
  achievement: 'var(--mf-amber)',
}
/** Woordenboek-sleutel per XP-type; een onbekend type tonen we zoals het is. */
const TYPE_SLEUTEL: Record<string, string> = {
  checkin: 'checkin', goal: 'doel', streak: 'reeks', achievement: 'mijlpaal',
}

const XP_BRONNEN = [
  { sleutel: 'checkin', xp: '+75', kleur: 'var(--mf-green)' },
  { sleutel: 'topScore', xp: '+25', kleur: 'var(--mf-green)' },
  { sleutel: 'doelregistratie', xp: '+15', kleur: 'var(--mf-blue)' },
  { sleutel: 'reeks7', xp: '+75', kleur: 'var(--mf-red)' },
  { sleutel: 'reeks30', xp: '+250', kleur: 'var(--mf-red)' },
  { sleutel: 'doelBereikt', xp: '+150', kleur: 'var(--mf-purple)' },
  { sleutel: 'mijlpalen', xp: '+50-500', kleur: 'var(--mf-amber)' },
] as const

function ActiviteitRij({ evt }: { evt: XPEvent }) {
  const { t } = useVertaling()
  const typeSleutel = TYPE_SLEUTEL[evt.type]
  const kleur = evt.xp > 0 ? (TYPE_KLEUR[evt.type] ?? 'var(--mf-green)') : 'var(--text-3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div aria-hidden="true" style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: kleur,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{evt.reden}</p>
        <p style={{ fontSize: 10, color: 'var(--text-4)' }}>
          {typeSleutel ? t(`voortgang.xp.type.${typeSleutel}`) : evt.type} · {evt.datum}
        </p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {evt.xp > 0 ? '+' : '−'}{Math.abs(evt.xp)} XP
      </span>
    </div>
  )
}

export default function XPDetails({ history }: { history: readonly XPEvent[] }) {
  const { t } = useVertaling()
  return (
    <>
      {history.length > 0 && (
        <Card style={{ padding: '22px 24px', marginBottom: 16 }}>
          <SectieKop>{t('voortgang.xp.recent')}</SectieKop>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.slice(0, 8).map((evt, i) => (
              <ActiviteitRij key={`${evt.datum}-${evt.reden}-${i}`} evt={evt} />
            ))}
          </div>
        </Card>
      )}

      <Card style={{ background: 'var(--bg-subtle)', padding: '22px 24px' }}>
        <SectieKop>{t('voortgang.xp.hoeHetWerkt')}</SectieKop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {XP_BRONNEN.map(bron => (
            <div key={bron.sleutel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{t(`voortgang.xp.bron.${bron.sleutel}`)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: bron.kleur, fontVariantNumeric: 'tabular-nums' }}>
                {bron.xp} XP
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
              {t('voortgang.xp.nooitKwijt')}
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}
