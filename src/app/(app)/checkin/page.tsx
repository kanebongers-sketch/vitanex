'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import { vandaag } from '@/lib/doelen/weekdoelen'
import { vitaEvent } from '@/lib/vita/events'
import { useToast } from '@/components/ui/Toast'
import VitaCheckinBegeleider from '@/components/vita/VitaCheckinBegeleider'
import Link from 'next/link'
import VraagKaart, { type Vraag } from './VraagKaart'
import CheckinResultaat from './CheckinResultaat'

// Decoratieve glow per sectie — verwijst naar de -light pijler-tokens (rgba met lage alpha).
const SECTIE_KLEUR: Record<string, string> = {
  slaap:     'var(--mf-purple-light)',
  stress:    'var(--mf-red-light)',
  energie:   'var(--mf-amber-light)',
  focus:     'var(--mf-green-light)',
  balans:    'var(--mf-blue-light)',
  motivatie: 'var(--mf-rose-light)',
}

interface Sectie {
  id:     string
  label:  string
  kleur:  string
  licht:  string
  vragen: Vraag[]
}

// 6 domeinen — 2 kernvragen per sectie (was 4+1, nu 2)
const SECTIES: Sectie[] = [
  {
    id: 'slaap', label: 'Slaap', kleur: 'var(--mf-purple)', licht: 'var(--mf-purple-light)',
    vragen: [
      { code: 'slaap_kwaliteit', type: 'schaal', verplicht: true, min: 'Zeer slecht',       max: 'Uitstekend',      label: 'Hoe heb je deze week geslapen?' },
      { code: 'slaap_fris',      type: 'schaal', verplicht: true, min: 'Volledig uitgeput', max: 'Fris en energiek', label: 'Hoe uitgerust voelde je je bij het opstaan?' },
    ],
  },
  {
    id: 'stress', label: 'Stress', kleur: 'var(--mf-red)', licht: 'var(--mf-red-light)',
    vragen: [
      { code: 'stress_niveau',   type: 'schaal', verplicht: true, min: 'Extreem gestrest', max: 'Volledig ontspannen',  label: 'Hoe stressvrij voelde je je deze week?' },
      { code: 'stress_controle', type: 'schaal', verplicht: true, min: 'Geen controle',    max: 'Volledig in controle', label: 'Had je het gevoel controle te hebben over je dag?' },
    ],
  },
  {
    id: 'energie', label: 'Energie', kleur: 'var(--mf-amber)', licht: 'var(--mf-amber-light)',
    vragen: [
      { code: 'energie_niveau',   type: 'schaal', verplicht: true, min: 'Uitgeput',        max: 'Vol energie', label: 'Hoe was je energieniveau deze week?' },
      { code: 'energie_beweging', type: 'schaal', verplicht: true, min: 'Totaal inactief', max: 'Zeer actief', label: 'Hoe actief was je buiten het werk?' },
    ],
  },
  {
    id: 'focus', label: 'Focus', kleur: 'var(--mf-green)', licht: 'var(--mf-green-light)',
    vragen: [
      { code: 'focus_concentratie', type: 'schaal', verplicht: true, min: 'Totaal niet',   max: 'Uitstekend',       label: 'Hoe goed kon je je concentreren op je werk?' },
      { code: 'focus_helderheid',   type: 'schaal', verplicht: true, min: 'Wazig en traag', max: 'Scherp en helder', label: 'Hoe helder was je hoofd deze week?' },
    ],
  },
  {
    id: 'balans', label: 'Balans', kleur: 'var(--mf-blue-mid)', licht: 'var(--mf-blue-light)',
    vragen: [
      { code: 'balans_werk_prive', type: 'schaal', verplicht: true, min: 'Helemaal niet', max: 'Perfecte balans',   label: 'Ervaarde je een goede werk-privé balans?' },
      { code: 'balans_herstel',    type: 'schaal', verplicht: true, min: 'Nauwelijks',    max: 'Meer dan genoeg',   label: 'Had je voldoende tijd voor herstel na het werk?' },
    ],
  },
  {
    id: 'motivatie', label: 'Motivatie', kleur: 'var(--mf-rose)', licht: 'var(--mf-rose-light)',
    vragen: [
      { code: 'motivatie_werk',   type: 'schaal', verplicht: true, min: 'Helemaal niet', max: 'Zeer gemotiveerd', label: 'Hoe gemotiveerd was je om je werk goed te doen?' },
      { code: 'motivatie_zinvol', type: 'schaal', verplicht: true, min: 'Zinloos',       max: 'Zeer zinvol',     label: 'In welke mate vond je je werk zinvol?' },
    ],
  },
]

