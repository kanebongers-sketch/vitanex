'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface TeamLid {
  id: string
  naam: string
  email: string
  checkins_30d: number
  dagen_sinds_checkin: number | null
  burnout_risico: number | null
  burnout_trending: string | null
  gemiddelde_scores: Record<string, number>
}

interface Aggregaat {
  totaal_medewerkers: number
  actief_30d: number
  participatie_pct: number
  totaal_checkins: number
  gem_burnout_risico: number | null
}

const DOMEIN_LABELS: Record<string, string> = {
  energie: 'Energie', slaap: 'Slaap', stress: 'Stress',
  focus: 'Focus', balans: 'Balans', motivatie: 'Motivatie',
}

function burnoutKleur(score: number | null) {
  if (score === null) return 'var(--text-4)'
  if (score >= 70) return 'var(--mf-red)'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-green)'
}

function RisicoBar({ score, max = 100 }: { score: number | null; max?: number }) {
  if (score === null) return <span style={{ fontSize: 12, color: 'var(--text-4)' }}>—</span>
  const kleur = burnoutKleur(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(score / max) * 100}%`, background: kleur, borderRadius: 100 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, width: 32, textAlign: 'right' }}>{score}%</span>
    </div>
  )
}

export default function HrTeamPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [team, setTeam] = useState<TeamLid[]>([])
  const [aggregaat, setAggregaat] = useState<Aggregaat | null>(null)
  const [sorteer, setSorteer] = useState<'naam' | 'burnout' | 'checkins' | 'inactief'>('burnout')
  const [filter, setFilter] = useState<'alles' | 'risico' | 'inactief'>('alles')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin', 'manager'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      const res = await authFetch('/api/manager/team-overzicht')
      if (res.ok) {
        const data = await res.json() as { team: TeamLid[]; aggregaat: Aggregaat }
        setTeam(data.team ?? [])
        setAggregaat(data.aggregaat ?? null)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  const gesorteerd = [...team]
    .filter(m => {
      if (filter === 'risico') return (m.burnout_risico ?? 0) >= 60
      if (filter === 'inactief') return m.checkins_30d === 0
      return true
    })
    .sort((a, b) => {
      if (sorteer === 'naam') return a.naam.localeCompare(b.naam)
      if (sorteer === 'burnout') return (b.burnout_risico ?? -1) - (a.burnout_risico ?? -1)
      if (sorteer === 'checkins') return b.checkins_30d - a.checkins_30d
      if (sorteer === 'inactief') return (b.dagen_sinds_checkin ?? 999) - (a.dagen_sinds_checkin ?? 999)
      return 0
    })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Team overzicht</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Anonieme welzijnsdata van jouw team (30 dagen)</p>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : (
          <>
            {/* Aggregaat stats */}
            {aggregaat && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Medewerkers', waarde: aggregaat.totaal_medewerkers, kleur: 'var(--text-2)' },
                  { label: 'Actief (30d)', waarde: aggregaat.actief_30d, kleur: 'var(--mf-green)' },
                  { label: 'Participatie', waarde: `${aggregaat.participatie_pct}%`, kleur: aggregaat.participatie_pct >= 70 ? 'var(--mf-green)' : 'var(--mf-amber)' },
                  { label: 'Check-ins', waarde: aggregaat.totaal_checkins, kleur: 'var(--mf-purple)' },
                  { label: 'Gem. burnout', waarde: aggregaat.gem_burnout_risico !== null ? `${aggregaat.gem_burnout_risico}%` : '—', kleur: burnoutKleur(aggregaat.gem_burnout_risico) },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '16px 18px' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters & sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 10, padding: 3 }}>
                {(['alles', 'risico', 'inactief'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 12, border: 'none', cursor: 'pointer',
                    background: filter === f ? 'white' : 'transparent',
                    color: filter === f ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: filter === f ? 600 : 400,
                  }}>
                    {f === 'alles' ? 'Alles' : f === 'risico' ? '⚠ Hoog risico' : '💤 Inactief'}
                  </button>
                ))}
              </div>
              <select
                value={sorteer}
                onChange={e => setSorteer(e.target.value as typeof sorteer)}
                style={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', background: 'white', color: 'var(--text-2)', outline: 'none' }}
              >
                <option value="burnout">Sorteer: burnout risico</option>
                <option value="naam">Sorteer: naam</option>
                <option value="checkins">Sorteer: check-ins</option>
                <option value="inactief">Sorteer: inactief</option>
              </select>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{gesorteerd.length} medewerkers</p>
            </div>

            {/* Team tabel */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Medewerker', 'Check-ins (30d)', 'Laatste check-in', 'Burnout risico', 'Aandacht'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', padding: '12px 16px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gesorteerd.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', fontSize: 13, color: 'var(--text-3)' }}>Geen medewerkers gevonden</td></tr>
                  ) : gesorteerd.map(m => {
                    const isInactief = m.checkins_30d === 0
                    const isHoogRisico = (m.burnout_risico ?? 0) >= 70
                    return (
                      <tr key={m.id} style={{ borderTop: '1px solid #F9FAFB' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: isHoogRisico ? 'var(--mf-red-light)' : isInactief ? 'var(--bg-subtle)' : 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isHoogRisico ? 'var(--mf-red)' : isInactief ? 'var(--text-3)' : 'var(--mf-green)', flexShrink: 0 }}>
                              {(m.naam ?? 'M').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{m.naam ?? 'Anoniem'}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.email ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < Math.min(m.checkins_30d, 5) ? 'var(--mf-green)' : 'var(--border)' }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{m.checkins_30d}×</p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {m.dagen_sinds_checkin === null ? (
                            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Nooit</span>
                          ) : m.dagen_sinds_checkin === 0 ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-green)' }}>Vandaag</span>
                          ) : (
                            <span style={{ fontSize: 12, color: m.dagen_sinds_checkin > 14 ? 'var(--mf-red)' : m.dagen_sinds_checkin > 7 ? 'var(--mf-amber)' : 'var(--text-2)' }}>
                              {m.dagen_sinds_checkin}d geleden
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', minWidth: 140 }}>
                          <RisicoBar score={m.burnout_risico} />
                          {m.burnout_trending && (
                            <p style={{ fontSize: 10, color: m.burnout_trending === 'stijgend' ? 'var(--mf-red)' : 'var(--mf-green)', marginTop: 2 }}>
                              {m.burnout_trending === 'stijgend' ? '↑ stijgend' : m.burnout_trending === 'dalend' ? '↓ dalend' : '→ stabiel'}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {isHoogRisico && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'var(--mf-red-light)', color: 'var(--mf-red)' }}>Hoog risico</span>
                            )}
                            {isInactief && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>Inactief</span>
                            )}
                            {m.dagen_sinds_checkin !== null && m.dagen_sinds_checkin > 14 && !isInactief && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)' }}>Lang inactief</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
              Alle data is geanonimiseerd en alleen zichtbaar als team &gt; 3 personen heeft deelgenomen.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

