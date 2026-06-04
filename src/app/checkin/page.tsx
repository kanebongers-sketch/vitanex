'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import { vandaag } from '@/lib/weekdoelen'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Vraag {
  code:       string
  label:      string
  type:       'schaal' | 'tekst'
  min?:       string
  max?:       string
  verplicht:  boolean
  placeholder?: string
}

interface Sectie {
  id:     string
  label:  string
  kleur:  string
  licht:  string
  vragen: Vraag[]
}

// ─── 6 vaste domeinen, elk 4 schaalvragen + 1 tekstvraag ──────────────────

const SECTIES: Sectie[] = [
  {
    id: 'slaap', label: 'Slaap', kleur: '#8B5CF6', licht: '#F5F3FF',
    vragen: [
      { code: 'slaap_kwaliteit', type: 'schaal', verplicht: true, min: 'Zeer slecht',       max: 'Uitstekend',     label: 'Hoe heb je deze week geslapen?' },
      { code: 'slaap_uren',      type: 'schaal', verplicht: true, min: 'Minder dan 5 uur',  max: '8 uur of meer',  label: 'Hoeveel uur sliep je gemiddeld per nacht?' },
      { code: 'slaap_fris',      type: 'schaal', verplicht: true, min: 'Volledig uitgeput', max: 'Fris en energiek', label: 'Hoe uitgerust voelde je je bij het opstaan?' },
      { code: 'slaap_loslaten',  type: 'schaal', verplicht: true, min: 'Nauwelijks',        max: 'Volledig',       label: "Lukte het om 's avonds echt los te laten van je werk?" },
      { code: 'slaap_tekst',     type: 'tekst',  verplicht: false, label: 'Wat belemmert je slaap of rust? (optioneel)', placeholder: 'Bijv. stress, piekeren, te laat naar bed...' },
    ],
  },
  {
    id: 'stress', label: 'Stress', kleur: '#E24B4A', licht: '#FFF5F5',
    vragen: [
      { code: 'stress_niveau',      type: 'schaal', verplicht: true, min: 'Extreem gestrest', max: 'Volledig ontspannen', label: 'Hoe stressvrij voelde je je deze week?' },
      { code: 'stress_piekeren',    type: 'schaal', verplicht: true, min: 'Voortdurend',       max: 'Helemaal niet',      label: 'In welke mate piekerde je over je werk?' },
      { code: 'stress_controle',    type: 'schaal', verplicht: true, min: 'Geen controle',     max: 'Volledig in controle', label: 'Had je het gevoel controle te hebben over je dag?' },
      { code: 'stress_ontspanning', type: 'schaal', verplicht: true, min: 'Nauwelijks',        max: 'Volledig',           label: 'Lukte het je om te ontspannen buiten werktijd?' },
      { code: 'stress_tekst',       type: 'tekst',  verplicht: false, label: 'Wat veroorzaakt de meeste stress voor jou? (optioneel)', placeholder: 'Bijv. werkdruk, privé, onzekerheid...' },
    ],
  },
  {
    id: 'energie', label: 'Energie', kleur: '#BA7517', licht: '#FFFBEB',
    vragen: [
      { code: 'energie_niveau',    type: 'schaal', verplicht: true, min: 'Uitgeput',        max: 'Vol energie',   label: 'Hoe was je energieniveau deze week?' },
      { code: 'energie_beweging',  type: 'schaal', verplicht: true, min: 'Totaal inactief', max: 'Zeer actief',   label: 'Hoe actief was je buiten het werk (sport, wandelen)?' },
      { code: 'energie_voeding',   type: 'schaal', verplicht: true, min: 'Ongezond',        max: 'Zeer gezond',   label: 'Hoe gezond was je eet- en drinkpatroon?' },
      { code: 'energie_dip',       type: 'schaal', verplicht: true, min: 'Ernstige dip',    max: 'Geen dip',      label: 'Had je last van een middagdip of energiedaling?' },
      { code: 'energie_tekst',     type: 'tekst',  verplicht: false, label: 'Wat kost je het meest energie? (optioneel)', placeholder: 'Bijv. vergaderingen, slechte nacht, te weinig beweging...' },
    ],
  },
  {
    id: 'focus', label: 'Focus', kleur: '#1D9E75', licht: '#F0FDF4',
    vragen: [
      { code: 'focus_concentratie', type: 'schaal', verplicht: true, min: 'Totaal niet',       max: 'Uitstekend',        label: 'Hoe goed kon je je concentreren op je werk?' },
      { code: 'focus_helderheid',   type: 'schaal', verplicht: true, min: 'Wazig en traag',     max: 'Scherp en helder',  label: 'Hoe helder was je hoofd — kon je snel beslissingen nemen?' },
      { code: 'focus_aanwezig',     type: 'schaal', verplicht: true, min: 'Continu afgeleid',   max: 'Volledig aanwezig', label: 'In welke mate was je echt aanwezig en niet afgeleid?' },
      { code: 'focus_flow',         type: 'schaal', verplicht: true, min: 'Geen enkele keer',   max: 'Veelvuldig',        label: "Had je momenten van 'flow' — volledig opgaan in je werk?" },
      { code: 'focus_tekst',        type: 'tekst',  verplicht: false, label: 'Wat leidt je het meeste af? (optioneel)', placeholder: 'Bijv. telefoon, open kantoor, meldingen...' },
    ],
  },
  {
    id: 'balans', label: 'Werk-privé balans', kleur: '#378ADD', licht: '#EFF6FF',
    vragen: [
      { code: 'balans_werk_prive', type: 'schaal', verplicht: true, min: 'Helemaal niet',  max: 'Perfecte balans',      label: 'Ervaarde je een goede balans tussen werk en privéleven?' },
      { code: 'balans_grenzen',    type: 'schaal', verplicht: true, min: 'Nauwelijks',     max: 'Uitstekend',           label: "Hoe goed kon je grenzen stellen en 'nee' zeggen?" },
      { code: 'balans_tijd',       type: 'schaal', verplicht: true, min: 'Lukt niet',      max: 'Volledig',             label: 'Hoe goed kon je werk en privé tijdelijk loskoppelen?' },
      { code: 'balans_herstel',    type: 'schaal', verplicht: true, min: 'Nauwelijks',     max: 'Meer dan genoeg',      label: 'Had je voldoende tijd en ruimte voor herstel na het werk?' },
      { code: 'balans_tekst',      type: 'tekst',  verplicht: false, label: 'Wat maakt het moeilijk om af te schakelen? (optioneel)', placeholder: 'Bijv. e-mails na werktijd, thuiswerk, etc...' },
    ],
  },
  {
    id: 'motivatie', label: 'Motivatie', kleur: '#9D174D', licht: '#FDF2F8',
    vragen: [
      { code: 'motivatie_werk',         type: 'schaal', verplicht: true, min: 'Helemaal niet', max: 'Zeer gemotiveerd',  label: 'Hoe gemotiveerd was je om je werk goed te doen?' },
      { code: 'motivatie_zinvol',       type: 'schaal', verplicht: true, min: 'Zinloos',        max: 'Zeer zinvol',      label: 'In welke mate vond je je werk zinvol en betekenisvol?' },
      { code: 'motivatie_enthousiasme', type: 'schaal', verplicht: true, min: 'Met tegenzin',   max: 'Erg enthousiast',  label: 'Hoe enthousiast en energiek ging je naar je werk?' },
      { code: 'motivatie_waardering',   type: 'schaal', verplicht: true, min: 'Helemaal niet',  max: 'Volledig',         label: 'Voelde je je gewaardeerd voor je inzet?' },
      { code: 'motivatie_tekst',        type: 'tekst',  verplicht: false, label: 'Wat geeft jou de meeste voldoening in je werk? (optioneel)', placeholder: 'Bijv. samenwerken, resultaat zien, leren...' },
    ],
  },
]

