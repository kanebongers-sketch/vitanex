'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PijlerBadge } from '@/components/coaching/PijlerBadge'
import { TrajectTijdlijn } from '@/components/coaching/TrajectTijdlijn'
import { TrajectFormulier } from '@/components/coaching/TrajectFormulier'
import { PIJLERS, PIJLER_VOLGORDE } from '@/lib/coaching/pijlers'
import { TRAJECT_STATUS_STIJL, type TrajectMetFases } from '@/lib/coaching/traject'
import { ArrowLeft, Route, Pencil, CalendarRange, Flag } from 'lucide-react'

function datumKort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function weekStatusTekst(week: number, duurMaanden: number): string {
  if (week < 1) return 'Nog niet gestart'
  const totaalWeken = Math.round(duurMaanden * 4.345)
  return `Week ${week} van ~${totaalWeken}`
}

export default function TrajectPagina() {
  const router = useRouter()
  const params = useParams<{ klantId: string }>()
  const klantId = params.klantId

  const [laden, setLaden] = useState(true)
  const [geenToegang, setGeenToegang] = useState(false)
  const [klantNaam, setKlantNaam] = useState<string | null>(null)
  const [traject, setTraject] = useState<TrajectMetFases | null>(null)
  const [bewerken, setBewerken] = useState(false)

  const laad = useCallback(async () => {
    const [klantRes, trajectRes] = await Promise.all([
      authFetch(`/api/coaching/klant/${klantId}`),
      authFetch(`/api/coaching/traject?klant=${klantId}`),
    ])
    if (!klantRes.ok || !trajectRes.ok) { setGeenToegang(true); setLaden(false); return }
    const klantData = await klantRes.json() as { klant: { naam: string } }
    const trajectData = await trajectRes.json() as { traject: TrajectMetFases | null }
    setKlantNaam(klantData.klant.naam)
    setTraject(trajectData.traject)
    setLaden(false)
  }, [klantId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      await laad()
    }
    init()
  }, [router, laad])

  function opgeslagen(nieuw: TrajectMetFases) {
    setTraject(nieuw)
    setBewerken(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 900, margin: '0 auto' }}>

        <Link href={`/coaching/${klantId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={15} aria-hidden /> Terug naar klant
        </Link>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : geenToegang ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Klant niet gevonden</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Deze klant is niet aan jou gekoppeld of bestaat niet.</p>
          </Card>
        ) : (
          <>
            <header style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Route size={18} aria-hidden style={{ color: 'var(--mf-green)' }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Traject</h1>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Begeleidingslijn voor <strong style={{ color: 'var(--text-2)' }}>{klantNaam}</strong> — opgebouwd rond de drie pijlers.
              </p>
            </header>

            {/* Pijler-legenda */}
            <Card style={{ padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {PIJLER_VOLGORDE.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200, flex: 1 }}>
                    <PijlerBadge pijler={p} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{PIJLERS[p].omschrijving}</span>
                  </div>
                ))}
              </div>
            </Card>

            {bewerken ? (
              <Card style={{ padding: 22 }}>
                <TrajectFormulier
                  klantId={klantId}
                  bestaand={traject}
                  onOpgeslagen={opgeslagen}
                  onAnnuleren={traject ? () => setBewerken(false) : undefined}
                />
              </Card>
            ) : !traject ? (
              <Card style={{ padding: 8 }}>
                <EmptyState
                  icon={Route}
                  title="Nog geen traject"
                  description="Stel een traject op met fases per pijler, zodat de klant precies weet waar jullie de komende maanden aan werken."
                  action={<Button onClick={() => setBewerken(true)} leftIcon={<Pencil size={15} aria-hidden />}>Traject opstellen</Button>}
                />
              </Card>
            ) : (
              <>
                {/* Traject-header */}
                <Card style={{ padding: 22, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{traject.traject.titel}</h2>
                        <Badge variant="neutral" style={{ background: TRAJECT_STATUS_STIJL[traject.traject.status].bg, color: TRAJECT_STATUS_STIJL[traject.traject.status].color }}>
                          {TRAJECT_STATUS_STIJL[traject.traject.status].label}
                        </Badge>
                      </div>
                      {traject.traject.doel && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, maxWidth: '60ch' }}>{traject.traject.doel}</p>}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setBewerken(true)} leftIcon={<Pencil size={14} aria-hidden />}>Bewerken</Button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-3)' }}>
                      <CalendarRange size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> Start {datumKort(traject.traject.start_datum)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-3)' }}>
                      <Flag size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> {traject.traject.duur_maanden} maanden
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginLeft: 'auto' }}>
                      {weekStatusTekst(traject.huidige_week, traject.traject.duur_maanden)}
                    </span>
                  </div>
                </Card>

                {/* Tijdlijn */}
                <TrajectTijdlijn data={traject} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
