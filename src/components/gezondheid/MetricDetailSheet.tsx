'use client'

/**
 * Detailweergave per metriek als bottom-sheet (mobiel) / dialoog (desktop):
 * periode-keuze, kerngetallen en een volledige grafiek — zoals de
 * detailschermen in Apple Health.
 */
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import {
  METRICS, STEMMING_INFO, dagKort, metricWaarde,
  type MetricKey, type TrendPunt,
} from '@/lib/gezondheid-metrics'
import {
  SheetRoot, SheetPortal, SheetOverlay, SheetTitle,
} from '@/components/ui/Sheet'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X, Footprints, Moon, HeartPulse, Sparkles, Smile, Flame, type LucideIcon } from 'lucide-react'

/** Lucide-icoon + navy/cyan-token per metriek — vervangt de emoji + hardcoded hex uit METRICS. */
const VISUAL: Record<MetricKey, { Icon: LucideIcon; kleur: string; kleurLicht: string }> = {
  stappen:   { Icon: Footprints, kleur: 'var(--mf-green)',           kleurLicht: 'var(--mf-green-light)' },
  slaap:     { Icon: Moon,       kleur: 'var(--mf-purple)',          kleurLicht: 'var(--mf-purple-light)' },
  hartslag:  { Icon: HeartPulse, kleur: 'var(--mf-red)',             kleurLicht: 'var(--mf-red-light)' },
  welzijn:   { Icon: Sparkles,   kleur: 'var(--mentaforce-primary)', kleurLicht: 'var(--mentaforce-primary-light)' },
  stemming:  { Icon: Smile,      kleur: 'var(--mf-blue)',            kleurLicht: 'var(--mf-blue-light)' },
  calorieen: { Icon: Flame,      kleur: 'var(--mf-amber)',           kleurLicht: 'var(--mf-amber-light)' },
}

/** Bottom-sheet slide-in (alleen transform/opacity, reduced-motion-aware). */
function SheetStyles() {
  return (
    <style>{`
      @keyframes mf-metric-sheet-in { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
      @keyframes mf-metric-sheet-out { from { transform: none; opacity: 1; } to { transform: translateY(40px); opacity: 0; } }
      .metric-sheet-content[data-state='open'] { animation: mf-metric-sheet-in 0.3s var(--ease); }
      .metric-sheet-content[data-state='closed'] { animation: mf-metric-sheet-out 0.22s var(--ease); }
      @media (min-width: 640px) {
        .metric-sheet-content {
          left: 50% !important; right: auto !important; bottom: 50% !important;
          transform: translate(-50%, 50%) !important;
          border-radius: var(--radius-xl) !important;
          border-bottom: 1px solid var(--border-strong) !important;
        }
        @keyframes mf-metric-sheet-in { from { transform: translate(-50%, calc(50% + 24px)); opacity: 0; } to { transform: translate(-50%, 50%); opacity: 1; } }
        @keyframes mf-metric-sheet-out { from { transform: translate(-50%, 50%); opacity: 1; } to { transform: translate(-50%, calc(50% + 24px)); opacity: 0; } }
      }
      @media (prefers-reduced-motion: reduce) {
        .metric-sheet-content { animation: none !important; }
      }
    `}</style>
  )
}

type Periode = 7 | 14 | 30
const PERIODES: { dagen: Periode; label: string }[] = [
  { dagen: 7, label: 'Week' },
  { dagen: 14, label: '2 weken' },
  { dagen: 30, label: 'Maand' },
]

interface MetricDetailSheetProps {
  metricKey: MetricKey
  trend: TrendPunt[]
  onClose: () => void
}

function GrafiekTooltip({ active, payload, label, eenheid }: {
  active?: boolean; payload?: { value: number; payload: { stemmingLabel?: string } }[]; label?: string; eenheid: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--text-2)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ color: 'var(--text-1)', margin: 0, fontWeight: 600 }}>
        {p.payload.stemmingLabel ?? `${p.value} ${eenheid}`}
      </p>
    </div>
  )
}

