'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

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

const PLAN_PRIJS: Record<string, number> = {
  starter: 4,
  groei: 7,
  enterprise: 15,
}

function StatKaart({ label, waarde, sub, kleur, icon }: {
  label: string; waarde: string | number; sub?: string; kleur: string; icon: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: kleur + '15', color: kleur }}>Live</span>
      </div>
      <p className="text-3xl font-black tracking-tight mb-1" style={{ color: kleur }}>{waarde}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectieKnop({ label, emoji, actief, onClick }: {
  id: Sectie; label: string; emoji: string; actief: boolean; onClick: () => void
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
      <span>{emoji}</span> {label}
    </button>
  )
}

export default function Admin() {
  const router = useRouter()
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
      if (profiel?.rol === 'medewerker') { router.push('/portaal'); return }
      if (profiel?.rol !== 'admin') { router.push('/portaal'); return }
      await laadAlles()
    }
    check()
  }, [router])

  function schakelNaarRol(rol: 'hr' | 'medewerker') {
    localStorage.setItem(BEKIJK_ALS_KEY, rol)
    router.push(rol === 'hr' ? '/dashboard' : '/portaal')
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
      setMelding({ type: 'error', tekst: `Fout: ${error.message}` })
    } else {
      setMelding({ type: 'success', tekst: `Bedrijf "${nieuwBedrijf}" aangemaakt.` })
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
      setMelding({ type: 'error', tekst: `Fout: ${error?.message}` })
      setBezig(false)
      return
    }
    await supabase.from('profiles').upsert({ id: data.user.id, naam: hrForm.email, bedrijf_id: hrForm.bedrijf_id, rol: 'hr' })
    setMelding({ type: 'success', tekst: `HR-account aangemaakt voor ${hrForm.email}` })
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

  // MRR berekening: schatting op basis van medewerkercount per bedrijf
  function mrrBedrijf(b: Bedrijf) {
    const medewerkers = aantalPerBedrijf(b.id, 'medewerker')
    const plan = b.plan ?? 'groei'
    return medewerkers * (PLAN_PRIJS[plan] ?? 7)
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
    <div className="min-h-screen" style={{ background: 'var(--mf-purple-light)' }}>
      <Navbar />

      {/* Admin portal identity banner */}
      <div style={{ background: '#1e1340', borderBottom: '1px solid #2d1f60' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--mf-purple)' }}>A</div>
          <p className="text-sm font-medium text-white">Admin Portaal</p>
          <span className="text-gray-500 text-xs">—</span>
          <p className="text-xs text-gray-400">MentaForce platform beheer</p>
        </div>
      </div>

      <div className="px-4 py-8 flex gap-6">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-3 sticky top-24">
            <div className="flex items-center gap-2 px-2 py-2 mb-3 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--mf-purple)' }}>A</div>
              <div>
                <p className="text-xs font-bold text-gray-800">Admin</p>
                <p className="text-xs text-gray-400">MentaForce Staff</p>
              </div>
            </div>
            {([
              ['overzicht', 'Overzicht', '🏠'],
              ['financieel', 'Financieel', '💰'],
              ['bedrijven', 'Bedrijven', '🏢'],
              ['gebruikers', 'Gebruikers', '👥'],
              ['platform', 'Platform', '📊'],
              ['beheer', 'Beheer', '⚙️'],
            ] as [Sectie, string, string][]).map(([id, label, emoji]) => (
              <SectieKnop key={id} id={id} label={label} emoji={emoji}
                actief={sectie === id} onClick={() => setSectie(id)} />
            ))}
            {/* Rol-switcher */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-widest">
                Bekijken als
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--mf-purple-light)', color: 'var(--mf-purple)' }}>
                  <span>🛡️</span> Admin (huidig)
                </div>
                <button
                  onClick={() => schakelNaarRol('hr')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition w-full text-left"
                >
                  <span>👔</span> HR-manager
                  <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => schakelNaarRol('medewerker')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-green-50 hover:text-green-700 transition w-full text-left"
                >
                  <span>👤</span> Medewerker
                  <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <a
                href="/setup"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <span>🔧</span> Setup & migraties
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
              }}>
              {melding.type === 'success' ? 'v ' : 'x '}{melding.tekst}
            </div>
          )}

          {/* ── OVERZICHT ── */}
          {sectie === 'overzicht' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Overzicht van alle activiteit op het MentaForce platform.
                  {' '}<span className="text-gray-400">Bijgewerkt: {new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>

              {laden ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
                </div>
              ) : (
                <>
                  {/* KPI grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatKaart icon="🏢" label="Bedrijven" waarde={totaalBedrijven}
                      sub={`+${nieuweBedrijven30d} deze maand`} kleur="#1D9E75" />
                    <StatKaart icon="👥" label="Gebruikers" waarde={totaalGebruikers}
                      sub={`${totaalMedewerkers} mwd / ${totaalHR} HR`} kleur="#378ADD" />
                    <StatKaart icon="✅" label="Check-ins (7d)" waarde={checkinsDezeWeek}
                      sub={`${checkinsDezeWeekUniek} unieke gebruikers`} kleur="#8B5CF6" />
                    <StatKaart icon="💰" label="MRR (schatting)" waarde={`€ ${totalMRR.toLocaleString('nl-BE')}`}
                      sub={`ARR: € ${totalARR.toLocaleString('nl-BE')}`} kleur="#BA7517" />
                  </div>

                  {/* Top bedrijven tabel */}
                  <div className="bg-white rounded-2xl border border-gray-100 mb-6">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-800">Meest actieve bedrijven</h2>
                      <button onClick={() => setSectie('bedrijven')}
                        className="text-xs font-medium transition" style={{ color: 'var(--mentaforce-primary)' }}>
                        Alles bekijken
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[...bedrijven]
                        .sort((a, b) => checkinsPerBedrijf(b.id) - checkinsPerBedrijf(a.id))
                        .slice(0, 5)
                        .map((b, i) => {
                          const mwd = aantalPerBedrijf(b.id, 'medewerker')
                          const ci = checkinsPerBedrijf(b.id)
                          const mrr = mrrBedrijf(b)
                          return (
                            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4">
                              <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{b.naam}</p>
                                <p className="text-xs text-gray-400">{mwd} medewerkers</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-700">{ci} check-ins</p>
                                <p className="text-xs text-gray-400">€ {mrr}/mnd</p>
                              </div>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                                style={{
                                  background: b.plan === 'enterprise' ? 'var(--mf-purple-light)' : b.plan === 'groei' ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                                  color: b.plan === 'enterprise' ? '#3C3489' : b.plan === 'groei' ? 'var(--mf-green-dark)' : 'var(--text-2)',
                                }}>
                                {b.plan ?? 'groei'}
                              </span>
                            </div>
                          )
                        })}
                      {bedrijven.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">Nog geen bedrijven.</div>
                      )}
                    </div>
                  </div>

                  {/* Recente gebruikers */}
                  <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-800">Recente gebruikers</h2>
                      <button onClick={() => setSectie('gebruikers')}
                        className="text-xs font-medium transition" style={{ color: 'var(--mentaforce-primary)' }}>
                        Alles bekijken
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[...profielen].slice(0, 6).map(p => {
                        const bedrijf = bedrijven.find(b => b.id === p.bedrijf_id)
                        return (
                          <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: p.rol === 'admin' ? 'var(--mf-purple-light)' : p.rol === 'hr' ? 'var(--mf-green-light)' : 'var(--mf-blue-light)',
                                color: p.rol === 'admin' ? '#3C3489' : p.rol === 'hr' ? 'var(--mf-green-dark)' : 'var(--mf-blue)',
                              }}>
                              {(p.naam || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p.naam || 'Onbekend'}</p>
                              <p className="text-xs text-gray-400">{bedrijf?.naam ?? 'Geen bedrijf'}</p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                              style={{
                                background: p.rol === 'hr' ? 'var(--mf-green-light)' : p.rol === 'admin' ? 'var(--mf-purple-light)' : 'var(--mf-blue-light)',
                                color: p.rol === 'hr' ? 'var(--mf-green-dark)' : p.rol === 'admin' ? '#3C3489' : 'var(--mf-blue)',
                              }}>
                              {p.rol}
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
                <h1 className="text-2xl font-bold text-gray-900">Financieel overzicht</h1>
                <p className="text-sm text-gray-500 mt-1">Geschatte inkomsten op basis van huidig aantal medewerkers per plan.</p>
              </div>

              {laden ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatKaart icon="📈" label="MRR" waarde={`€ ${totalMRR.toLocaleString('nl-BE')}`}
                      sub="Maandelijkse inkomsten" kleur="#1D9E75" />
                    <StatKaart icon="🎯" label="ARR" waarde={`€ ${totalARR.toLocaleString('nl-BE')}`}
                      sub="Jaarlijkse inkomsten" kleur="#378ADD" />
                    <StatKaart icon="👤" label="ARPU" waarde={`€ ${totaalMedewerkers > 0 ? (totalMRR / totaalMedewerkers).toFixed(2) : '0'}`}
                      sub="Per medewerker per mnd" kleur="#8B5CF6" />
                    <StatKaart icon="🏢" label="ARPC" waarde={`€ ${totaalBedrijven > 0 ? Math.round(totalMRR / totaalBedrijven) : 0}`}
                      sub="Per bedrijf per mnd" kleur="#BA7517" />
                  </div>

                  {/* Plan verdeling */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { plan: 'starter', naam: 'Starter', prijs: 4, kleur: 'var(--text-2)', bg: 'var(--bg-subtle)' },
                      { plan: 'groei', naam: 'Groei', prijs: 7, kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                      { plan: 'enterprise', naam: 'Enterprise', prijs: 15, kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
                    ].map(plan => {
                      const aantalBedrijven = planVerdeling[plan.plan] ?? 0
                      const aantalMwd = bedrijven
                        .filter(b => (b.plan ?? 'groei') === plan.plan)
                        .reduce((s, b) => s + aantalPerBedrijf(b.id, 'medewerker'), 0)
                      const mrr = aantalMwd * plan.prijs
                      return (
                        <div key={plan.plan} className="bg-white rounded-2xl border border-gray-100 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold px-3 py-1 rounded-full"
                              style={{ background: plan.bg, color: plan.kleur }}>{plan.naam}</span>
                            <span className="text-xs text-gray-400">€ {plan.prijs}/pp/mnd</span>
                          </div>
                          <p className="text-3xl font-black mb-1" style={{ color: plan.kleur }}>
                            € {mrr.toLocaleString('nl-BE')}
                          </p>
                          <p className="text-xs text-gray-500">MRR</p>
                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-800">{aantalBedrijven}</p>
                              <p className="text-xs text-gray-400">bedrijven</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-800">{aantalMwd}</p>
                              <p className="text-xs text-gray-400">medewerkers</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Inkomsten per bedrijf */}
                  <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-800">Inkomsten per bedrijf</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[...bedrijven]
                        .sort((a, b) => mrrBedrijf(b) - mrrBedrijf(a))
                        .map(b => {
                          const mwd = aantalPerBedrijf(b.id, 'medewerker')
                          const mrr = mrrBedrijf(b)
                          const arr = mrr * 12
                          const plan = b.plan ?? 'groei'
                          return (
                            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{b.naam}</p>
                                <p className="text-xs text-gray-400">{mwd} medewerkers · {plan}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: 'var(--mf-green)' }}>€ {mrr}/mnd</p>
                                <p className="text-xs text-gray-400">€ {arr.toLocaleString('nl-BE')}/jaar</p>
                              </div>
                            </div>
                          )
                        })}
                      {bedrijven.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">Geen data beschikbaar.</div>
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
                  <h1 className="text-2xl font-bold text-gray-900">Bedrijven</h1>
                  <p className="text-sm text-gray-500 mt-1">{bedrijven.length} bedrijven actief op het platform.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 mb-5 p-4 flex gap-3">
                <input
                  type="text"
                  placeholder="Zoek op bedrijfsnaam..."
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="divide-y divide-gray-50">
                  {laden ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
                    </div>
                  ) : gefilterdeBedrijven.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">Geen resultaten gevonden.</div>
                  ) : gefilterdeBedrijven.map(b => {
                    const hrAantal = aantalPerBedrijf(b.id, 'hr')
                    const mwdAantal = aantalPerBedrijf(b.id, 'medewerker')
                    const ci = checkinsPerBedrijf(b.id)
                    const mrr = mrrBedrijf(b)
                    const isOpen = openBedrijf === b.id
                    const hrLeden = profielen.filter(p => p.bedrijf_id === b.id && p.rol === 'hr')
                    const plan = b.plan ?? 'groei'

                    return (
                      <div key={b.id}>
                        <button
                          onClick={() => setOpenBedrijf(isOpen ? null : b.id)}
                          className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: '#0a0f1e' }}>
                            {b.naam[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{b.naam}</p>
                            <p className="text-xs text-gray-400">
                              {mwdAantal} medewerkers · {hrAantal} HR · Aangemaakt {new Date(b.aangemaakt_op).toLocaleDateString('nl-BE')}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold" style={{ color: 'var(--mf-green)' }}>€ {mrr}/mnd</p>
                            <p className="text-xs text-gray-400">{ci} check-ins</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize ml-2"
                            style={{
                              background: plan === 'enterprise' ? 'var(--mf-purple-light)' : plan === 'groei' ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                              color: plan === 'enterprise' ? '#3C3489' : plan === 'groei' ? 'var(--mf-green-dark)' : 'var(--text-2)',
                            }}>
                            {plan}
                          </span>
                          <span className="text-gray-400 ml-2">{isOpen ? '↑' : '↓'}</span>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 border-t border-gray-50" style={{ background: 'var(--bg-subtle)' }}>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {[
                                { label: 'Medewerkers', waarde: mwdAantal, kleur: 'var(--mf-blue)' },
                                { label: 'HR-accounts', waarde: hrAantal, kleur: 'var(--mf-green)' },
                                { label: 'Totaal check-ins', waarde: ci, kleur: 'var(--mf-purple)' },
                              ].map(s => (
                                <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                  <p className="text-xl font-bold" style={{ color: s.kleur }}>{s.waarde}</p>
                                  <p className="text-xs text-gray-400">{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">HR-accounts</p>
                            {hrLeden.length === 0 ? (
                              <p className="text-xs text-gray-400">Geen HR-accounts gekoppeld.</p>
                            ) : hrLeden.map(p => (
                              <div key={p.id} className="flex items-center gap-2 py-1">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
                                  {(p.naam || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-600">{p.naam}</span>
                              </div>
                            ))}
                            <p className="text-xs text-gray-300 mt-3">ID: {b.id}</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
                <p className="text-sm text-gray-500 mt-1">{totaalGebruikers} gebruikers totaal.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-3xl font-black text-gray-900 mb-1">{totaalGebruikers}</p>
                  <p className="text-xs text-gray-500">Totaal</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-3xl font-black mb-1" style={{ color: 'var(--mf-green)' }}>{totaalMedewerkers}</p>
                  <p className="text-xs text-gray-500">Medewerkers</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-3xl font-black mb-1" style={{ color: 'var(--mf-blue)' }}>{totaalHR}</p>
                  <p className="text-xs text-gray-500">HR-accounts</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-4">
                <input
                  type="text"
                  placeholder="Zoek op naam..."
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="divide-y divide-gray-50">
                  {laden ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
                    </div>
                  ) : gefilterdGebruikers.slice(0, 50).map(p => {
                    const bedrijf = bedrijven.find(b => b.id === p.bedrijf_id)
                    const userCheckins = checkins.filter(c => c.user_id === p.id).length
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: p.rol === 'admin' ? 'var(--mf-purple-light)' : p.rol === 'hr' ? 'var(--mf-green-light)' : 'var(--mf-blue-light)',
                            color: p.rol === 'admin' ? '#3C3489' : p.rol === 'hr' ? 'var(--mf-green-dark)' : 'var(--mf-blue)',
                          }}>
                          {(p.naam || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.naam || 'Naamloos'}</p>
                          <p className="text-xs text-gray-400 truncate">{bedrijf?.naam ?? 'Geen bedrijf'}</p>
                        </div>
                        <p className="text-xs text-gray-400 hidden sm:block">{userCheckins} check-ins</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize ml-2"
                          style={{
                            background: p.rol === 'hr' ? 'var(--mf-green-light)' : p.rol === 'admin' ? 'var(--mf-purple-light)' : 'var(--mf-blue-light)',
                            color: p.rol === 'hr' ? 'var(--mf-green-dark)' : p.rol === 'admin' ? '#3C3489' : 'var(--mf-blue)',
                          }}>
                          {p.rol}
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
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Platform statistieken</h1>
                <p className="text-sm text-gray-500 mt-1">Activiteit en gezondheid van het platform.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatKaart icon="✅" label="Totaal check-ins" waarde={checkins.length}
                  sub="Alle tijden" kleur="#1D9E75" />
                <StatKaart icon="📅" label="Check-ins (7d)" waarde={checkinsDezeWeek}
                  sub={`${checkinsDezeWeekUniek} gebruikers`} kleur="#378ADD" />
                <StatKaart icon="📊" label="Gem. per bedrijf" waarde={totaalBedrijven > 0 ? Math.round(checkins.length / totaalBedrijven) : 0}
                  sub="Check-ins totaal" kleur="#8B5CF6" />
              </div>

              {/* Check-in activiteit per bedrijf */}
              <div className="bg-white rounded-2xl border border-gray-100 mb-5">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-800">Participatiegraad per bedrijf (7 dagen)</h2>
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
                          <p className="text-sm font-medium text-gray-700">{b.naam}</p>
                          <p className="text-sm font-bold" style={{ color: pct >= 70 ? 'var(--mf-green)' : pct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)' }}>
                            {pct}%
                          </p>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 70 ? 'var(--mf-green)' : pct >= 40 ? 'var(--mf-amber)' : 'var(--mf-red)',
                            }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{actiefDezeWeek.size}/{medewerkers.length} medewerkers actief</p>
                      </div>
                    )
                  })}
                  {bedrijven.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Geen data.</p>}
                </div>
              </div>
            </>
          )}

          {/* ── BEHEER ── */}
          {sectie === 'beheer' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Beheer</h1>
                <p className="text-sm text-gray-500 mt-1">Bedrijven aanmaken en HR-accounts instellen.</p>
              </div>

              {/* Nieuw bedrijf */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Nieuw bedrijf aanmaken</h2>
                <p className="text-xs text-gray-400 mb-4">Maak een nieuw klantbedrijf aan op het platform.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Bedrijfsnaam"
                    value={nieuwBedrijf}
                    onChange={e => setNieuwBedrijf(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && maakBedrijfAan()}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                  <select
                    value={nieuwPlan}
                    onChange={e => setNieuwPlan(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
                  >
                    <option value="starter">Starter (€4/pp)</option>
                    <option value="groei">Groei (€7/pp)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <button
                    onClick={maakBedrijfAan}
                    disabled={bezig || !nieuwBedrijf.trim()}
                    className="text-white rounded-xl px-6 py-3 text-sm font-semibold transition disabled:opacity-30"
                    style={{ background: 'var(--mentaforce-primary)' }}>
                    {bezig ? 'Bezig...' : 'Aanmaken'}
                  </button>
                </div>
              </div>

              {/* HR-account aanmaken */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">HR-account aanmaken</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Maak een HR-account aan voor een bestaand bedrijf. Het account is direct actief.
                </p>
                <div className="flex flex-col gap-3">
                  <select
                    value={hrForm.bedrijf_id}
                    onChange={e => setHrForm(prev => ({ ...prev, bedrijf_id: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
                  >
                    <option value="">Kies een bedrijf</option>
                    {bedrijven.map(b => <option key={b.id} value={b.id}>{b.naam}</option>)}
                  </select>
                  <input
                    type="email"
                    placeholder="E-mailadres HR-manager"
                    value={hrForm.email}
                    onChange={e => setHrForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                  <input
                    type="password"
                    placeholder="Tijdelijk wachtwoord"
                    value={hrForm.wachtwoord}
                    onChange={e => setHrForm(prev => ({ ...prev, wachtwoord: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={maakHRAan}
                    disabled={bezig || !hrForm.email || !hrForm.bedrijf_id || !hrForm.wachtwoord}
                    className="text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-30"
                    style={{ background: '#0a0f1e' }}>
                    {bezig ? 'Bezig...' : 'HR-account aanmaken'}
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

