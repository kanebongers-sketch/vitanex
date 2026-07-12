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
import { KOPPEL_STATUS_STIJL, type KlantDetail } from '@/lib/coaching/relatie'
import { ArrowLeft, ShieldAlert, TrendingUp, TrendingDown, ArrowRight, CalendarCheck, ListChecks, Milestone } from 'lucide-react'

function burnoutKleur(score: number | null) {
  if (score === null) return 'var(--text-4)'
  if (score >= 70) return 'var(--mf-red)'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-green)'
}

function datumKort(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
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
      const { data: profiel } = await supabase
        .from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 900, margin: '0 auto' }}>

        <Link href="/coaching" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={15} aria-hidden /> Terug naar klanten
        </Link>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : nietGevonden || !klant ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Klant niet gevonden</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Deze klant is niet aan jou gekoppeld of bestaat niet.</p>
          </Card>
        ) : (
          <>
            {/* Klant-header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar naam={klant.naam} avatarUrl={klant.avatar_url} size={56} />
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{klant.naam}</h1>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{klant.email ?? ''}</p>
              </div>
              <Badge variant="neutral" style={{ background: KOPPEL_STATUS_STIJL[klant.status].bg, color: KOPPEL_STATUS_STIJL[klant.status].color }}>
                {KOPPEL_STATUS_STIJL[klant.status].label}
              </Badge>
            </header>

            {/* Sub-navigatie naar de coaching-modules van deze klant */}
            <nav aria-label="Klantmodules" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { href: `/coaching/${klantId}/taken`, label: 'Taken', icon: ListChecks },
                { href: `/coaching/${klantId}/traject`, label: 'Traject', icon: Milestone },
              ].map(m => {
                const Icon = m.icon
                return (
                  <Link key={m.href} href={m.href} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    color: 'var(--text-2)', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    transition: 'border-color 0.15s var(--ease), color 0.15s var(--ease)',
                  }}>
                    <Icon size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> {m.label}
                  </Link>
                )
              })}
            </nav>

            {/* Geen inzage → nette lege staat */}
            {!klant.welzijn ? (
              <Card style={{ padding: '28px 24px', textAlign: 'center', borderColor: 'var(--mf-amber)' }}>
                <span style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: '50%', background: 'var(--mf-amber-light)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <ShieldAlert size={22} aria-hidden style={{ color: 'var(--mf-amber)' }} />
                </span>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Wacht op inzage-toestemming</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: '46ch', margin: '0 auto', lineHeight: 1.6 }}>
                  Deze klant heeft nog geen toestemming gegeven om welzijnsdata met jou te delen.
                  Zodra dat gebeurt (via <strong>Mijn coach</strong> in hun account), zie je hier hun voortgang.
                </p>
              </Card>
            ) : (
              <>
                {/* Welzijnssamenvatting */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, alignSelf: 'flex-start' }}>Welzijnsprofiel (30d)</h2>
                    {Object.keys(klant.welzijn.gemiddelde_scores).length > 0 ? (
                      <RadarChart scores={klant.welzijn.gemiddelde_scores} size={240} />
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '40px 0' }}>Nog geen check-in data</p>
                    )}
                  </Card>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card style={{ padding: 18 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Check-ins (30 dagen)</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{klant.welzijn.checkins_30d}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        {klant.welzijn.dagen_sinds_checkin === null ? 'Nog geen check-in'
                          : klant.welzijn.dagen_sinds_checkin === 0 ? 'Laatste: vandaag'
                          : `Laatste: ${klant.welzijn.dagen_sinds_checkin}d geleden`}
                      </p>
                    </Card>
                    <Card style={{ padding: 18 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Burn-out risico</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: burnoutKleur(klant.welzijn.burnout_risico) }}>
                        {klant.welzijn.burnout_risico !== null ? `${klant.welzijn.burnout_risico}%` : '—'}
                      </p>
                      {klant.welzijn.burnout_trending && (
                        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 2, color: klant.welzijn.burnout_trending === 'stijgend' ? 'var(--mf-red)' : klant.welzijn.burnout_trending === 'dalend' ? 'var(--mf-green)' : 'var(--text-3)' }}>
                          {klant.welzijn.burnout_trending === 'stijgend' ? <><TrendingUp size={13} aria-hidden /> stijgend</>
                            : klant.welzijn.burnout_trending === 'dalend' ? <><TrendingDown size={13} aria-hidden /> dalend</>
                            : <><ArrowRight size={13} aria-hidden /> stabiel</>}
                        </p>
                      )}
                    </Card>
                  </div>
                </div>

                {/* Recente check-ins */}
                <Card style={{ padding: 20 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarCheck size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> Recente check-ins
                  </h2>
                  {klant.welzijn.recente_analyses.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Nog geen check-ins geregistreerd.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {klant.welzijn.recente_analyses.map((a, i) => {
                        const waarden = Object.values(a.scores ?? {}).filter(v => typeof v === 'number')
                        const gem = waarden.length ? Math.round((waarden.reduce((x, y) => x + y, 0) / waarden.length) * 10) / 10 : null
                        return (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < klant.welzijn!.recente_analyses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{datumKort(a.datum)}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                              {gem !== null ? `${gem}/5` : '—'}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Card>

                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 16, textAlign: 'center' }}>
                  Deze data deelt je klant vrijwillig. Behandel het vertrouwelijk.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
