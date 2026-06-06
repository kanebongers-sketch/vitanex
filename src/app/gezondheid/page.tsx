'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/Navbar'
import nextDynamic from 'next/dynamic'
const AiCoachCard = nextDynamic(() => import('@/components/AiCoachCard'), { ssr: false })
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface TrendPunt {
  datum: string
  stappen?: number
  slaap?: number
  hartslag?: number
  welzijn?: number
  stemming?: string
}

interface Risico {
  score: number
  niveau: 'laag' | 'matig' | 'hoog'
  factoren: string[]
}

interface Correlatie {
  label: string
  tip: string
}

interface HealthData {
  risico: Risico
  trend: TrendPunt[]
  statistieken: {
    gemiddeldStappen: number
    gemiddeldSlaapMinuten: number
    aantalMetingen: number
    aantalCheckins: number
  }
  correlaties: Correlatie[]
}

const RISICO_KLEUR = { laag: '#1D9E75', matig: '#F59E0B', hoog: '#E24B4A' }
const RISICO_BG    = { laag: '#F0FAF6', matig: '#FFFBEB', hoog: '#FEF2F2' }
const RISICO_LABEL = { laag: 'Laag risico', matig: 'Matig risico', hoog: 'Hoog risico' }

const STEMMING_SCORE: Record<string, number> = {
  moe: 1, gestrest: 2, ok: 3, blij: 4, energiek: 5,
}

