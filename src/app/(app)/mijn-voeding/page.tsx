'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: stijl.kleur, flexShrink: 0 }} />
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
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
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

        <CoachHeader
          eyebrow="Voeding"
          titel="Mijn voeding"
          subtitel="De persoonlijke voedingsrichtlijn die je coach voor je heeft opgesteld."
        />

        {laden ? (
          <CoachSkeleton rijen={2} />
        ) : !richtlijn ? (
          <CoachEmpty
            icon={Apple}
            titel="Nog geen richtlijn"
            tekst="Zodra je coach een voedingsrichtlijn voor je opstelt, verschijnt die hier met je persoonlijke dagdoelen."
          />
        ) : (
          <>
            {/* Caloriedoel — het anker van de richtlijn, als hero-getal */}
            {richtlijn.calorie_doel != null && (
              <Card className="mf-card-glow mf-animate-up mf-delay-1" style={{ padding: '26px 26px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)', boxShadow: '0 0 28px rgba(0,229,255,0.22)' }}>
                  <Flame size={26} strokeWidth={1.75} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="mf-overline" style={{ marginBottom: 8 }}>Caloriedoel per dag</p>
                  <p className="mf-number-large" style={{ color: 'var(--mf-green)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {richtlijn.calorie_doel}
                    <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-4)', marginLeft: 7, letterSpacing: 0 }}>kcal</span>
                  </p>
                </div>
              </Card>
            )}

            {/* Macro-dagdoelen */}
            {heeftMacros && (
              <CoachSection titel="Macro-dagdoelen" style={{ marginTop: 24 }}>
                <Card className="mf-animate-up mf-delay-2" style={{ padding: '22px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <MacroRegel label="Eiwit" gram={richtlijn.eiwit_g ?? 0} pct={verdeling?.eiwit_pct ?? null} stijl={MACRO_STIJL.eiwit} />
                    <MacroRegel label="Koolhydraten" gram={richtlijn.koolhydraat_g ?? 0} pct={verdeling?.koolhydraat_pct ?? null} stijl={MACRO_STIJL.koolhydraat} />
                    <MacroRegel label="Vet" gram={richtlijn.vet_g ?? 0} pct={verdeling?.vet_pct ?? null} stijl={MACRO_STIJL.vet} />
                  </div>
                  {verdeling && (
                    <p className="mf-caption" style={{ marginTop: 16 }}>
                      Percentages tonen het aandeel in de energie uit macro&apos;s (samen {verdeling.totaal_kcal} kcal).
                    </p>
                  )}
                </Card>
              </CoachSection>
            )}

            {/* Dieetvoorkeur */}
            {toonDieet && richtlijn.dieetvoorkeur && (
              <Card className="mf-animate-up mf-delay-3" style={{ padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Dieetvoorkeur</span>
                <Badge variant="success">{DIEETVOORKEUR_LABELS[richtlijn.dieetvoorkeur]}</Badge>
              </Card>
            )}

            {/* Vrije richtlijn van de coach */}
            {richtlijn.richtlijn_tekst && (
              <Card className="mf-animate-up mf-delay-3" style={{ padding: '22px 24px', marginBottom: 16 }}>
                <h2 className="mf-overline" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
                  <Apple size={14} aria-hidden style={{ color: 'var(--mf-green)' }} /> Richtlijn van je coach
                </h2>
                <p className="mf-body" style={{ color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {richtlijn.richtlijn_tekst}
                </p>
              </Card>
            )}

            <p className="mf-caption" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Deze richtlijn is opgesteld door je coach als persoonlijke begeleiding. Coaching is geen medische of
              diëtistische behandeling — heb je gezondheidsklachten of twijfels, raadpleeg dan een arts of diëtist.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
