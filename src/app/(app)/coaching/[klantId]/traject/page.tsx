'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { PijlerBadge } from '@/components/coaching/PijlerBadge'
import { TrajectTijdlijn } from '@/components/coaching/TrajectTijdlijn'
import { TrajectFormulier } from '@/components/coaching/TrajectFormulier'
import { PIJLERS, PIJLER_VOLGORDE } from '@/lib/coaching/pijlers'
import { TRAJECT_STATUS_STIJL, type TrajectMetFases } from '@/lib/coaching/traject'
import { Route, Pencil, CalendarRange, Flag, ShieldAlert } from 'lucide-react'

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
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
        <CoachHeader
          eyebrow="Traject"
          titel="Traject"
          subtitel={`Begeleidingslijn voor ${klantNaam ?? 'je klant'} — opgebouwd rond de drie pijlers.`}
          backHref={`/coaching/${klantId}`}
          backLabel="Terug naar klant"
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : geenToegang ? (
          <CoachEmpty
            icon={ShieldAlert}
            toon="wacht"
            titel="Klant niet gevonden"
            tekst="Deze klant is niet aan jou gekoppeld of bestaat niet."
          />
        ) : (
          <>
            {/* Pijler-legenda */}
            <Card className="mf-animate-up mf-delay-1" style={{ padding: '16px 20px', marginBottom: 22 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {PIJLER_VOLGORDE.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 210, flex: 1 }}>
                    <PijlerBadge pijler={p} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{PIJLERS[p].omschrijving}</span>
                  </div>
                ))}
              </div>
            </Card>

            {bewerken ? (
              <Card className="mf-animate-up mf-delay-2" style={{ padding: 24 }}>
                <TrajectFormulier
                  klantId={klantId}
                  bestaand={traject}
                  onOpgeslagen={opgeslagen}
                  onAnnuleren={traject ? () => setBewerken(false) : undefined}
                />
              </Card>
            ) : !traject ? (
              <div className="mf-animate-up mf-delay-2">
                <CoachEmpty
                  icon={Route}
                  titel="Nog geen traject"
                  tekst="Stel een traject op met fases per pijler, zodat de klant precies weet waar jullie de komende maanden aan werken."
                  actie={<Button onClick={() => setBewerken(true)} leftIcon={<Pencil size={15} aria-hidden />}>Traject opstellen</Button>}
                />
              </div>
            ) : (
              <>
                {/* Traject-header */}
                <Card className="mf-card-glow mf-animate-up mf-delay-2" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span aria-hidden style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: 'var(--mf-green-light)', color: 'var(--mf-green)',
                        }}>
                          <Route size={17} aria-hidden />
                        </span>
                        <h2 className="mf-h2">{traject.traject.titel}</h2>
                        <Badge variant="neutral" style={{ background: TRAJECT_STATUS_STIJL[traject.traject.status].bg, color: TRAJECT_STATUS_STIJL[traject.traject.status].color }}>
                          {TRAJECT_STATUS_STIJL[traject.traject.status].label}
                        </Badge>
                      </div>
                      {traject.traject.doel && <p className="mf-body" style={{ maxWidth: '60ch' }}>{traject.traject.doel}</p>}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setBewerken(true)} leftIcon={<Pencil size={14} aria-hidden />}>Bewerken</Button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-3)' }}>
                      <CalendarRange size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> Start {datumKort(traject.traject.start_datum)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-3)' }}>
                      <Flag size={15} aria-hidden style={{ color: 'var(--mf-green)' }} /> {traject.traject.duur_maanden} maanden
                    </span>
                    <span style={{
                      marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12.5, fontWeight: 700, color: 'var(--mf-green)',
                      background: 'var(--mf-green-light)', padding: '5px 12px', borderRadius: 999,
                      border: '1px solid color-mix(in srgb, var(--mf-green) 30%, transparent)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {weekStatusTekst(traject.huidige_week, traject.traject.duur_maanden)}
                    </span>
                  </div>
                </Card>

                {/* Tijdlijn */}
                <div className="mf-animate-up mf-delay-3">
                  <CoachSection titel="Fases">
                    <TrajectTijdlijn data={traject} />
                  </CoachSection>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
