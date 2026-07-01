'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import { vandaag } from '@/lib/weekdoelen'
import { vitaEvent } from '@/lib/vita/events'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

// Decoratieve glow per sectie — verwijst naar de -light pijler-tokens (rgba met lage alpha).
const SECTIE_KLEUR: Record<string, string> = {
  slaap:     'var(--mf-purple-light)',
  stress:    'var(--mf-red-light)',
  energie:   'var(--mf-amber-light)',
  focus:     'var(--mf-green-light)',
  balans:    'var(--mf-blue-light)',
  motivatie: 'var(--mf-rose-light)',
}

interface Vraag {
  code:      string
  label:     string
  type:      'schaal'
  min?:      string
  max?:      string
  verplicht: boolean
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
  const [laden,      setLaden]      = useState(false)
  const [fout,       setFout]       = useState<string | null>(null)
  const [advancing,  setAdvancing]  = useState(false)

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

  const doSubmit = useCallback(async (ant: Record<string, number>, uid: string) => {
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

      const params = new URLSearchParams({
        slaap:    String(vlakScores.slaap),
        stress:   String(vlakScores.stress),
        energie:  String(vlakScores.energie),
        focus:    String(vlakScores.focus),
        balans:   String(vlakScores.balans),
        motivatie:String(vlakScores.motivatie),
        sid:      data.sessie_id ?? '',
      })
      router.push(`/doelkeuze?${params.toString()}`)
    } catch (err) {
      setFout(`Opslaan mislukt: ${err instanceof Error ? err.message : String(err)}`)
      setLaden(false)
    }
  }, [bedrijfId, weekStart, router])

  function stelIn(code: string, waarde: number) {
    if (advancing) return
    setAntwoorden(prev => {
      const nieuw = { ...prev, [code]: waarde }
      const isLaatste = sectieIdx === totaalSecties - 1
      const compleet  = sectieCompleet(sectieIdx, nieuw)
      if (compleet && !isLaatste) {
        setAdvancing(true)
        setTimeout(() => {
          setSectieIdx(s => s + 1)
          scrollTop()
          setAdvancing(false)
        }, 380)
      }
      return nieuw
    })
  }

  function volgendeSectie() {
    if (!sectieCompleet(sectieIdx) || laden) return
    setFout(null)
    if (sectieIdx < totaalSecties - 1) {
      setSectieIdx(s => s + 1)
      scrollTop()
    } else {
      if (userId) doSubmit(antwoorden, userId)
    }
  }

  function vorigeSectie() {
    setSectieIdx(s => Math.max(0, s - 1))
    scrollTop()
  }

  // Voortgang: voltooide secties + vragen in huidige sectie
  const voortgangPct = useMemo(() => {
    const voltooideVragen  = SECTIES.slice(0, sectieIdx).reduce((sum, s) => sum + s.vragen.length, 0)
    const totaalVragen     = SECTIES.reduce((sum, s) => sum + s.vragen.length, 0)
    const huidigBeantwoord = huidigeSectie.vragen.filter(v => antwoorden[v.code] !== undefined).length
    return Math.round(((voltooideVragen + huidigBeantwoord) / totaalVragen) * 100)
  }, [sectieIdx, huidigeSectie, antwoorden])

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
          <Link href="/bedankt" className="w-full inline-block text-center rounded-xl py-3 text-sm"
            style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Bekijk analyse</Link>
        </div>
      </div>
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
          Vul eerst je wekelijkse check-in in — daarna heb je toegang tot de app.
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
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: actief ? s.kleur : klaar ? s.kleur + '20' : 'var(--bg-subtle)',
                    color:      actief ? 'var(--bg-app)' : klaar ? s.kleur : 'var(--text-3)',
                    cursor:     i < sectieIdx ? 'pointer' : 'default',
                  }}>
                  {klaar && <Check size={11} strokeWidth={3} aria-hidden="true" />}
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Voortgangsbalk */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 overflow-hidden" style={{ borderRadius: 9999, background: 'var(--bg-subtle)' }}
              role="progressbar" aria-valuenow={voortgangPct} aria-valuemin={0} aria-valuemax={100}
              aria-label={`Voortgang: ${voortgangPct}%`}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${voortgangPct}%`, background: huidigeSectie.kleur, borderRadius: 9999 }} />
            </div>
            <span className="text-xs font-semibold flex-shrink-0 tabular-nums" style={{ color: huidigeSectie.kleur }}>
              {voortgangPct}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-7">

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

        {/* Vragen */}
        <div className="flex flex-col gap-4">
          {huidigeSectie.vragen.map((vraag, qi) => (
            <VraagKaart
              key={vraag.code}
              vraag={vraag}
              waarde={antwoorden[vraag.code]}
              kleur={huidigeSectie.kleur}
              licht={huidigeSectie.licht}
              nummer={qi + 1}
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

        {/* Navigatie */}
        <div className="flex gap-3 mt-6">
          {sectieIdx > 0 && (
            <button onClick={vorigeSectie}
              className="px-5 py-3.5 rounded-xl text-sm font-medium border transition"
              style={{ borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--bg-card)' }}>
              Vorige
            </button>
          )}
          <button
            onClick={volgendeSectie}
            disabled={!sectieCompleet(sectieIdx) || laden || advancing}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-30 flex items-center justify-center gap-2"
            style={{
              color: sectieIdx === totaalSecties - 1 ? 'var(--bg-app)' : 'white',
              background: sectieIdx === totaalSecties - 1
                ? 'linear-gradient(135deg, var(--mf-green-dark), var(--mf-green))'
                : huidigeSectie.kleur,
              boxShadow: sectieIdx === totaalSecties - 1 ? 'var(--shadow-md)' : undefined,
            }}>
            {laden && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            {laden ? 'Opslaan...' : advancing ? 'Volgende...' : sectieIdx === totaalSecties - 1 ? 'Afronden' : 'Volgende'}
          </button>
        </div>

        {!sectieCompleet(sectieIdx) && (
          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-4)' }}>
            Beantwoord beide vragen om door te gaan.
          </p>
        )}

        <p className="text-xs text-center mt-5 pb-6" style={{ color: 'var(--text-4)' }}>
          Alle antwoorden zijn anoniem en beveiligd opgeslagen.
        </p>
      </div>

      <style>{`
        .mf-schaal-btn:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-schaal-btn { transition: none !important; }
        }
      `}</style>
    </main>
  )
}

// ─── VraagKaart ──────────────────────────────────────────────────────────────

function VraagKaart({ vraag, waarde, kleur, licht, nummer, onChange }: {
  vraag:    Vraag
  waarde:   number | undefined
  kleur:    string
  licht:    string
  nummer:   number
  onChange: (v: number) => void
}) {
  const geselecteerd = waarde ?? null
  const beantwoord   = geselecteerd !== null

  return (
    <div className="rounded-2xl border p-5 transition-all"
      style={{
        background:  'var(--bg-card)',
        borderColor: beantwoord ? kleur + '60' : 'var(--border)',
        borderWidth: beantwoord ? 1.5 : 1,
      }}>

      {/* Vraagnummer + label */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: beantwoord ? kleur : licht, color: beantwoord ? 'var(--bg-app)' : kleur }}>
          {beantwoord
            ? <Check size={11} strokeWidth={3} aria-hidden="true" />
            : nummer}
        </div>
        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-1)' }}>{vraag.label}</p>
      </div>

      {/* Schaalbuttons */}
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            aria-label={`${vraag.label}: ${n} van 5`}
            aria-pressed={geselecteerd === n}
            className="mf-schaal-btn flex-1 h-11 rounded-xl text-sm font-semibold transition-all border"
            style={{
              background:  geselecteerd === n ? kleur : 'var(--bg-subtle)',
              borderColor: geselecteerd === n ? kleur : 'var(--border)',
              color:       geselecteerd === n ? 'var(--bg-app)' : 'var(--text-3)',
              transform:   geselecteerd === n ? 'scale(1.06)' : 'scale(1)',
              boxShadow:   geselecteerd === n ? `0 2px 8px ${kleur}50` : undefined,
            }}>
            {n}
          </button>
        ))}
      </div>

      {(vraag.min || vraag.max) && (
        <div className="flex justify-between text-xs px-0.5 mt-1" style={{ color: 'var(--text-4)' }}>
          <span>{vraag.min}</span>
          <span>{vraag.max}</span>
        </div>
      )}
    </div>
  )
}
