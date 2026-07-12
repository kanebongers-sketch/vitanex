'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DIEETVOORKEUR_LABELS,
  isDieetvoorkeur,
  macroVerdeling,
  type VoedingRichtlijn,
} from '@/lib/coaching/voeding'
import { Apple, Flame } from 'lucide-react'

const MACRO_STIJL = {
  eiwit:       { kleur: 'var(--mf-green)',  bg: 'var(--mf-green-light)' },
  koolhydraat: { kleur: 'var(--mf-amber)',  bg: 'var(--mf-amber-light)' },
  vet:         { kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
} as const

interface MacroRegelProps {
  label: string
  gram: number
  pct: number | null
  stijl: { kleur: string; bg: string }
}

/** Eén macro-rij met grammen en (indien bekend) een statisch aandeel-balkje. */
function MacroRegel({ label, gram, pct, stijl }: MacroRegelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
          {gram}<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginLeft: 2 }}>g</span>
          {pct !== null && <span style={{ fontSize: 11, fontWeight: 600, color: stijl.kleur, marginLeft: 8 }}>{pct}%</span>}
        </span>
      </div>
      {pct !== null && (
        <div style={{ height: 6, borderRadius: 100, background: stijl.bg, overflow: 'hidden' }} aria-hidden>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: stijl.kleur }} />
        </div>
      )}
    </div>
  )
}

export default function MijnVoedingPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [richtlijn, setRichtlijn] = useState<VoedingRichtlijn | null>(null)

  const laad = useCallback(async () => {
    const res = await authFetch('/api/coaching/mijn-voeding')
    if (res.ok) {
      const data = await res.json() as { richtlijn: VoedingRichtlijn | null }
      setRichtlijn(data.richtlijn)
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await laad()
    }
    init()
  }, [router, laad])

  const verdeling = richtlijn ? macroVerdeling(richtlijn) : null
  const heeftMacros = Boolean(richtlijn && (richtlijn.eiwit_g != null || richtlijn.koolhydraat_g != null || richtlijn.vet_g != null))
  const toonDieet = richtlijn?.dieetvoorkeur != null && richtlijn.dieetvoorkeur !== 'geen' && isDieetvoorkeur(richtlijn.dieetvoorkeur)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 720, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mijn voeding
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            De persoonlijke voedingsrichtlijn die je coach voor je heeft opgesteld.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : !richtlijn ? (
          <Card style={{ padding: 8 }}>
            <EmptyState
              icon={Apple}
              title="Nog geen richtlijn"
              description="Zodra je coach een voedingsrichtlijn voor je opstelt, verschijnt die hier met je persoonlijke dagdoelen."
            />
          </Card>
        ) : (
          <>
            {/* Caloriedoel — het anker van de richtlijn */}
            {richtlijn.calorie_doel != null && (
              <Card style={{ padding: '22px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                  <Flame size={22} />
                </span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 2 }}>Caloriedoel per dag</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1 }}>
                    {richtlijn.calorie_doel}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', marginLeft: 5 }}>kcal</span>
                  </p>
                </div>
              </Card>
            )}

            {/* Macro-dagdoelen */}
            {heeftMacros && (
              <Card style={{ padding: '20px 24px', marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}>Macro-dagdoelen</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <MacroRegel label="Eiwit" gram={richtlijn.eiwit_g ?? 0} pct={verdeling?.eiwit_pct ?? null} stijl={MACRO_STIJL.eiwit} />
                  <MacroRegel label="Koolhydraten" gram={richtlijn.koolhydraat_g ?? 0} pct={verdeling?.koolhydraat_pct ?? null} stijl={MACRO_STIJL.koolhydraat} />
                  <MacroRegel label="Vet" gram={richtlijn.vet_g ?? 0} pct={verdeling?.vet_pct ?? null} stijl={MACRO_STIJL.vet} />
                </div>
                {verdeling && (
                  <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 14 }}>
                    Percentages tonen het aandeel in de energie uit macro's (samen {verdeling.totaal_kcal} kcal).
                  </p>
                )}
              </Card>
            )}

            {/* Dieetvoorkeur */}
            {toonDieet && richtlijn.dieetvoorkeur && (
              <Card style={{ padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Dieetvoorkeur</span>
                <Badge variant="success">{DIEETVOORKEUR_LABELS[richtlijn.dieetvoorkeur]}</Badge>
              </Card>
            )}

            {/* Vrije richtlijn van de coach */}
            {richtlijn.richtlijn_tekst && (
              <Card style={{ padding: '20px 24px', marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Apple size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> Richtlijn van je coach
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {richtlijn.richtlijn_tekst}
                </p>
              </Card>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 8, lineHeight: 1.6 }}>
              Deze richtlijn is opgesteld door je coach als persoonlijke begeleiding. Coaching is geen medische of
              diëtistische behandeling — heb je gezondheidsklachten of twijfels, raadpleeg dan een arts of diëtist.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
