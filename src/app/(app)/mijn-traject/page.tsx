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
import { useVertaling } from '@/lib/i18n/TaalProvider'

export default function MijnTrajectPagina() {
  const { t } = useVertaling()
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
          eyebrow={t('coaching.tabs.traject')}
          titel={t('coaching.mijnTraject.titel')}
          subtitel={t('coaching.mijnTraject.subtitel')}
        />

        {laden ? (
          <CoachSkeleton rijen={2} />
        ) : !data ? (
          <CoachEmpty
            icon={Milestone}
            titel={t('coaching.traject.leegTitel')}
            tekst={t('coaching.mijnTraject.leegTekst')}
          />
        ) : (
          <>
            {/* Kerncijfers — waar je staat in het traject */}
            <div className="mf-animate-up mf-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
              <CoachStat
                label={t('coaching.mijnTraject.huidigeWeek')}
                waarde={gestart ? data.huidige_week : '-'}
                accent={gestart ? 'var(--mf-green)' : 'var(--text-1)'}
                hint={gestart ? undefined : t('coaching.traject.nietGestart')}
                glow={gestart}
              />
              <CoachStat label={t('coaching.mijnTraject.duur')} waarde={<>{data.traject.duur_maanden}<span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-4)', marginLeft: 4 }}>{t('coaching.mijnTraject.mnd')}</span></>} />
              <CoachStat label={t('coaching.trajectFormulier.fases')} waarde={data.fases.length} />
            </div>

            {/* Traject-overzicht: titel, status, doel */}
            <Card className="mf-animate-up mf-delay-2" style={{ padding: '22px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: data.traject.doel ? 16 : 0, flexWrap: 'wrap' }}>
                <h2 className="mf-h2" style={{ minWidth: 0 }}>{data.traject.titel}</h2>
                {stijl && (
                  <Badge variant="neutral" style={{ background: stijl.bg, color: stijl.color, flexShrink: 0 }}>{t(`coaching.labels.trajectStatus.${data.traject.status}`)}</Badge>
                )}
              </div>
              {data.traject.doel && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
                    <Target size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="mf-overline" style={{ marginBottom: 5 }}>{t('coaching.mijnTraject.jouwDoel')}</p>
                    <p className="mf-body">{data.traject.doel}</p>
                  </div>
                </div>
              )}
            </Card>

            <CoachSection titel={t('coaching.mijnTraject.tijdlijn')}>
              {data.fases.length === 0 ? (
                <CoachEmpty
                  icon={Milestone}
                  toon="wacht"
                  titel={t('coaching.mijnTraject.geenFasesTitel')}
                  tekst={t('coaching.mijnTraject.geenFasesTekst')}
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
