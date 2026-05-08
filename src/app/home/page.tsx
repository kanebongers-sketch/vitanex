'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'

type CheckIn = {
  energie: number
  slaap: number
  mentaal_focus: number
  mentaal_balans: number
  motivatie: number
}

function berekenScore(ci: CheckIn): number {
  const w = [ci.energie, ci.slaap, ci.mentaal_focus, ci.mentaal_balans, ci.motivatie]
  return Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 20)
}

function ScoreRing({ score }: { score: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={kleur} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill={kleur}>{score}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#9CA3AF">/100</text>
    </svg>
  )
}

function StatCard({ label, value, color, bg, icon }: { label: string; value: string | number; color: string; bg: string; icon: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '16px 18px',
      border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [recentCheckins, setRecentCheckins] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol, bedrijf_id').eq('id', user.id).single()

      setNaam(profiel?.naam ?? '')

      // Laatste check-in
      const { data: ci } = await supabase
        .from('checkins').select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      if (ci) setCheckIn(ci as CheckIn)

      // Afgelopen 4 weken check-ins
      const { count } = await supabase.from('checkins')
        .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
      setRecentCheckins(count ?? 0)
      setStreak(Math.min(count ?? 0, 7))

      setLaden(false)
    }
    laad()
  }, [router])

  const score = checkIn ? berekenScore(checkIn) : null
  const scoreKleur = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabel = !score ? 'Geen data' : score >= 70 ? 'Goed op weg!' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'

  const dagtijd = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond'
  })()

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            {dagtijd}, {naam.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 3 }}>
            Hier is je vitaliteitsoverzicht van vandaag.
          </p>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard
            label="Vitaalscore"
            value={score ?? '—'}
            color={scoreKleur}
            bg={!score ? '#F3F4F6' : score >= 70 ? '#E1F5EE' : score >= 45 ? '#FEF3C7' : '#FEE2E2'}
            icon={!score ? '—' : score >= 70 ? '💚' : score >= 45 ? '🟡' : '🔴'}
          />
          <StatCard label="Check-ins (4w)" value={recentCheckins} color="#185FA5" bg="#EFF6FF" icon="📋" />
          <StatCard label="Week streak" value={`${streak}x`} color="#7C3AED" bg="#EDE9FE" icon="🔥" />
        </div>

        {/* ── MAIN CONTENT: score kaart + vitaliteit tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>

          {/* Score card */}
          <div style={{
            background: 'white', borderRadius: 16, padding: '24px',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 16 }}>
              Vitaliteitsscore
            </p>
            {score ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ScoreRing score={score} />
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: scoreKleur, marginBottom: 6 }}>{scoreLabel}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 12 }}>
                    {score < 50
                      ? 'Je score is laag. Overweeg de AI Coach te raadplegen voor persoonlijk advies.'
                      : 'Je staat er goed voor deze week. Blijf lekker zo doorgaan!'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/rapport" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#1D9E75', color: 'white',
                      borderRadius: 8, padding: '8px 14px',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>
                      Bekijk rapport
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                    <Link href="/checkin" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#F0FDF8', color: '#1D9E75',
                      border: '1.5px solid #1D9E75',
                      borderRadius: 8, padding: '8px 14px',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>
                      Nieuwe check-in
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, background: '#F0FDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>📊</div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Nog geen check-in gedaan</p>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Doe je eerste check-in en ontdek je vitaliteitsscore.</p>
                  <Link href="/checkin" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#1D9E75', color: 'white',
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>
                    Start check-in →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Score per dimensie */}
          {checkIn && (
            <div style={{
              background: 'white', borderRadius: 16, padding: '20px',
              border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
                Per dimensie
              </p>
              {[
                { label: 'Energie',   value: checkIn.energie,        color: '#F59E0B', bg: '#FEF3C7' },
                { label: 'Slaap',     value: checkIn.slaap,          color: '#185FA5', bg: '#EFF6FF' },
                { label: 'Focus',     value: checkIn.mentaal_focus,  color: '#7C3AED', bg: '#EDE9FE' },
                { label: 'Balans',    value: checkIn.mentaal_balans, color: '#1D9E75', bg: '#E1F5EE' },
                { label: 'Motivatie', value: checkIn.motivatie,      color: '#EF4444', bg: '#FEE2E2' },
              ].map(d => (
                <div key={d.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{d.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}/5</p>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: d.color, width: `${(d.value / 5) * 100}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SNELLE ACTIES ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            Snelle acties
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { href: '/checkin',     emoji: '✅', label: 'Check-in',    color: '#1D9E75', bg: '#E1F5EE' },
              { href: '/coach',       emoji: '🧠', label: 'AI Coach',    color: '#185FA5', bg: '#EFF6FF' },
              { href: '/doelen',      emoji: '🎯', label: 'Doelen',      color: '#7C3AED', bg: '#EDE9FE' },
              { href: '/uitdagingen', emoji: '🏆', label: 'Uitdagingen', color: '#B45309', bg: '#FEF3C7' },
              { href: '/journal',     emoji: '📓', label: 'Journal',     color: '#0369A1', bg: '#E0F2FE' },
              { href: '/burnout',     emoji: '🔥', label: 'Burn-out',    color: '#DC2626', bg: '#FEE2E2' },
              { href: '/focus',       emoji: '🫁', label: 'Focus',       color: '#065F46', bg: '#ECFDF5' },
              { href: '/rapport',     emoji: '📊', label: 'Rapport',     color: '#374151', bg: '#F3F4F6' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'white', borderRadius: 12, padding: '16px 8px',
                border: '1px solid #E5E7EB', textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {item.emoji}
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{item.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Crisis */}
        <div style={{ maxWidth: 400 }}>
          <CrisisButton />
        </div>

      </main>
    </div>
  )
}
