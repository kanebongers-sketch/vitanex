'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TrajectTijdlijn } from '@/components/coaching/TrajectTijdlijn'
import { TRAJECT_STATUS_STIJL, type TrajectMetFases } from '@/lib/coaching/traject'
import { Milestone } from 'lucide-react'

export default function MijnTrajectPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<TrajectMetFases | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const res = await authFetch('/api/coaching/mijn-traject')
      if (res.ok) {
        const json = await res.json() as { traject: TrajectMetFases | null }
        setData(json.traject)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  const stijl = data ? TRAJECT_STATUS_STIJL[data.traject.status] : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mijn traject
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Je begeleidingslijn in fases — waar je nu staat en wat er komt.
          </p>
        </header>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
        ) : !data ? (
          <Card style={{ padding: 8 }}>
            <EmptyState
              icon={Milestone}
              title="Nog geen traject"
              description="Zodra je coach een traject voor je opstelt, zie je hier je fases en voortgang."
            />
          </Card>
        ) : (
          <>
            <Card style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: data.traject.doel ? 10 : 0 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{data.traject.titel}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {data.traject.duur_maanden} maanden
                    {data.huidige_week >= 1 ? ` · week ${data.huidige_week}` : ' · nog niet gestart'}
                  </p>
                </div>
                {stijl && (
                  <Badge variant="neutral" style={{ background: stijl.bg, color: stijl.color }}>{stijl.label}</Badge>
                )}
              </div>
              {data.traject.doel && (
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{data.traject.doel}</p>
              )}
            </Card>

            {data.fases.length === 0 ? (
              <Card style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Je coach heeft nog geen fases toegevoegd.</p>
              </Card>
            ) : (
              <TrajectTijdlijn data={data} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
