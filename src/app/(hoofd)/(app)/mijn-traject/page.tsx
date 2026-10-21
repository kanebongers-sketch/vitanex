'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrajectTijdlijn } from '@/components/coaching/TrajectTijdlijn'
import { CoachHeader, CoachStat, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { TRAJECT_STATUS_STIJL, type TrajectMetFases } from '@/lib/coaching/traject'
import { Milestone, Target } from 'lucide-react'

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
  const gestart = data ? data.huidige_week >= 1 : false

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

        <CoachHeader
          eyebrow="Traject"
          titel="Mijn traject"
          subtitel="Je begeleidingslijn in fases — waar je nu staat en wat er komt."
        />

        {laden ? (
          <CoachSkeleton rijen={2} />
        ) : !data ? (
          <CoachEmpty
            icon={Milestone}
            titel="Nog geen traject"
            tekst="Zodra je coach een traject voor je opstelt, zie je hier je fases en voortgang."
          />
        ) : (
          <>
            {/* Kerncijfers — waar je staat in het traject */}
            <div className="mf-animate-up mf-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
              <CoachStat
                label="Huidige week"
                waarde={gestart ? data.huidige_week : '—'}
                accent={gestart ? 'var(--mf-green)' : 'var(--text-1)'}
                hint={gestart ? undefined : 'Nog niet gestart'}
                glow={gestart}
              />
              <CoachStat label="Duur" waarde={<>{data.traject.duur_maanden}<span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-4)', marginLeft: 4 }}>mnd</span></>} />
              <CoachStat label="Fases" waarde={data.fases.length} />
            </div>

            {/* Traject-overzicht: titel, status, doel */}
            <Card className="mf-animate-up mf-delay-2" style={{ padding: '22px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: data.traject.doel ? 16 : 0, flexWrap: 'wrap' }}>
                <h2 className="mf-h2" style={{ minWidth: 0 }}>{data.traject.titel}</h2>
                {stijl && (
                  <Badge variant="neutral" style={{ background: stijl.bg, color: stijl.color, flexShrink: 0 }}>{stijl.label}</Badge>
                )}
              </div>
              {data.traject.doel && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                    <Target size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="mf-overline" style={{ marginBottom: 5 }}>Jouw doel</p>
                    <p className="mf-body">{data.traject.doel}</p>
                  </div>
                </div>
              )}
            </Card>

            <CoachSection titel="Tijdlijn">
              {data.fases.length === 0 ? (
                <CoachEmpty
                  icon={Milestone}
                  toon="wacht"
                  titel="Nog geen fases"
                  tekst="Je coach heeft nog geen fases aan dit traject toegevoegd."
                />
              ) : (
                <div className="mf-animate-up mf-delay-3">
                  <TrajectTijdlijn data={data} />
                </div>
              )}
            </CoachSection>
          </>
        )}
      </main>
    </div>
  )
}
