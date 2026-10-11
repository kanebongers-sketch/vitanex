'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Moon,
  Footprints,
  Target,
  Leaf,
  Droplets,
  NotebookPen,
  CalendarDays,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Ring } from '@/components/ui/Ring'
import { Progress } from '@/components/ui/Progress'
import { useVertaling } from '@/lib/i18n/TaalProvider'

type Moeilijkheid = 'Makkelijk' | 'Gemiddeld' | 'Uitdagend'

/** Titel en uitleg staan in het woordenboek: vita.uitdagingen.lijst.<id>.titel/sub. */
type Uitdaging = {
  id: string
  icon: LucideIcon
  duur: number
  categorie: string
  moeilijkheid: Moeilijkheid
}

type ActieveUitdaging = {
  id: string
  startDatum: string
}

const UITDAGINGEN: Uitdaging[] = [
  { id: '10slaap',    icon: Moon,        duur: 10, categorie: 'slaap',   moeilijkheid: 'Makkelijk' },
  { id: '21beweging', icon: Footprints,  duur: 21, categorie: 'fysiek',  moeilijkheid: 'Gemiddeld' },
  { id: '7focus',     icon: Target,      duur: 7,  categorie: 'werk',    moeilijkheid: 'Uitdagend' },
  { id: '14stress',   icon: Leaf,        duur: 14, categorie: 'mentaal', moeilijkheid: 'Makkelijk' },
  { id: '30water',    icon: Droplets,    duur: 30, categorie: 'fysiek',  moeilijkheid: 'Makkelijk' },
  { id: '7journaal',  icon: NotebookPen, duur: 7,  categorie: 'mentaal', moeilijkheid: 'Makkelijk' },
]

const MOEILIJKHEID_SLEUTEL: Record<Moeilijkheid, string> = {
  Makkelijk: 'makkelijk',
  Gemiddeld: 'gemiddeld',
  Uitdagend: 'uitdagend',
}
// Moeilijkheid is nooit kleur-alleen: elke graad krijgt ook een Badge-variant
// én het label blijft zichtbaar. Variant geeft enkel extra (niet-essentiële) hint.
const MOEILIJKHEID_VARIANT: Record<Moeilijkheid, 'success' | 'warning' | 'danger'> = {
  Makkelijk: 'success',
  Gemiddeld: 'warning',
  Uitdagend: 'danger',
}

const STORAGE_KEY = 'mf-uitdagingen'

function laadActief(): ActieveUitdaging[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function slaActief(lijst: ActieveUitdaging[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lijst))
}

function dagenVerstreken(startDatum: string): number {
  const start = new Date(startDatum)
  const nu = new Date()
  return Math.floor((nu.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export default function UitdagingenPage() {
  const { t } = useVertaling()
  const titelVan = (u: Uitdaging) => t(`vita.uitdagingen.lijst.${u.id}.titel`)
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)
  const [actieven, setActieven] = useState<ActieveUitdaging[]>([])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setActieven(laadActief())
      setKlaar(true)
    }
    check()
  }, [router])

  // Functionele updater voorkomt de localStorage-race bij snel achter elkaar
  // klikken: we lezen telkens de meest recente lijst i.p.v. een verouderde
  // closure-snapshot, en persisteren in dezelfde stap.
  function startUitdaging(id: string) {
    setActieven(prev => {
      if (prev.find(a => a.id === id)) return prev
      const bijgewerkt = [...prev, { id, startDatum: new Date().toISOString() }]
      slaActief(bijgewerkt)
      return bijgewerkt
    })
  }

  function stopUitdaging(id: string) {
    setActieven(prev => {
      const bijgewerkt = prev.filter(a => a.id !== id)
      slaActief(bijgewerkt)
      return bijgewerkt
    })
  }

  const actieveIds = new Set(actieven.map(a => a.id))

  if (!klaar) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" />
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />

      <main style={{ padding: '24px 24px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>{t('vita.uitdagingen.titel')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>{t('vita.uitdagingen.sub')}</p>
        </header>

        {/* Active challenges */}
        {actieven.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('vita.uitdagingen.actiefBezig')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {actieven.map(actief => {
                const uitdaging = UITDAGINGEN.find(u => u.id === actief.id)
                if (!uitdaging) return null
                const Icon = uitdaging.icon
                const verstreken = Math.min(dagenVerstreken(actief.startDatum), uitdaging.duur)
                const procent = Math.round((verstreken / uitdaging.duur) * 100)
                const voltooid = verstreken >= uitdaging.duur

                return (
                  <Card key={actief.id} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Progress ring */}
                    <Ring
                      value={procent}
                      ariaLabel={t('vita.uitdagingen.ringLabel', { titel: titelVan(uitdaging), verstreken, duur: uitdaging.duur, procent })}
                      size={52}
                      thickness={5}
                      color={voltooid ? 'var(--mf-green)' : 'var(--mf-amber)'}
                      style={{ flexShrink: 0 }}
                    >
                      {voltooid ? (
                        <Check size={18} aria-hidden style={{ color: 'var(--mf-green)' }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-1)' }}>{procent}%</span>
                      )}
                    </Ring>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Icon size={16} aria-hidden style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                            {titelVan(uitdaging)}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{t('vita.uitdagingen.dagenVan', { verstreken, duur: uitdaging.duur })}</p>
                        </div>
                        {voltooid ? (
                          <Badge variant="success" style={{ flexShrink: 0 }}>
                            <Check size={12} aria-hidden /> {t('vita.uitdagingen.voltooid')}
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => stopUitdaging(actief.id)} style={{ flexShrink: 0, padding: '4px 8px' }}>
                            {t('vita.uitdagingen.stoppen')}
                          </Button>
                        )}
                      </div>
                      <Progress
                        value={procent}
                        ariaLabel={t('vita.uitdagingen.voortgangLabel', { titel: titelVan(uitdaging) })}
                        thickness={5}
                        color={voltooid ? 'var(--mf-green)' : 'var(--mf-amber)'}
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Available challenges */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('vita.uitdagingen.beschikbaar')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
            {UITDAGINGEN.map(uitdaging => {
              const isActief = actieveIds.has(uitdaging.id)
              const Icon = uitdaging.icon

              return (
                <Card
                  key={uitdaging.id}
                  style={{
                    padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    opacity: isActief ? 0.85 : 1,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                      color: 'var(--mentaforce-primary)',
                    }}
                  >
                    <Icon size={20} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3 }}>{titelVan(uitdaging)}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4, lineHeight: 1.4 }}>{t(`vita.uitdagingen.lijst.${uitdaging.id}.sub`)}</p>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Badge variant="neutral">
                      <CalendarDays size={12} aria-hidden /> {t('vita.uitdagingen.aantalDagen', { aantal: uitdaging.duur })}
                    </Badge>
                    <Badge variant={MOEILIJKHEID_VARIANT[uitdaging.moeilijkheid]}>
                      {t(`vita.uitdagingen.moeilijkheid.${MOEILIJKHEID_SLEUTEL[uitdaging.moeilijkheid]}`)}
                    </Badge>
                  </div>

                  {isActief ? (
                    <Badge variant="success" style={{ justifyContent: 'center', padding: '8px' }}>
                      <Check size={14} aria-hidden /> {t('vita.uitdagingen.actief')}
                    </Badge>
                  ) : (
                    <Button onClick={() => startUitdaging(uitdaging.id)} style={{ width: '100%' }}>
                      {t('vita.uitdagingen.starten')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}
