'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import RadarChart from '@/components/ui/RadarChart'
import { CoachNotitie } from '@/components/coaching/CoachNotitie'
import { BackLink, CoachStat, CoachEmpty, CoachSkeleton, CoachSection } from '@/components/coaching/CoachChrome'
import { KOPPEL_STATUS_STIJL, type KlantDetail } from '@/lib/coaching/relatie'
import { ShieldAlert, TrendingUp, TrendingDown, ArrowRight, LayoutGrid, ListChecks, Milestone, Dumbbell, Apple, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function burnoutKleur(score: number | null) {
  if (score === null) return 'var(--text-4)'
  if (score >= 70) return 'var(--mf-red)'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-green)'
}

function datumKort(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ModuleTabs({ klantId }: { klantId: string }) {
  const tabs: { href: string; label: string; icon: LucideIcon; actief?: boolean }[] = [
    { href: `/coaching/${klantId}`, label: 'Overzicht', icon: LayoutGrid, actief: true },
    { href: `/coaching/${klantId}/taken`, label: 'Taken', icon: ListChecks },
    { href: `/coaching/${klantId}/training`, label: 'Training', icon: Dumbbell },
    { href: `/coaching/${klantId}/voeding`, label: 'Voeding', icon: Apple },
    { href: `/coaching/${klantId}/content`, label: 'Mindset & stress', icon: BookOpen },
    { href: `/coaching/${klantId}/traject`, label: 'Traject', icon: Milestone },
  ]
  return (
    <nav aria-label="Klantmodules" className="mf-scroll-row" style={{ marginBottom: 26 }}>
      {tabs.map(t => {
        const Icon = t.icon
        return (
          <Link
            key={t.href} href={t.href} className="mf-coach-tab mf-scroll-item"
            data-actief={t.actief ? 'true' : 'false'}
            aria-current={t.actief ? 'page' : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px',
              borderRadius: 11, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border)',
            }}
          >
            <Icon size={15} aria-hidden /> {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function KlantDetailPagina() {
  const router = useRouter()
  const params = useParams<{ klantId: string }>()
  const klantId = params.klantId

  const [laden, setLaden] = useState(true)
  const [klant, setKlant] = useState<KlantDetail | null>(null)
  const [nietGevonden, setNietGevonden] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      const res = await authFetch(`/api/coaching/klant/${klantId}`)
      if (res.ok) {
        const data = await res.json() as { klant: KlantDetail }
        setKlant(data.klant)
      } else {
        setNietGevonden(true)
      }
      setLaden(false)
    }
    laad()
  }, [router, klantId])

  const welzijn = klant?.welzijn ?? null

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 920, margin: '0 auto' }}>
        <BackLink href="/coaching" label="Terug naar klanten" />

        {laden ? (
          <CoachSkeleton rijen={2} />
        ) : nietGevonden || !klant ? (
          <CoachEmpty icon={ShieldAlert} titel="Klant niet gevonden" tekst="Deze klant is niet aan jou gekoppeld of bestaat niet." toon="wacht" />
        ) : (
          <>
            {/* Hero */}
            <header className="mf-animate-up" style={{ position: 'relative', marginBottom: 26 }}>
              <span className="mf-coach-aura" aria-hidden style={{ top: -150, left: -100 }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <Avatar naam={klant.naam} avatarUrl={klant.avatar_url} size={60} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="mf-overline" style={{ color: 'var(--mf-green)', marginBottom: 6 }}>Klant</p>
                  <h1 className="mf-h1" style={{ fontSize: 'clamp(22px, 4vw, 28px)' }}>{klant.naam}</h1>
                  <p className="mf-subtitle" style={{ marginTop: 2 }}>{klant.email ?? ''}</p>
                </div>
                <Badge variant="neutral" style={{ background: KOPPEL_STATUS_STIJL[klant.status].bg, color: KOPPEL_STATUS_STIJL[klant.status].color }}>
                  {KOPPEL_STATUS_STIJL[klant.status].label}
                </Badge>
              </div>
            </header>

            <div className="mf-animate-up mf-delay-1"><ModuleTabs klantId={klantId} /></div>

            <div className="mf-animate-up mf-delay-2">
              <CoachNotitie klantId={klantId} initieleNotitie={klant.notitie} />
            </div>

            {!welzijn ? (
              <div className="mf-animate-up mf-delay-3" style={{ marginTop: 20 }}>
                <CoachEmpty
                  icon={ShieldAlert}
                  toon="wacht"
                  titel="Wacht op inzage-toestemming"
                  tekst="Deze klant deelt zijn welzijnsdata nog niet. Zodra hij dat toestaat (via Mijn coach), zie je hier het welzijnsprofiel en de voortgang."
                />
              </div>
            ) : (
              <div className="mf-animate-up mf-delay-3" style={{ marginTop: 20 }}>
                <CoachSection titel="Welzijn — laatste 30 dagen">
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
                    <Card className="mf-card-glow" style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <h3 className="mf-overline" style={{ alignSelf: 'flex-start', marginBottom: 6 }}>Welzijnsprofiel</h3>
                      {Object.keys(welzijn.gemiddelde_scores).length > 0 ? (
                        <RadarChart scores={welzijn.gemiddelde_scores} size={240} />
                      ) : (
                        <p className="mf-body" style={{ padding: '48px 0', color: 'var(--text-3)' }}>Nog geen check-in data</p>
                      )}
                    </Card>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <CoachStat
                        label="Check-ins (30 dagen)"
                        waarde={welzijn.checkins_30d}
                        hint={welzijn.dagen_sinds_checkin === null ? 'Nog geen check-in'
                          : welzijn.dagen_sinds_checkin === 0 ? 'Laatste: vandaag'
                          : `Laatste: ${welzijn.dagen_sinds_checkin}d geleden`}
                      />
                      <div style={{ padding: '20px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                        <p className="mf-number-large" style={{ color: burnoutKleur(welzijn.burnout_risico), lineHeight: 1 }}>
                          {welzijn.burnout_risico !== null ? `${welzijn.burnout_risico}%` : '—'}
                        </p>
                        <p className="mf-overline" style={{ marginTop: 10 }}>Burn-out risico</p>
                        {welzijn.burnout_trending && (
                          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 6, color: welzijn.burnout_trending === 'stijgend' ? 'var(--mf-red)' : welzijn.burnout_trending === 'dalend' ? 'var(--mf-green)' : 'var(--text-3)' }}>
                            {welzijn.burnout_trending === 'stijgend' ? <><TrendingUp size={13} aria-hidden /> stijgend</>
                              : welzijn.burnout_trending === 'dalend' ? <><TrendingDown size={13} aria-hidden /> dalend</>
                              : <><ArrowRight size={13} aria-hidden /> stabiel</>}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CoachSection>

                <CoachSection titel="Recente check-ins">
                  <Card style={{ padding: '8px 20px' }}>
                    {welzijn.recente_analyses.length === 0 ? (
                      <p className="mf-body" style={{ padding: '16px 0', color: 'var(--text-3)' }}>Nog geen check-ins geregistreerd.</p>
                    ) : (
                      <ul style={{ listStyle: 'none' }}>
                        {welzijn.recente_analyses.map((a, i) => {
                          const waarden = Object.values(a.scores ?? {}).filter(v => typeof v === 'number')
                          const gem = waarden.length ? Math.round((waarden.reduce((x, y) => x + y, 0) / waarden.length) * 10) / 10 : null
                          return (
                            <li key={a.datum + i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < welzijn.recente_analyses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{datumKort(a.datum)}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{gem !== null ? `${gem}/5` : '—'}</span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </Card>
                </CoachSection>

                <p className="mf-caption" style={{ textAlign: 'center', marginTop: 4 }}>Deze data deelt je klant vrijwillig. Behandel het vertrouwelijk.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
