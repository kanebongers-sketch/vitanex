'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { laadXPData, berekenLevel, LEVEL_NAMEN, ALLE_ACHIEVEMENTS } from '@/lib/xp'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AandachtsPunt { titel: string; uitleg: string }
interface ActiePlan     { actie: string; waarom: string; wanneer: string }
interface BurnoutRisico { niveau: 'laag' | 'matig' | 'hoog'; score: number; uitleg: string }
interface WellbeingCat  { naam: string; niveau: 'goed' | 'matig' | 'laag'; samenvatting: string; tips: string[] }

interface AnalyseJSON {
  samenvatting:          string
  sterke_punten:         string[]
  aandachtspunten:       AandachtsPunt[]
  actieplan:             ActiePlan[]
  burnout_risico:        BurnoutRisico
  bericht:               string
  wellbeing_categorieen?: WellbeingCat[]
}

interface Analyse {
  id: string
  scores: Record<string, number>
  analyse_json: AnalyseJSON
  aangemaakt_op: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; kleur: string; bg: string; border: string }> = {
  e: { label: 'Energie & Lichaam',     kleur: '#1D9E75', bg: '#E1F5EE', border: '#A7F3D0' },
  m: { label: 'Mentaal welzijn',       kleur: '#378ADD', bg: '#E6F1FB', border: '#BFDBFE' },
  w: { label: 'Werk & Motivatie',      kleur: '#8B5CF6', bg: '#EEEDFE', border: '#DDD6FE' },
  s: { label: 'Team & Samenwerking',   kleur: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  g: { label: 'Groei & Ontwikkeling',  kleur: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
}

const WELLBEING_SLUG: Record<string, string> = {
  'Slaap': 'slaap', 'Stress': 'stress', 'Energie': 'energie',
  'Focus': 'focus', 'Werk-privé balans': 'balans', 'Motivatie': 'motivatie',
}

const WELLBEING_META: Record<string, { kleur: string; bg: string; border: string }> = {
  'Slaap':             { kleur: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  'Stress':            { kleur: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  'Energie':           { kleur: '#1D9E75', bg: '#E1F5EE', border: '#A7F3D0' },
  'Focus':             { kleur: '#185FA5', bg: '#E6F1FB', border: '#BFDBFE' },
  'Werk-privé balans': { kleur: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  'Motivatie':         { kleur: '#9D174D', bg: '#FDF2F8', border: '#FBCFE8' },
}

const NIVEAU_CFG = {
  goed:  { bg: '#E1F5EE', tekst: '#0F6E56', label: 'Goed',           dot: '#1D9E75' },
  matig: { bg: '#FEF3C7', tekst: '#854F0B', label: 'Matig',          dot: '#B45309' },
  laag:  { bg: '#FCEBEB', tekst: '#A32D2D', label: 'Aandacht nodig', dot: '#DC2626' },
}

function ScoreBar({ waarde, kleur }: { waarde: number; kleur: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, background: kleur, width: `${(waarde / 5) * 100}%`, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, width: 28, textAlign: 'right' }}>{waarde.toFixed(1)}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Rapport() {
  const router  = useRouter()
  const [laden, setLaden]     = useState(true)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [xpLevel, setXpLevel] = useState(1)
  const [achCount, setAchCount] = useState(0)
  const [doelCount, setDoelCount] = useState(0)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Laatste persoonlijke analyse
      const { data } = await supabase
        .from('checkin_analyses')
        .select('id, scores, analyse_json, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) setAnalyse(data as Analyse)

      // Aantal actieve doelen
      const { count } = await supabase
        .from('doelen')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'actief')
      setDoelCount(count ?? 0)

      setLaden(false)

      // XP / achievements uit localStorage
      try {
        const xp = laadXPData()
        setXpLevel(berekenLevel(xp.xp))
        setAchCount((xp.achievements ?? []).length)
      } catch { /* non-critical */ }
    }
    laad()
  }, [router])

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const aj = analyse?.analyse_json

  // Zwakke gebieden (laag/matig) uit wellbeing_categorieen
  const zwakke = aj?.wellbeing_categorieen?.filter(c => c.niveau !== 'goed') ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Mijn rapport
            </h1>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>
              {analyse
                ? `Laatste check-in: ${new Date(analyse.aangemaakt_op).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}`
                : 'Nog geen check-in gedaan'}
            </p>
          </div>
          <Link href="/checkin" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1D9E75', color: 'white',
            borderRadius: 12, padding: '11px 22px',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(29,158,117,0.25)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Nieuwe check-in doen
          </Link>
        </div>

        {/* ── GEEN ANALYSE ── */}
        {!analyse ? (
          <div style={{
            background: 'white', borderRadius: 20, padding: '60px 40px',
            border: '1px solid #E5E7EB', textAlign: 'center',
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#1D9E75' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Nog geen rapport beschikbaar</h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Vul je eerste wekelijkse check-in in. De AI analyseert jouw antwoorden en maakt een persoonlijk rapport met inzichten en tips.
            </p>
            <Link href="/checkin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1D9E75', color: 'white',
              borderRadius: 12, padding: '12px 28px',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              Start eerste check-in →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── RIJ 1: Score + Samenvatting ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

              {/* Scores per categorie */}
              <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>
                  Scores deze week
                </p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Totaal</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: analyse.scores.t >= 4 ? '#1D9E75' : analyse.scores.t >= 2.5 ? '#B45309' : '#DC2626' }}>
                      {analyse.scores.t?.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>/5</span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(CAT_META).map(([k, meta]) => {
                    const v = analyse.scores[k]
                    if (!v) return null
                    return (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>{meta.label}</span>
                        </div>
                        <ScoreBar waarde={v} kleur={meta.kleur} />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Samenvatting + Sterke punten */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
                    AI-samenvatting
                  </p>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{aj?.samenvatting}</p>
                </div>
                {aj?.sterke_punten && aj.sterke_punten.length > 0 && (
                  <div style={{ background: '#E1F5EE', borderRadius: 18, padding: '20px 24px', border: '1px solid #A7F3D0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0F6E56', marginBottom: 10 }}>
                      Sterke punten
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aj.sterke_punten.map((p, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#065F46', lineHeight: 1.5 }}>
                          <span style={{ flexShrink: 0, marginTop: 2, color: '#1D9E75' }}>✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ── VERBETERPUNTEN (zwakke gebieden) ── */}
            {zwakke.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Verbeterpunten</h2>
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Deze gebieden verdienen jouw aandacht. Stel een doel in om actief aan te werken.</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {zwakke.map(cat => {
                    const meta  = WELLBEING_META[cat.naam] ?? { kleur: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }
                    const nv    = NIVEAU_CFG[cat.niveau]
                    const slug  = WELLBEING_SLUG[cat.naam] ?? cat.naam.toLowerCase()
                    return (
                      <div key={cat.naam} style={{
                        background: 'white', borderRadius: 16, padding: '20px 22px',
                        border: `1.5px solid ${meta.border}`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: meta.kleur }}>{cat.naam}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: nv.bg, color: nv.tekst }}>
                            {nv.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>{cat.samenvatting}</p>
                        {cat.tips.length > 0 && (
                          <ul style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {cat.tips.slice(0, 2).map((tip, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={meta.kleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                        <Link href={`/doelen?categorie=${slug}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: meta.bg, color: meta.kleur,
                          border: `1.5px solid ${meta.border}`,
                          borderRadius: 10, padding: '8px 16px',
                          fontSize: 13, fontWeight: 700, textDecoration: 'none',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
                          </svg>
                          Stel een doel in
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── AANDACHTSPUNTEN + ACTIEPLAN ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Aandachtspunten */}
              {aj?.aandachtspunten && aj.aandachtspunten.length > 0 && (
                <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
                    Aandachtspunten
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {aj.aandachtspunten.map((a, i) => (
                      <div key={i} style={{ borderRadius: 12, padding: '14px 16px', background: '#FAEEDA', borderLeft: '3px solid #BA7517' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#854F0B', marginBottom: 4 }}>{a.titel}</p>
                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{a.uitleg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actieplan */}
              {aj?.actieplan && aj.actieplan.length > 0 && (
                <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
                    Actieplan voor volgende week
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {aj.actieplan.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#378ADD', flexShrink: 0, marginTop: 1 }}>
                          {i + 1}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{item.actie}</p>
                          <p style={{ fontSize: 11, color: '#B45309', fontWeight: 600, marginBottom: 2 }}>{item.wanneer}</p>
                          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{item.waarom}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── BURN-OUT RISICO ── */}
            {aj?.burnout_risico && (
              (() => {
                const r = aj.burnout_risico
                const cfg = r.niveau === 'hoog'
                  ? { bg: '#FCEBEB', border: '#E24B4A', tekst: '#A32D2D', label: 'Hoog risico' }
                  : r.niveau === 'matig'
                  ? { bg: '#FAEEDA', border: '#BA7517', tekst: '#854F0B', label: 'Matig risico' }
                  : { bg: '#E1F5EE', border: '#1D9E75', tekst: '#0F6E56', label: 'Laag risico' }
                return (
                  <div style={{ borderRadius: 16, padding: '20px 24px', background: cfg.bg, borderLeft: `4px solid ${cfg.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: cfg.tekst }}>Burn-out risico: {cfg.label}</p>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: cfg.border + '20', color: cfg.tekst }}>
                        {r.score}/10
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: cfg.tekst, lineHeight: 1.6 }}>{r.uitleg}</p>
                    {r.niveau !== 'laag' && (
                      <Link href="/burnout" style={{ display: 'inline-flex', marginTop: 10, fontSize: 13, fontWeight: 600, color: cfg.tekst, textDecoration: 'underline' }}>
                        Doe de volledige burn-out scan →
                      </Link>
                    )}
                  </div>
                )
              })()
            )}

            {/* ── VOORTGANG: DOELEN + ACHIEVEMENTS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Doelen */}
              <Link href="/doelen" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 18, padding: '24px',
                  border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', gap: 18,
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#7C3AED' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Mijn doelen</p>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                      {doelCount > 0 ? `${doelCount} actief doel${doelCount !== 1 ? 'en' : ''}` : 'Nog geen doelen ingesteld'}
                    </p>
                    <p style={{ fontSize: 12, color: '#7C3AED', marginTop: 6, fontWeight: 600 }}>
                      {doelCount === 0 ? 'Stel je eerste doel in →' : 'Bekijk en log je voortgang →'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Achievements + Fit Level */}
              <Link href="/niveau" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 18, padding: '24px',
                  border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', gap: 18,
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#B45309' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Fit Level {xpLevel} — {LEVEL_NAMEN[xpLevel]}</p>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                      {achCount}/{ALLE_ACHIEVEMENTS.length} achievements behaald
                    </p>
                    <p style={{ fontSize: 12, color: '#B45309', marginTop: 6, fontWeight: 600 }}>
                      Bekijk al je achievements →
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* ── PERSOONLIJK BERICHT ── */}
            {aj?.bericht && (
              <div style={{ background: 'white', borderRadius: 18, padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
                  Persoonlijk bericht van de AI Coach
                </p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, fontStyle: 'italic' }}>"{aj.bericht}"</p>
                <Link href="/coach" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 16, fontSize: 13, fontWeight: 600,
                  color: '#185FA5', textDecoration: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  Praat verder met de AI Coach
                </Link>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}
