'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { AlertTriangle, Moon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { useVertaling } from '@/lib/i18n/TaalProvider'


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

type SorteerKey = 'naam' | 'burnout' | 'checkins' | 'inactief'

function burnoutKleur(score: number | null) {
  if (score === null) return 'var(--text-4)'
  if (score >= 70) return 'var(--mf-red)'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-green)'
}

function RisicoBar({ score, max = 100 }: { score: number | null; max?: number }) {
  const { t } = useVertaling()
  if (score === null) return <span style={{ fontSize: 12, color: 'var(--text-4)' }}>—</span>
  const kleur = burnoutKleur(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Progress value={score} max={max} ariaLabel={t('werk.hrTeam.risicoLabel', { score })} color={kleur} thickness={6} style={{ flex: 1 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: kleur, width: 32, textAlign: 'right' }}>{score}%</span>
    </div>
  )
}

export default function HrTeamPage() {
  const router = useRouter()
  const { t } = useVertaling()
  const [laden, setLaden] = useState(true)
  const [team, setTeam] = useState<TeamLid[]>([])
  const [aggregaat, setAggregaat] = useState<Aggregaat | null>(null)
  const [sorteer, setSorteer] = useState<SorteerKey>('burnout')
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

  const filterOpties: { id: 'alles' | 'risico' | 'inactief'; label: string; icon?: typeof AlertTriangle }[] = [
    { id: 'alles', label: t('werk.hrTeam.alles') },
    { id: 'risico', label: t('werk.hrTeam.hoogRisico'), icon: AlertTriangle },
    { id: 'inactief', label: t('werk.hrTeam.inactief'), icon: Moon },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>{t('werk.hrTeam.titel')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('werk.hrTeam.intro')}</p>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : (
          <>
            {/* Aggregaat stats */}
            {aggregaat && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: t('werk.hrTeam.medewerkers'), waarde: aggregaat.totaal_medewerkers, kleur: 'var(--text-1)' },
                  { label: t('werk.hrTeam.actief30'), waarde: aggregaat.actief_30d, kleur: 'var(--mf-green)' },
                  { label: t('werk.hrTeam.participatie'), waarde: `${aggregaat.participatie_pct}%`, kleur: aggregaat.participatie_pct >= 70 ? 'var(--mf-green)' : 'var(--mf-amber)' },
                  { label: t('werk.hrTeam.checkins'), waarde: aggregaat.totaal_checkins, kleur: 'var(--mf-purple)' },
                  { label: t('werk.hrTeam.gemBurnout'), waarde: aggregaat.gem_burnout_risico !== null ? `${aggregaat.gem_burnout_risico}%` : '—', kleur: burnoutKleur(aggregaat.gem_burnout_risico) },
                ].map(s => (
                  <Card key={s.label} style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: s.kleur }}>{s.waarde}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Filters & sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div role="group" aria-label={t('werk.hrTeam.filterLabel')} style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
                {filterOpties.map(f => {
                  const Icon = f.icon
                  const actief = filter === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={actief}
                      onClick={() => setFilter(f.id)}
                      className="mf-team-filter"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 'var(--radius-xs)', fontSize: 12, border: 'none', cursor: 'pointer',
                        background: actief ? 'var(--bg-card)' : 'transparent',
                        color: actief ? 'var(--text-1)' : 'var(--text-3)',
                        fontWeight: actief ? 600 : 400,
                      }}
                    >
                      {Icon && <Icon size={13} aria-hidden />}
                      {f.label}
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{t('werk.hrTeam.aantalMedewerkers', { aantal: gesorteerd.length })}</p>
            </div>

            {/* Team tabel */}
            <Table caption={t('werk.hrTeam.caption')}>
              <THead>
                <Tr>
                  <Th scope="col" sortable sortDirection={sorteer === 'naam' ? 'asc' : 'none'} onSort={() => setSorteer('naam')}>{t('werk.hrTeam.kolomMedewerker')}</Th>
                  <Th scope="col" sortable sortDirection={sorteer === 'checkins' ? 'desc' : 'none'} onSort={() => setSorteer('checkins')}>{t('werk.hrTeam.kolomCheckins')}</Th>
                  <Th scope="col" sortable sortDirection={sorteer === 'inactief' ? 'desc' : 'none'} onSort={() => setSorteer('inactief')}>{t('werk.hrTeam.kolomLaatste')}</Th>
                  <Th scope="col" sortable sortDirection={sorteer === 'burnout' ? 'desc' : 'none'} onSort={() => setSorteer('burnout')}>{t('werk.hrTeam.kolomRisico')}</Th>
                  <Th scope="col">{t('werk.hrTeam.kolomAandacht')}</Th>
                </Tr>
              </THead>
              <TBody>
                {gesorteerd.length === 0 ? (
                  <Tr><Td colSpan={5} align="center" style={{ padding: '40px', fontSize: 13, color: 'var(--text-3)' }}>{t('werk.hrTeam.geenMedewerkers')}</Td></Tr>
                ) : gesorteerd.map(m => {
                  const isInactief = m.checkins_30d === 0
                  const isHoogRisico = (m.burnout_risico ?? 0) >= 70
                  const avatarBg = isHoogRisico ? 'var(--mf-red-light)' : isInactief ? 'var(--bg-subtle)' : 'var(--mf-green-light)'
                  const avatarColor = isHoogRisico ? 'var(--mf-red)' : isInactief ? 'var(--text-3)' : 'var(--mf-green)'
                  return (
                    <Tr key={m.id}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div aria-hidden style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>
                            {(m.naam ?? 'M').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{m.naam ?? t('werk.hrTeam.anoniem')}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.email ?? ''}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div aria-hidden style={{ display: 'flex', gap: 3 }}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < Math.min(m.checkins_30d, 5) ? 'var(--mf-green)' : 'var(--border-strong)' }} />
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{m.checkins_30d}×</p>
                      </Td>
                      <Td>
                        {m.dagen_sinds_checkin === null ? (
                          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{t('werk.hrTeam.nooit')}</span>
                        ) : m.dagen_sinds_checkin === 0 ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-green)' }}>{t('werk.hrTeam.vandaag')}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: m.dagen_sinds_checkin > 14 ? 'var(--mf-red)' : m.dagen_sinds_checkin > 7 ? 'var(--mf-amber)' : 'var(--text-2)' }}>
                            {t('werk.hrTeam.dagenGeleden', { dagen: m.dagen_sinds_checkin })}
                          </span>
                        )}
                      </Td>
                      <Td style={{ minWidth: 140 }}>
                        <RisicoBar score={m.burnout_risico} />
                        {m.burnout_trending && (
                          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: m.burnout_trending === 'stijgend' ? 'var(--mf-red)' : m.burnout_trending === 'dalend' ? 'var(--mf-green)' : 'var(--text-3)', marginTop: 2 }}>
                            {m.burnout_trending === 'stijgend' ? <><TrendingUp size={11} aria-hidden /> {t('werk.hrTeam.stijgend')}</> : m.burnout_trending === 'dalend' ? <><TrendingDown size={11} aria-hidden /> {t('werk.hrTeam.dalend')}</> : <><ArrowRight size={11} aria-hidden /> {t('werk.hrTeam.stabiel')}</>}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {isHoogRisico && <Badge variant="danger" style={{ fontSize: 10, padding: '2px 8px' }}>{t('werk.hrTeam.hoogRisico')}</Badge>}
                          {isInactief && <Badge variant="neutral" style={{ fontSize: 10, padding: '2px 8px' }}>{t('werk.hrTeam.inactief')}</Badge>}
                          {m.dagen_sinds_checkin !== null && m.dagen_sinds_checkin > 14 && !isInactief && (
                            <Badge variant="warning" style={{ fontSize: 10, padding: '2px 8px' }}>{t('werk.hrTeam.langInactief')}</Badge>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </TBody>
            </Table>

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
              {t('werk.hrTeam.privacy')}
            </p>
          </>
        )}
        <style>{`
          .mf-team-filter:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: 2px;
            border-radius: var(--radius-xs);
          }
        `}</style>
      </main>
    </div>
  )
}
