'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { CAT, DOELKEUZE_OPTIES } from '@/lib/doelen-config'
import { verwerkCheckin, LEVEL_NAMEN, type Achievement } from '@/lib/xp'
import { syncXPNaarServer } from '@/lib/xp-sync'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  vandaag, slaWeekSelectieOp,
} from '@/lib/weekdoelen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { CheckinInsight } from '@/components/checkin/CheckinInsight'
import VitaDoelbegeleider from '@/components/vita/VitaDoelbegeleider'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'

const ALLE_VLAKKEN: WellbeingCat[] = ['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie']

function DoelKeuzeInhoud() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const sid = params.get('sid') ?? ''

  const scores: Record<WellbeingCat, number> = {
    slaap:    parseInt(params.get('slaap')    ?? '0'),
    stress:   parseInt(params.get('stress')   ?? '0'),
    energie:  parseInt(params.get('energie')  ?? '0'),
    focus:    parseInt(params.get('focus')    ?? '0'),
    balans:   parseInt(params.get('balans')   ?? '0'),
    motivatie:parseInt(params.get('motivatie')?? '0'),
  }

  // 3 lowest-scoring domains with valid scores
  const topDrie = ALLE_VLAKKEN
    .filter(v => scores[v] > 0)
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, 3)

  const [keuzes, setKeuzes] = useState<Partial<Record<WellbeingCat, number>>>({})
  const [opgeslagen, setOpgeslagen] = useState(false)

  const resterend = topDrie.filter(v => keuzes[v] === undefined).length
  const alleGekozen = resterend === 0 && topDrie.length > 0

  // Laagst scorende vlak uit de check-in (topDrie is oplopend gesorteerd) — voor
  // Vita's persoonlijke intro. `null` als er geen geldige scores binnenkwamen.
  const focusLabel = topDrie.length > 0 ? CAT[topDrie[0]].label : null

  function toonXPToast(xp: number, level: number | undefined, achievements: Achievement[]) {
    const titel = level ? `Level ${level} — ${LEVEL_NAMEN[level]}!` : `+${xp} XP verdiend!`
    const beschrijving = achievements.length > 0
      ? `Nieuwe badge: ${achievements.map(a => a.naam).join(', ')}`
      : level ? `+${xp} XP verdiend` : undefined
    toast({ title: titel, description: beschrijving, variant: 'success' })
  }

  async function slaatOp() {
    if (!alleGekozen) return
    const doelen: WeekDoel[] = topDrie.map(vlak => {
      const optie = DOELKEUZE_OPTIES[vlak][keuzes[vlak]!]
      return {
        vlak,
        doel_titel:       optie.titel,
        doel_beschrijving:optie.beschrijving,
        target_waarde:    7,
        eenheid:          'dagen',
        meetType:         'dagelijks' as const,
        logs:             [],
      }
    })
    const ws: WeekSelectie = {
      weekStart:   vandaag(),
      doelen,
      vlak_scores: scores,
    }
    slaWeekSelectieOp(ws)
    setOpgeslagen(true)

    // Check-in-XP direct hier toekennen (niet pas na de analyse) zodat de
    // beloning zichtbaar is vóór de navigatie. De sameISOWeek-dedupe in
    // verwerkCheckin voorkomt dubbele toekenning binnen dezelfde week.
    try {
      const scoreVals = Object.values(scores).filter(v => v > 0)
      const gem = scoreVals.reduce((a, b) => a + b, 0) / (scoreVals.length || 1)
      // Vlak-scores lopen 4–20 (4 vragen × 1–5) → deel door 4 voor de 1–5-schaal.
      const xpResult = verwerkCheckin(gem / 4)
      if (xpResult.xpGewonnen > 0 || xpResult.nieuweAchievements.length > 0) {
        toonXPToast(xpResult.xpGewonnen, xpResult.levelOmhoog ? xpResult.nieuwLevel : undefined, xpResult.nieuweAchievements)
      }
      syncXPNaarServer(xpResult.xpData).catch(() => { /* stil falen — lokaal blijft intact */ })
    } catch { /* niet-kritiek — doelen zijn opgeslagen */ }

    // Redirect immediately — analysis runs in background for the rapport page
    router.push('/home')
    triggerAnalyse(sid, scores)
  }

  async function triggerAnalyse(sessieId: string, vlak_scores: Record<string, number>) {
    if (!sessieId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if analysis already exists for this session
      const { data: bestaand } = await supabase
        .from('checkin_analyses')
        .select('id')
        .eq('sessie_id', sessieId)
        .maybeSingle()
      if (bestaand) return

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()

      const { data: antwoorden } = await supabase
        .from('checkin_antwoorden')
        .select('categorie, waarde_tekst')
        .eq('sessie_id', sessieId)
        .not('waarde_tekst', 'is', null)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vlak_scores, antwoorden: antwoorden ?? [] }),
      })
      if (!res.ok) {
        toast({ title: 'Analyse niet beschikbaar', description: 'Je doelen zijn opgeslagen, maar de AI-analyse kon niet worden gemaakt.', variant: 'warning' })
        return
      }

      const json = await res.json()
      if (!json.analyse) return

      await supabase.from('checkin_analyses').insert({
        sessie_id:      sessieId,
        user_id:        user.id,
        bedrijf_id:     profiel?.bedrijf_id ?? null,
        scores:         vlak_scores,
        analyse_json:   json.analyse,
        gedeeld_met_hr: false,
      })
    } catch {
      toast({ title: 'Analyse niet beschikbaar', description: 'Je doelen zijn opgeslagen, maar de AI-analyse kon niet worden gemaakt.', variant: 'warning' })
    }
  }

  // Guard tegen een doodlopende flow: zonder scores (refresh of directe
  // navigatie) is er niets te kiezen — stuur eerlijk terug naar de check-in.
  if (topDrie.length === 0) {
    return (
      <main className="mf-mesh-bg" style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        padding: '40px 20px 80px',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 40 }}>
          <VitaLeegScherm
            titel="Geen check-in gevonden"
            boodschap="Ik kan hier alleen doelen voorstellen direct na je check-in. Doe (of hervat) eerst je wekelijkse check-in, dan gaan we samen verder."
            actieLabel="Start check-in"
            actieHref="/checkin"
            emotion="supportive"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="mf-mesh-bg" style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 16px' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, var(--mentaforce-primary-light) 0%, transparent 70%)' }} />
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--mentaforce-primary)', position: 'relative', zIndex: 1,
            }}>
              <Check size={26} aria-hidden />
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Check-in ingevuld!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Kies voor elk aandachtsgebied één doel dat je deze week wil aanpakken.
          </p>
        </div>

        {/* Vita introduceert het moment — companion die je check-in kent */}
        <div style={{ marginBottom: 24 }}>
          <VitaDoelbegeleider
            fase={opgeslagen ? 'bevestigd' : 'intro'}
            focusLabel={focusLabel}
            aantalGebieden={topDrie.length}
          />
        </div>

        {/* Welzijnscan score overzicht */}
        {ALLE_VLAKKEN.some(v => scores[v] > 0) && (
          <Card style={{ borderRadius: 20, padding: '18px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
              Jouw welzijnsscan
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ALLE_VLAKKEN.filter(v => scores[v] > 0).map(vlak => {
                const c = CAT[vlak]
                const score = scores[vlak]
                const pct = Math.round(((score - 4) / 16) * 100)
                const kleur = pct >= 75 ? 'var(--mf-green)' : pct >= 50 ? 'var(--mf-amber)' : 'var(--mf-red)'
                const label = pct >= 75 ? 'Goed' : pct >= 50 ? 'Matig' : 'Lastig'
                const isAandacht = topDrie.includes(vlak)
                return (
                  <div key={vlak} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 70, fontSize: 11, fontWeight: isAandacht ? 700 : 500, color: isAandacht ? c.kleur : 'var(--text-3)', flexShrink: 0 }}>
                      {c.label}
                    </div>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', borderRadius: 3, background: kleur, transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.8s var(--ease)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: kleur, width: 36, textAlign: 'right', flexShrink: 0 }}>{score}/20</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-4)', width: 52, flexShrink: 0 }}>
                      {label}{isAandacht ? <AlertTriangle size={10} aria-label="aandachtsgebied" /> : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Persoonlijk inzicht — het beloningsmoment ná de check-in */}
        <CheckinInsight scores={scores} />

        {/* Domain goal selection */}
        {topDrie.map((vlak, idx) => {
          const c = CAT[vlak]
          const opties = DOELKEUZE_OPTIES[vlak]
          const gekozen = keuzes[vlak]

          return (
            <Card key={vlak} style={{
              borderRadius: 20,
              border: `1.5px solid ${gekozen !== undefined ? 'color-mix(in srgb, ' + c.kleur + ' 40%, transparent)' : 'var(--border)'}`,
              padding: '20px 20px', marginBottom: 16,
              transition: 'border-color 0.2s var(--ease)',
            }}>
              {/* Domain header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur, flexShrink: 0,
                }}>
                  <span style={{ transform: 'scale(0.75)', display: 'flex' }}>{c.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Aandachtsgebied {idx + 1}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: c.kleur }}>
                    {c.label} — {scores[vlak]}/20
                  </p>
                </div>
                {gekozen !== undefined && (
                  <div style={{
                    marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
                    background: c.kleur, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--bg-app)', flexShrink: 0,
                  }}>
                    <Check size={12} strokeWidth={3.5} aria-hidden />
                  </div>
                )}
              </div>

              {/* Goal options */}
              <div
                role="radiogroup"
                aria-label={`Kies een doel voor ${c.label}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {opties.map((opt, i) => {
                  const selected = gekozen === i
                  return (
                    <button key={i}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setKeuzes(prev => ({ ...prev, [vlak]: i }))}
                      className="mf-doelkeuze-optie"
                      style={{
                        textAlign: 'left', padding: '13px 15px', borderRadius: 12,
                        border: `2px solid ${selected ? c.kleur : 'var(--border-strong)'}`,
                        background: selected ? c.licht : 'var(--bg-subtle)',
                        cursor: 'pointer', transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)', width: '100%',
                        display: 'flex', alignItems: 'flex-start', gap: 11,
                      }}>
                      <span aria-hidden style={{
                        flexShrink: 0, marginTop: 1, width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${selected ? c.kleur : 'var(--border-strong)'}`,
                        background: selected ? c.kleur : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--bg-app)',
                      }}>
                        {selected && <Check size={11} strokeWidth={3.5} aria-hidden />}
                      </span>
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: selected ? c.kleur : 'var(--text-1)', marginBottom: 3 }}>
                          {opt.titel}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                          {opt.beschrijving}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {/* Confirm button */}
        <Button
          onClick={slaatOp}
          disabled={!alleGekozen || opgeslagen}
          loading={opgeslagen}
          size="lg"
          style={{ width: '100%', marginTop: 4 }}
        >
          {opgeslagen ? 'Bezig...' : alleGekozen ? 'Start deze week →' : resterend > 0 ? `Kies nog ${resterend} doel${resterend > 1 ? 'en' : ''}` : 'Kies je doelen'}
        </Button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>
          Je kunt je doelen later aanpassen via het Doelen-menu.
        </p>

      </div>
      <style>{`
        .mf-doelkeuze-optie:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
      `}</style>
    </main>
  )
}

export default function DoelKeuze() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div className="mf-spinner" />
      </main>
    }>
      <DoelKeuzeInhoud />
    </Suspense>
  )
}
