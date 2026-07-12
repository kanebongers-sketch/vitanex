'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaakKaart } from '@/components/coaching/TaakKaart'
import type { TaakMetVoortgang } from '@/lib/coaching/taken'
import { ListChecks, Sparkles } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 720, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mijn taken
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            De gewoontes die je coach voor je heeft klaargezet. Vink af wat je vandaag hebt gedaan.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : taken.length === 0 ? (
          <Card style={{ padding: 8 }}>
            <EmptyState
              icon={ListChecks}
              title="Nog geen taken"
              description="Zodra je coach gewoontes voor je toewijst, verschijnen ze hier om dagelijks af te vinken."
            />
          </Card>
        ) : (
          <>
            {/* Dag-voortgang */}
            <Card style={{ padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Sparkles size={16} aria-hidden style={{ color: 'var(--mf-green)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Vandaag</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
                  {vandaagGehaald}/{taken.length} afgevinkt
                </span>
              </div>
              {/* Compositor-vriendelijke voortgangsbalk (scaleX) */}
              <div
                role="progressbar"
                aria-valuenow={voortgangPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Taken vandaag afgevinkt"
                style={{ height: 6, borderRadius: 100, background: 'var(--bg-subtle)', overflow: 'hidden' }}
              >
                <div
                  style={{
                    height: '100%', width: '100%', borderRadius: 100, background: 'var(--mf-green)',
                    transformOrigin: 'left', transform: `scaleX(${voortgangPct / 100})`,
                    transition: 'transform 0.3s var(--ease)',
                  }}
                />
              </div>
            </Card>

            <section aria-label="Mijn taken" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
