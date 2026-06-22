'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CAT, DOELKEUZE_OPTIES } from '@/lib/doelen-config'
import { verwerkCheckin } from '@/lib/xp'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  vandaag, slaWeekSelectieOp,
} from '@/lib/weekdoelen'

const ALLE_VLAKKEN: WellbeingCat[] = ['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie']

function DoelKeuzeInhoud() {
  const params = useSearchParams()
  const router = useRouter()

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
      if (!res.ok) return

      const json = await res.json()
      if (!json.analyse) return

      const scoreVals = Object.values(vlak_scores).filter(v => v > 0)
      const gem = scoreVals.reduce((a, b) => a + b, 0) / (scoreVals.length || 1)
      const vitaalScore = Math.round(((gem - 4) / 16) * 100)

      await supabase.from('checkin_analyses').insert({
        sessie_id:      sessieId,
        user_id:        user.id,
        bedrijf_id:     profiel?.bedrijf_id ?? null,
        scores:         vlak_scores,
        analyse_json:   json.analyse,
        gedeeld_met_hr: false,
      })

      try { verwerkCheckin(vitaalScore) } catch { /* non-critical */ }
    } catch { /* non-critical — home will still load */ }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)',
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--mf-green)' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Check-in ingevuld!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Kies voor elk aandachtsgebied één doel dat je deze week wil aanpakken.
          </p>
        </div>

        {/* Welzijnscan score overzicht */}
        {ALLE_VLAKKEN.some(v => scores[v] > 0) && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '18px 20px',
            marginBottom: 20, border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
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
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: kleur, transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: kleur, width: 36, textAlign: 'right', flexShrink: 0 }}>{score}/20</span>
                    <span style={{ fontSize: 10, color: 'var(--text-4)', width: 40, flexShrink: 0 }}>{label}{isAandacht ? ' ⚠' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Domain goal selection */}
        {topDrie.map((vlak, idx) => {
          const c = CAT[vlak]
          const opties = DOELKEUZE_OPTIES[vlak]
          const gekozen = keuzes[vlak]

          return (
            <div key={vlak} style={{
              background: 'var(--bg-card)', borderRadius: 20,
              border: `1.5px solid ${gekozen !== undefined ? c.kleur + '40' : 'var(--border)'}`,
              padding: '20px 20px', marginBottom: 16,
              transition: 'border-color 0.2s',
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
                    background: c.kleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Goal options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {opties.map((opt, i) => {
                  const selected = gekozen === i
                  return (
                    <button key={i}
                      onClick={() => setKeuzes(prev => ({ ...prev, [vlak]: i }))}
                      style={{
                        textAlign: 'left', padding: '13px 15px', borderRadius: 12,
                        border: `2px solid ${selected ? c.kleur : 'var(--border)'}`,
                        background: selected ? c.licht : 'var(--bg-subtle)',
                        cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                      }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: selected ? c.kleur : 'var(--text-1)', marginBottom: 3 }}>
                        {opt.titel}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                        {opt.beschrijving}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Confirm button */}
        <button
          onClick={slaatOp}
          disabled={!alleGekozen || opgeslagen}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: alleGekozen ? 'var(--mf-green)' : 'var(--border)',
            color: alleGekozen ? 'white' : 'var(--text-3)',
            fontSize: 15, fontWeight: 700, cursor: alleGekozen && !opgeslagen ? 'pointer' : 'default',
            transition: 'all 0.2s', marginTop: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {opgeslagen ? 'Bezig...' : alleGekozen ? 'Start deze week →' : `Kies nog ${resterend} doel${resterend > 1 ? 'en' : ''}`}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>
          Je kunt je doelen later aanpassen via het Doelen-menu.
        </p>

      </div>
    </main>
  )
}

export default function DoelKeuze() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mf-green-light)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: 'var(--mf-green)' }} className="mf-spinner" />
      </main>
    }>
      <DoelKeuzeInhoud />
    </Suspense>
  )
}