export default function MetricDetailSheet({ metricKey, trend, onClose }: MetricDetailSheetProps) {
  const cfg = METRICS[metricKey]
  const visual = VISUAL[metricKey]
  const Icon = visual.Icon
  const [periode, setPeriode] = useState<Periode>(14)

  const punten = useMemo(() => (
    trend.slice(-periode).map(p => {
      const waarde = metricWaarde(p, metricKey)
      return {
        dagLabel: dagKort(p.datum),
        waarde,
        stemmingLabel: metricKey === 'stemming' && p.stemming
          ? `${STEMMING_INFO[p.stemming]?.emoji ?? ''} ${STEMMING_INFO[p.stemming]?.label ?? p.stemming}`
          : undefined,
      }
    })
  ), [trend, periode, metricKey])

  const waarden = punten.map(p => p.waarde).filter((v): v is number => v !== undefined)

  const stats = useMemo(() => {
    if (waarden.length === 0) return null
    const som = waarden.reduce((a, b) => a + b, 0)
    return {
      gemiddeld: som / waarden.length,
      hoogste: Math.max(...waarden),
      laagste: Math.min(...waarden),
    }
  }, [waarden])

  const formatStat = (v: number) => metricKey === 'stemming'
    ? `${STEMMING_INFO[Object.keys(STEMMING_INFO)[Math.min(4, Math.max(0, Math.round(v) - 1))]]?.emoji ?? ''} ${(Math.round(v * 10) / 10).toLocaleString('nl-BE')}`
    : cfg.formatWaarde(v)

  return (
    <SheetRoot open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetPortal>
        <SheetOverlay />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="metric-sheet-content"
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 101,
            width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto',
            background: 'var(--bg-app)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            border: '1px solid var(--border-strong)', borderBottom: 'none',
            boxShadow: 'var(--shadow-xl)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
        {/* Sheet-handgreep + header */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg-app)', padding: '10px 20px 12px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', zIndex: 1 }}>
          <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SheetTitle style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 9, paddingRight: 0 }}>
              <span aria-hidden="true" style={{
                width: 30, height: 30, borderRadius: 9, background: visual.kleurLicht,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} strokeWidth={2.25} style={{ color: visual.kleur }} />
              </span>
              {cfg.label}
            </SheetTitle>
            <RadixDialog.Close
              aria-label="Sluiten"
              className="mf-pressable"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--bg-card)', color: 'var(--text-3)',
                boxShadow: 'var(--shadow-xs)',
              }}
            ><X size={16} aria-hidden /></RadixDialog.Close>
          </div>
        </div>

        <div style={{ padding: '4px 20px 28px' }}>
          {/* Periode-keuze */}
          <div role="tablist" aria-label="Periode" style={{
            display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 11, padding: 3, marginBottom: 18,
          }}>
            {PERIODES.map(p => (
              <button
                key={p.dagen}
                role="tab" aria-selected={periode === p.dagen}
                onClick={() => setPeriode(p.dagen)}
                style={{
                  flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 9, fontSize: 13, fontWeight: 700,
                  background: periode === p.dagen ? 'var(--bg-card)' : 'transparent',
                  color: periode === p.dagen ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow: periode === p.dagen ? 'var(--shadow-xs)' : 'none',
                  transition: 'background var(--transition-fast)',
                }}
              >{p.label}</button>
            ))}
          </div>

          {waarden.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '36px 20px',
              textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <Icon size={30} strokeWidth={1.75} aria-hidden="true" style={{ color: visual.kleur, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', margin: '0 0 4px' }}>Nog geen metingen</p>
              <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Koppel een wearable of vul je check-in in.</p>
            </div>
          ) : (
            <>
              {/* Kerngetallen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {stats && [
                  { label: 'Gemiddeld', waarde: stats.gemiddeld },
                  { label: 'Hoogste', waarde: stats.hoogste },
                  { label: 'Laagste', waarde: stats.laagste },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    padding: '11px 12px', border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{s.label}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: visual.kleur, margin: 0, lineHeight: 1.1 }}>
                      {formatStat(s.waarde)}
                      {cfg.eenheid && !cfg.eenheidInWaarde && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', marginLeft: 3 }}>{cfg.eenheid}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Grafiek */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                padding: '18px 12px 10px', border: '1px solid var(--border)', marginBottom: 16,
              }}>
                <ResponsiveContainer width="100%" height={220}>
                  {cfg.grafiek === 'staaf' ? (
                    <BarChart data={punten} barSize={periode === 30 ? 8 : 16}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={42} domain={cfg.domein} />
                      <Tooltip content={<GrafiekTooltip eenheid={cfg.eenheid} />} cursor={{ fill: 'var(--border)' }} />
                      {metricKey === 'stappen' && (
                        <ReferenceLine y={10000} stroke="var(--text-4)" strokeDasharray="6 4" label={{ value: 'Doel', position: 'insideTopRight', fontSize: 10, fill: 'var(--text-3)' }} />
                      )}
                      {stats && (
                        <ReferenceLine y={stats.gemiddeld} stroke={visual.kleur} strokeOpacity={0.45} strokeDasharray="4 4" label={{ value: 'Gem.', position: 'insideTopLeft', fontSize: 10, fill: visual.kleur }} />
                      )}
                      <Bar dataKey="waarde" fill={visual.kleur} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={punten}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={36} domain={cfg.domein} />
                      <Tooltip content={<GrafiekTooltip eenheid={cfg.eenheid} />} />
                      {stats && metricKey !== 'stemming' && (
                        <ReferenceLine y={stats.gemiddeld} stroke={visual.kleur} strokeOpacity={0.45} strokeDasharray="4 4" label={{ value: 'Gem.', position: 'insideTopLeft', fontSize: 10, fill: visual.kleur }} />
                      )}
                      <Line dataKey="waarde" stroke={visual.kleur} strokeWidth={2.5} dot={{ r: 3.5, fill: visual.kleur, strokeWidth: 0 }} connectNulls />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Uitleg */}
              <div style={{
                background: visual.kleurLicht, borderRadius: 'var(--radius-lg)', padding: '14px 16px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: visual.kleur, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
                  Over {cfg.label.toLowerCase()}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{cfg.uitleg}</p>
              </div>
            </>
          )}
        </div>
        <SheetStyles />
        </RadixDialog.Content>
      </SheetPortal>
    </SheetRoot>
  )
}
