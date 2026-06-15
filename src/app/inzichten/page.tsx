'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface Inzichten {
  samenvatting: string
  patroon: string
  tip_van_de_week: string
  score_label: string
}

interface Stats {
  checkins: number
  stemming: string | null
  slaap: string | null
  stress: string | null
  burnout_risico: number | null
  burnout_trending: string | null
  focus_minuten: number
  dankbaarheid_dagen: number
}

export default function InzichtenPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [inzichten, setInzichten] = useState<Inzichten | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [bericht, setBericht] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/inzichten')
      if (res.ok) {
        const json = await res.json() as { inzichten: Inzichten | null; stats?: Stats; bericht?: string }
        setInzichten(json.inzichten)
        setStats(json.stats ?? null)
        setBericht(json.bericht ?? null)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  const burnoutKleur = (s: number | null) =>
    s === null ? '#9CA3AF' : s >= 70 ? '#EF4444' : s >= 45 ? '#F59E0B' : '#1D9E75'

  const stemmingKleur = (s: string | null) =>
    !s ? '#9CA3AF' : parseFloat(s) >= 4 ? '#1D9E75' : parseFloat(s) >= 3 ? '#F59E0B' : '#EF4444'

  const SCORE_LABEL_KLEUR: Record<string, string> = {
    'Sterke week': '#1D9E75', 'Goede week': '#6366f1',
    'Gemiddelde week': '#F59E0B', 'Uitdagende week': '#EF4444',
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Wekelijkse inzichten
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>AI-analyse van jouw afgelopen 7 dagen</p>
        </header>

        {bericht && !inzichten && (
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 24px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{bericht}</p>
          </div>
        )}

        {inzichten && (
          <>
            {/* Score label */}
            <div style={{
              background: (SCORE_LABEL_KLEUR[inzichten.score_label] ?? '#6366f1') + '10',
              border: `1px solid ${(SCORE_LABEL_KLEUR[inzichten.score_label] ?? '#6366f1') + '30'}`,
              borderRadius: 16, padding: '14px 18px', marginBottom: 16, textAlign: 'center',
            }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: SCORE_LABEL_KLEUR[inzichten.score_label] ?? '#6366f1' }}>
                {inzichten.score_label}
              </p>
            </div>

            {/* Samenvatting */}
            <div style={{ background: 'white', borderRadius: 20, padding: '18px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
                Samenvatting
              </p>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{inzichten.samenvatting}</p>
            </div>

            {/* Stats grid */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {stats.stemming && (
                  <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: stemmingKleur(stats.stemming) }}>{stats.stemming}</p>
                    <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Stemming</p>
                  </div>
                )}
                {stats.slaap && (
                  <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: parseFloat(stats.slaap) >= 7 ? '#1D9E75' : '#F59E0B' }}>{stats.slaap}u</p>
                    <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Gem. slaap</p>
                  </div>
                )}
                {stats.burnout_risico !== null && (
                  <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: burnoutKleur(stats.burnout_risico) }}>{stats.burnout_risico}%</p>
                    <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Burnout risico</p>
                  </div>
                )}
                <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: stats.focus_minuten >= 60 ? '#1D9E75' : '#9CA3AF' }}>{stats.focus_minuten}m</p>
                  <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Focus</p>
                </div>
                <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: stats.dankbaarheid_dagen >= 3 ? '#1D9E75' : '#9CA3AF' }}>{stats.dankbaarheid_dagen}×</p>
                  <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Dankbaarheid</p>
                </div>
                <div style={{ background: 'white', borderRadius: 14, padding: '14px 10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: stats.checkins > 0 ? '#1D9E75' : '#EF4444' }}>{stats.checkins}</p>
                  <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Check-ins</p>
                </div>
              </div>
            )}

            {/* Patroon */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #E5E7EB', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
                🔍 Patroon
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{inzichten.patroon}</p>
            </div>

            {/* Tip */}
            <div style={{ background: '#F0FDF4', borderRadius: 16, padding: '16px', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803D', marginBottom: 8 }}>
                💡 Tip van de week
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{inzichten.tip_van_de_week}</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