// 2 codes per domein — scores genormaliseerd ×2 om range 4–20 te houden
const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_fris'],
  stress:   ['stress_niveau',   'stress_controle'],
  energie:  ['energie_niveau',  'energie_beweging'],
  focus:    ['focus_concentratie', 'focus_helderheid'],
  balans:   ['balans_werk_prive',  'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol'],
}

const TOTAAL_VRAGEN = SECTIES.reduce((sum, s) => sum + s.vragen.length, 0)

// Lichte pijler-info voor het resultaatmoment (presentational prop).
const PIJLER_INFO = SECTIES.map(s => ({ id: s.id, label: s.label, kleur: s.kleur }))

// Interactie-states van de check-in. Rustkleuren van de schaalknoppen staan
// hier (niet inline) zodat hover/active via CSS kunnen; de geselecteerde staat
// krijgt zijn sectiekleur inline vanuit VraagKaart. Alle beweging is
// transform/opacity-only en valt weg onder prefers-reduced-motion.
const CHECKIN_CSS = `
  .mf-checkin-pil { transition: opacity 0.15s var(--ease); }
  .mf-checkin-pil[data-terug]:hover { opacity: 0.8; }
  .mf-checkin-pil:focus-visible {
    outline: 2px solid var(--mentaforce-primary);
    outline-offset: 2px;
  }

  .mf-vraag-kaart { transition: opacity 0.2s var(--ease), border-color 0.2s var(--ease); }
  .mf-vraag-stil { opacity: 0.6; }
  .mf-vraag-stil:hover, .mf-vraag-stil:focus-within { opacity: 1; }

  .mf-schaal-btn {
    background: var(--bg-subtle);
    border-color: var(--border);
    color: var(--text-3);
    transition: transform 0.18s var(--ease), background 0.15s var(--ease),
      border-color 0.15s var(--ease), color 0.15s var(--ease), box-shadow 0.18s var(--ease);
  }
  .mf-schaal-btn:not([aria-pressed='true']):hover { border-color: var(--border-strong); color: var(--text-1); }
  .mf-schaal-btn:not([aria-pressed='true']):active { transform: scale(0.96); }
  .mf-schaal-btn[aria-pressed='true'] {
    transform: scale(1.06);
    animation: mf-schaal-pop 0.2s var(--ease);
  }
  .mf-schaal-btn:focus-visible {
    outline: 2px solid var(--mentaforce-primary);
    outline-offset: 2px;
  }
  @keyframes mf-schaal-pop {
    0%   { transform: scale(0.97); }
    60%  { transform: scale(1.09); }
    100% { transform: scale(1.06); }
  }

  .mf-checkin-nav {
    transition: transform 0.15s var(--ease), filter 0.15s var(--ease), opacity 0.15s var(--ease);
  }
  .mf-checkin-nav:hover:not(:disabled)  { filter: brightness(1.08); }
  .mf-checkin-nav:active:not(:disabled) { transform: scale(0.98); }
  .mf-checkin-nav:focus-visible {
    outline: 2px solid var(--mentaforce-primary);
    outline-offset: 2px;
  }

  .mf-toets-tip { display: none; }
  @media (hover: hover) and (pointer: fine) {
    .mf-toets-tip { display: block; }
  }

  @media (prefers-reduced-motion: reduce) {
    .mf-checkin-pil, .mf-vraag-kaart, .mf-schaal-btn, .mf-checkin-nav { transition: none; }
    .mf-schaal-btn[aria-pressed='true'] { animation: none; }
  }
`

interface Resultaat {
  scores: Record<string, number>
  sid:    string
}

