'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── HR onboarding stappen ────────────────────────────────────────────────────
type HrStap = 'welkom' | 'gegevens' | 'bedrijf' | 'details' | 'klaar'
const HR_STAPPEN: HrStap[] = ['welkom', 'gegevens', 'bedrijf', 'details', 'klaar']

// ─── Gebruiker/werknemer onboarding stappen ───────────────────────────────────
type GebrStap = 'welkom' | 'profiel' | 'eerste-meting' | 'lichaam' | 'privacy' | 'hrcode' | 'klaar'
const GEBR_STAPPEN: GebrStap[] = ['welkom', 'profiel', 'eerste-meting', 'lichaam', 'privacy', 'klaar']

// ─── Eerste meting state ──────────────────────────────────────────────────────
interface EersteMeting {
  slaap: number | null
  energie: number | null
  stemming: number | null
  geladen: boolean
  score: number | null
}

function berekenReadiness(slaap: number, energie: number, stemming: number): number {
  return 50 + slaap * 20 + energie * 15 + stemming * 15
}

function readinessLabel(score: number): { label: string; uitleg: string; kleur: string } {
  if (score >= 90) return { label: 'Uitstekend', uitleg: 'Je bent top in vorm. Profiteer hiervan.', kleur: '#1D9E75' }
  if (score >= 75) return { label: 'Goed', uitleg: 'Je hebt een solide basis. Kleine verbeteringen maken het verschil.', kleur: '#3B82F6' }
  if (score >= 60) return { label: 'Matig', uitleg: 'Ruimte voor verbetering. Let op slaap en herstel.', kleur: '#F59E0B' }
  return { label: 'Laag', uitleg: 'Je lichaam vraagt aandacht. Neem het rustig aan vandaag.', kleur: '#EF4444' }
}

// ─── Sectoren ────────────────────────────────────────────────────────────────
const SECTOREN = [
  'Zorg & Welzijn', 'Technologie & IT', 'Logistiek & Transport',
  'Retail & E-commerce', 'Onderwijs & Onderzoek', 'Financiën & Verzekeringen',
  'Bouw & Vastgoed', 'Industrie & Productie', 'Horeca & Toerisme',
  'Overheid & Non-profit', 'Marketing & Communicatie', 'Juridisch & Advies',
  'Energie & Milieu', 'Landbouw & Voedsel', 'Anders',
]

const GROOTTES = [
  { val: '1-10',    label: '1 – 10',    sub: 'Klein team' },
  { val: '11-25',   label: '11 – 25',   sub: 'Groeiend bedrijf' },
  { val: '26-50',   label: '26 – 50',   sub: 'Middelgroot' },
  { val: '51-100',  label: '51 – 100',  sub: 'Groter bedrijf' },
  { val: '101-250', label: '101 – 250', sub: 'Groot bedrijf' },
  { val: '250+',    label: '250+',      sub: 'Enterprise' },
]

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────
function VoortgangsBalk({ huidig, totaal }: { huidig: number; totaal: number }) {
  const pct = Math.min(100, (huidig / (totaal - 1)) * 100)
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Stap {Math.min(huidig + 1, totaal)} van {totaal - 1}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1D9E75' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999,
          background: 'linear-gradient(90deg, #1D9E75, #15B89A)',
          width: `${pct}%`,
          transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

function Veld({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
      {sub && <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>{sub}</p>}
      {children}
    </div>
  )
}

const inputStijl: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
  padding: '12px 16px', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s', boxSizing: 'border-box', background: 'white',
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStijl, ...props.style }}
      onFocus={e => { e.target.style.borderColor = '#1D9E75'; props.onFocus?.(e) }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; props.onBlur?.(e) }}
    />
  )
}

function Knop({ onClick, disabled, children, variant = 'primary' }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: 'primary' | 'ghost'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '13px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        border: variant === 'ghost' ? '1.5px solid #E5E7EB' : 'none',
        background: variant === 'primary' ? 'linear-gradient(135deg, #1D9E75, #15B89A)' : 'white',
        color: variant === 'primary' ? 'white' : '#6B7280',
        boxShadow: variant === 'primary' ? '0 4px 14px rgba(29,158,117,0.28)' : 'none',
      }}
    >{children}</button>
  )
}

