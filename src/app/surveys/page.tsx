'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

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

const TEMPLATES: { naam: string; kleur: string; beschrijving: string; vragen: Omit<Vraag, 'id'>[] }[] = [
  {
    naam: 'Pulse check',
    kleur: 'var(--mf-green)',
    beschrijving: '3 vragen · ±1 min · Ideaal wekelijks',
    vragen: [
      { tekst: 'Hoe voel je je vandaag op het werk?', type: 'schaal' },
      { tekst: 'Heb je voldoende energie voor je taken?', type: 'schaal' },
      { tekst: 'Is je werkdruk beheersbaar?', type: 'ja_nee' },
    ],
  },
  {
    naam: 'Stress & werkdruk',
    kleur: 'var(--mf-red)',
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
    kleur: 'var(--mf-blue)',
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
    kleur: 'var(--mf-purple)',
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
    kleur: 'var(--mf-amber)',
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
    <div style={{ borderRadius: 16, border: '1px solid rgba(55,138,221,0.35)', background: 'var(--mf-blue-light)', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mf-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-blue)' }}>Volledig anoniem</p>
            <p style={{ fontSize: 12, color: 'var(--mf-blue-mid)' }}>Jouw naam wordt nooit gedeeld met HR of collega&apos;s</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 8, color: 'var(--mf-blue)', background: 'rgba(55,138,221,0.12)', border: 'none', cursor: 'pointer' }}
        >
          {open ? 'Verbergen' : 'Hoe werkt dit?'}
        </button>
      </div>
      {open && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(55,138,221,0.25)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
            {[
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mf-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
                titel: 'Wat HR ziet',
                tekst: 'Alleen groepsgemiddelden en percentages. Nooit individuele antwoorden.',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mf-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
                titel: 'Wat HR niet ziet',
                tekst: 'Jouw naam, e-mail, of welke antwoorden van jou zijn.',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mf-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                titel: 'Kleine teams',
                tekst: 'Bij teams < 5 personen worden resultaten niet getoond om herleidbaarheid te voorkomen.',
              },
            ].map(item => (
              <div key={item.titel} style={{ borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.6)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--mf-blue)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {item.icon} {item.titel}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{item.tekst}</p>
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
    <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {(['template', 'zelf'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTemplateTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
              background: templateTab === t ? 'white' : 'transparent',
              color: templateTab === t ? 'var(--text-1)' : 'var(--text-3)',
              fontWeight: templateTab === t ? 600 : 400,
              boxShadow: templateTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t === 'template' ? 'Kies template' : 'Zelf maken'}
          </button>
        ))}
      </div>

      {templateTab === 'template' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.naam}
              onClick={() => laadTemplate(tmpl)}
              style={{
                textAlign: 'left', padding: 16, borderRadius: 16,
                border: `2px solid ${tmpl.kleur}40`, background: `${tmpl.kleur}08`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: tmpl.kleur, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{tmpl.naam}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{tmpl.beschrijving}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tmpl.vragen.slice(0, 2).map((v, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.tekst.slice(0, 30)}{v.tekst.length > 30 ? '...' : ''}
                  </span>
                ))}
                {tmpl.vragen.length > 2 && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
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
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {vragen.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0, width: 18 }}>{i + 1}.</span>
                <input
                  type="text"
                  placeholder="Vraag..."
                  value={v.tekst}
                  onChange={e => setVragen(prev => prev.map(q => q.id === v.id ? { ...q, tekst: e.target.value } : q))}
                  style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none' }}
                />
                <select
                  value={v.type}
                  onChange={e => setVragen(prev => prev.map(q => q.id === v.id ? { ...q, type: e.target.value as Vraag['type'] } : q))}
                  style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '9px 8px', fontSize: 12, outline: 'none', background: 'var(--bg-card)' }}
                >
                  <option value="schaal">1-5 schaal</option>
                  <option value="ja_nee">Ja / Nee</option>
                  <option value="tekst">Open tekst</option>
                </select>
                {vragen.length > 1 && (
                  <button
                    onClick={() => verwijderVraag(v.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={voegVraagToe} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Vraag toevoegen</button>
            <button
              onClick={maakAan}
              disabled={bezig || !titel.trim() || vragen.some(v => !v.tekst.trim())}
              style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--mf-green)', opacity: (bezig || !titel.trim() || vragen.some(v => !v.tekst.trim())) ? 0.4 : 1 }}
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
  if (score >= 4) return 'var(--mf-green)'
  if (score >= 3) return 'var(--mf-amber)'
  return 'var(--mf-red)'
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

  const aantalBeantwoord = activeSurvey
    ? activeSurvey.vragen.filter(v => antwoorden[v.id] !== undefined).length
    : 0
  const voortgang = activeSurvey ? aantalBeantwoord / activeSurvey.vragen.length : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 2 }}>Surveys</h1>
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Anonieme peilingen over welzijn op het werk.</p>
          </div>
          {isHR && (
            <button
              onClick={() => setNieuwTonen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: nieuwTonen ? 'var(--text-3)' : 'var(--mf-green)', color: 'white',
                borderRadius: 12, padding: '10px 18px',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              {nieuwTonen ? 'Sluiten' : '+ Nieuwe survey'}
            </button>
          )}
        </div>

        {/* Anonimiteits-banner */}
        <AnonimBanner />

        {/* Success toast */}
        {verzondSuccess && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            background: 'var(--text-1)', color: 'white', fontSize: 13, padding: '12px 20px',
            borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--mf-green)' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Antwoord anoniem verstuurd
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
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--bg-subtle)' }}>
              <div style={{ height: '100%', width: `${voortgang * 100}%`, background: 'var(--mf-green)', transition: 'width 0.3s' }} />
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{activeSurvey.titel}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{aantalBeantwoord}/{activeSurvey.vragen.length} vragen beantwoord</p>
                </div>
                <button
                  onClick={() => { setActiveSurveyId(null); setAntwoorden({}) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeSurvey.vragen.map((v, idx) => (
                  <div key={v.id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginTop: 2, width: 20, flexShrink: 0 }}>{idx + 1}</span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{v.tekst}</p>
                    </div>
                    {v.type === 'schaal' && (
                      <div style={{ display: 'flex', gap: 8, paddingLeft: 28 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setAntwoorden(prev => ({ ...prev, [v.id]: n }))}
                            style={{
                              flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                              border: `2px solid ${antwoorden[v.id] === n ? 'var(--mf-green)' : 'var(--border)'}`,
                              background: antwoorden[v.id] === n ? 'var(--mf-green)' : 'transparent',
                              color: antwoorden[v.id] === n ? 'white' : 'var(--text-2)',
                              cursor: 'pointer',
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                    {v.type === 'ja_nee' && (
                      <div style={{ display: 'flex', gap: 12, paddingLeft: 28 }}>
                        {([true, false] as const).map(b => (
                          <button
                            key={String(b)}
                            onClick={() => setAntwoorden(prev => ({ ...prev, [v.id]: b }))}
                            style={{
                              flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
                              border: `2px solid ${antwoorden[v.id] === b ? 'var(--mf-green)' : 'var(--border)'}`,
                              background: antwoorden[v.id] === b ? 'var(--mf-green)' : 'transparent',
                              color: antwoorden[v.id] === b ? 'white' : 'var(--text-2)',
                              cursor: 'pointer',
                            }}
                          >
                            {b ? 'Ja' : 'Nee'}
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
                        style={{ width: 'calc(100% - 28px)', marginLeft: 28, border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => verstuurAntwoord(activeSurvey.id)}
                  disabled={verzenden || activeSurvey.vragen.some(v => v.type !== 'tekst' && antwoorden[v.id] === undefined)}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    color: 'white', border: 'none', cursor: 'pointer', background: 'var(--mf-green)',
                    opacity: (verzenden || activeSurvey.vragen.some(v => v.type !== 'tekst' && antwoorden[v.id] === undefined)) ? 0.4 : 1,
                  }}
                >
                  {verzenden ? 'Versturen...' : 'Verstuur anoniem'}
                </button>
                <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-3)', marginTop: 8 }}>
                  Jouw naam wordt nooit gedeeld. Antwoorden zijn 100% anoniem.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HR tabs */}
        {isHR && (
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 16 }}>
            {(['actief', 'resultaten'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                  fontWeight: tab === t ? 600 : 400,
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'actief' ? 'Actieve surveys' : 'Resultaten'}
              </button>
            ))}
          </div>
        )}

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="mf-spinner" />
          </div>
        ) : alleTabSurveys.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '56px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Geen surveys</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {isHR ? 'Nog geen surveys aangemaakt.' : 'Geen actieve surveys op dit moment.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alleTabSurveys.map(s => {
              const res = resultaten[s.id]
              const alBeantwoord = beantwoord.has(s.id)
              const geschatteMinuten = Math.ceil(s.vragen.length / 3)

              return (
                <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{s.titel}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            {s.vragen.length} vra{s.vragen.length !== 1 ? 'gen' : 'ag'}
                          </span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>±{geschatteMinuten} min</span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            {new Date(s.aangemaakt_op).toLocaleDateString('nl-BE')}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'var(--mf-blue-light)', color: 'var(--mf-blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Anoniem
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {isHR && (
                          <button
                            onClick={() => toggleActief(s.id, s.actief)}
                            style={{
                              fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                              background: s.actief ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                              borderColor: s.actief ? 'var(--mf-green)' : 'var(--border)',
                              color: s.actief ? 'var(--mf-green-dark)' : 'var(--text-2)',
                            }}
                          >
                            {s.actief ? 'Actief' : 'Inactief'}
                          </button>
                        )}
                        {!isHR && s.actief && !alBeantwoord && (
                          <button
                            onClick={() => { setActiveSurveyId(s.id); setAntwoorden({}) }}
                            style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--mf-green)' }}
                          >
                            Invullen
                          </button>
                        )}
                        {!isHR && alBeantwoord && (
                          <span style={{ fontSize: 12, color: 'var(--mf-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Ingevuld
                          </span>
                        )}
                      </div>
                    </div>

                    {/* HR results */}
                    {isHR && tab === 'resultaten' && (
                      <div style={{ borderTop: '1px solid var(--bg-subtle)', paddingTop: 16, marginTop: 16 }}>
                        {!res ? (
                          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Nog geen antwoorden.</p>
                        ) : res.count < 3 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--mf-amber-dark)', background: 'var(--mf-amber-light)', padding: '10px 14px', borderRadius: 10 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Resultaten worden verborgen totdat er minimaal 3 reacties zijn ({res.count}/3).
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12 }}>
                              {res.count} respons{res.count !== 1 ? 'en' : ''}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {s.vragen.map(v => (
                                <div key={v.id}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>{v.tekst}</p>
                                  {v.type === 'schaal' && res.schaalGems[v.id] !== undefined && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ flex: 1, height: 8, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 100, width: `${(res.schaalGems[v.id] / 5) * 100}%`, background: schaalKleur(res.schaalGems[v.id]), transition: 'width 0.6s ease' }} />
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: schaalKleur(res.schaalGems[v.id]), width: 40, textAlign: 'right' }}>
                                        {res.schaalGems[v.id]}/5
                                      </span>
                                    </div>
                                  )}
                                  {v.type === 'ja_nee' && res.jaCount[v.id] !== undefined && (
                                    <div style={{ display: 'flex', gap: 10 }}>
                                      {[
                                        { label: 'Ja', count: res.jaCount[v.id], kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
                                        { label: 'Nee', count: res.count - res.jaCount[v.id], kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)' },
                                      ].map(item => (
                                        <div key={item.label} style={{ flex: 1, borderRadius: 12, padding: '10px 0', textAlign: 'center', background: item.bg }}>
                                          <p style={{ fontSize: 18, fontWeight: 800, color: item.kleur }}>{item.count}</p>
                                          <p style={{ fontSize: 11, color: item.kleur }}>{item.label}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {v.type === 'tekst' && res.teksten[v.id] && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {res.teksten[v.id].slice(0, 4).map((t, i) => (
                                        <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 8 }}>
                                          &ldquo;{t}&rdquo;
                                        </p>
                                      ))}
                                      {res.teksten[v.id].length > 4 && (
                                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>+{res.teksten[v.id].length - 4} meer reacties</p>
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
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '56px 40px', textAlign: 'center', marginTop: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Geen actieve surveys</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 2 }}>Geen actieve surveys op dit moment.</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Je HR-team stuurt surveys wanneer ze inzichten nodig hebben.</p>
          </div>
        )}

      </main>
    </div>
  )
}