// ─── Domein → scale-vraag codes (voor score berekening) ──────────────────

const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_uren', 'slaap_fris', 'slaap_loslaten'],
  stress:   ['stress_niveau',   'stress_piekeren', 'stress_controle', 'stress_ontspanning'],
  energie:  ['energie_niveau',  'energie_beweging', 'energie_voeding', 'energie_dip'],
  focus:    ['focus_concentratie', 'focus_helderheid', 'focus_aanwezig', 'focus_flow'],
  balans:   ['balans_werk_prive', 'balans_grenzen', 'balans_tijd', 'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol', 'motivatie_enthousiasme', 'motivatie_waardering'],
}

// ─── Auto-tekst antwoorden per domein ────────────────────────────────────

const AUTO_TEKST: Record<string, string[]> = {
  slaap:    ['Ik slaap redelijk, maar kan er altijd op letten dat ik eerder naar bed ga.', 'Soms wat veel op mijn hoofd voor het slapen.', 'Over het algemeen goed, af en toe wakker worden.'],
  stress:   ['Drukke week maar hanteerbaar.', 'Wat meer werkdruk dan normaal, maar under control.', 'Een normale week zonder grote uitschieters.'],
  energie:  ['Normaal energieniveau, na de lunch soms een dipje.', 'Redelijk energiek, zou meer kunnen bewegen.', 'Goed gevoel, sport helpt om energie op peil te houden.'],
  focus:    ['Af en toe afgeleid door meldingen, maar over het algemeen goed.', 'Productieve week, goed kunnen focussen op prioriteiten.', 'Soms moeite om aan te komen door vergaderingen.'],
  balans:   ["Kan soms moeilijk loskomen van werk 's avonds.", 'Goede week voor werk-privé balans, op tijd gestopt.', 'Zou meer pauzes kunnen nemen overdag.'],
  motivatie:['Werk is zinvol en ik voel waardering van het team.', 'Gedreven week, duidelijke doelen geholpen.', 'Positief gevoel over mijn bijdrage deze week.'],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CheckIn() {
  const router   = useRouter()
  const topRef   = useRef<HTMLDivElement>(null)

  const [userId,          setUserId]         = useState<string | null>(null)
  const [bedrijfId,       setBedrijfId]      = useState<string | null>(null)
  const [checkend,        setCheckend]       = useState(true)
  const [alIngevuld,      setAlIngevuld]     = useState(false)
  const [sessieId,        setSessieId]       = useState<string | null>(null)
  const [kanOpnieuw,      setKanOpnieuw]     = useState(false)
  const [volgendeCheckin, setVolgendeCheckin]= useState('')

  const [sectieIdx,  setSectieIdx]  = useState(0)
  const [antwoorden, setAntwoorden] = useState<Record<string, number | string>>({})
  const [laden,      setLaden]      = useState(false)
  const [fout,       setFout]       = useState<string | null>(null)

  const weekStart = vandaag()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      // Check for any check-in in the last 7 days
      const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: sessie } = await supabase
        .from('checkin_sessies')
        .select('id, aangemaakt_op')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zevenDagenGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessie) {
        setAlIngevuld(true)
        setSessieId(sessie.id)
        const uren = (Date.now() - new Date(sessie.aangemaakt_op).getTime()) / 3600000
        setKanOpnieuw(uren < 4)
        const volgende = new Date(sessie.aangemaakt_op)
        volgende.setDate(volgende.getDate() + 7)
        setVolgendeCheckin(volgende.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))
      }

      setCheckend(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function verwijderSessie() {
    if (!sessieId) return
    setLaden(true)
    await authFetch('/api/reset-sessie', {
      method: 'POST',
      body: JSON.stringify({ sessie_id: sessieId }),
    })
    setAlIngevuld(false)
    setSessieId(null)
    setSectieIdx(0)
    setAntwoorden({})
    setLaden(false)
  }

  const huidigeSectie = SECTIES[sectieIdx]
  const totaalSecties = SECTIES.length

  function sectieCompleet(idx: number) {
    return SECTIES[idx].vragen
      .filter(v => v.verplicht && v.type === 'schaal')
      .every(v => antwoorden[v.code] !== undefined)
  }

  function stelIn(code: string, waarde: number | string) {
    setAntwoorden(prev => ({ ...prev, [code]: waarde }))
  }

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function vulAutomatischIn() {
    const auto: Record<string, number | string> = {}
    for (const sectie of SECTIES) {
      for (const vraag of sectie.vragen) {
        if (vraag.type === 'schaal') {
          // Realistische scores: 3-5 (matig tot goed)
          auto[vraag.code] = Math.floor(Math.random() * 3) + 3
        } else if (vraag.type === 'tekst') {
          // Automatisch een realistisch tekst-antwoord kiezen
          auto[vraag.code] = pickRandom(AUTO_TEKST[sectie.id] ?? ['Geen bijzondere opmerkingen.'])
        }
      }
    }
    setAntwoorden(auto)
    setSectieIdx(SECTIES.length - 1)
    scrollTop()
  }

  function volgendeSectie() {
    if (!sectieCompleet(sectieIdx)) return
    setFout(null)
    if (sectieIdx < totaalSecties - 1) {
      setSectieIdx(s => s + 1)
      scrollTop()
    } else {
      submit()
    }
  }

  function vorigeSectie() {
    setSectieIdx(s => Math.max(0, s - 1))
    scrollTop()
  }

  async function submit() {
    if (!userId) return
    setLaden(true)
    setFout(null)

    try {
      // Bouw rijen op voor de API
      const rijen = Object.entries(antwoorden)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([code, waarde]) => {
          const sectieObj = SECTIES.find(s => s.vragen.some(v => v.code === code))
          return {
            vraag_code:   code,
            categorie:    sectieObj?.id ?? null,
            waarde_schaal: typeof waarde === 'number' ? waarde : null,
            waarde_tekst:  typeof waarde === 'string' && waarde.trim() ? waarde.trim() : null,
          }
        })

      const res  = await authFetch('/api/submit-checkin', {
        method: 'POST',
        body: JSON.stringify({ bedrijf_id: bedrijfId, week_start: weekStart, rijen }),
      })
      const data = await res.json()

      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)

      const nieuwSessieId = data.sessie_id

      // Bereken domeinscores (som van 4 schaalvragen, range 4-20)
      const vlakScores: Record<string, number> = {}
      for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
        const som = codes.reduce((acc, code) => {
          const w = antwoorden[code]
          return acc + (typeof w === 'number' ? w : 0)
        }, 0)
        vlakScores[domein] = som
      }

      const params = new URLSearchParams({
        slaap:    String(vlakScores.slaap),
        stress:   String(vlakScores.stress),
        energie:  String(vlakScores.energie),
        focus:    String(vlakScores.focus),
        balans:   String(vlakScores.balans),
        motivatie:String(vlakScores.motivatie),
        sid:      nieuwSessieId ?? '',
      })
      router.push(`/doelkeuze?${params.toString()}`)
    } catch (err) {
      console.error('[checkin submit]', err)
      setFout(`Opslaan mislukt: ${err instanceof Error ? err.message : String(err)}`)
      setLaden(false)
    }
  }

  // Voortgang
  const beantwoord   = SECTIES.slice(0, sectieIdx).reduce((sum, s) => sum + s.vragen.filter(v => v.type === 'schaal').length, 0)
  const totaalSchaal = SECTIES.reduce((sum, s) => sum + s.vragen.filter(v => v.type === 'schaal').length, 0)
  const voortgangPct = Math.round((beantwoord / totaalSchaal) * 100)

  // ── Laadscherm ─────────────────────────────────────────────────────────────

  if (checkend) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
        style={{ borderTopColor: '#1D9E75' }} />
    </main>
  )

  // ── Al ingevuld ────────────────────────────────────────────────────────────

  if (alIngevuld) return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E1F5EE' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Al ingevuld deze week</h2>
        <p className="text-gray-500 text-sm mb-2 leading-relaxed">Je check-in is ontvangen. Bedankt!</p>
        <p className="text-xs text-gray-400 mb-6">
          Volgende check-in: <span className="font-medium text-gray-600">{volgendeCheckin}</span>
        </p>

        {kanOpnieuw && (
          <div className="rounded-xl p-4 mb-4 text-left"
            style={{ background: '#FAEEDA', borderLeft: '3px solid #BA7517' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#854F0B' }}>Wil je je antwoorden aanpassen?</p>
            <p className="text-xs mb-3" style={{ color: '#854F0B' }}>Je kan opnieuw invullen binnen 4 uur na het indienen.</p>
            <button onClick={verwijderSessie} disabled={laden}
              className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: '#854F0B', color: 'white' }}>
              {laden ? 'Bezig...' : 'Opnieuw invullen'}
            </button>
          </div>
        )}

        {/* Testmodus */}
        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#F3F4F6', borderLeft: '3px solid #9ca3af' }}>
          <p className="text-xs font-medium mb-1 text-gray-500">Testmodus</p>
          <p className="text-xs mb-3 text-gray-400">Bypass de wekelijkse limiet en vul opnieuw in.</p>
          <button onClick={verwijderSessie} disabled={laden}
            className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: '#6b7280', color: 'white' }}>
            {laden ? 'Bezig...' : 'Opnieuw invullen (test)'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/home" className="w-full inline-block text-center text-white rounded-xl py-3 text-sm font-medium"
            style={{ background: '#1D9E75' }}>Naar dashboard</Link>
          <Link href="/bedankt" className="w-full inline-block text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition">
            Bekijk laatste analyse</Link>
        </div>
      </div>
    </main>
  )

  // ── Formulier ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(160deg, #F0FAF6 0%, #EBF4FB 50%, #F5F3FF 100%)' }}>

      {/* Sticky header */}
      <div ref={topRef} className="sticky top-0 z-20 border-b"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#e5e7eb' }}>
        <div className="max-w-2xl mx-auto px-5 py-3">

          {/* Sectie pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2.5" style={{ scrollbarWidth: 'none' }}>
            {SECTIES.map((s, i) => {
              const klaar  = i < sectieIdx
              const actief = i === sectieIdx
              return (
                <button key={s.id}
                  onClick={() => i < sectieIdx && setSectieIdx(i)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: actief ? s.kleur : klaar ? s.kleur + '20' : '#F3F4F6',
                    color:      actief ? 'white'  : klaar ? s.kleur        : '#9ca3af',
                    cursor:     i < sectieIdx ? 'pointer' : 'default',
                  }}>
                  {klaar && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Voortgangsbalk + auto-knop */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${voortgangPct}%`, background: huidigeSectie.kleur }} />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{voortgangPct}%</span>
            <button
              onClick={vulAutomatischIn}
              className="flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium transition"
              style={{ background: huidigeSectie.licht, color: huidigeSectie.kleur, border: `1px solid ${huidigeSectie.kleur}30` }}
              title="Auto-invullen — vult alle vragen in met realistische antwoorden">
              Auto
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-8">

        {/* Sectie header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: huidigeSectie.licht, color: huidigeSectie.kleur }}>
              {sectieIdx + 1}
            </div>
            <div>
              <p className="text-xs text-gray-400">Sectie {sectieIdx + 1} van {totaalSecties}</p>
              <h1 className="text-lg font-bold text-gray-900">{huidigeSectie.label}</h1>
            </div>
          </div>
        </div>

        {/* Vragen */}
        <div className="flex flex-col gap-4">
          {huidigeSectie.vragen.map((vraag) => (
            <VraagKaart
              key={vraag.code}
              vraag={vraag}
              waarde={antwoorden[vraag.code]}
              kleur={huidigeSectie.kleur}
              licht={huidigeSectie.licht}
              onChange={(v) => stelIn(vraag.code, v)}
            />
          ))}
        </div>

        {/* Fout */}
        {fout && (
          <div className="mt-5 rounded-xl p-4" style={{ background: '#FCEBEB', borderLeft: '3px solid #E24B4A' }}>
            <p className="text-sm text-red-700">{fout}</p>
          </div>
        )}

        {/* Navigatie */}
        <div className="flex gap-3 mt-6">
          {sectieIdx > 0 && (
            <button onClick={vorigeSectie}
              className="px-6 py-3.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
              Vorige
            </button>
          )}
          <button
            onClick={volgendeSectie}
            disabled={!sectieCompleet(sectieIdx) || laden}
            className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: huidigeSectie.kleur }}>
            {laden && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {laden ? 'Opslaan...' : sectieIdx === totaalSecties - 1 ? 'Afronden en opslaan' : 'Volgende'}
          </button>
        </div>

        {!sectieCompleet(sectieIdx) && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Beantwoord alle 4 vragen om door te gaan.
          </p>
        )}

        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Alle antwoorden zijn anoniem en beveiligd opgeslagen.
        </p>
      </div>
    </main>
  )
}

// ─── VraagKaart ───────────────────────────────────────────────────────────────

function VraagKaart({ vraag, waarde, kleur, licht, onChange }: {
  vraag:    Vraag
  waarde:   number | string | undefined
  kleur:    string
  licht:    string
  onChange: (v: number | string) => void
}) {
  const geselecteerd = typeof waarde === 'number' ? waarde : null

  if (vraag.type === 'schaal') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5"
        style={{ borderLeft: geselecteerd ? `3px solid ${kleur}` : '3px solid transparent' }}>
        <p className="text-sm font-medium text-gray-900 mb-4 leading-snug">{vraag.label}</p>

        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onChange(n)}
              className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background:  geselecteerd === n ? kleur : '#F9FAFB',
                borderColor: geselecteerd === n ? kleur : '#e5e7eb',
                color:       geselecteerd === n ? 'white' : '#9ca3af',
              }}>
              {n}
            </button>
          ))}
        </div>

        {(vraag.min || vraag.max) && (
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
            <span>{vraag.min}</span>
            <span>{vraag.max}</span>
          </div>
        )}
      </div>
    )
  }

  const tekst = typeof waarde === 'string' ? waarde : ''
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ opacity: 0.9 }}>
      <p className="text-sm font-medium text-gray-600 mb-3 leading-snug">{vraag.label}</p>
      <textarea
        rows={3}
        value={tekst}
        onChange={e => onChange(e.target.value)}
        placeholder={vraag.placeholder ?? 'Schrijf hier je antwoord...'}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none transition text-gray-700"
        onFocus={e => e.target.style.borderColor = kleur}
        onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
      />
      {tekst && <p className="text-xs text-gray-300 text-right mt-1">{tekst.length} tekens</p>}
    </div>
  )
}