// ─── ReadinessRing SVG ────────────────────────────────────────────────────────
function ReadinessRing({ score, kleur }: { score: number; kleur: string }) {
  const radius = 54
  const omtrek = 2 * Math.PI * radius
  const voortgang = (score / 100) * omtrek
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={70} cy={70} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={12} />
      <circle
        cx={70} cy={70} r={radius} fill="none"
        stroke={kleur} strokeWidth={12}
        strokeDasharray={`${voortgang} ${omtrek}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text x={70} y={65} textAnchor="middle" fontSize={28} fontWeight={800} fill="#111827">{score}</text>
      <text x={70} y={85} textAnchor="middle" fontSize={11} fill="#9CA3AF">/100</text>
    </svg>
  )
}

// ─── EersteMeting stap ────────────────────────────────────────────────────────
function EersteMeting({
  meting, setMeting, onVolgende, onTerug, bezig,
}: {
  meting: EersteMeting
  setMeting: React.Dispatch<React.SetStateAction<EersteMeting>>
  onVolgende: () => void
  onTerug: () => void
  bezig: boolean
}) {
  const alleIngevuld = meting.slaap !== null && meting.energie !== null && meting.stemming !== null

  const SLAAP_EMOJIS = ['😫', '😕', '😐', '😊', '🤩']
  const ENERGIE_EMOJIS = ['⚡', '⚡⚡', '⚡⚡⚡', '⚡⚡⚡⚡', '⚡⚡⚡⚡⚡']
  const STEMMING_EMOJIS = ['😞', '😔', '😐', '🙂', '😄']

  function EmojiSchaal({
    vraag, emojis, waarde, onChange,
  }: {
    vraag: string
    emojis: string[]
    waarde: number | null
    onChange: (v: number) => void
  }) {
    return (
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>{vraag}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {emojis.map((emoji, i) => {
            const val = i + 1
            const geselecteerd = waarde === val
            return (
              <button
                key={val}
                type="button"
                onClick={() => onChange(val)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  borderRadius: 12,
                  border: `2px solid ${geselecteerd ? '#1D9E75' : '#E5E7EB'}`,
                  background: geselecteerd ? '#E1F5EE' : '#F9FAFB',
                  cursor: 'pointer',
                  fontSize: 22,
                  transition: 'all 0.15s',
                  transform: geselecteerd ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: geselecteerd ? '0 2px 10px rgba(29,158,117,0.22)' : 'none',
                }}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (meting.geladen && meting.score !== null) {
    const { label, uitleg, kleur } = readinessLabel(meting.score)
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Jouw eerste Readiness Score
          </h2>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Gebaseerd op slaap, energie en stemming</p>
        </div>

        <div style={{
          padding: '28px 24px', borderRadius: 20,
          background: 'linear-gradient(135deg, #F0FDF8, #EFF6FF)',
          border: `2px solid ${kleur}30`,
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <ReadinessRing score={meting.score} kleur={kleur} />
          <div style={{ marginTop: 16 }}>
            <span style={{
              display: 'inline-block', fontSize: 13, fontWeight: 800, padding: '4px 14px',
              borderRadius: 20, background: kleur + '20', color: kleur, marginBottom: 8,
            }}>{label}</span>
            <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>{uitleg}</p>
          </div>
        </div>

        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: '#F9FAFB', border: '1px solid #E5E7EB',
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Morgenvroeg vergelijken we dit. Zo zien we hoe je evolueert.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Knop onClick={onVolgende} disabled={bezig}>
            {bezig ? 'Opslaan...' : 'Ga naar mijn app →'}
          </Knop>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎯</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Jouw eerste meting
        </h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>
          Dit duurt 30 seconden. Dan zien we gelijk hoe je je voelt.
        </p>
      </div>

      <EmojiSchaal
        vraag="Hoe sliep je gisteravond?"
        emojis={SLAAP_EMOJIS}
        waarde={meting.slaap}
        onChange={v => setMeting(m => ({ ...m, slaap: v }))}
      />

      <EmojiSchaal
        vraag="Hoe is je energieniveau nu?"
        emojis={ENERGIE_EMOJIS}
        waarde={meting.energie}
        onChange={v => setMeting(m => ({ ...m, energie: v }))}
      />

      <EmojiSchaal
        vraag="Hoe voel je je op dit moment?"
        emojis={STEMMING_EMOJIS}
        waarde={meting.stemming}
        onChange={v => setMeting(m => ({ ...m, stemming: v }))}
      />

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 8 }}>
        <Knop onClick={onTerug} variant="ghost">← Terug</Knop>
        <Knop
          onClick={() => {
            if (meting.slaap === null || meting.energie === null || meting.stemming === null) return
            const score = Math.min(100, berekenReadiness(
              (meting.slaap - 1) / 4,
              (meting.energie - 1) / 4,
              (meting.stemming - 1) / 4,
            ))
            setMeting(m => ({ ...m, score: Math.round(score), geladen: true }))
          }}
          disabled={!alleIngevuld}
        >
          Bereken mijn score →
        </Knop>
      </div>
    </div>
  )
}

// ─── Hoofd pagina ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [stap, setStap] = useState<'welkom' | 'profiel'>('welkom')
  const [rol, setRol] = useState<'hr' | 'zelfstandige' | 'other' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // HR stap state
  const [hrStap, setHrStap] = useState<HrStap>('welkom')

  // Gebruiker stap state
  const [gebrStap, setGebrStap] = useState<GebrStap>('welkom')

  // Eerste meting state
  const [meting, setMeting] = useState<EersteMeting>({
    slaap: null, energie: null, stemming: null, geladen: false, score: null,
  })

  // HR form
  const [hr, setHr] = useState({
    naam: '', functietitel: '', telefoon: '',
    bedrijfNaam: '', stad: '', kvk: '', website: '',
    sector: '', grootte: '',
  })

  // Gebruiker form
  const [gebr, setGebr] = useState({
    naam: '', geslacht: '' as '' | 'man' | 'vrouw' | 'anders' | 'zeg_ik_niet',
    geboortedatum: '', lengte_cm: '', gewicht_kg: '', hrCode: '',
    hrInzageRapporten: false,
    hrInzageBestanden: false,
  })

  // HR code validatie
  const [hrCodeBedrijf, setHrCodeBedrijf] = useState('')
  const hrCodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Maximaal toegestane geboortedatum (minimaal 14 jaar oud) — per mount vastgezet
  const [maxGeboortedatum] = useState(
    () => new Date(Date.now() - 14 * 365.25 * 86400000).toISOString().split('T')[0]
  )

  // Auth check
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, rol, onboarding_voltooid')
        .eq('id', user.id).single()

      if (profiel?.onboarding_voltooid) {
        const dest = profiel.rol === 'admin' ? '/admin' : profiel.rol === 'hr' ? '/hr' : '/home'
        router.replace(dest); return
      }

      const isHr = profiel?.rol === 'hr'
      const isZelfstandige = profiel?.rol === 'zelfstandige'
      setRol(isHr ? 'hr' : isZelfstandige ? 'zelfstandige' : 'other')
      if (profiel?.naam) {
        if (isHr) setHr(f => ({ ...f, naam: profiel.naam }))
        else setGebr(f => ({ ...f, naam: profiel.naam }))
      }
    }
    check()
  }, [router])

  // HR code live check
  useEffect(() => {
    if (hrCodeTimer.current) clearTimeout(hrCodeTimer.current)
    if (!gebr.hrCode || gebr.hrCode.length < 6) {
      hrCodeTimer.current = setTimeout(() => setHrCodeBedrijf(''), 0)
      return
    }
    hrCodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hr-code?code=${gebr.hrCode.toUpperCase()}`)
        const data = await res.json()
        setHrCodeBedrijf(data.geldig ? data.bedrijfsnaam : '')
      } catch { setHrCodeBedrijf('') }
    }, 500)
    return () => { if (hrCodeTimer.current) clearTimeout(hrCodeTimer.current) }
  }, [gebr.hrCode])

  // ── HR afronden ────────────────────────────────────────────────────────────
  async function hrAfronden() {
    if (!userId) return
    setBezig(true)

    const { data: bedrijf } = await supabase
      .from('bedrijven')
      .insert({
        naam: hr.bedrijfNaam.trim(),
        sector: hr.sector || null,
        grootte: hr.grootte || null,
        stad: hr.stad.trim() || null,
        website: hr.website.trim() || null,
        kvk_nummer: hr.kvk.trim() || null,
      })
      .select('id')
      .single()

    await supabase.from('profiles').update({
      naam: hr.naam.trim(),
      functie: hr.functietitel.trim() || null,
      telefoon: hr.telefoon.trim() || null,
      bedrijf_id: bedrijf?.id ?? null,
      onboarding_voltooid: true,
    }).eq('id', userId)

    setHrStap('klaar')
    setBezig(false)
  }

  // ── Sla eerste meting op en rond daarna af ─────────────────────────────────
  async function slaEersteMeting() {
    if (!userId || meting.slaap === null || meting.energie === null || meting.stemming === null) return
    setBezig(true)

    const vandaag = new Date().toISOString().split('T')[0]
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    await Promise.allSettled([
      fetch('/api/stemming', {
        method: 'POST',
        headers,
        body: JSON.stringify({ score: meting.stemming, notitie: 'Ingevoerd tijdens onboarding' }),
      }),
      fetch('/api/slaap', {
        method: 'POST',
        headers,
        body: JSON.stringify({ kwaliteit: meting.slaap, datum: vandaag }),
      }),
    ])
  }

  // ── Gebruiker afronden (zonder eerste meting) ──────────────────────────────
  async function gebruikerAfronden() {
    if (!userId) return
    setBezig(true)

    const updates: Record<string, unknown> = {
      naam: gebr.naam.trim(),
      onboarding_voltooid: true,
      hr_inzage_rapporten: gebr.hrInzageRapporten,
      hr_inzage_bestanden: gebr.hrInzageBestanden,
    }
    if (gebr.geboortedatum) updates.geboortedatum = gebr.geboortedatum
    if (gebr.lengte_cm) updates.lengte_cm = parseInt(gebr.lengte_cm)
    if (gebr.gewicht_kg) updates.gewicht_kg = parseFloat(gebr.gewicht_kg.replace(',', '.'))
    if (gebr.geslacht) updates.geslacht = gebr.geslacht

    if (gebr.hrCode && hrCodeBedrijf) {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/hr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ code: gebr.hrCode.toUpperCase() }),
      })
      updates.rol = 'medewerker'
    }

    await supabase.from('profiles').update(updates).eq('id', userId)
    setGebrStap('klaar')
    setBezig(false)
  }

  // ── Gebruiker afronden na eerste meting ────────────────────────────────────
  async function gebruikerAfrondenMetMeting() {
    if (!userId) return
    setBezig(true)

    await slaEersteMeting()

    const updates: Record<string, unknown> = {
      naam: gebr.naam.trim(),
      onboarding_voltooid: true,
      hr_inzage_rapporten: gebr.hrInzageRapporten,
      hr_inzage_bestanden: gebr.hrInzageBestanden,
    }
    if (gebr.geboortedatum) updates.geboortedatum = gebr.geboortedatum
    if (gebr.lengte_cm) updates.lengte_cm = parseInt(gebr.lengte_cm)
    if (gebr.gewicht_kg) updates.gewicht_kg = parseFloat(gebr.gewicht_kg.replace(',', '.'))
    if (gebr.geslacht) updates.geslacht = gebr.geslacht

    if (gebr.hrCode && hrCodeBedrijf) {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/hr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ code: gebr.hrCode.toUpperCase() }),
      })
      updates.rol = 'medewerker'
    }

    await supabase.from('profiles').update(updates).eq('id', userId)
    setBezig(false)
    window.location.href = '/home'
  }

  if (stap === 'welkom') return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'linear-gradient(160deg, #E8F8F2 0%, #EBF4FB 50%, #F0EEFF 100%)' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, letterSpacing: '-0.03em' }}>
          Welkom bij MentaForce
        </h1>
        <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 36, lineHeight: 1.6 }}>
          Jouw persoonlijke welzijnscoach. In 3 minuten per week weet je hoe je er echt voor staat.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, textAlign: 'left' }}>
          {([
            { icon: '📊', title: 'Wekelijkse check-in', desc: 'Beantwoord vragen over slaap, stress, energie en meer.' },
            { icon: '🤖', title: 'Persoonlijk AI-rapport', desc: 'AI analyseert jouw antwoorden en geeft gerichte tips.' },
            { icon: '🎯', title: 'Concreet actieplan', desc: 'Praktische stappen om beter te voelen en te presteren.' },
          ] as const).map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStap('profiel')}
          style={{ width: '100%', background: '#1D9E75', color: 'white', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(29,158,117,0.35)' }}
        >
          Aan de slag →
        </button>
      </div>
    </main>
  )

  if (rol === null) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#1D9E75', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: rol === 'hr'
        ? 'linear-gradient(135deg, #EEF2FF 0%, #F9FAFB 50%, #E1F5EE 100%)'
        : 'linear-gradient(135deg, #F0FDF8 0%, #F9FAFB 50%, #EEF2FF 100%)',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'white', borderRadius: 24,
        border: '1px solid #E5E7EB',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        padding: '40px 36px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1D9E75, #15B89A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌿</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>MentaForce</span>
            <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: rol === 'hr' ? '#EEF2FF' : '#E1F5EE', color: rol === 'hr' ? '#4F46E5' : '#0F6E56', fontWeight: 700 }}>
              {rol === 'hr' ? 'HR Setup' : 'Welkom'}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HR FLOW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {rol === 'hr' && (
          <>
            {hrStap !== 'welkom' && hrStap !== 'klaar' && (
              <VoortgangsBalk huidig={HR_STAPPEN.indexOf(hrStap)} totaal={HR_STAPPEN.length} />
            )}

            {/* ── HR: WELKOM ── */}
            {hrStap === 'welkom' && (
              <div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Welkom, HR-professional</h1>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Laten we jouw organisatie instellen in MentaForce. We stellen je een paar vragen over jou en je bedrijf — zo is het platform direct op maat.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {[
                    { emoji: '🏢', tekst: 'Jouw bedrijfsprofiel aanmaken' },
                    { emoji: '📊', tekst: 'Sector en teamgrootte instellen' },
                    { emoji: '🔑', tekst: 'Automatisch een HR code genereren voor werknemers' },
                  ].map(({ emoji, tekst }) => (
                    <div key={tekst} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <p style={{ fontSize: 13, color: '#374151' }}>{tekst}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Duurt minder dan 3 minuten · eenmalig</p>
                <Knop onClick={() => setHrStap('gegevens')}>Beginnen →</Knop>
              </div>
            )}

            {/* ── HR: JOUW GEGEVENS ── */}
            {hrStap === 'gegevens' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>😊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jouw gegevens</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Hoe mogen we je noemen en wat is je rol?</p>

                <Veld label="Volledige naam *">
                  <Input value={hr.naam} onChange={e => setHr(f => ({ ...f, naam: e.target.value }))} placeholder="Voor- en achternaam" autoFocus />
                </Veld>
                <Veld label="Functietitel" sub="Bijv. HR Manager, People & Culture Lead">
                  <Input value={hr.functietitel} onChange={e => setHr(f => ({ ...f, functietitel: e.target.value }))} placeholder="HR Manager" />
                </Veld>
                <Veld label="Telefoonnummer" sub="Voor contact met het MentaForce-team (optioneel)">
                  <Input type="tel" value={hr.telefoon} onChange={e => setHr(f => ({ ...f, telefoon: e.target.value }))} placeholder="+32 4xx xx xx xx" />
                </Veld>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
                  <Knop onClick={() => setHrStap('welkom')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setHrStap('bedrijf')} disabled={!hr.naam.trim()}>Volgende →</Knop>
                </div>
              </div>
            )}

            {/* ── HR: BEDRIJF NAAM & LOCATIE ── */}
            {hrStap === 'bedrijf' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jouw organisatie</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Basisinformatie over het bedrijf</p>

                <Veld label="Bedrijfsnaam *">
                  <Input value={hr.bedrijfNaam} onChange={e => setHr(f => ({ ...f, bedrijfNaam: e.target.value }))} placeholder="Naam van het bedrijf" autoFocus />
                </Veld>
                <Veld label="Stad / vestigingsplaats">
                  <Input value={hr.stad} onChange={e => setHr(f => ({ ...f, stad: e.target.value }))} placeholder="Bijv. Amsterdam, Brussel..." />
                </Veld>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Veld label="KvK-nummer" sub="Optioneel">
                    <Input value={hr.kvk} onChange={e => setHr(f => ({ ...f, kvk: e.target.value }))} placeholder="12345678" />
                  </Veld>
                  <Veld label="Website" sub="Optioneel">
                    <Input value={hr.website} onChange={e => setHr(f => ({ ...f, website: e.target.value }))} placeholder="www.bedrijf.nl" />
                  </Veld>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
                  <Knop onClick={() => setHrStap('gegevens')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setHrStap('details')} disabled={!hr.bedrijfNaam.trim()}>Volgende →</Knop>
                </div>
              </div>
            )}

            {/* ── HR: BEDRIJF DETAILS ── */}
            {hrStap === 'details' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Bedrijfsdetails</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Helpt ons het platform te optimaliseren voor jouw organisatie</p>

                <Veld label="Sector / branche">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                    {SECTOREN.map(s => (
                      <button key={s} type="button" onClick={() => setHr(f => ({ ...f, sector: s }))}
                        style={{
                          padding: '9px 12px', borderRadius: 10, fontSize: 12, textAlign: 'left',
                          fontWeight: hr.sector === s ? 700 : 400, cursor: 'pointer',
                          border: `1.5px solid ${hr.sector === s ? '#1D9E75' : '#E5E7EB'}`,
                          background: hr.sector === s ? '#E1F5EE' : 'white',
                          color: hr.sector === s ? '#0F6E56' : '#6B7280',
                          transition: 'all 0.1s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Veld>

                <Veld label="Aantal medewerkers" sub="Hoe groot is de organisatie?">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {GROOTTES.map(g => (
                      <button key={g.val} type="button" onClick={() => setHr(f => ({ ...f, grootte: g.val }))}
                        style={{
                          padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${hr.grootte === g.val ? '#1D9E75' : '#E5E7EB'}`,
                          background: hr.grootte === g.val ? '#E1F5EE' : 'white',
                          transition: 'all 0.1s', textAlign: 'center',
                        }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: hr.grootte === g.val ? '#0F6E56' : '#374151' }}>{g.label}</p>
                        <p style={{ fontSize: 10, color: hr.grootte === g.val ? '#1D9E75' : '#9CA3AF', marginTop: 2 }}>{g.sub}</p>
                      </button>
                    ))}
                  </div>
                </Veld>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
                  <Knop onClick={() => setHrStap('bedrijf')} variant="ghost">← Terug</Knop>
                  <Knop onClick={hrAfronden} disabled={bezig}>
                    {bezig ? 'Opslaan...' : 'Account activeren →'}
                  </Knop>
                </div>
              </div>
            )}

            {/* ── HR: KLAAR ── */}
            {hrStap === 'klaar' && (
              <div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Organisatie aangemaakt!</h2>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Je HR-account is klaar. Dit is je startpunt:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {[
                    { emoji: '🏢', tekst: hr.bedrijfNaam, sub: `${hr.sector || 'Sector'} · ${hr.grootte || '?'} medewerkers` },
                    { emoji: '🔑', tekst: 'HR Code automatisch gegenereerd', sub: 'Deel met werknemers via Instellingen → Bedrijf' },
                    { emoji: '📊', tekst: 'Dashboard klaar voor gebruik', sub: 'Check-in data verschijnt zodra werknemers zich aanmelden' },
                  ].map(item => (
                    <div key={item.tekst} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: 22 }}>{item.emoji}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.tekst}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => { window.location.href = '/hr' }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(24,95,165,0.3)',
                  }}>
                  Naar het HR portaal 🚀
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ZELFSTANDIGE FLOW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {rol === 'zelfstandige' && (
          <>
            {gebrStap !== 'welkom' && gebrStap !== 'klaar' && (
              <VoortgangsBalk
                huidig={['welkom', 'profiel', 'eerste-meting', 'lichaam', 'klaar'].indexOf(gebrStap)}
                totaal={5}
              />
            )}

            {gebrStap === 'welkom' && (
              <div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Welkom bij MentaForce</h1>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Even kennismaken. Duurt minder dan <strong>2 minuten</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                  {[
                    { emoji: '🎯', tekst: 'Persoonlijke vitaliteitsscores' },
                    { emoji: '🤖', tekst: 'Betere AI-coach adviezen' },
                    { emoji: '💪', tekst: 'Sport & fitness schema op maat' },
                  ].map(({ emoji, tekst }) => (
                    <div key={tekst} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B7280', padding: '8px 12px', borderRadius: 10, background: '#F9FAFB' }}>
                      <span style={{ fontSize: 18 }}>{emoji}</span>{tekst}
                    </div>
                  ))}
                </div>
                <Knop onClick={() => setGebrStap('profiel')}>Beginnen →</Knop>
              </div>
            )}

            {gebrStap === 'profiel' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>😊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jouw profiel</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Hoe mogen we je noemen?</p>

                <Veld label="Naam *">
                  <Input value={gebr.naam} onChange={e => setGebr(f => ({ ...f, naam: e.target.value }))} placeholder="Jouw naam" autoFocus />
                </Veld>

                <Veld label="Geslacht">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([
                      { val: 'man', label: '♂ Man' }, { val: 'vrouw', label: '♀ Vrouw' },
                      { val: 'anders', label: '⚧ Anders' }, { val: 'zeg_ik_niet', label: '— Zeg ik niet' },
                    ] as const).map(opt => (
                      <button key={opt.val} type="button" onClick={() => setGebr(f => ({ ...f, geslacht: opt.val }))}
                        style={{
                          padding: '10px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                          fontWeight: gebr.geslacht === opt.val ? 700 : 400,
                          border: `1.5px solid ${gebr.geslacht === opt.val ? '#1D9E75' : '#E5E7EB'}`,
                          background: gebr.geslacht === opt.val ? '#E1F5EE' : 'white',
                          color: gebr.geslacht === opt.val ? '#0F6E56' : '#6B7280',
                          transition: 'all 0.12s',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Veld>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
                  <Knop onClick={() => setGebrStap('welkom')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setGebrStap('eerste-meting')} disabled={!gebr.naam.trim()}>Volgende →</Knop>
                </div>
              </div>
            )}

            {gebrStap === 'eerste-meting' && (
              <EersteMeting
                meting={meting}
                setMeting={setMeting}
                onTerug={() => setGebrStap('profiel')}
                onVolgende={() => setGebrStap('lichaam')}
                bezig={false}
              />
            )}

            {gebrStap === 'lichaam' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Persoonlijke gegevens</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Voor nauwkeurige vitaliteitsberekeningen</p>

                <Veld label="Geboortedatum">
                  <Input type="date" value={gebr.geboortedatum} onChange={e => setGebr(f => ({ ...f, geboortedatum: e.target.value }))}
                    max={maxGeboortedatum} />
                </Veld>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Veld label="Lengte (cm)">
                    <Input type="number" value={gebr.lengte_cm} onChange={e => setGebr(f => ({ ...f, lengte_cm: e.target.value }))} placeholder="175" min={100} max={250} />
                  </Veld>
                  <Veld label="Gewicht (kg)">
                    <Input type="number" value={gebr.gewicht_kg} onChange={e => setGebr(f => ({ ...f, gewicht_kg: e.target.value }))} placeholder="70" min={30} max={300} step={0.1} />
                  </Veld>
                </div>

                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Alle velden optioneel — later invullen kan via Instellingen</p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                  <Knop onClick={() => setGebrStap('eerste-meting')} variant="ghost">← Terug</Knop>
                  <Knop onClick={async () => {
                    if (!userId) return
                    setBezig(true)
                    await slaEersteMeting()
                    const updates: Record<string, unknown> = {
                      naam: gebr.naam.trim(),
                      onboarding_voltooid: true,
                    }
                    if (gebr.geboortedatum) updates.geboortedatum = gebr.geboortedatum
                    if (gebr.lengte_cm) updates.lengte_cm = parseInt(gebr.lengte_cm)
                    if (gebr.gewicht_kg) updates.gewicht_kg = parseFloat(gebr.gewicht_kg.replace(',', '.'))
                    if (gebr.geslacht) updates.geslacht = gebr.geslacht
                    await supabase.from('profiles').update(updates).eq('id', userId)
                    setGebrStap('klaar')
                    setBezig(false)
                  }} disabled={bezig}>
                    {bezig ? 'Opslaan...' : 'Account activeren →'}
                  </Knop>
                </div>
              </div>
            )}

            {gebrStap === 'klaar' && (
              <div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Je bent klaar!</h2>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Jouw persoonlijke MentaForce-omgeving staat klaar.</p>
                <button onClick={() => { window.location.href = '/home' }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    background: 'linear-gradient(135deg, #1D9E75, #15B89A)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(29,158,117,0.3)',
                  }}>
                  Naar mijn dashboard 🚀
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GEBRUIKER / WERKNEMER FLOW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {rol === 'other' && (
          <>
            {gebrStap !== 'welkom' && gebrStap !== 'klaar' && (
              <VoortgangsBalk huidig={GEBR_STAPPEN.indexOf(gebrStap)} totaal={GEBR_STAPPEN.length} />
            )}

            {/* ── WELKOM ── */}
            {gebrStap === 'welkom' && (
              <div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Welkom bij MentaForce</h1>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                  Even kennismaken. We stellen je een paar korte vragen om jouw vitaliteitsplatform persoonlijk te maken. Duurt minder dan <strong>2 minuten</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                  {[
                    { emoji: '🎯', tekst: 'Persoonlijke vitaliteitsscores' },
                    { emoji: '🤖', tekst: 'Betere AI-coach adviezen' },
                    { emoji: '🏢', tekst: 'Optioneel koppelen aan je werkgever' },
                  ].map(({ emoji, tekst }) => (
                    <div key={tekst} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B7280', padding: '8px 12px', borderRadius: 10, background: '#F9FAFB' }}>
                      <span style={{ fontSize: 18 }}>{emoji}</span>{tekst}
                    </div>
                  ))}
                </div>
                <Knop onClick={() => setGebrStap('profiel')}>Beginnen →</Knop>
              </div>
            )}

            {/* ── PROFIEL ── */}
            {gebrStap === 'profiel' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>😊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jouw profiel</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Hoe mogen we je noemen?</p>

                <Veld label="Naam *">
                  <Input value={gebr.naam} onChange={e => setGebr(f => ({ ...f, naam: e.target.value }))} placeholder="Jouw naam" autoFocus />
                </Veld>

                <Veld label="Geslacht">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([
                      { val: 'man', label: '♂ Man' }, { val: 'vrouw', label: '♀ Vrouw' },
                      { val: 'anders', label: '⚧ Anders' }, { val: 'zeg_ik_niet', label: '— Zeg ik niet' },
                    ] as const).map(opt => (
                      <button key={opt.val} type="button" onClick={() => setGebr(f => ({ ...f, geslacht: opt.val }))}
                        style={{
                          padding: '10px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                          fontWeight: gebr.geslacht === opt.val ? 700 : 400,
                          border: `1.5px solid ${gebr.geslacht === opt.val ? '#1D9E75' : '#E5E7EB'}`,
                          background: gebr.geslacht === opt.val ? '#E1F5EE' : 'white',
                          color: gebr.geslacht === opt.val ? '#0F6E56' : '#6B7280',
                          transition: 'all 0.12s',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Veld>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
                  <Knop onClick={() => setGebrStap('welkom')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setGebrStap('eerste-meting')} disabled={!gebr.naam.trim()}>Volgende →</Knop>
                </div>
              </div>
            )}

            {/* ── EERSTE METING (2b) ── */}
            {gebrStap === 'eerste-meting' && (
              <EersteMeting
                meting={meting}
                setMeting={setMeting}
                onTerug={() => setGebrStap('profiel')}
                onVolgende={() => setGebrStap('lichaam')}
                bezig={false}
              />
            )}

            {/* ── LICHAAM ── */}
            {gebrStap === 'lichaam' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Persoonlijke gegevens</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Voor nauwkeurige vitaliteitsberekeningen</p>

                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#E1F5EE', border: '1px solid #A3DECE', fontSize: 12, color: '#0F6E56', marginBottom: 20 }}>
                  🔒 Nooit gedeeld met HR — alleen voor jouw persoonlijke dashboard
                </div>

                <Veld label="Geboortedatum">
                  <Input type="date" value={gebr.geboortedatum} onChange={e => setGebr(f => ({ ...f, geboortedatum: e.target.value }))}
                    max={maxGeboortedatum} />
                </Veld>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Veld label="Lengte (cm)">
                    <Input type="number" value={gebr.lengte_cm} onChange={e => setGebr(f => ({ ...f, lengte_cm: e.target.value }))} placeholder="175" min={100} max={250} />
                  </Veld>
                  <Veld label="Gewicht (kg)">
                    <Input type="number" value={gebr.gewicht_kg} onChange={e => setGebr(f => ({ ...f, gewicht_kg: e.target.value }))} placeholder="70" min={30} max={300} step={0.1} />
                  </Veld>
                </div>

                {gebr.lengte_cm && gebr.gewicht_kg && (() => {
                  const h = parseInt(gebr.lengte_cm) / 100, w = parseFloat(gebr.gewicht_kg)
                  if (!h || !w) return null
                  const bmi = w / (h * h)
                  const cat = bmi < 18.5 ? { label: 'Ondergewicht', k: '#378ADD' } : bmi < 25 ? { label: 'Gezond gewicht', k: '#1D9E75' } : bmi < 30 ? { label: 'Overgewicht', k: '#BA7517' } : { label: 'Obesitas', k: '#E24B4A' }
                  return <div style={{ padding: '8px 14px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', marginTop: -8, marginBottom: 12 }}><span style={{ fontSize: 13, color: '#6B7280' }}>BMI: <strong>{bmi.toFixed(1)}</strong></span><span style={{ fontSize: 12, fontWeight: 700, color: cat.k, padding: '2px 8px', borderRadius: 20, background: cat.k + '18' }}>{cat.label}</span></div>
                })()}

                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Alle velden optioneel — later invullen kan via Instellingen</p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                  <Knop onClick={() => setGebrStap('eerste-meting')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setGebrStap('privacy')}>Volgende →</Knop>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {gebrStap === 'privacy' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Privacy-instellingen</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Kies wat je HR-afdeling van jou mag inzien</p>

                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
                  MentaForce is gebouwd op privacy. Jij bepaalt wat HR kan zien. Deze keuze kun je altijd aanpassen via <strong>Instellingen → Privacy</strong>.
                </p>

                {[
                  {
                    key: 'hrInzageRapporten' as const,
                    titel: 'HR mag mijn AI-rapporten inzien',
                    sub: 'Check-in rapporten, DISC-profiel analyse en onboarding samenvatting',
                    actief: gebr.hrInzageRapporten,
                  },
                  {
                    key: 'hrInzageBestanden' as const,
                    titel: 'HR mag mijn gedeelde bestanden bekijken',
                    sub: 'Alleen bestanden die jij expliciet markeert als "Deel met HR"',
                    actief: gebr.hrInzageBestanden,
                  },
                ].map(opt => (
                  <div key={opt.key} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                    padding: '16px', borderRadius: 14, marginBottom: 12,
                    background: opt.actief ? '#E1F5EE' : '#F9FAFB',
                    border: `1.5px solid ${opt.actief ? '#A3DECE' : '#E5E7EB'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{opt.titel}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>{opt.sub}</p>
                    </div>
                    <button onClick={() => setGebr(f => ({ ...f, [opt.key]: !f[opt.key] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
                        background: opt.actief ? '#1D9E75' : '#E5E7EB', flexShrink: 0, position: 'relative',
                        transition: 'background 0.2s',
                      }}>
                      <span style={{
                        position: 'absolute', top: 2, left: opt.actief ? 22 : 2, width: 20, height: 20,
                        borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                ))}

                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.5 }}>
                  Standaard staat alles <strong>uit</strong>. Je kunt het altijd later aanzetten.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                  <Knop onClick={() => setGebrStap('lichaam')} variant="ghost">← Terug</Knop>
                  <Knop onClick={gebruikerAfrondenMetMeting} disabled={bezig}>
                    {bezig ? 'Opslaan...' : 'Afronden →'}
                  </Knop>
                </div>
              </div>
            )}

            {/* ── KLAAR ── */}
            {gebrStap === 'klaar' && (
              <div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Je bent klaar!</h2>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Welkom aan boord. Dit is je startpunt:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                  {[
                    { emoji: '✅', tekst: `Profiel: ${gebr.naam}` },
                    gebr.geboortedatum || gebr.lengte_cm ? { emoji: '📊', tekst: 'Persoonlijke gegevens opgeslagen' } : null,
                    meting.score !== null ? { emoji: '🎯', tekst: `Readiness Score: ${meting.score}/100` } : null,
                    hrCodeBedrijf ? { emoji: '🏢', tekst: `Gekoppeld aan ${hrCodeBedrijf}` } : { emoji: '👤', tekst: 'Persoonlijk account' },
                  ].filter(Boolean).map((item, i) => item && (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: 20 }}>{item.emoji}</span>
                      <p style={{ fontSize: 13, color: '#374151' }}>{item.tekst}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => { window.location.href = '/home' }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    background: 'linear-gradient(135deg, #1D9E75, #15B89A)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(29,158,117,0.35)',
                  }}>
                  Naar mijn dashboard 🚀
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