function dagKort(datum: string) {
  const d = new Date(datum + 'T12:00:00')
  return d.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric' }).replace('.', '')
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function GezondheidPage() {
  const router = useRouter()
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actief, setActief] = useState<'stappen' | 'slaap' | 'hartslag' | 'welzijn' | 'voeding'>('stappen')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      authFetch('/api/health-insights')
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    })
  }, [router])

  const trendMetLabels = data?.trend.map(t => ({
    ...t,
    dagLabel: dagKort(t.datum),
    stemmingScore: t.stemming ? STEMMING_SCORE[t.stemming] : undefined,
  })) || []

  const risico = data?.risico
  const risicoKleur = risico ? RISICO_KLEUR[risico.niveau] : '#9CA3AF'
  const risicoBg    = risico ? RISICO_BG[risico.niveau] : '#F9FAFB'

  const tabs: { key: typeof actief; label: string; kleur: string; eenheid: string }[] = [
    { key: 'stappen',  label: '👟 Stappen',  kleur: '#1D9E75', eenheid: 'stappen' },
    { key: 'slaap',    label: '😴 Slaap',    kleur: '#8B5CF6', eenheid: 'uur' },
    { key: 'hartslag', label: '❤️ Hartslag', kleur: '#E24B4A', eenheid: 'bpm' },
    { key: 'welzijn',  label: '⚡ Welzijn',  kleur: '#F59E0B', eenheid: '/100' },
    { key: 'voeding',  label: '🥗 Voeding',  kleur: '#1D9E75', eenheid: 'kcal' },
  ]

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>
            Jouw Gezondheid
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Objectieve data + jouw gevoel gecombineerd
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 300, 260].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 20, background: 'white', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : !data ? (
          <div style={{ background: 'white', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Geen data beschikbaar</p>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Koppel een wearable om je gezondheidsdata te zien.</p>
          </div>
        ) : (
          <>
            {/* Burn-out risico card */}
            <div style={{
              background: risicoBg,
              border: `1px solid ${risicoKleur}30`,
              borderRadius: 20,
              padding: '18px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="24" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="24" fill="none" stroke={risicoKleur} strokeWidth="6"
                  strokeDasharray={`${(risico!.score / 100) * 150.8} 150.8`}
                  strokeLinecap="round" transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dasharray 1.2s ease' }}
                />
                <text x="32" y="28" textAnchor="middle" fontSize="16" fontWeight="900" fill={risicoKleur}>{risico!.score}</text>
                <text x="32" y="40" textAnchor="middle" fontSize="9" fill="#9CA3AF">/100</text>
              </svg>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: risicoKleur, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                  Burn-out risico — {RISICO_LABEL[risico!.niveau]}
                </p>
                {risico!.factoren.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {risico!.factoren.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: risicoKleur, flexShrink: 0, display: 'inline-block' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>✅ Geen risicosignalen — ga zo door!</p>
                )}
              </div>
            </div>

            {/* Statistieken cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Gem. stappen', value: data.statistieken.gemiddeldStappen > 0 ? data.statistieken.gemiddeldStappen.toLocaleString('nl') : '–', sub: 'per dag' },
                { label: 'Gem. slaap', value: data.statistieken.gemiddeldSlaapMinuten > 0 ? `${Math.floor(data.statistieken.gemiddeldSlaapMinuten / 60)}u${data.statistieken.gemiddeldSlaapMinuten % 60}m` : '–', sub: 'per nacht' },
                { label: 'Check-ins', value: String(data.statistieken.aantalCheckins), sub: 'laatste 30 dagen' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ── AI Bewegingscoach ── */}
            <AiCoachCard
              categorie="beweging"
              apiUrl="/api/ai-coach/beweging"
              linkUrl="/koppelingen"
              linkLabel="Koppel wearable"
            />

            {/* Chart tabs */}
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', marginBottom: 16, overflow: 'hidden' }}>
              {/* Tab buttons */}
              <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', overflowX: 'auto' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActief(tab.key)}
                    style={{
                      flex: 1, minWidth: 80, padding: '12px 8px', border: 'none', cursor: 'pointer',
                      background: actief === tab.key ? `${tab.kleur}15` : 'transparent',
                      borderBottom: actief === tab.key ? `2px solid ${tab.kleur}` : '2px solid transparent',
                      fontSize: 12, fontWeight: actief === tab.key ? 700 : 500,
                      color: actief === tab.key ? tab.kleur : '#9CA3AF',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div style={{ padding: '20px 16px 16px' }}>
                {trendMetLabels.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Nog geen data — koppel een wearable onder Koppelingen.</p>
                  </div>
                ) : actief === 'stappen' ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendMetLabels} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="stappen" name="Stappen" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : actief === 'slaap' ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendMetLabels} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={35} domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="slaap" name="Slaap (uur)" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : actief === 'hartslag' ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendMetLabels}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={35} domain={[50, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line dataKey="hartslag" name="Hartslag (bpm)" stroke="#E24B4A" strokeWidth={2.5} dot={{ r: 4, fill: '#E24B4A' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : actief === 'welzijn' ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendMetLabels}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={35} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line dataKey="welzijn" name="Welzijn (/100)" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} connectNulls />
                      <Line dataKey="stemmingScore" name="Stemming (1-5)" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} strokeDasharray="4 2" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : actief === 'voeding' ? (
                  <div style={{ padding: '20px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#374151', fontWeight: 700, marginBottom: 8 }}>🥗 Voeding</p>
                    <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
                      Log je maaltijden via de Voeding pagina.<br />
                      Data verschijnt hier automatisch.
                    </p>
                    <a href="/voeding" style={{
                      display: 'inline-block', marginTop: 12,
                      background: '#1D9E75', color: 'white',
                      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}>
                      Voeding loggen →
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Gecombineerde trend: stappen + welzijn */}
            {trendMetLabels.some(t => t.welzijn && t.stappen) && (
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', padding: '18px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
                  📈 Stappen vs Welzijn
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendMetLabels}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="dagLabel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="stappen" orientation="left" tick={{ fontSize: 9, fill: '#1D9E75' }} axisLine={false} tickLine={false} width={45} />
                    <YAxis yAxisId="welzijn" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: '#F59E0B' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="stappen" dataKey="stappen" name="Stappen" stroke="#1D9E75" strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="welzijn" dataKey="welzijn" name="Welzijn" stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Correlaties */}
            {data.correlaties.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
                  💡 Jouw patronen
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.correlaties.map((c, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{c.label.split(' ')[0]}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>{c.label.split(' ').slice(1).join(' ')}</p>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{c.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA wearable koppelen als geen data */}
            {data.statistieken.aantalMetingen === 0 && (
              <div style={{ background: 'linear-gradient(135deg, #1D9E7510, #8B5CF610)', border: '1px dashed #1D9E7540', borderRadius: 20, padding: '24px', textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>⌚</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Koppel je wearable voor echte data</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Google Fitness, Samsung Health of Apple Health</p>
                <a href="/koppelingen" style={{
                  display: 'inline-block', background: '#1D9E75', color: 'white',
                  padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>
                  Koppelen →
                </a>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }
      `}</style>
    </div>
  )
}
