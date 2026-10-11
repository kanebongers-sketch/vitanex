'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Wallet,
  Building2,
  Users,
  BarChart3,
  Settings,
  Shield,
  Briefcase,
  User,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Target,
  Calendar,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { normaliseerPlan, PLAN_INFO } from '@/lib/plan/plan'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'


const BEKIJK_ALS_KEY = 'mentaforce_admin_view_as'

type Sectie = 'overzicht' | 'bedrijven' | 'gebruikers' | 'financieel' | 'platform' | 'beheer'

type Bedrijf = {
  id: string
  naam: string
  aangemaakt_op: string
  plan?: string
}

type Profiel = {
  id: string
  naam: string
  rol: string
  bedrijf_id: string | null
  aangemaakt_op?: string
}

type CheckinStat = {
  user_id: string
  created_at: string
}

function StatKaart({ label, waarde, sub, kleur, icon: Icon }: {
  label: string; waarde: string | number; sub?: string; kleur: string; icon: LucideIcon
}) {
  const { t } = useVertaling()
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <Icon size={22} strokeWidth={2} style={{ color: kleur }} aria-hidden="true" />
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `color-mix(in srgb, ${kleur} 8%, transparent)`, color: kleur }}>{t('werk.admin.live')}</span>
      </div>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)` }} />
        </div>
        <p className="text-3xl font-black tracking-tight" style={{ color: kleur, position: 'relative', zIndex: 1 }}>{waarde}</p>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  )
}

function SectieKnop({ label, icon: Icon, actief, onClick }: {
  id: Sectie; label: string; icon: LucideIcon; actief: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left transition text-sm font-medium"
      style={{
        background: actief ? 'var(--mentaforce-primary-light)' : 'transparent',
        color: actief ? 'var(--mentaforce-primary)' : 'var(--text-2)',
      }}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" /> {label}
    </button>
  )
}

const BEKENDE_ROLLEN = new Set(['admin', 'hr', 'medewerker', 'manager'])
const BEKENDE_PLANNEN = new Set(['starter', 'groei', 'enterprise'])

export default function Admin() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const rolLabel = (rol: string) => (BEKENDE_ROLLEN.has(rol) ? t(`werk.rol.${rol}`) : rol)
  const planLabel = (plan: string) => (BEKENDE_PLANNEN.has(plan) ? t(`werk.admin.plan.${plan}`) : plan)
  const serverFout = (bericht: string | undefined) => (taal === 'nl' && bericht ? bericht : t('werk.algemeen.ietsMis'))
  const [sectie, setSectie] = useState<Sectie>('overzicht')
  const [bedrijven, setBedrijven] = useState<Bedrijf[]>([])
  const [profielen, setProfielen] = useState<Profiel[]>([])
  const [checkins, setCheckins] = useState<CheckinStat[]>([])
  const [laden, setLaden] = useState(true)

  // Formulier states
  const [nieuwBedrijf, setNieuwBedrijf] = useState('')
  const [nieuwPlan, setNieuwPlan] = useState('groei')
  const [hrForm, setHrForm] = useState({ email: '', bedrijf_id: '', wachtwoord: '' })
  const [melding, setMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [openBedrijf, setOpenBedrijf] = useState<string | null>(null)
  const [zoekterm, setZoekterm] = useState('')

  useEffect(() => {
    // Altijd preview-modus beëindigen bij terugkeer naar admin
    localStorage.removeItem(BEKIJK_ALS_KEY)

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (profiel?.rol === 'hr') { router.push('/dashboard'); return }
      if (profiel?.rol === 'medewerker') { router.push('/home'); return }
      if (profiel?.rol !== 'admin') { router.push('/home'); return }
      await laadAlles()
    }
    check()
  }, [router])

  function schakelNaarRol(rol: 'hr' | 'medewerker') {
    localStorage.setItem(BEKIJK_ALS_KEY, rol)
    router.push(rol === 'hr' ? '/dashboard' : '/home')
  }

  async function laadAlles() {
    const [{ data: bData }, { data: pData }, { data: cData }] = await Promise.all([
      supabase.from('bedrijven').select('id, naam, hr_code, aangemaakt_op').order('aangemaakt_op', { ascending: false }).limit(100),
      supabase.from('profiles').select('id, naam, rol, bedrijf_id').order('naam'),
      supabase.from('checkins').select('user_id, created_at').order('created_at', { ascending: false }).limit(500),
    ])
    setBedrijven(bData || [])
    setProfielen(pData || [])
    setCheckins(cData || [])
    setLaden(false)
  }

  async function maakBedrijfAan() {
    if (!nieuwBedrijf.trim()) return
    setBezig(true)
    const { error } = await supabase.from('bedrijven').insert({ naam: nieuwBedrijf.trim(), plan: nieuwPlan })
    if (error) {
      setMelding({ type: 'error', tekst: t('werk.admin.foutMet', { fout: serverFout(error.message) }) })
    } else {
      setMelding({ type: 'success', tekst: t('werk.admin.bedrijfAangemaakt', { naam: nieuwBedrijf }) })
      setNieuwBedrijf('')
    }
    await laadAlles()
    setBezig(false)
    setTimeout(() => setMelding(null), 4000)
  }

  async function maakHRAan() {
    if (!hrForm.email || !hrForm.bedrijf_id || !hrForm.wachtwoord) return
    setBezig(true)
    setMelding(null)
    const { data, error } = await supabase.auth.admin.createUser({
      email: hrForm.email,
      password: hrForm.wachtwoord,
      email_confirm: true,
    })
    if (error || !data.user) {
      setMelding({ type: 'error', tekst: t('werk.admin.foutMet', { fout: serverFout(error?.message) }) })
      setBezig(false)
      return
    }
    await supabase.from('profiles').upsert({ id: data.user.id, naam: hrForm.email, bedrijf_id: hrForm.bedrijf_id, rol: 'hr' })
    setMelding({ type: 'success', tekst: t('werk.admin.hrAangemaakt', { email: hrForm.email }) })
    setHrForm({ email: '', bedrijf_id: '', wachtwoord: '' })
    await laadAlles()
    setBezig(false)
    setTimeout(() => setMelding(null), 4000)
  }

  // Berekende statistieken
  const totaalGebruikers = profielen.length
  const totaalHR = profielen.filter(p => p.rol === 'hr').length
  const totaalMedewerkers = profielen.filter(p => p.rol === 'medewerker').length
  const totaalBedrijven = bedrijven.length

  const nu = new Date()
  const dertigDagenGeleden = new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000)
  const zevenDagenGeleden = new Date(nu.getTime() - 7 * 24 * 60 * 60 * 1000)

  const checkinsDezeWeek = checkins.filter(c => new Date(c.created_at) >= zevenDagenGeleden).length
  const checkinsDezeWeekUniek = new Set(checkins.filter(c => new Date(c.created_at) >= zevenDagenGeleden).map(c => c.user_id)).size

  function aantalPerBedrijf(bid: string, rol?: string) {
    return profielen.filter(p => p.bedrijf_id === bid && (rol ? p.rol === rol : true)).length
  }

  function checkinsPerBedrijf(bid: string) {
    const userIds = new Set(profielen.filter(p => p.bedrijf_id === bid).map(p => p.id))
    return checkins.filter(c => userIds.has(c.user_id)).length
  }

  // MRR berekening: schatting op basis van medewerkercount per bedrijf.
  // Onbekend/leeg plan telt als starter — liever te laag geschat dan te hoog.
  function mrrBedrijf(b: Bedrijf) {
    const medewerkers = aantalPerBedrijf(b.id, 'medewerker')
    return medewerkers * PLAN_INFO[normaliseerPlan(b.plan)].prijsPerGebruiker
  }

  const totalMRR = bedrijven.reduce((sum, b) => sum + mrrBedrijf(b), 0)
  const totalARR = totalMRR * 12

  // Nieuwe bedrijven afgelopen 30 dagen
  const nieuweBedrijven30d = bedrijven.filter(b => new Date(b.aangemaakt_op) >= dertigDagenGeleden).length

  const gefilterdeBedrijven = bedrijven.filter(b =>
    b.naam.toLowerCase().includes(zoekterm.toLowerCase())
  )

  const gefilterdGebruikers = profielen.filter(p =>
    p.naam?.toLowerCase().includes(zoekterm.toLowerCase())
  )

  const planVerdeling = bedrijven.reduce((acc, b) => {
    const plan = b.plan ?? 'groei'
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <style>{`
        .mf-rol-knop-hr:hover {
          background: color-mix(in srgb, var(--mf-blue) 12%, transparent);
          color: var(--mf-blue);
        }
        .mf-rol-knop-mwd:hover {
          background: color-mix(in srgb, var(--mf-green) 12%, transparent);
          color: var(--mf-green);
        }
        .mf-setup-link:hover {
          background: var(--mf-purple-light);
          color: var(--mf-purple);
        }
        .mf-bedrijf-rij:hover {
          background: color-mix(in srgb, var(--text-1) 4%, transparent);
        }
      `}</style>
      <Navbar />

      {/* Admin portal identity banner */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--bg-subtle)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--mf-purple)', color: 'var(--bg-app)' }}>A</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t('werk.admin.portaal')}</p>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>·</span>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.platformBeheer')}</p>
        </div>
      </div>

      <div className="px-4 py-8 flex gap-6">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <div className="rounded-2xl border p-3 sticky top-24" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 px-2 py-2 mb-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--mf-purple)', color: 'var(--bg-app)' }}>A</div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.admin')}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.staff')}</p>
              </div>
            </div>
            {([
              ['overzicht', t('werk.admin.sectie.overzicht'), Home],
              ['financieel', t('werk.admin.sectie.financieel'), Wallet],
              ['bedrijven', t('werk.admin.sectie.bedrijven'), Building2],
              ['gebruikers', t('werk.admin.sectie.gebruikers'), Users],
              ['platform', t('werk.admin.sectie.platform'), BarChart3],
              ['beheer', t('werk.admin.sectie.beheer'), Settings],
            ] as [Sectie, string, LucideIcon][]).map(([id, label, icon]) => (
              <SectieKnop key={id} id={id} label={label} icon={icon}
                actief={sectie === id} onClick={() => setSectie(id)} />
            ))}
            {/* Rol-switcher */}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold px-2 mb-2 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                {t('werk.admin.bekijkenAls')}
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--mf-purple-light)', color: 'var(--mf-purple)' }}>
                  <Shield size={14} strokeWidth={2} aria-hidden="true" /> {t('werk.admin.adminHuidig')}
                </div>
                <button
                  onClick={() => schakelNaarRol('hr')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition w-full text-left mf-rol-knop-hr"
                  style={{ color: 'var(--text-3)' }}
                >
                  <Briefcase size={14} strokeWidth={2} aria-hidden="true" /> {t('werk.admin.hrManager')}
                  <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => schakelNaarRol('medewerker')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition w-full text-left mf-rol-knop-mwd"
                  style={{ color: 'var(--text-3)' }}
                >
                  <User size={14} strokeWidth={2} aria-hidden="true" /> {t('werk.admin.medewerker')}
                  <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <a
                href="/setup"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left text-xs transition mf-setup-link"
                style={{ color: 'var(--text-3)' }}
              >
                <Wrench size={14} strokeWidth={2} aria-hidden="true" /> {t('werk.admin.setup')}
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Melding */}
          {melding && (
            <div className="rounded-2xl border p-4 mb-5 text-sm font-medium"
              style={{
                background: melding.type === 'success' ? 'var(--mf-green-light)' : 'var(--mf-red-light)',
                borderColor: melding.type === 'success' ? 'var(--mf-green-light)' : 'var(--mf-red-light)',
                color: melding.type === 'success' ? 'var(--mf-green-dark)' : 'var(--mf-red)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {melding.type === 'success'
                ? <CheckCircle2 size={15} aria-hidden style={{ flexShrink: 0 }} />
                : <X size={15} aria-hidden style={{ flexShrink: 0 }} />}
              {melding.tekst}
            </div>
          )}

          {/* ── OVERZICHT ── */}
          {sectie === 'overzicht' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.dashboard')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                  {t('werk.admin.dashboardIntro')}
                  {' '}<span style={{ color: 'var(--text-4)' }}>{t('werk.admin.bijgewerkt', { tijd: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}</span>
                </p>
              </div>

              {laden ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
                </div>
              ) : (
                <>
                  {/* KPI grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatKaart icon={Building2} label={t('werk.admin.bedrijven')} waarde={totaalBedrijven}
                      sub={t('werk.admin.dezeMaand', { aantal: nieuweBedrijven30d })} kleur="var(--mf-green)" />
                    <StatKaart icon={Users} label={t('werk.admin.gebruikers')} waarde={totaalGebruikers}
                      sub={t('werk.admin.verdeling', { medewerkers: totaalMedewerkers, hr: totaalHR })} kleur="var(--mf-blue)" />
                    <StatKaart icon={CheckCircle2} label={t('werk.admin.checkins7')} waarde={checkinsDezeWeek}
                      sub={t('werk.admin.uniek', { aantal: checkinsDezeWeekUniek })} kleur="var(--mf-purple)" />
                    <StatKaart icon={Wallet} label={t('werk.admin.mrrSchatting')} waarde={t('werk.admin.euro', { bedrag: totalMRR.toLocaleString(locale) })}
                      sub={t('werk.admin.arr', { bedrag: totalARR.toLocaleString(locale) })} kleur="var(--mf-amber)" />
                  </div>

                  {/* Top bedrijven tabel */}
                  <div className="rounded-2xl border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.meestActief')}</h2>
                      <button onClick={() => setSectie('bedrijven')}
                        className="text-xs font-medium transition" style={{ color: 'var(--mentaforce-primary)' }}>
                        {t('werk.admin.allesBekijken')}
                      </button>
                    </div>
                    <div>
                      {[...bedrijven]
                        .sort((a, b) => checkinsPerBedrijf(b.id) - checkinsPerBedrijf(a.id))
                        .slice(0, 5)
                        .map((b, i) => {
                          const mwd = aantalPerBedrijf(b.id, 'medewerker')
                          const ci = checkinsPerBedrijf(b.id)
                          const mrr = mrrBedrijf(b)
                          return (
                            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 not-first:border-t" style={{ borderColor: 'var(--border)' }}>
                              <span className="text-sm font-bold w-5" style={{ color: 'var(--text-3)' }}>{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{b.naam}</p>
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.medewerkersAantal', { aantal: mwd })}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t('werk.admin.checkinsAantal', { aantal: ci })}</p>
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.perMaand', { bedrag: mrr })}</p>
                              </div>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                                style={{
                                  background: b.plan === 'enterprise' ? 'var(--mf-purple-light)' : b.plan === 'groei' ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                                  color: b.plan === 'enterprise' ? 'var(--mf-purple)' : b.plan === 'groei' ? 'var(--mf-green-dark)' : 'var(--text-2)',
                                }}>
                                {planLabel(b.plan ?? 'groei')}
                              </span>
                            </div>
                          )
                        })}
                      {bedrijven.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.admin.nogGeenBedrijven')}</div>
                      )}
                    </div>
                  </div>

                  {/* Recente gebruikers */}
                  <div className="rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.recenteGebruikers')}</h2>
                      <button onClick={() => setSectie('gebruikers')}
                        className="text-xs font-medium transition" style={{ color: 'var(--mentaforce-primary)' }}>
                        {t('werk.admin.allesBekijken')}
                      </button>
                    </div>
                    <div>
                      {[...profielen].slice(0, 6).map(p => {
                        const bedrijf = bedrijven.find(b => b.id === p.bedrijf_id)
                        return (
                          <div key={p.id} className="px-5 py-3 flex items-center gap-3 not-first:border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: p.rol === 'admin' ? 'var(--mf-purple-light)' : p.rol === 'hr' ? 'var(--mf-green-light)' : 'var(--mf-blue-light)',
                                color: p.rol === 'admin' ? 'var(--mf-purple)' : p.rol === 'hr' ? 'var(--mf-green-dark)' : 'var(--mf-blue)',
                              }}>
                              {(p.naam || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{p.naam || t('werk.admin.onbekend')}</p>
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{bedrijf?.naam ?? t('werk.admin.geenBedrijf')}</p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                              style={{
                                background: p.rol === 'hr' ? 'var(--mf-green-light)' : p.rol === 'admin' ? 'var(--mf-purple-light)' : 'var(--mf-blue-light)',
                                color: p.rol === 'hr' ? 'var(--mf-green-dark)' : p.rol === 'admin' ? 'var(--mf-purple)' : 'var(--mf-blue)',
                              }}>
                              {rolLabel(p.rol)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── FINANCIEEL ── */}
          {sectie === 'financieel' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.financieelTitel')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t('werk.admin.financieelIntro')}</p>
              </div>

              {laden ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatKaart icon={TrendingUp} label={t('werk.admin.mrr')} waarde={t('werk.admin.euro', { bedrag: totalMRR.toLocaleString(locale) })}
                      sub={t('werk.admin.maandInkomsten')} kleur="var(--mf-green)" />
                    <StatKaart icon={Target} label={t('werk.admin.arrLabel')} waarde={t('werk.admin.euro', { bedrag: totalARR.toLocaleString(locale) })}
                      sub={t('werk.admin.jaarInkomsten')} kleur="var(--mf-blue)" />
                    <StatKaart icon={User} label={t('werk.admin.arpu')} waarde={t('werk.admin.euro', { bedrag: totaalMedewerkers > 0 ? (totalMRR / totaalMedewerkers).toFixed(2) : '0' })}
                      sub={t('werk.admin.perMedewerker')} kleur="var(--mf-purple)" />
                    <StatKaart icon={Building2} label={t('werk.admin.arpc')} waarde={t('werk.admin.euro', { bedrag: totaalBedrijven > 0 ? Math.round(totalMRR / totaalBedrijven) : 0 })}
                      sub={t('werk.admin.perBedrijf')} kleur="var(--mf-amber)" />
                  </div>

                  {/* Plan verdeling */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { plan: 'starter', naam: t('werk.admin.plan.starter'), prijs: 4, kleur: 'var(--text-2)', bg: 'var(--bg-subtle)' },
                      { plan: 'groei', naam: t('werk.admin.plan.groei'), prijs: 7, kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                      { plan: 'enterprise', naam: t('werk.admin.plan.enterprise'), prijs: 15, kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
                    ].map(plan => {
                      const aantalBedrijven = planVerdeling[plan.plan] ?? 0
                      const aantalMwd = bedrijven
                        .filter(b => (b.plan ?? 'groei') === plan.plan)
                        .reduce((s, b) => s + aantalPerBedrijf(b.id, 'medewerker'), 0)
                      const mrr = aantalMwd * plan.prijs
                      return (
                        <div key={plan.plan} className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold px-3 py-1 rounded-full"
                              style={{ background: plan.bg, color: plan.kleur }}>{plan.naam}</span>
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.ppMaand', { prijs: plan.prijs })}</span>
                          </div>
                          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                              <div style={{ width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)` }} />
                            </div>
                            <p className="text-3xl font-black" style={{ color: plan.kleur, position: 'relative', zIndex: 1 }}>
                              {t('werk.admin.euro', { bedrag: mrr.toLocaleString(locale) })}
                            </p>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.mrr')}</p>
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                            <div>
                              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{aantalBedrijven}</p>
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.bedrijvenKlein')}</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{aantalMwd}</p>
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.medewerkersKlein')}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Inkomsten per bedrijf */}
                  <div className="rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.inkomstenPerBedrijf')}</h2>
                    </div>
                    <div>
                      {[...bedrijven]
                        .sort((a, b) => mrrBedrijf(b) - mrrBedrijf(a))
                        .map(b => {
                          const mwd = aantalPerBedrijf(b.id, 'medewerker')
                          const mrr = mrrBedrijf(b)
                          const arr = mrr * 12
                          const plan = b.plan ?? 'groei'
                          return (
                            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 not-first:border-t" style={{ borderColor: 'var(--border)' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{b.naam}</p>
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.medewerkersPlan', { aantal: mwd, plan: planLabel(plan) })}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: 'var(--mf-green)' }}>{t('werk.admin.perMaand', { bedrag: mrr })}</p>
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.perJaar', { bedrag: arr.toLocaleString(locale) })}</p>
                              </div>
                            </div>
                          )
                        })}
                      {bedrijven.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.admin.geenData')}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── BEDRIJVEN ── */}
          {sectie === 'bedrijven' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.bedrijven')}</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t('werk.admin.bedrijvenActief', { aantal: bedrijven.length })}</p>
                </div>
              </div>

              <div className="rounded-2xl border mb-5 p-4 flex gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <input
                  type="text"
                  placeholder={t('werk.admin.zoekBedrijf')}
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                />
              </div>

              <div className="rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div>
                  {laden ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
                    </div>
                  ) : gefilterdeBedrijven.length === 0 ? (
                    <div className="py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>{t('werk.admin.geenResultaten')}</div>
                  ) : gefilterdeBedrijven.map(b => {
                    const hrAantal = aantalPerBedrijf(b.id, 'hr')
                    const mwdAantal = aantalPerBedrijf(b.id, 'medewerker')
                    const ci = checkinsPerBedrijf(b.id)
                    const mrr = mrrBedrijf(b)
                    const isOpen = openBedrijf === b.id
                    const hrLeden = profielen.filter(p => p.bedrijf_id === b.id && p.rol === 'hr')
                    const plan = b.plan ?? 'groei'

                    return (
                      <div key={b.id} className="not-first:border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => setOpenBedrijf(isOpen ? null : b.id)}
                          className="w-full px-5 py-4 flex items-center gap-4 transition text-left mf-bedrijf-rij"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: 'var(--bg-app)', color: 'var(--text-1)' }}>
                            {b.naam[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{b.naam}</p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {t('werk.admin.bedrijfRegel', { medewerkers: mwdAantal, hr: hrAantal, datum: new Date(b.aangemaakt_op).toLocaleDateString(locale) })}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold" style={{ color: 'var(--mf-green)' }}>{t('werk.admin.perMaand', { bedrag: mrr })}</p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.checkinsAantal', { aantal: ci })}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize ml-2"
                            style={{
                              background: plan === 'enterprise' ? 'var(--mf-purple-light)' : plan === 'groei' ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                              color: plan === 'enterprise' ? 'var(--mf-purple)' : plan === 'groei' ? 'var(--mf-green-dark)' : 'var(--text-2)',
                            }}>
                            {planLabel(plan)}
                          </span>
                          <span className="ml-2" style={{ color: 'var(--text-3)' }}>{isOpen ? '↑' : '↓'}</span>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 border-t" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {[
                                { label: t('werk.admin.medewerkers'), waarde: mwdAantal, kleur: 'var(--mf-blue)' },
                                { label: t('werk.admin.hrAccounts'), waarde: hrAantal, kleur: 'var(--mf-green)' },
                                { label: t('werk.admin.totaalCheckins'), waarde: ci, kleur: 'var(--mf-purple)' },
                              ].map(s => (
                                <div key={s.label} className="rounded-xl p-3 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                  <p className="text-xl font-bold" style={{ color: s.kleur }}>{s.waarde}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t('werk.admin.hrAccounts')}</p>
                            {hrLeden.length === 0 ? (
                              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.geenHr')}</p>
                            ) : hrLeden.map(p => (
                              <div key={p.id} className="flex items-center gap-2 py-1">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
                                  {(p.naam || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{p.naam}</span>
                              </div>
                            ))}
                            <p className="text-xs mt-3" style={{ color: 'var(--text-4)' }}>{t('werk.admin.id', { id: b.id })}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── GEBRUIKERS ── */}
          {sectie === 'gebruikers' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.gebruikers')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t('werk.admin.gebruikersTotaal', { aantal: totaalGebruikers })}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <p className="text-3xl font-black mb-1" style={{ color: 'var(--text-1)' }}>{totaalGebruikers}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.totaal')}</p>
                </div>
                <div className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <p className="text-3xl font-black mb-1" style={{ color: 'var(--mf-green)' }}>{totaalMedewerkers}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.medewerkers')}</p>
                </div>
                <div className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <p className="text-3xl font-black mb-1" style={{ color: 'var(--mf-blue)' }}>{totaalHR}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.admin.hrAccounts')}</p>
                </div>
              </div>

              <div className="rounded-2xl border mb-4 p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <input
                  type="text"
                  placeholder={t('werk.admin.zoekNaam')}
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                />
              </div>

              <div className="rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div>
                  {laden ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
                    </div>
                  ) : gefilterdGebruikers.slice(0, 50).map(p => {
                    const bedrijf = bedrijven.find(b => b.id === p.bedrijf_id)
                    const userCheckins = checkins.filter(c => c.user_id === p.id).length
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3 not-first:border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: p.rol === 'admin' ? 'var(--mf-purple-light)' : p.rol === 'hr' ? 'var(--mf-green-light)' : 'var(--mf-blue-light)',
                            color: p.rol === 'admin' ? 'var(--mf-purple)' : p.rol === 'hr' ? 'var(--mf-green-dark)' : 'var(--mf-blue)',
                          }}>
                          {(p.naam || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{p.naam || t('werk.admin.naamloos')}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{bedrijf?.naam ?? t('werk.admin.geenBedrijf')}</p>
                        </div>
                        <p className="text-xs hidden sm:block" style={{ color: 'var(--text-3)' }}>{t('werk.admin.checkinsAantal', { aantal: userCheckins })}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize ml-2"
                          style={{
                            background: p.rol === 'hr' ? 'var(--mf-green-light)' : p.rol === 'admin' ? 'var(--mf-purple-light)' : 'var(--mf-blue-light)',
                            color: p.rol === 'hr' ? 'var(--mf-green-dark)' : p.rol === 'admin' ? 'var(--mf-purple)' : 'var(--mf-blue)',
                          }}>
                          {rolLabel(p.rol)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── PLATFORM ── */}
          {sectie === 'platform' && (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.platformTitel')}</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t('werk.admin.platformIntro')}</p>
                </div>
                <Link href="/admin/metrics" style={{
                  fontSize: 13, color: 'var(--mentaforce-primary)', textDecoration: 'none',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-btn)', padding: '8px 14px',
                }}>
                  {t('werk.admin.retentie')}
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatKaart icon={CheckCircle2} label={t('werk.admin.totaalCheckins')} waarde={checkins.length}
                  sub={t('werk.admin.alleTijden')} kleur="var(--mf-green)" />
                <StatKaart icon={Calendar} label={t('werk.admin.checkins7')} waarde={checkinsDezeWeek}
                  sub={t('werk.admin.gebruikersAantal', { aantal: checkinsDezeWeekUniek })} kleur="var(--mf-blue)" />
                <StatKaart icon={BarChart3} label={t('werk.admin.gemPerBedrijf')} waarde={totaalBedrijven > 0 ? Math.round(checkins.length / totaalBedrijven) : 0}
                  sub={t('werk.admin.checkinsTotaal')} kleur="var(--mf-purple)" />
              </div>

              {/* Check-in activiteit per bedrijf */}
              <div className="rounded-2xl border mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.participatie')}</h2>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {bedrijven.map(b => {
                    const medewerkers = profielen.filter(p => p.bedrijf_id === b.id && p.rol === 'medewerker')
                    const userIds = new Set(medewerkers.map(p => p.id))
                    const actiefDezeWeek = new Set(
                      checkins.filter(c => new Date(c.created_at) >= zevenDagenGeleden && userIds.has(c.user_id)).map(c => c.user_id)
                    )
                    const pct = medewerkers.length > 0
                      ? Math.round((actiefDezeWeek.size / medewerkers.length) * 100)
                      : 0
                    return (
                      <div key={b.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{b.naam}</p>
                          <p className="text-sm font-bold" style={{ color: pct >= 70 ? 'var(--mf-green)' : pct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)' }}>
                            {pct}%
                          </p>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 70 ? 'var(--mf-green)' : pct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)',
                            }} />
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t('werk.admin.actiefTelling', { actief: actiefDezeWeek.size, totaal: medewerkers.length })}</p>
                      </div>
                    )
                  })}
                  {bedrijven.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>{t('werk.admin.geenDataKort')}</p>}
                </div>
              </div>
            </>
          )}

          {/* ── BEHEER ── */}
          {sectie === 'beheer' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{t('werk.admin.beheerTitel')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t('werk.admin.beheerIntro')}</p>
              </div>

              {/* Nieuw bedrijf */}
              <div className="rounded-2xl border p-6 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t('werk.admin.nieuwBedrijf')}</h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>{t('werk.admin.nieuwBedrijfIntro')}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={t('werk.admin.bedrijfsnaam')}
                    value={nieuwBedrijf}
                    onChange={e => setNieuwBedrijf(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && maakBedrijfAan()}
                    className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                  <select
                    value={nieuwPlan}
                    onChange={e => setNieuwPlan(e.target.value)}
                    className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  >
                    <option value="starter">{t('werk.admin.optieStarter')}</option>
                    <option value="groei">{t('werk.admin.optieGroei')}</option>
                    <option value="enterprise">{t('werk.admin.optieEnterprise')}</option>
                  </select>
                  <button
                    onClick={maakBedrijfAan}
                    disabled={bezig || !nieuwBedrijf.trim()}
                    className="rounded-xl px-6 py-3 text-sm font-semibold transition disabled:opacity-30"
                    style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}>
                    {bezig ? t('werk.admin.bezig') : t('werk.admin.aanmaken')}
                  </button>
                </div>
              </div>

              {/* HR-account aanmaken */}
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t('werk.admin.hrAanmaken')}</h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                  {t('werk.admin.hrAanmakenIntro')}
                </p>
                <div className="flex flex-col gap-3">
                  <select
                    value={hrForm.bedrijf_id}
                    onChange={e => setHrForm(prev => ({ ...prev, bedrijf_id: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  >
                    <option value="">{t('werk.admin.kiesBedrijf')}</option>
                    {bedrijven.map(b => <option key={b.id} value={b.id}>{b.naam}</option>)}
                  </select>
                  <input
                    type="email"
                    placeholder={t('werk.admin.emailHr')}
                    value={hrForm.email}
                    onChange={e => setHrForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                  <input
                    type="password"
                    placeholder={t('werk.admin.tijdelijkWachtwoord')}
                    value={hrForm.wachtwoord}
                    onChange={e => setHrForm(prev => ({ ...prev, wachtwoord: e.target.value }))}
                    className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--mentaforce-primary)]"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                  <button
                    onClick={maakHRAan}
                    disabled={bezig || !hrForm.email || !hrForm.bedrijf_id || !hrForm.wachtwoord}
                    className="rounded-xl py-3 text-sm font-semibold transition disabled:opacity-30"
                    style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}>
                    {bezig ? t('werk.admin.bezig') : t('werk.admin.hrAanmaken')}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