export default function CheckIn() {
  const router  = useRouter()
  const { toast } = useToast()
  const topRef  = useRef<HTMLDivElement>(null)

  const [userId,          setUserId]         = useState<string | null>(null)
  const [bedrijfId,       setBedrijfId]      = useState<string | null>(null)
  const [checkend,        setCheckend]       = useState(true)
  const [alIngevuld,      setAlIngevuld]     = useState(false)
  const [sessieId,        setSessieId]       = useState<string | null>(null)
  const [kanOpnieuw,      setKanOpnieuw]     = useState(false)
  const [volgendeCheckin, setVolgendeCheckin]= useState('')

  const [sectieIdx,  setSectieIdx]  = useState(0)
  const [antwoorden, setAntwoorden] = useState<Record<string, number>>({})
  // Spiegel van de laatste antwoorden: snelle opeenvolgende clicks lezen anders
  // een stale closure en verliezen elkaars antwoord (zie stelIn).
  const antwoordenRef = useRef(antwoorden)
  const [laden,      setLaden]      = useState(false)
  const [fout,       setFout]       = useState<string | null>(null)
  const [advancing,  setAdvancing]  = useState(false)
  // Kalm resultaatmoment ná succesvol opslaan — de flow eindigt niet abrupt.
  const [resultaat,  setResultaat]  = useState<Resultaat | null>(null)
  // Toont Vita's bemoedigende reactie terwijl de flow doorschuift. De reactie
  // hoort bij de nét afgeronde pijler en blijft langer staan dan de sectie-wissel.
  const [toonReactie, setToonReactie] = useState(false)
  const [reactieSectie, setReactieSectie] = useState<Sectie | null>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reactieTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (reactieTimer.current) clearTimeout(reactieTimer.current)
  }, [])

  // Houd de spiegel gelijk aan de state, ook bij resets (verwijderSessie).
  useEffect(() => { antwoordenRef.current = antwoorden }, [antwoorden])

  const weekStart = vandaag()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

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
        setVolgendeCheckin(volgende.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }))
      }

      setCheckend(false)
    }
    init()
  }, [router])

  async function verwijderSessie() {
    if (!sessieId) return
    setLaden(true)
    try {
      const res = await authFetch('/api/reset-sessie', {
        method: 'POST',
        body: JSON.stringify({ sessie_id: sessieId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAlIngevuld(false)
      setSessieId(null)
      setSectieIdx(0)
      setAntwoorden({})
    } catch {
      toast({
        variant: 'error',
        title: 'Opnieuw invullen mislukt',
        description: 'Probeer het zo nog eens. Je antwoorden blijven bewaard.',
      })
    } finally {
      setLaden(false)
    }
  }

  const huidigeSectie = SECTIES[sectieIdx]
  const totaalSecties = SECTIES.length

  function sectieCompleet(idx: number, ant: Record<string, number> = antwoorden) {
    return SECTIES[idx].vragen
      .filter(v => v.verplicht)
      .every(v => ant[v.code] !== undefined)
  }

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const doSubmit = useCallback(async (ant: Record<string, number>) => {
    setLaden(true)
    setFout(null)
    try {
      const rijen = Object.entries(ant).map(([code, waarde]) => {
        const sectieObj = SECTIES.find(s => s.vragen.some(v => v.code === code))
        return {
          vraag_code:    code,
          categorie:     sectieObj?.id ?? null,
          waarde_schaal: waarde,
          waarde_tekst:  null,
        }
      })

      const res  = await authFetch('/api/submit-checkin', {
        method: 'POST',
        body: JSON.stringify({ bedrijf_id: bedrijfId, week_start: weekStart, rijen }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)

      // Sluit de VITA-retentie-loop: check-in is succesvol opgeslagen.
      vitaEvent('check_in_completed')

      // Normaliseer scores: 2 vragen × 2 = zelfde range als voorheen (4–20)
      const vlakScores: Record<string, number> = {}
      for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
        const som = codes.reduce((acc, code) => acc + (ant[code] ?? 0), 0)
        vlakScores[domein] = som * 2
      }

      // Eerst het kalme resultaatmoment; de CTA daar navigeert naar /doelkeuze.
      setResultaat({ scores: vlakScores, sid: data.sessie_id ?? '' })
      setLaden(false)
      window.scrollTo(0, 0)
    } catch (err) {
      setFout(`Opslaan mislukt: ${err instanceof Error ? err.message : String(err)}`)
      setLaden(false)
    }
  }, [bedrijfId, weekStart])

  function gaNaarDoelkeuze() {
    if (!resultaat) return
    const params = new URLSearchParams({
      slaap:    String(resultaat.scores.slaap),
      stress:   String(resultaat.scores.stress),
      energie:  String(resultaat.scores.energie),
      focus:    String(resultaat.scores.focus),
      balans:   String(resultaat.scores.balans),
      motivatie:String(resultaat.scores.motivatie),
      sid:      resultaat.sid,
    })
    router.push(`/doelkeuze?${params.toString()}`)
  }

  function stelIn(code: string, waarde: number) {
    if (advancing) return
    // Functionele update + ref-merge: twee snelle clicks vlak na elkaar mogen
    // elkaars antwoord niet overschrijven via een stale `antwoorden`-closure.
    const nieuw = { ...antwoordenRef.current, [code]: waarde }
    antwoordenRef.current = nieuw
    setAntwoorden(prev => ({ ...prev, [code]: waarde }))

    const isLaatste = sectieIdx === totaalSecties - 1
    if (!sectieCompleet(sectieIdx, nieuw) || isLaatste) return

    // Bij reduced motion: reactie-fase overslaan en direct doorschakelen.
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setSectieIdx(s => s + 1)
      scrollTop()
      return
    }

    // Twee losse timers: de sectie schuift snel door (380ms), maar Vita's
    // reactie blijft lang genoeg staan om te lezen (~1800ms). Eerst eventuele
    // lopende timers van de vorige sectie opruimen, anders klikt een stale
    // reactieTimer de nieuwe reactie voortijdig weg.
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (reactieTimer.current) clearTimeout(reactieTimer.current)
    setAdvancing(true)
    setToonReactie(true)
    setReactieSectie(SECTIES[sectieIdx])
    advanceTimer.current = setTimeout(() => {
      setSectieIdx(s => s + 1)
      scrollTop()
      setAdvancing(false)
    }, 380)
    reactieTimer.current = setTimeout(() => {
      setToonReactie(false)
      setReactieSectie(null)
    }, 1800)
  }

  // Toetsenbord: 1–5 beantwoordt de eerstvolgende open vraag in de huidige
  // sectie. Via een ref zodat de window-listener maar één keer bindt maar wel
  // altijd de actuele state ziet.
  const toetsRef = useRef<(waarde: number) => void>(() => {})
  useEffect(() => {
    toetsRef.current = (waarde: number) => {
      if (checkend || alIngevuld || laden || advancing || resultaat) return
      const open = SECTIES[sectieIdx].vragen.find(v => antwoordenRef.current[v.code] === undefined)
      if (open) stelIn(open.code, waarde)
    }
  })
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (!/^[1-5]$/.test(e.key)) return
      const doel = e.target as HTMLElement | null
      if (doel && (doel.tagName === 'INPUT' || doel.tagName === 'TEXTAREA' || doel.tagName === 'SELECT' || doel.isContentEditable)) return
      toetsRef.current(Number(e.key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function volgendeSectie() {
    if (!sectieCompleet(sectieIdx) || laden) return
    setFout(null)
    if (sectieIdx < totaalSecties - 1) {
      setSectieIdx(s => s + 1)
      scrollTop()
    } else {
      if (userId) doSubmit(antwoordenRef.current)
    }
  }

  function vorigeSectie() {
    setSectieIdx(s => Math.max(0, s - 1))
    scrollTop()
  }

  // Voortgang: beantwoorde vragen over de hele check-in ("7 van 12").
  const voortgang = useMemo(() => {
    const eerder = SECTIES.slice(0, sectieIdx).reduce((sum, s) => sum + s.vragen.length, 0)
    const huidig = huidigeSectie.vragen.filter(v => antwoorden[v.code] !== undefined).length
    const beantwoord = eerder + huidig
    return { beantwoord, pct: Math.round((beantwoord / TOTAAL_VRAGEN) * 100) }
  }, [sectieIdx, huidigeSectie, antwoorden])

  // Eerstvolgende open vraag: die staat op volle sterkte, de rest is stil.
  const eersteOpenCode = huidigeSectie.vragen
    .find(v => antwoorden[v.code] === undefined)?.code ?? null

  const huidigCompleet = sectieCompleet(sectieIdx)
  const isLaatsteSectie = sectieIdx === totaalSecties - 1

  // ── Laadscherm ──────────────────────────────────────────────────────────────

  if (checkend) return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" role="status" aria-label="Laden"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
    </main>
  )

  // ── Al ingevuld ──────────────────────────────────────────────────────────────

  if (alIngevuld) return (
    <main className="mf-mesh-bg min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border p-10 shadow-sm text-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* Vita viert de afronding — warm en oprecht, geen valse claims */}
        <div className="mb-6 text-left">
          <VitaCheckinBegeleider
            fase="afronden"
            pijlerId={huidigeSectie.id}
            pijlerLabel={huidigeSectie.label}
            sectieIdx={sectieIdx}
            totaalSecties={totaalSecties}
          />
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--mf-green-light)' }}>
          <Check size={24} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--mf-green)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Check-in gedaan!</h2>
        <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>Je antwoorden zijn ontvangen. Tot volgende week.</p>
        <p className="text-xs mb-6" style={{ color: 'var(--text-4)' }}>
          Volgende check-in: <span className="font-medium" style={{ color: 'var(--text-2)' }}>{volgendeCheckin}</span>
        </p>

        {kanOpnieuw && (
          <div className="rounded-xl p-4 mb-4 text-left"
            style={{ background: 'var(--mf-amber-light)', borderLeft: '3px solid var(--mf-amber)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--mf-amber)' }}>Aanpassen?</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>Je kan opnieuw invullen binnen 4 uur na het indienen.</p>
            <button onClick={verwijderSessie} disabled={laden}
              className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: 'var(--mf-amber)', color: 'var(--bg-app)' }}>
              {laden ? 'Bezig...' : 'Opnieuw invullen'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/home" className="w-full inline-block text-center rounded-xl py-3.5 text-sm font-semibold"
            style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}>Naar dashboard</Link>
          <Link href="/rapport" className="w-full inline-block text-center rounded-xl py-3 text-sm"
            style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Bekijk mijn rapport</Link>
        </div>
      </div>
    </main>
  )

  // ── Resultaatmoment ──────────────────────────────────────────────────────────

  if (resultaat) return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-6">
      <CheckinResultaat pijlers={PIJLER_INFO} scores={resultaat.scores} onVerder={gaNaarDoelkeuze} />
    </main>
  )

  // ── Formulier ────────────────────────────────────────────────────────────────

  return (
    <main className="mf-mesh-bg min-h-screen"
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Gate banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--mf-green-dark), var(--mf-green))',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Check size={16} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--bg-app)' }} />
        <p style={{ color: 'var(--bg-app)', fontSize: 13, fontWeight: 600 }}>
          Je wekelijkse check-in — {TOTAAL_VRAGEN} vragen, klaar in ±2 minuten.
        </p>
      </div>

      {/* Sticky header */}
      <div ref={topRef} className="sticky top-0 z-20 border-b"
        style={{ background: 'var(--bg-app)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 py-3">

          {/* Sectie pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2.5" style={{ scrollbarWidth: 'none' }}>
            {SECTIES.map((s, i) => {
              const klaar  = i < sectieIdx
              const actief = i === sectieIdx
              return (
                <button key={s.id}
                  onClick={() => { if (i < sectieIdx) setSectieIdx(i) }}
                  aria-disabled={i >= sectieIdx}
                  tabIndex={i < sectieIdx ? 0 : -1}
                  aria-current={actief ? 'step' : undefined}
                  data-terug={klaar || undefined}
                  className="mf-checkin-pil flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: actief ? s.kleur : klaar ? `color-mix(in srgb, ${s.kleur} 13%, transparent)` : 'var(--bg-subtle)',
                    color:      actief ? 'var(--bg-app)' : klaar ? s.kleur : 'var(--text-3)',
                    cursor:     i < sectieIdx ? 'pointer' : 'default',
                  }}>
                  {klaar && <Check size={11} strokeWidth={3} aria-hidden="true" />}
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Voortgangsbalk — "7 van 12" is concreter dan een percentage */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 overflow-hidden" style={{ borderRadius: 9999, background: 'var(--bg-subtle)' }}
              role="progressbar" aria-valuenow={voortgang.beantwoord} aria-valuemin={0} aria-valuemax={TOTAAL_VRAGEN}
              aria-label={`Voortgang: ${voortgang.beantwoord} van ${TOTAAL_VRAGEN} vragen beantwoord`}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${voortgang.pct}%`, background: huidigeSectie.kleur, borderRadius: 9999 }} />
            </div>
            <span className="text-xs font-semibold flex-shrink-0 tabular-nums" style={{ color: huidigeSectie.kleur }}>
              {voortgang.beantwoord}
              <span style={{ color: 'var(--text-4)', fontWeight: 500 }}> / {TOTAAL_VRAGEN}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-7">

        {/* Statuswissel voor screenreaders: welke sectie is nu aan de beurt. */}
        <p className="sr-only" role="status">
          Sectie {sectieIdx + 1} van {totaalSecties}: {huidigeSectie.label}
        </p>

        {/* Vita loopt mee: rustige aanmoediging per pijler, korte reactie bij doorschuiven.
            Tijdens de reactie-fase blijft de zin bij de nét afgeronde pijler horen. */}
        <div className="mb-6">
          {(() => {
            const vitaSectie = toonReactie && reactieSectie ? reactieSectie : huidigeSectie
            return (
              <VitaCheckinBegeleider
                key={toonReactie ? `reactie-${vitaSectie.id}` : `vraag-${huidigeSectie.id}`}
                fase={toonReactie ? 'reactie' : 'vraag'}
                pijlerId={vitaSectie.id}
                pijlerLabel={vitaSectie.label}
                sectieIdx={sectieIdx}
                totaalSecties={totaalSecties}
              />
            )
          })()}
        </div>

        {/* Sectie header */}
        <div className="flex items-center gap-3 mb-6">
          <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 64, height: 64, borderRadius: '50%',
              background: `radial-gradient(circle, ${SECTIE_KLEUR[huidigeSectie.id] ?? 'var(--mf-green-light)'} 0%, transparent 70%)`,
            }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: huidigeSectie.licht, color: huidigeSectie.kleur, position: 'relative' }}>
              {sectieIdx + 1}
            </div>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{sectieIdx + 1} van {totaalSecties}</p>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{huidigeSectie.label}</h1>
          </div>
        </div>

        {/* Vragen — de eerstvolgende open vraag op volle sterkte, de rest stil */}
        <div className="flex flex-col gap-4">
          {huidigeSectie.vragen.map((vraag, qi) => (
            <VraagKaart
              key={vraag.code}
              vraag={vraag}
              waarde={antwoorden[vraag.code]}
              kleur={huidigeSectie.kleur}
              licht={huidigeSectie.licht}
              nummer={qi + 1}
              stil={antwoorden[vraag.code] === undefined && vraag.code !== eersteOpenCode}
              onChange={v => stelIn(vraag.code, v)}
            />
          ))}
        </div>

        {/* Fout */}
        {fout && (
          <div className="mt-5 rounded-xl p-4" role="alert" style={{ background: 'var(--mf-red-light)', borderLeft: '3px solid var(--mf-red)' }}>
            <p className="text-sm" style={{ color: 'var(--mf-red)' }}>{fout}</p>
          </div>
        )}

        {/* Navigatie — Vorige blijft ruimte innemen zodat niets verschuift */}
        <div className="flex gap-3 mt-6">
          <button onClick={vorigeSectie} disabled={sectieIdx === 0}
            className="mf-checkin-nav px-5 py-3.5 rounded-xl text-sm font-medium border"
            style={{
              borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--bg-card)',
              visibility: sectieIdx === 0 ? 'hidden' : 'visible',
            }}>
            Vorige
          </button>
          <button
            onClick={volgendeSectie}
            disabled={!huidigCompleet || laden || advancing}
            className="mf-checkin-nav flex-1 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-30 flex items-center justify-center gap-2"
            style={{
              color: 'var(--bg-app)',
              background: isLaatsteSectie
                ? 'linear-gradient(135deg, var(--mf-green-dark), var(--mf-green))'
                : huidigeSectie.kleur,
              boxShadow: isLaatsteSectie ? 'var(--shadow-md)' : undefined,
            }}>
            {laden && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            {laden ? 'Opslaan...' : advancing ? 'Volgende...' : isLaatsteSectie ? 'Afronden' : 'Volgende'}
          </button>
        </div>

        {/* Hint houdt zijn regelruimte vast — geen layout-shift bij voltooien */}
        <p className="text-xs text-center mt-3" aria-hidden={huidigCompleet}
          style={{ color: 'var(--text-4)', minHeight: '1rem', opacity: huidigCompleet ? 0 : 1, transition: 'opacity 0.2s var(--ease)' }}>
          Beantwoord beide vragen om door te gaan.
        </p>
        <p className="mf-toets-tip text-xs text-center mt-1" style={{ color: 'var(--text-4)' }}>
          Tip: toets 1–5 beantwoordt de open vraag.
        </p>

        <p className="text-xs text-center mt-5 pb-6" style={{ color: 'var(--text-4)' }}>
          Je antwoorden worden beveiligd opgeslagen.
        </p>
      </div>

      <style>{CHECKIN_CSS}</style>
    </main>
  )
}
