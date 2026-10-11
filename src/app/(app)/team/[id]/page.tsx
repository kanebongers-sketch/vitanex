'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

import nextDynamic from 'next/dynamic'
import { BarChart3, MessageCircle, FolderOpen } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import DocumentenSectie from '@/components/team/DocumentenSectie'
import GesprekkenTab from '@/components/hr/GesprekkenTab'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

// recharts lui laden — alleen wanneer de vitaliteitstrend echt getoond wordt.
const VitaliteitTrend = nextDynamic(() => import('@/components/team/VitaliteitTrend'), { ssr: false })

type TeamTab = 'vitaliteit' | 'gesprekken' | 'dossier'

type Profiel = {
  id: string
  naam: string
  rol: string
  avatar_url: string | null
}

type Checkin = {
  id: string
  energie: number
  slaap: number
  fysiek_pijn: number
  fysiek_beweging: number
  werkdruk: number
  mentaal_focus: number
  mentaal_stress: number
  mentaal_balans: number
  motivatie: number
  sociaal_team: number
  sociaal_steun: number
  herstel: number
  toelichting: string | null
  created_at: string
}

function gem(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function scoreKleur(s: number) {
  if (s >= 4) return 'var(--mf-green)'
  if (s >= 2.5) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

function catScore(checkins: Checkin[], keys: (keyof Checkin)[]) {
  return gem(keys.map(k => gem(checkins.map(c => c[k] as number))))
}

const rolBadge: Record<string, { label: string; bg: string; color: string }> = {
  hr: { label: 'werk.teamLid.rolHr', bg: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' },
  admin: { label: 'werk.teamLid.rolAdmin', bg: 'var(--mf-purple-light)', color: 'var(--mf-purple)' },
  medewerker: { label: 'werk.teamLid.rolMedewerker', bg: 'var(--mf-blue-light)', color: 'var(--mf-blue)' },
}

// Label = woordenboek-sleutel werk.teamLid.metric.<key>
const detailMetrics: { key: keyof Checkin }[] = [
  { key: 'energie' },
  { key: 'slaap' },
  { key: 'fysiek_pijn' },
  { key: 'fysiek_beweging' },
  { key: 'werkdruk' },
  { key: 'mentaal_focus' },
  { key: 'mentaal_stress' },
  { key: 'mentaal_balans' },
  { key: 'motivatie' },
  { key: 'sociaal_team' },
  { key: 'sociaal_steun' },
  { key: 'herstel' },
]

export default function ProfielPagina() {
  const router = useRouter()
  const params = useParams()
  const profielId = params.id as string
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]

  const [profiel, setProfiel] = useState<Profiel | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [mijnRol, setMijnRol] = useState('')
  const [mijnBedrijfId, setMijnBedrijfId] = useState('')
  const [mijnUserId, setMijnUserId] = useState('')
  const [laden, setLaden] = useState(true)
  const [nieGevonden, setNieGevonden] = useState(false)
  const [herinneringBezig, setHerinneringBezig] = useState(false)
  const [herinneringMelding, setHerinneringMelding] = useState<string | null>(null)
  const [herinneringFout, setHerinneringFout] = useState(false)
  const [actieveTab, setActieveTab] = useState<TeamTab>('vitaliteit')

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: mijnProfiel } = await supabase
        .from('profiles')
        .select('rol, bedrijf_id')
        .eq('id', user.id)
        .single()

      if (!mijnProfiel) { router.push('/login'); return }
      setMijnRol(mijnProfiel.rol)
      setMijnBedrijfId(mijnProfiel.bedrijf_id)
      setMijnUserId(user.id)

      const { data: doelProfiel } = await supabase
        .from('profiles')
        .select('id, naam, rol, avatar_url')
        .eq('id', profielId)
        .eq('bedrijf_id', mijnProfiel.bedrijf_id)
        .single()

      if (!doelProfiel) { setNieGevonden(true); setLaden(false); return }
      setProfiel(doelProfiel)

      if (mijnProfiel.rol === 'hr' || mijnProfiel.rol === 'admin') {
        const { data } = await supabase
          .from('checkins')
          .select('*')
          .eq('user_id', profielId)
          .order('created_at', { ascending: true })
          .limit(20)
        setCheckins(data || [])
      }

      setLaden(false)
    }
    laadData()
  }, [router, profielId])

  async function stuurHerinnering() {
    setHerinneringBezig(true)
    setHerinneringMelding(null)
    setHerinneringFout(false)
    try {
      const res = await fetch('/api/herinnering-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profielId }),
      })
      const json = await res.json()
      if (res.ok) {
        setHerinneringMelding(t('werk.teamLid.herinneringVerstuurd', { email: json.email }))
      } else {
        setHerinneringFout(true)
        setHerinneringMelding(t('werk.teamLid.fout', { fout: taal === 'nl' ? json.error : t('werk.algemeen.ietsMis') }))
      }
    } catch {
      setHerinneringFout(true)
      setHerinneringMelding(t('werk.teamLid.ietsMis'))
    }
    setHerinneringBezig(false)
  }

  const isHR = mijnRol === 'hr' || mijnRol === 'admin'
  const badge = rolBadge[profiel?.rol ?? 'medewerker'] ?? rolBadge.medewerker

  const fysiekScore = catScore(checkins, ['energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging'])
  const mentaalScore = catScore(checkins, ['werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans'])
  const sociaalScore = catScore(checkins, ['motivatie', 'sociaal_team', 'sociaal_steun', 'herstel'])
  const totaalScore = gem([fysiekScore, mentaalScore, sociaalScore])

  const trendData = checkins.map(c => ({
    datum: new Date(c.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    Score: Math.round(((c.energie + c.slaap + c.fysiek_pijn + c.fysiek_beweging +
                        c.werkdruk + c.mentaal_focus + c.mentaal_stress + c.mentaal_balans +
                        c.motivatie + c.sociaal_team + c.sociaal_steun + c.herstel) / 60) * 100),
  }))

  const toelichtingen = checkins.filter(c => c.toelichting?.trim())

  if (laden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 flex justify-center mt-16" role="status" aria-label={t('werk.teamLid.laden')}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
      </main>
    </div>
  )

  if (nieGevonden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 text-center mt-16">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.teamLid.nietGevonden')}</p>
        <Link href="/dashboard" className="text-sm hover:underline mt-4 inline-block" style={{ color: 'var(--text-2)' }}>{t('werk.teamLid.terug')}</Link>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-6 transition" style={{ color: 'var(--text-3)' }}>
          {t('werk.teamLid.terugTeam')}
        </Link>

        {/* Header */}
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Avatar naam={profiel?.naam || '?'} avatarUrl={profiel?.avatar_url} size={56} />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-xl font-medium" style={{ color: 'var(--text-1)' }}>{profiel?.naam}</h1>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                    {t(badge.label)}
                  </span>
                </div>
                {isHR ? (
                  checkins.length > 0
                    ? <p className="text-sm" style={{ color: 'var(--text-3)' }}>{checkins.length === 1
                      ? t('werk.teamLid.checkinsEen', { datum: new Date(checkins[checkins.length - 1].created_at).toLocaleDateString(locale) })
                      : t('werk.teamLid.checkinsMeer', { aantal: checkins.length, datum: new Date(checkins[checkins.length - 1].created_at).toLocaleDateString(locale) })}</p>
                    : <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.teamLid.geenCheckins')}</p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.teamLid.teamlid')}</p>
                )}
              </div>
            </div>
            {isHR && profiel?.rol === 'medewerker' && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={stuurHerinnering}
                  disabled={herinneringBezig}
                  className="text-sm rounded-xl px-4 py-2 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
                >
                  {herinneringBezig ? t('werk.teamLid.versturen') : t('werk.teamLid.stuurHerinnering')}
                </button>
                {herinneringMelding && (
                  <p
                    role={herinneringFout ? 'alert' : 'status'}
                    aria-live="polite"
                    className="text-xs"
                    style={{ color: herinneringFout ? 'var(--mf-red)' : 'var(--mf-green-dark)' }}
                  >
                    {herinneringMelding}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs — alleen voor HR */}
        {isHR && (
          <nav aria-label={t('werk.teamLid.secties')} style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            {([
              ['vitaliteit', 'werk.teamLid.tabVitaliteit', BarChart3],
              ['gesprekken', 'werk.teamLid.tabGesprekken', MessageCircle],
              ['dossier', 'werk.teamLid.tabDossier', FolderOpen],
            ] as const).map(([tab, label, Icon]) => (
              <button key={tab} type="button" aria-pressed={actieveTab === tab} onClick={() => setActieveTab(tab)} className="text-sm inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2" style={{
                padding: '9px 16px', fontWeight: 600, border: 'none',
                background: 'transparent', cursor: 'pointer',
                borderBottom: `2px solid ${actieveTab === tab ? 'var(--mf-green)' : 'transparent'}`,
                color: actieveTab === tab ? 'var(--mf-green)' : 'var(--text-2)',
                transition: 'all 0.15s',
              }}>
                <Icon size={15} aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </nav>
        )}

        {/* HR-only: scores + detail + trend + toelichtingen */}
        {isHR && actieveTab === 'vitaliteit' && checkins.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-app)', border: `2px solid ${scoreKleur(totaalScore)}` }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{t('werk.teamLid.totaal')}</p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                  </div>
                  <p className="text-3xl font-medium" style={{ color: scoreKleur(totaalScore), position: 'relative', zIndex: 1 }}>{totaalScore}/5</p>
                </div>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--mf-green-light)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--mf-green-dark)' }}>{t('werk.teamLid.fysiek')}</p>
                <p className="text-2xl font-medium" style={{ color: 'var(--mf-green)' }}>{fysiekScore}/5</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--mf-blue-light)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--mf-blue)' }}>{t('werk.teamLid.mentaal')}</p>
                <p className="text-2xl font-medium" style={{ color: 'var(--mf-blue)' }}>{mentaalScore}/5</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--mf-purple-light)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--mf-purple)' }}>{t('werk.teamLid.sociaal')}</p>
                <p className="text-2xl font-medium" style={{ color: 'var(--mf-purple)' }}>{sociaalScore}/5</p>
              </div>
            </div>

            <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>{t('werk.teamLid.perIndicator')}</p>
              <div className="grid grid-cols-2 gap-3">
                {detailMetrics.map(m => {
                  const waarde = gem(checkins.map(c => c[m.key] as number))
                  const label = t(`werk.teamLid.metric.${m.key}`)
                  return (
                    <div key={m.key} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-app)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-20 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--bg-subtle)' }}
                          role="progressbar"
                          aria-label={t('werk.teamLid.scoreLabel', { label })}
                          aria-valuenow={waarde}
                          aria-valuemin={0}
                          aria-valuemax={5}
                          aria-valuetext={waarde > 0 ? t('werk.teamLid.vanVijf', { waarde }) : t('werk.teamLid.geenData')}
                        >
                          <div className="h-full rounded-full" style={{ width: `${(waarde / 5) * 100}%`, background: scoreKleur(waarde) }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right" style={{ color: waarde > 0 ? scoreKleur(waarde) : 'var(--border)' }}>
                          {waarde > 0 ? waarde : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {checkins.length > 1 && (
              <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>{t('werk.teamLid.trend')}</p>
                <VitaliteitTrend data={trendData} />
              </div>
            )}

            {toelichtingen.length > 0 && (
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>{t('werk.teamLid.toelichtingen', { aantal: toelichtingen.length })}</p>
                <div className="flex flex-col gap-3">
                  {toelichtingen.map(c => (
                    <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--bg-app)', borderLeft: '3px solid var(--mentaforce-primary)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>&ldquo;{c.toelichting}&rdquo;</p>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString(locale)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isHR && actieveTab === 'vitaliteit' && checkins.length === 0 && (
          <div className="rounded-2xl border p-8 text-center mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.teamLid.nogGeen')}</p>
          </div>
        )}

        {/* Gesprekken tab */}
        {isHR && actieveTab === 'gesprekken' && mijnBedrijfId && mijnUserId && (
          <GesprekkenTab
            bedrijfId={mijnBedrijfId}
            hrUserId={mijnUserId}
            gefilterdOpMedewerker={profielId}
          />
        )}

        {/* Dossier tab */}
        {isHR && actieveTab === 'dossier' && (
          <div className="mt-2">
            <DocumentenSectie
              userId={profielId}
              isHR={true}
              naamMedewerker={profiel?.naam ?? undefined}
            />
          </div>
        )}

        {/* Dossier — altijd zichtbaar voor HR als geen tabs (fallback) */}
        {!isHR && (
          <div className="mt-2">
            <DocumentenSectie
              userId={profielId}
              isHR={false}
              naamMedewerker={profiel?.naam ?? undefined}
            />
          </div>
        )}

      </main>
    </div>
  )
}
