'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Target, Timer as TimerIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { useToast } from '@/components/ui/Toast'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import type { HoofdTab } from './focus-data'
import { useAdemEngine } from './useAdemEngine'
import { useFocusTimer } from './useFocusTimer'
import AdemSectie from './AdemSectie'
import FocusTimer from './FocusTimer'
import KennisSecties from './KennisSecties'

const TABS: { id: HoofdTab; label: string }[] = [
  { id: 'adem', label: 'Ademhaling' },
  { id: 'beweging', label: 'Beweging' },
  { id: 'voeding', label: 'Voeding' },
  { id: 'slaap', label: 'Slaap' },
  { id: 'mentaal', label: 'Mentaal' },
  { id: 'timer', label: 'Timer' },
]

/**
 * Container van het Focus-scherm: laadt de statistieken van vandaag, houdt de
 * adem- en timer-engines op paginaniveau (zodat een lopende sessie doorloopt
 * bij het wisselen van tab) en delegeert alle presentatie aan AdemSectie,
 * FocusTimer en KennisSecties.
 */
export default function FocusPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [klaar, setKlaar] = useState(false)
  const [tab, setTab] = useState<HoofdTab>('adem')
  const [focusMinutenVandaag, setFocusMinutenVandaag] = useState(0)
  const [focusSessiesVandaag, setFocusSessiesVandaag] = useState(0)

  const adem = useAdemEngine()

  const registreerVoltooideSessie = useCallback((duurMinuten: number) => {
    setFocusMinutenVandaag(minuten => minuten + duurMinuten)
    setFocusSessiesVandaag(sessies => sessies + 1)
  }, [])
  const timer = useFocusTimer(registreerVoltooideSessie)

  useEffect(() => {
    async function laadVandaag() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const vandaagStr = new Date().toISOString().split('T')[0]
        const { data: logs } = await supabase
          .from('focus_timer_logs')
          .select('duur_minuten')
          .eq('user_id', user.id)
          .eq('datum', vandaagStr)

        if (logs) {
          setFocusSessiesVandaag(logs.length)
          setFocusMinutenVandaag(logs.reduce((acc, log) => acc + (log.duur_minuten ?? 0), 0))
        }
      } catch {
        toast({ title: 'Kon je focus-statistieken niet laden', description: 'Probeer het later opnieuw.', variant: 'warning' })
      } finally {
        setKlaar(true)
      }
    }
    laadVandaag()
  }, [router, toast])

  if (!klaar) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
    </div>
  )

  const vandaagStats = [
    { Icon: Target, waarde: `${focusMinutenVandaag}`, sub: 'min focus', kleur: focusMinutenVandaag >= 50 ? 'var(--mf-green)' : focusMinutenVandaag >= 25 ? 'var(--mf-amber)' : 'var(--text-3)' },
    { Icon: TimerIcon, waarde: `${focusSessiesVandaag}`, sub: focusSessiesVandaag === 1 ? 'sessie' : 'sessies', kleur: focusSessiesVandaag >= 4 ? 'var(--mf-green)' : 'var(--text-3)' },
    { Icon: Flame, waarde: focusMinutenVandaag >= 100 ? 'Top!' : focusMinutenVandaag >= 50 ? 'Goed' : 'Bezig', sub: 'vandaag', kleur: focusMinutenVandaag >= 100 ? 'var(--mf-green)' : focusMinutenVandaag >= 50 ? 'var(--mf-amber)' : 'var(--text-3)' },
  ]

  return (
    <div className="min-h-screen mf-mesh-bg" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-6 pb-20">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Focus & Welzijn</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Ademhaling, beweging, voeding, slaap en mentale reset.</p>
        </div>

        {/* Vandaag strip */}
        {(focusMinutenVandaag > 0 || focusSessiesVandaag > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {vandaagStats.map(stat => (
              <div key={stat.sub} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '12px 10px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: stat.kleur }}><stat.Icon size={18} aria-hidden /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: stat.kleur, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{stat.waarde}</div>
                <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 2, fontWeight: 600 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        <TabsRoot value={tab} onValueChange={(v) => setTab(v as HoofdTab)}>
          {/* Tab bar — scrollable op mobiel */}
          <div className="overflow-x-auto pb-1 mb-6">
            <TabsList
              aria-label="Welzijnscategorieën"
              className="mf-focus-tabs"
              style={{
                display: 'flex', gap: 6, minWidth: 'max-content',
                background: 'var(--bg-subtle)', borderRadius: 16, padding: 6, border: 'none',
              }}
            >
              {TABS.map(t => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="mf-focus-tab"
                  style={{
                    padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    whiteSpace: 'nowrap', color: 'var(--text-3)',
                  }}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <style>{`
              .mf-focus-tabs .mf-focus-tab[data-state='active'] {
                background: var(--bg-card);
                color: var(--text-1);
                box-shadow: var(--shadow-xs);
              }
              .mf-focus-tabs .mf-focus-tab .mf-tabs-indicator { display: none; }
              .mf-collapsible-card { background: var(--bg-card); border-color: var(--border); }
              .mf-acc-trigger { background: transparent; cursor: pointer; appearance: none; border: none; }
              .mf-acc-trigger:hover { background: var(--bg-subtle); }
              .mf-divider-row { border-bottom: 1px solid var(--border); }
              .mf-divider-row:last-child { border-bottom: 0; }
              .mf-reset-btn:hover { background: var(--bg-subtle); }
            `}</style>
          </div>

          <TabsContent value="adem" style={{ paddingTop: 0 }}>
            <AdemSectie engine={adem} />
          </TabsContent>

          <KennisSecties />

          <TabsContent value="timer" style={{ paddingTop: 0 }}>
            <FocusTimer engine={timer} vandaagMinuten={focusMinutenVandaag} vandaagSessies={focusSessiesVandaag} />
          </TabsContent>
        </TabsRoot>

      </main>
    </div>
  )
}
