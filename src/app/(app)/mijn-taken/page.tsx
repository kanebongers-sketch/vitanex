'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { TaakKaart } from '@/components/coaching/TaakKaart'
import { CoachHeader, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import type { TaakMetVoortgang } from '@/lib/coaching/taken'
import { ListChecks, Sparkles, Check } from 'lucide-react'

export default function MijnTakenPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [taken, setTaken] = useState<TaakMetVoortgang[]>([])
  const [bezigId, setBezigId] = useState<string | null>(null)

  const laadTaken = useCallback(async () => {
    const res = await authFetch('/api/coaching/mijn-taken')
    if (res.ok) {
      const data = await res.json() as { taken: TaakMetVoortgang[] }
      setTaken(data.taken ?? [])
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await laadTaken()
    }
    laad()
  }, [router, laadTaken])

  const vandaagGehaald = useMemo(() => taken.filter(t => t.vandaag_gehaald).length, [taken])
  const voortgangPct = taken.length > 0 ? Math.round((vandaagGehaald / taken.length) * 100) : 0
  const allesGehaald = taken.length > 0 && vandaagGehaald === taken.length

  async function toggle(taak: TaakMetVoortgang, gehaald: boolean) {
    if (bezigId) return
    setBezigId(taak.id)

    // Optimistische update
    const delta = gehaald ? 1 : -1
    setTaken(prev => prev.map(t => t.id === taak.id
      ? { ...t, vandaag_gehaald: gehaald, deze_week_gehaald: Math.max(0, t.deze_week_gehaald + delta) }
      : t))

    const res = await authFetch('/api/coaching/taken/log', {
      method: 'POST',
      body: JSON.stringify({ taak_id: taak.id, gehaald }),
    })

    if (res.ok) {
      const data = await res.json() as { vandaag_gehaald: boolean; deze_week_gehaald: number }
      setTaken(prev => prev.map(t => t.id === taak.id
        ? { ...t, vandaag_gehaald: data.vandaag_gehaald, deze_week_gehaald: data.deze_week_gehaald }
        : t))
      // Streak/achievements laten (her)berekenen — best-effort, faalt stil.
      void authFetch('/api/achievements/check', { method: 'POST' }).catch(() => {})
    } else {
      // Rollback bij fout
      setTaken(prev => prev.map(t => t.id === taak.id
        ? { ...t, vandaag_gehaald: !gehaald, deze_week_gehaald: Math.max(0, t.deze_week_gehaald - delta) }
        : t))
    }
    setBezigId(null)
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

        <CoachHeader
          eyebrow="Vandaag"
          titel="Mijn taken"
          subtitel="De gewoontes die je coach voor je heeft klaargezet. Vink af wat je vandaag hebt gedaan."
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : taken.length === 0 ? (
          <CoachEmpty
            icon={ListChecks}
            titel="Nog geen taken"
            tekst="Zodra je coach gewoontes voor je toewijst, verschijnen ze hier om dagelijks af te vinken."
          />
        ) : (
          <>
            {/* Dag-voortgang — motiverende hero */}
            <Card
              className={`mf-animate-up${allesGehaald ? ' mf-card-glow' : ''}`}
              style={{ padding: '22px 24px', marginBottom: 22 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <p className="mf-overline" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, color: 'var(--text-3)' }}>
                    <Sparkles size={13} aria-hidden style={{ color: 'var(--mf-green)' }} /> Vandaag
                  </p>
                  <p className="mf-number-large" style={{ lineHeight: 1, color: allesGehaald ? 'var(--mf-green)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                    {vandaagGehaald}
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '-0.02em' }}> / {taken.length}</span>
                  </p>
                  <p className="mf-caption" style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {allesGehaald
                      ? <><Check size={13} aria-hidden style={{ color: 'var(--mf-green)' }} /> Alles afgevinkt — sterk gedaan.</>
                      : 'gewoontes afgevinkt vandaag'}
                  </p>
                </div>
                <span
                  aria-hidden
                  style={{ fontSize: 15, fontWeight: 700, color: allesGehaald ? 'var(--mf-green)' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {voortgangPct}%
                </span>
              </div>
              {/* Compositor-vriendelijke voortgangsbalk (scaleX) */}
              <div
                role="progressbar"
                aria-valuenow={voortgangPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Taken vandaag afgevinkt"
                style={{ height: 8, borderRadius: 100, background: 'var(--bg-subtle)', overflow: 'hidden' }}
              >
                <div
                  style={{
                    height: '100%', width: '100%', borderRadius: 100, background: 'var(--mf-green)',
                    transformOrigin: 'left', transform: `scaleX(${voortgangPct / 100})`,
                    transition: 'transform 0.4s var(--ease)',
                  }}
                />
              </div>
            </Card>

            <section aria-label="Mijn taken" className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {taken.map(t => (
                <TaakKaart
                  key={t.id}
                  taak={t}
                  bezig={bezigId === t.id}
                  onToggle={gehaald => toggle(t, gehaald)}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
