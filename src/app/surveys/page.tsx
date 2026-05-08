'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Vraag = { id: string; tekst: string; type: 'schaal' | 'ja_nee' | 'tekst' }

type Survey = {
  id: string
  titel: string
  vragen: Vraag[]
  actief: boolean
  aangemaakt_op: string
  aangemaakt_door: string
}

type ResultatenMap = Record<string, {
  count: number
  schaalGems: Record<string, number>
  jaCount: Record<string, number>
  teksten: Record<string, string[]>
}>

// -- Survey templates --------------------------------------------------------

const TEMPLATES: { naam: string; emoji: string; beschrijving: string; kleur: string; vragen: Omit<Vraag, 'id'>[] }[] = [
  {
    naam: 'Pulse check',
    emoji: '???',
    kleur: '#1D9E75',
    beschrijving: '3 vragen · ±1 min · Ideaal wekelijks',
    vragen: [
      { tekst: 'Hoe voel je je vandaag op het werk?', type: 'schaal' },
      { tekst: 'Heb je voldoende energie voor je taken?', type: 'schaal' },
      { tekst: 'Is je werkdruk beheersbaar?', type: 'ja_nee' },
    ],
  },
  {
    naam: 'Stress & werkdruk',
    emoji: '??',
    kleur: '#E24B4A',
    beschrijving: '4 vragen · ±2 min · Maandelijks',
    vragen: [
      { tekst: 'Hoe hoog ervaar je de werkdruk momenteel?', type: 'schaal' },
      { tekst: 'Lukt het je om je werk af te krijgen binnen werktijd?', type: 'ja_nee' },
      { tekst: 'Heb je voldoende hersteltijd na het werk?', type: 'schaal' },
      { tekst: 'Wat zou jouw werkdruk verlagen?', type: 'tekst' },
    ],
  },
  {
    naam: 'Teamcultuur',
    emoji: '??',
    kleur: '#378ADD',
    beschrijving: '4 vragen · ±2 min · Kwartaal',
    vragen: [
      { tekst: 'Hoe prettig ervaar je de samenwerking in je team?', type: 'schaal' },
      { tekst: 'Voel je je gehoord door je leidinggevende?', type: 'schaal' },
      { tekst: 'Zou je ons bedrijf aanraden als werkgever?', type: 'ja_nee' },
      { tekst: 'Wat kan beter in onze teamcultuur?', type: 'tekst' },
    ],
  },
  {
    naam: 'Betrokkenheid',
    emoji: '??',
    kleur: '#8B5CF6',
    beschrijving: '4 vragen · ±2 min · Kwartaal',
    vragen: [
      { tekst: 'Hoe gemotiveerd ben je in je werk?', type: 'schaal' },
      { tekst: 'Voel je je verbonden met de doelen van het bedrijf?', type: 'schaal' },
      { tekst: 'Heb je voldoende ruimte voor persoonlijke groei?', type: 'schaal' },
      { tekst: 'Wat zou jouw betrokkenheid verhogen?', type: 'tekst' },
    ],
  },
  {
    naam: 'Leiderschap',
    emoji: '??',
    kleur: '#BA7517',
    beschrijving: '4 vragen · ±2 min · Extra anoniem',
    vragen: [
      { tekst: 'Geeft je leidinggevende duidelijk richting?', type: 'schaal' },
      { tekst: 'Voel je je gesteund door je leidinggevende?', type: 'schaal' },
      { tekst: 'Worden jouw ideeën serieus genomen?', type: 'schaal' },
      { tekst: 'Wat kan beter in het leiderschap binnen je team?', type: 'tekst' },
    ],
  },
]

function maakVragen(vragen: Omit<Vraag, 'id'>[]): Vraag[] {
  return vragen.map(v => ({ ...v, id: crypto.randomUUID() }))
}

// -- Transparantie-banner -----------------------------------------------------

function AnonimBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: '#B8D5F5', background: '#E6F1FB' }}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">??</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#185FA5' }}>Volledig anoniem</p>
            <p className="text-xs" style={{ color: '#2563EB' }}>Jouw naam wordt nooit gedeeld met HR of collega's</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
          style={{ color: '#185FA5', background: 'rgba(37,99,235,0.1)' }}
        >
          {open ? 'Verbergen' : 'Hoe werkt dit?'}
        </button>
      </div>
      {open && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: '#B8D5F5' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {[
              { icon: '?', titel: 'Wat HR ziet', tekst: 'Alleen groepsgemiddelden en percentages. Nooit individuele antwoorden.' },
              { icon: '?', titel: 'Wat HR niet ziet', tekst: 'Jouw naam, e-mail, of welke antwoorden van jou zijn.' },
              { icon: '???', titel: 'Kleine teams', tekst: 'Bij teams < 5 personen worden resultaten niet getoond om herleidbaarheid te voorkomen.' },
            ].map(item => (
              <div key={item.titel} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#185FA5' }}>{item.icon} {item.titel}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// -- HR form met templates ----------------------------------------------------

function NieuweSurveyForm({ bedrijfId, userId, onGemaakt }: {
  bedrijfId: string
  userId: string
  onGemaakt: () => void
}) {
  const [titel, setTitel] = useState('')
  const [vragen, setVragen] = useState<Vraag[]>([
    { id: crypto.randomUUID(), tekst: '', type: 'schaal' },
  ])
  const [bezig, setBezig] = useState(false)
  const [templateTab, setTemplateTab] = useState<'template' | 'zelf'>('template')

  function voegVraagToe() {
    setVragen(prev => [...prev, { id: crypto.randomUUID(), tekst: '', type: 'schaal' }])
  }

  function verwijderVraag(id: string) {
    setVragen(prev => prev.filter(v => v.id !== id))
  }

  function laadTemplate(tmpl: typeof TEMPLATES[0]) {
    setTitel(tmpl.naam)
    setVragen(maakVragen(tmpl.vragen))
    setTemplateTab('zelf')
  }

  async function maakAan() {
    if (!titel.trim() || vragen.some(v => !v.tekst.trim())) return
    setBezig(true)
    await supabase.from('pulse_surveys').insert({
      bedrijf_id: bedrijfId,
      aangemaakt_door: userId,
      titel: titel.trim(),
      vragen,
      actief: true,
    })
    setBezig(false)
    onGemaakt()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['template', 'zelf'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTemplateTab(t)}
            className="px-4 py-2 rounded-lg text-sm transition"
            style={{
              background: templateTab === t ? 'white' : 'transparent',
              color: templateTab === t ? '#111' : '#888',
              fontWeight: templateTab === t ? 500 : 400,
              boxShadow: templateTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t === 'template' ? '? Kies template' : '?? Zelf maken'}
          </button>
        ))}
      </div>

      {templateTab === 'template' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.naam}
              onClick={() => laadTemplate(tmpl)}
              className="text-left p-4 rounded-2xl border-2 transition hover:shadow-sm"
              style={{ borderColor: tmpl.kleur + '40', background: tmpl.kleur + '08' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{tmpl.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{tmpl.naam}</span>
              </div>
              <p className="text-xs text-gray-500">{tmpl.beschrijving}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tmpl.vragen.slice(0, 2).map((v, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 truncate max-w-[160px]">
                    {v.tekst.slice(0, 30)}{v.tekst.length > 30 ? '…' : ''}
                  </span>
                ))}
                {tmpl.vragen.length > 2 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400">
                    +{tmpl.vragen.length - 2} meer
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Titel van de survey"
            value={titel}
            onChange={e => setTitel(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 mb-4"
          />
          <div className="flex flex-col gap-3 mb-4">
            {vragen.map((v, i) => (
              <div key={v.id} className="flex gap-2 items-start">
                <span className="text-xs text-gray-400 mt-3 flex-shrink-0 w-4">{i + 1}.</span>
                <input
                  type="text"
                  placeholder="Vraag..."
                  value={v.tekst}
                  onChange={e => setVragen(prev => prev.map(q => q.id === v.id ? { ...q, tekst: e.target.value } : q))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
                <select
                  value={v.type}
                  onChange={e => setVragen(prev => prev.map(q => q.id === v.id ? { ...q, type: e.target.value as Vraag['type'] } : q))}
                  className="border border-gray-200 rounded-xl px-2 py-2.5 text-xs outline-none focus:border-gray-400 bg-white"
                >
                  <option value="schaal">1–5 schaal</option>
                  <option value="ja_nee">Ja / Nee</option>
                  <option value="tekst">Open tekst</option>
                </select>
                {vragen.length > 1 && (
                  <button onClick={() => verwijderVraag(v.id)} className="text-gray-300 hover:text-red-400 transition mt-2.5 text-xs">?</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <button onClick={voegVraagToe} className="text-xs text-gray-400 hover:text-gray-600 transition">+ Vraag toevoegen</button>
            <button
              onClick={maakAan}
              disabled={bezig || !titel.trim() || vragen.some(v => !v.tekst.trim())}
              className="px-5 py-2 rounded-xl text-sm text-white font-medium transition disabled:opacity-40"
              style={{ background: 'var(--MentaForce-primary)' }}
            >
              {bezig ? 'Aanmaken...' : 'Survey aanmaken'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// -- Schaalkleur helper -------------------------------------------------------

function schaalKleur(score: number) {
  if (score >= 4) return '#1D9E75'
  if (score >= 3) return '#BA7517'
  return '#E24B4A'
}

// -- Main pagina --------------------------------------------------------------

export default function SurveysPagina() {
  const router = useRouter()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [beantwoord, setBeantwoord] = useState<Set<string>>(new Set())
  const [resultaten, setResultaten] = useState<ResultatenMap>({})
  const [laden, setLaden] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [rol, setRol] = useState('')
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null)
  const [antwoorden, setAntwoorden] = useState<Record<string, number | string | boolean>>({})
  const [verzenden, setVerzenden] = useState(false)
  const [nieuwTonen, setNieuwTonen] = useState(false)
  const [tab, setTab] = useState<'actief' | 'resultaten'>('actief')
  const [verzondSuccess, setVerzondSuccess] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      if (!profiel?.bedrijf_id) { setLaden(false); return }
      setBedrijfId(profiel.bedrijf_id)
      setRol(profiel.rol)
      await laadSurveys(profiel.bedrijf_id, user.id, profiel.rol)
      setLaden(false)
    }
    laad()
  }, [router])

  async function laadSurveys(bid: string, uid: string, userRol: string) {
    const { data: sv } = await supabase
      .from('pulse_surveys')
      .select('id, titel, vragen, actief, aangemaakt_op, aangemaakt_door')
      .eq('bedrijf_id', bid)
      .order('aangemaakt_op', { ascending: false })
    setSurveys(sv || [])

    if (sv && sv.length > 0) {
      const { data: ant } = await supabase
        .from('survey_antwoorden')
        .select('survey_id')
        .eq('user_id', uid)
        .in('survey_id', sv.map((s: Survey) => s.id))
      setBeantwoord(new Set((ant || []).map((a: { survey_id: string }) => a.survey_id)))
    }

    if (userRol === 'hr' || userRol === 'admin') {
      const { data: alle } = await supabase
        .from('survey_antwoorden')
        .select('survey_id, antwoorden')
        .in('survey_id', (sv || []).map((s: Survey) => s.id))

      const res: ResultatenMap = {}
      for (const a of alle || []) {
        if (!res[a.survey_id]) res[a.survey_id] = { count: 0, schaalGems: {}, jaCount: {}, teksten: {} }
        res[a.survey_id].count++
        for (const [vraagId, waarde] of Object.entries(a.antwoorden)) {
          if (typeof waarde === 'number') {
            res[a.survey_id].schaalGems[vraagId] = (res[a.survey_id].schaalGems[vraagId] ?? 0) + (waarde as number)
          } else if (typeof waarde === 'boolean') {
            res[a.survey_id].jaCount[vraagId] = (res[a.survey_id].jaCount[vraagId] ?? 0) + (waarde ? 1 : 0)
          } else if (typeof waarde === 'string' && (waarde as string).trim()) {
            if (!res[a.survey_id].teksten[vraagId]) res[a.survey_id].teksten[vraagId] = []
            res[a.survey_id].teksten[vraagId].push(waarde as string)
          }
        }
      }
      for (const sid of Object.keys(res)) {
        for (const vId of Object.keys(res[sid].schaalGems)) {
          res[sid].schaalGems[vId] = Math.round((res[sid].schaalGems[vId] / res[sid].count) * 10) / 10
        }
      }
      setResultaten(res)
    }
  }

  async function verstuurAntwoord(surveyId: string) {
    if (!userId || !bedrijfId) return
    setVerzenden(true)
    await supabase.from('survey_antwoorden').insert({
      survey_id: surveyId,
      user_id: userId,
      antwoorden,
    })
    setBeantwoord(prev => new Set([...prev, surveyId]))
    setActiveSurveyId(null)
    setAntwoorden({})
    setVerzenden(false)
    setVerzondSuccess(true)
    setTimeout(() => setVerzondSuccess(false), 3000)
    await laadSurveys(bedrijfId, userId, rol)
  }

  async function toggleActief(surveyId: string, huidig: boolean) {
    await supabase.from('pulse_surveys').update({ actief: !huidig }).eq('id', surveyId)
    if (bedrijfId && userId) await laadSurveys(bedrijfId, userId, rol)
  }

  const isHR = rol === 'hr' || rol === 'admin'
  const activeSurvey = surveys.find(s => s.id === activeSurveyId)
  const actiefSurveys = surveys.filter(s => s.actief)
  const alleTabSurveys = tab === 'actief' ? actiefSurveys : surveys

  // Progress: how many questions answered
  const aantalBeantwoord = activeSurvey
    ? activeSurvey.vragen.filter(v => antwoorden[v.id] !== undefined).length
    : 0
  const voortgang = activeSurvey ? aantalBeantwoord / activeSurvey.vragen.length : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Surveys</h1>
            <p className="text-gray-500 text-sm mt-0.5">Anonieme peilingen over welzijn op het werk.</p>
          </div>
          {isHR && (
            <button
              onClick={() => setNieuwTonen(v => !v)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition"
              style={{ background: nieuwTonen ? '#6b7280' : 'var(--MentaForce-primary)' }}
            >
              {nieuwTonen ? '? Sluiten' : '+ Nieuwe survey'}
            </button>
          )}
        </div>

        {/* Anonimiteits-banner */}
        <AnonimBanner />

        {/* Success toast */}
        {verzondSuccess && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            ? Antwoord anoniem verstuurd
          </div>
        )}

        {/* HR: new survey form */}
        {isHR && nieuwTonen && bedrijfId && userId && (
          <NieuweSurveyForm
            bedrijfId={bedrijfId}
            userId={userId}
            onGemaakt={async () => {
              setNieuwTonen(false)
              if (bedrijfId && userId) await laadSurveys(bedrijfId, userId, rol)
            }}
          />
        )}

        {/* Survey answering form */}
        {activeSurvey && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${voortgang * 100}%`, background: 'var(--MentaForce-primary)' }}
              />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-base font-semibold text-gray-900">{activeSurvey.titel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{aantalBeantwoord}/{activeSurvey.vragen.length} vragen beantwoord</p>
                </div>
                <button
                  onClick={() => { setActiveSurveyId(null); setAntwoorden({}) }}
                  className="text-xs text-gray-400 hover:text-gray-600 p-1.5"
                >
                  ?
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {activeSurvey.vragen.map((v, idx) => (
                  <div key={v.id}>
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs font-semibold text-gray-400 mt-0.5 w-5 flex-shrink-0">{idx + 1}</span>
                      <p className="text-sm font-medium text-gray-800">{v.tekst}</p>
                    </div>
                    {v.type === 'schaal' && (
                      <div className="flex gap-2 pl-7">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setAntwoorden(prev => ({ ...prev, [v.id]: n }))}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition"
                            style={{
                              background: antwoorden[v.id] === n ? 'var(--MentaForce-primary)' : 'transparent',
                              borderColor: antwoorden[v.id] === n ? 'var(--MentaForce-primary)' : '#e5e7eb',
                              color: antwoorden[v.id] === n ? 'white' : '#374151',
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                    {v.type === 'ja_nee' && (
                      <div className="flex gap-3 pl-7">
                        {([true, false] as const).map(b => (
                          <button
                            key={String(b)}
                            onClick={() => setAntwoorden(prev => ({ ...prev, [v.id]: b }))}
                            className="flex-1 py-3 rounded-xl text-sm font-medium border-2 transition"
                            style={{
                              background: antwoorden[v.id] === b ? 'var(--MentaForce-primary)' : 'transparent',
                              borderColor: antwoorden[v.id] === b ? 'var(--MentaForce-primary)' : '#e5e7eb',
                              color: antwoorden[v.id] === b ? 'white' : '#374151',
                            }}
                          >
                            {b ? '? Ja' : '? Nee'}
                          </button>
                        ))}
                      </div>
                    )}
                    {v.type === 'tekst' && (
                      <textarea
                        rows={3}
                        value={(antwoorden[v.id] as string) ?? ''}
                        onChange={e => setAntwoorden(prev => ({ ...prev, [v.id]: e.target.value }))}
                        placeholder="Jouw antwoord (optioneel)..."
                        className="w-full ml-7 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
                        style={{ width: 'calc(100% - 1.75rem)' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => verstuurAntwoord(activeSurvey.id)}
                  disabled={
                    verzenden ||
                    activeSurvey.vragen.some(v => v.type !== 'tekst' && antwoorden[v.id] === undefined)
                  }
                  className="w-full py-3.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-40"
                  style={{ background: 'var(--MentaForce-primary)' }}
                >
                  {verzenden ? 'Versturen...' : '?? Verstuur anoniem'}
                </button>
                <p className="text-xs text-center text-gray-400">
                  Jouw naam wordt nooit gedeeld. Antwoorden zijn 100% anoniem.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HR tabs */}
        {isHR && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
            {(['actief', 'resultaten'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 rounded-lg text-sm transition"
                style={{
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#111' : '#888',
                  fontWeight: tab === t ? 500 : 400,
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'actief' ? 'Actieve surveys' : `Resultaten`}
              </button>
            ))}
          </div>
        )}

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin"
              style={{ borderTopColor: 'var(--MentaForce-primary)' }} />
          </div>
        ) : alleTabSurveys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-3xl mb-3">??</p>
            <p className="text-gray-500 text-sm">
              {isHR ? 'Nog geen surveys aangemaakt.' : 'Geen actieve surveys op dit moment.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {alleTabSurveys.map(s => {
              const res = resultaten[s.id]
              const alBeantwoord = beantwoord.has(s.id)
              const geschatteMinuten = Math.ceil(s.vragen.length / 3)

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{s.titel}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {s.vragen.length} vra{s.vragen.length !== 1 ? 'gen' : 'ag'}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">±{geschatteMinuten} min</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">
                            {new Date(s.aangemaakt_op).toLocaleDateString('nl-BE')}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: '#E6F1FB', color: '#185FA5' }}>
                            ?? Anoniem
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isHR && (
                          <button
                            onClick={() => toggleActief(s.id, s.actief)}
                            className="text-xs px-2.5 py-1 rounded-lg border transition"
                            style={{
                              background: s.actief ? '#E1F5EE' : '#F3F4F6',
                              borderColor: s.actief ? '#1D9E75' : '#e5e7eb',
                              color: s.actief ? '#0F6E56' : '#6b7280',
                            }}
                          >
                            {s.actief ? '? Actief' : '? Inactief'}
                          </button>
                        )}
                        {!isHR && s.actief && !alBeantwoord && (
                          <button
                            onClick={() => { setActiveSurveyId(s.id); setAntwoorden({}) }}
                            className="text-xs px-3.5 py-2 rounded-xl text-white font-medium transition"
                            style={{ background: 'var(--MentaForce-primary)' }}
                          >
                            Invullen
                          </button>
                        )}
                        {!isHR && alBeantwoord && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            ? Ingevuld
                          </span>
                        )}
                      </div>
                    </div>

                    {/* HR results */}
                    {isHR && tab === 'resultaten' && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        {!res ? (
                          <p className="text-xs text-gray-400">Nog geen antwoorden.</p>
                        ) : res.count < 3 ? (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                            <span>???</span>
                            <span>Resultaten worden verborgen totdat er minimaal 3 reacties zijn ({res.count}/3).</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-medium text-gray-500 mb-3">
                              {res.count} respons{res.count !== 1 ? 'en' : ''}
                            </p>
                            <div className="flex flex-col gap-4">
                              {s.vragen.map(v => (
                                <div key={v.id}>
                                  <p className="text-xs font-medium text-gray-700 mb-2">{v.tekst}</p>
                                  {v.type === 'schaal' && res.schaalGems[v.id] !== undefined && (
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all"
                                          style={{
                                            width: `${(res.schaalGems[v.id] / 5) * 100}%`,
                                            background: schaalKleur(res.schaalGems[v.id]),
                                          }}
                                        />
                                      </div>
                                      <span
                                        className="text-sm font-bold w-10 text-right"
                                        style={{ color: schaalKleur(res.schaalGems[v.id]) }}
                                      >
                                        {res.schaalGems[v.id]}/5
                                      </span>
                                    </div>
                                  )}
                                  {v.type === 'ja_nee' && res.jaCount[v.id] !== undefined && (
                                    <div className="flex items-center gap-3">
                                      <div className="flex gap-2 w-full">
                                        {[
                                          { label: 'Ja', count: res.jaCount[v.id], kleur: '#1D9E75', bg: '#E1F5EE' },
                                          { label: 'Nee', count: res.count - res.jaCount[v.id], kleur: '#E24B4A', bg: '#FCEBEB' },
                                        ].map(item => (
                                          <div key={item.label} className="flex-1 rounded-xl p-2.5 text-center"
                                            style={{ background: item.bg }}>
                                            <p className="text-lg font-bold" style={{ color: item.kleur }}>{item.count}</p>
                                            <p className="text-xs" style={{ color: item.kleur }}>{item.label}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {v.type === 'tekst' && res.teksten[v.id] && (
                                    <div className="flex flex-col gap-1.5">
                                      {res.teksten[v.id].slice(0, 4).map((t, i) => (
                                        <p key={i} className="text-xs text-gray-600 italic bg-gray-50 px-3 py-2 rounded-lg">
                                          "{t}"
                                        </p>
                                      ))}
                                      {res.teksten[v.id].length > 4 && (
                                        <p className="text-xs text-gray-400">+{res.teksten[v.id].length - 4} meer reacties</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state employee */}
        {!isHR && actiefSurveys.length === 0 && !laden && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center mt-4">
            <p className="text-3xl mb-3">??</p>
            <p className="text-gray-500 text-sm">Geen actieve surveys op dit moment.</p>
            <p className="text-gray-400 text-xs mt-1">Je HR-team stuurt surveys wanneer ze inzichten nodig hebben.</p>
          </div>
        )}

      </main>
    </div>
  )
}
