'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── HR onboarding stappen ────────────────────────────────────────────────────
type HrStap = 'welkom' | 'gegevens' | 'bedrijf' | 'details' | 'klaar'
const HR_STAPPEN: HrStap[] = ['welkom', 'gegevens', 'bedrijf', 'details', 'klaar']

// ─── Gebruiker/werknemer onboarding stappen ───────────────────────────────────
type GebrStap = 'welkom' | 'profiel' | 'lichaam' | 'hrcode' | 'klaar'
const GEBR_STAPPEN: GebrStap[] = ['welkom', 'profiel', 'lichaam', 'hrcode', 'klaar']

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

// ─── Hoofd pagina ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [rol, setRol] = useState<'hr' | 'other' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  // HR stap state
  const [hrStap, setHrStap] = useState<HrStap>('welkom')

  // Gebruiker stap state
  const [gebrStap, setGebrStap] = useState<GebrStap>('welkom')

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
  })

  // HR code validatie
  const [hrCodeBedrijf, setHrCodeBedrijf] = useState('')
  const [hrCodeFout, setHrCodeFout] = useState('')
  const [hrCodeBezig, setHrCodeBezig] = useState(false)
  const hrCodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setRol(isHr ? 'hr' : 'other')
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
    if (!gebr.hrCode || gebr.hrCode.length < 6) { setHrCodeBedrijf(''); setHrCodeFout(''); return }
    hrCodeTimer.current = setTimeout(async () => {
      setHrCodeBezig(true)
      try {
        const res = await fetch(`/api/hr-code?code=${gebr.hrCode.toUpperCase()}`)
        const data = await res.json()
        if (data.geldig) { setHrCodeBedrijf(data.bedrijfsnaam); setHrCodeFout('') }
        else { setHrCodeBedrijf(''); setHrCodeFout('Ongeldige code') }
      } catch { setHrCodeFout('Kan niet valideren') }
      setHrCodeBezig(false)
    }, 500)
    return () => { if (hrCodeTimer.current) clearTimeout(hrCodeTimer.current) }
  }, [gebr.hrCode])

  // ── HR afronden ────────────────────────────────────────────────────────────
  async function hrAfronden() {
    if (!userId) return
    setBezig(true)

    // 1. Maak bedrijf aan
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

    // 2. Update HR profiel
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

  // ── Gebruiker afronden ─────────────────────────────────────────────────────
  async function gebruikerAfronden() {
    if (!userId) return
    setBezig(true)

    const updates: Record<string, unknown> = {
      naam: gebr.naam.trim(),
      onboarding_voltooid: true,
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
                  <Knop onClick={() => setGebrStap('lichaam')} disabled={!gebr.naam.trim()}>Volgende →</Knop>
                </div>
              </div>
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
                    max={new Date(Date.now() - 14 * 365.25 * 86400000).toISOString().split('T')[0]} />
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
                  <Knop onClick={() => setGebrStap('profiel')} variant="ghost">← Terug</Knop>
                  <Knop onClick={() => setGebrStap('hrcode')}>Volgende →</Knop>
                </div>
              </div>
            )}

            {/* ── HR CODE ── */}
            {gebrStap === 'hrcode' && (
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Werkgever koppelen</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Optioneel — je kunt dit overslaan</p>

                <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, marginBottom: 20 }}>
                  Werkt u bij een organisatie die MentaForce gebruikt? Voer de HR code in die u van uw werkgever heeft ontvangen.
                </p>

                <Veld label="HR Code" sub="6 tekens — ontvangen van uw werkgever">
                  <div style={{ position: 'relative' }}>
                    <Input
                      value={gebr.hrCode}
                      onChange={e => setGebr(f => ({ ...f, hrCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }))}
                      placeholder="bijv. A3KZ9W"
                      maxLength={6}
                      style={{ ...inputStijl, fontSize: 20, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.2em', paddingRight: 44, borderColor: hrCodeFout ? '#E24B4A' : hrCodeBedrijf ? '#1D9E75' : '#E5E7EB' }}
                    />
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                      {hrCodeBezig && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: '#1D9E75', animation: 'spin 0.7s linear infinite' }} />}
                      {!hrCodeBezig && hrCodeBedrijf && <span style={{ color: '#1D9E75' }}>✓</span>}
                      {!hrCodeBezig && hrCodeFout && <span style={{ color: '#E24B4A' }}>✗</span>}
                    </div>
                  </div>
                  {hrCodeBedrijf && (
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#E1F5EE', border: '1px solid #A3DECE', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1D9E75, #185FA5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800 }}>HR</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{hrCodeBedrijf}</p>
                        <p style={{ fontSize: 11, color: '#4CAF87' }}>Je wordt als werknemer gekoppeld</p>
                      </div>
                    </div>
                  )}
                  {hrCodeFout && <p style={{ fontSize: 12, color: '#E24B4A', marginTop: 6 }}>{hrCodeFout}</p>}
                </Veld>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
                  <Knop onClick={() => setGebrStap('lichaam')} variant="ghost">← Terug</Knop>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!hrCodeBedrijf && (
                      <Knop onClick={gebruikerAfronden} variant="ghost" disabled={bezig}>Overslaan</Knop>
                    )}
                    <Knop onClick={gebruikerAfronden} disabled={bezig || (gebr.hrCode.length > 0 && !hrCodeBedrijf)}>
                      {bezig ? 'Opslaan...' : hrCodeBedrijf ? 'Koppelen & afronden →' : 'Afronden →'}
                    </Knop>
                  </div>
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
