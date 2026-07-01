'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Stap = 'type' | 'hrcode' | 'info' | 'account' | 'bevestig'
type GebruikerType = 'gebruiker' | 'hr'

const VOORDELEN_WERKNEMER = [
  { icon: '📈', tekst: 'Zie je eigen vitaliteitsverloop over tijd' },
  { icon: '🤖', tekst: 'AI-coach beschikbaar voor persoonlijk advies' },
  { icon: '📓', tekst: 'Privé journal voor reflectie en notities' },
  { icon: '🔒', tekst: 'Volledig anoniem tegenover je werkgever' },
  { icon: '🔥', tekst: 'Gewoontetracker met dagelijkse streaks' },
  { icon: '🎯', tekst: 'Focus- en hersteltools voor op het werk' },
]

const VOORDELEN_HR = [
  { icon: '📊', tekst: 'Realtime welzijnsdata van je hele team' },
  { icon: '⚠️', tekst: 'Vroege signalen bij burn-out risicos' },
  { icon: '💡', tekst: 'AI-inzichten en concrete HR-adviezen' },
  { icon: '📋', tekst: 'Anonieme pulse surveys met templates' },
  { icon: '📄', tekst: 'Exporteerbare rapporten voor management' },
  { icon: '🛡️', tekst: 'Privacy-by-design - AVG-conform' },
]


function StapIndicator({ huidig, type }: { stap: Stap; huidig: Stap; type: GebruikerType | null }) {
  // Gebruikers krijgen een extra HR-code stap; HR niet
  const stappen: Stap[] = type === 'gebruiker'
    ? ['type', 'hrcode', 'info', 'account', 'bevestig']
    : ['type', 'info', 'account', 'bevestig']
  const labels = type === 'gebruiker'
    ? ['Jouw rol', 'HR Code', 'Gegevens', 'Account', 'Bevestiging']
    : ['Jouw rol', 'Gegevens', 'Account', 'Bevestiging']
  const huidigeIndex = stappen.indexOf(huidig)

  return (
    <div className="flex items-center gap-0 mb-10">
      {stappen.map((s, i) => {
        const gedaan = i < huidigeIndex
        const actief = s === huidig
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: gedaan ? 'var(--mf-green)' : actief ? '#0a0f1e' : 'var(--border)',
                  color: gedaan ? 'white' : actief ? 'white' : 'var(--text-3)',
                  border: actief ? '2px solid #1D9E75' : 'none',
                }}
              >
                {gedaan ? 'v' : i + 1}
              </div>
              <span className="text-xs mt-1.5 font-medium hidden sm:block"
                style={{ color: actief ? 'var(--mf-green)' : gedaan ? 'var(--text-2)' : 'var(--text-3)' }}>
                {labels[i]}
              </span>
            </div>
            {i < stappen.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-0 sm:-mt-4 transition-all"
                style={{ background: gedaan ? 'var(--mf-green)' : 'var(--border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Register() {
  const [stap, setStap] = useState<Stap>('type')
  const [type, setType] = useState<GebruikerType | null>(null)

  // Stap 2 - persoonlijke info
  const [naam, setNaam] = useState('')
  const [organisatie, setOrganisatie] = useState('')
  const [teamgrootte, setTeamgrootte] = useState('')
  const [functie, setFunctie] = useState('')
  const [telefoon, setTelefoon] = useState('')

  // Stap 3 - account
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState('')
  const [toonWachtwoord, setToonWachtwoord] = useState(false)
  const [akkoord, setAkkoord] = useState(false)
  const [nieuwsbrief, setNieuwsbrief] = useState(false)

  // Stap hrcode (alleen werknemers)
  const [hrCode, setHrCode] = useState('')
  const [hrCodeBedrijfId, setHrCodeBedrijfId] = useState<string | null>(null)
  const [hrCodeBedrijfsnaam, setHrCodeBedrijfsnaam] = useState('')
  const [hrCodeBezig, setHrCodeBezig] = useState(false)
  const [hrCodeFout, setHrCodeFout] = useState<string | null>(null)

  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [resendBezig, setResendBezig] = useState(false)
  const [resendKlaar, setResendKlaar] = useState(false)

  // Email validatie feedback
  const emailGeldig = email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const emailFout = !emailGeldig ? 'Voer een geldig e-mailadres in.' : null

  async function valideerHrCode() {
    const code = hrCode.toUpperCase().trim()
    if (!/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
      setHrCodeFout('Voer een geldige code in, zoals FIT-X2K.')
      return
    }
    setHrCodeBezig(true)
    setHrCodeFout(null)
    try {
      const res = await fetch(`/api/hr-code/valideer?code=${encodeURIComponent(code)}`)
      const json = await res.json()
      if (!res.ok || !json.geldig) {
        setHrCodeFout(json.fout ?? 'Ongeldige HR code.')
      } else {
        setHrCodeBedrijfId(json.bedrijf_id)
        setHrCodeBedrijfsnaam(json.bedrijfsnaam)
        setStap('info')
      }
    } catch {
      setHrCodeFout('Netwerkfout. Controleer je verbinding en probeer opnieuw.')
    } finally {
      setHrCodeBezig(false)
    }
  }

  const wachtwoordSterkte = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3
  const sterkteTekst = ['Te kort', 'Matig', 'Goed', 'Sterk'][wachtwoordSterkte]
  const sterkteKleur = ['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)', 'var(--mf-green)'][wachtwoordSterkte]

  const voordelen = type === 'hr' ? VOORDELEN_HR : VOORDELEN_WERKNEMER

  async function registreer() {
    if (!email.trim() || !wachtwoord || wachtwoord !== bevestigWachtwoord || !akkoord) return
    if (wachtwoord.length < 8) { setFout('Wachtwoord moet minimaal 8 tekens zijn.'); return }
    setBezig(true)
    setFout(null)
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: wachtwoord,
      options: {
        data: {
          naam: naam.trim(),
          rol: type === 'hr' ? 'hr' : 'medewerker',
          organisatie: organisatie.trim(),
          functie: functie.trim(),
        },
      },
    })
    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('already registered') || m.includes('user already exists')) {
        setFout('Dit e-mailadres is al geregistreerd. Probeer in te loggen of reset je wachtwoord.')
      } else if (m.includes('password') && m.includes('weak')) {
        setFout('Kies een sterker wachtwoord met letters, cijfers en/of symbolen.')
      } else if (m.includes('invalid email')) {
        setFout('Voer een geldig e-mailadres in.')
      } else {
        setFout('Registratie mislukt. Controleer je gegevens en probeer opnieuw.')
      }
      setBezig(false)
      return
    }
    // Supabase kan een user teruggeven zonder error maar met identities=[] als het account al bestond
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      setFout('Dit e-mailadres is al geregistreerd. Probeer in te loggen of reset je wachtwoord.')
      setBezig(false)
      return
    }

    // Koppel HR code als de werknemer een geldige code heeft ingevoerd
    if (type === 'gebruiker' && hrCodeBedrijfId && signUpData.session?.access_token) {
      try {
        await fetch('/api/hr-code/koppel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${signUpData.session.access_token}`,
          },
          body: JSON.stringify({ code: hrCode.toUpperCase().trim() }),
        })
        // Fout bij koppelen is niet fataal: gebruiker kan later koppelen via Instellingen
      } catch {
        // stil negeren
      }
    }

    setBezig(false)
    setStap('bevestig')
  }

  return (
    <div className="mf-mesh-bg min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-sans)' }}>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--mf-green)' }}>
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">MentaForce</span>
        </Link>
        <p className="text-sm text-gray-500">
          Al een account?{' '}
          <Link href="/login" className="font-semibold transition" style={{ color: 'var(--mf-green)' }}>
            Inloggen
          </Link>
        </p>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">

        {/* Left panel - form */}
        <div className="flex-1 flex items-start justify-center px-6 py-12">
          <div className="w-full max-w-lg">

            {stap !== 'bevestig' && (
              <StapIndicator stap={stap} huidig={stap} type={type} />
            )}

            {/* STAP 1: Kies type */}
            {stap === 'type' && (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Wie ben je?</h1>
                <p className="text-gray-500 mb-6">We passen MentaForce aan op basis van jouw rol.</p>

                {/* Google SSO shortcut */}
                <button
                  onClick={async () => {
                    const { supabase } = await import('@/lib/supabase')
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: window.location.origin + '/onboarding' },
                    })
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 mb-5 font-semibold transition"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #e5e7eb',
                    color: 'var(--text-2)',
                    fontSize: 15,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Snel registreren met Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400">of kies je rol</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="flex flex-col gap-4 mb-8">
                  {[
                    {
                      id: 'gebruiker' as GebruikerType,
                      icon: '👤',
                      titel: 'Gebruiker',
                      beschrijving: 'Ik wil mijn eigen welzijn bijhouden en persoonlijke tools gebruiken.',
                      badge: null,
                    },
                    {
                      id: 'hr' as GebruikerType,
                      icon: '👥',
                      titel: 'HR-manager of leidinggevende',
                      beschrijving: 'Ik wil het welzijn van mijn team monitoren en HR-inzichten ontvangen.',
                      badge: 'Populairste keuze',
                    },
                  ].map(o => (
                    <button
                      key={o.id}
                      onClick={() => setType(o.id)}
                      className="relative text-left p-5 rounded-2xl border-2 transition-all"
                      style={{
                        borderColor: type === o.id ? 'var(--mf-green)' : 'var(--border)',
                        background: type === o.id ? 'var(--mf-green-light)' : 'white',
                      }}
                    >
                      {o.badge && (
                        <span className="absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full text-white"
                          style={{ background: 'var(--mf-green)' }}>
                          {o.badge}
                        </span>
                      )}
                      <div className="flex items-start gap-4">
                        <span className="text-3xl mt-0.5">{o.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{o.titel}</p>
                            {type === o.id && (
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: 'var(--mf-green)' }}>v</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{o.beschrijving}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!type) return
                    // Gebruikers krijgen de HR-code stap; HR gaat direct naar info
                    setStap(type === 'gebruiker' ? 'hrcode' : 'info')
                  }}
                  disabled={!type}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary, #1D9E75) 0%, var(--color-primary-dark, #15785A) 100%)',
                    boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                  }}
                >
                  Verder
                </button>
              </div>
            )}

            {/* STAP 1b: HR Code invoer (alleen voor werknemers) */}
            {stap === 'hrcode' && (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">HR Code van je werkgever</h1>
                <p className="text-gray-500 mb-8">
                  Voer de 7-tekens HR code in die je van je werkgever of HR-afdeling hebt ontvangen.
                  Geen code? Je kunt deze stap overslaan en later koppelen via Instellingen.
                </p>

                <div className="mb-6">
                  <label htmlFor="reg-hrcode" className="text-xs font-semibold text-gray-600 block mb-2">HR Code</label>
                  <input
                    id="reg-hrcode"
                    type="text"
                    aria-describedby={hrCodeFout ? 'reg-hrcode-fout' : undefined}
                    value={hrCode}
                    onChange={e => {
                      let v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                      if (v.length === 3 && !v.includes('-') && hrCode.length === 2) v = v + '-'
                      if (v.length > 7) v = v.slice(0, 7)
                      setHrCode(v)
                      setHrCodeFout(null)
                    }}
                    onKeyDown={e => e.key === 'Enter' && hrCode.length === 7 && valideerHrCode()}
                    placeholder="FIT-X2K"
                    maxLength={7}
                    autoFocus
                    className="w-full border-2 rounded-xl px-4 py-4 text-2xl font-mono font-bold text-center tracking-[0.3em] outline-none transition"
                    style={{
                      borderColor: hrCodeFout ? 'var(--mf-red)' : hrCode.length === 7 ? 'var(--mf-green)' : 'var(--border)',
                      color: '#0a0f1e',
                    }}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {hrCodeBedrijfsnaam && !hrCodeFout && hrCode.length === 7 && (
                    <div aria-live="polite" className="mt-3 rounded-xl px-4 py-2.5 text-sm font-medium"
                      style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)', color: 'var(--mf-green-dark)' }}>
                      Bedrijf gevonden: <strong>{hrCodeBedrijfsnaam}</strong>
                    </div>
                  )}
                  {hrCodeFout && (
                    <div id="reg-hrcode-fout" role="alert" aria-live="assertive" className="mt-3 rounded-xl px-4 py-2.5 text-sm"
                      style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', color: 'var(--mf-red)' }}>
                      {hrCodeFout}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStap('type')}
                    className="px-6 py-4 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Terug
                  </button>
                  <button
                    onClick={valideerHrCode}
                    disabled={hrCodeBezig || hrCode.length < 7}
                    className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary, #1D9E75) 0%, var(--color-primary-dark, #15785A) 100%)',
                      boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                    }}
                  >
                    {hrCodeBezig ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Controleren...
                      </>
                    ) : (
                      'Controleer & verder'
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setHrCodeBedrijfId(null)
                    setHrCodeBedrijfsnaam('')
                    setStap('info')
                  }}
                  className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition underline"
                >
                  Ik heb geen HR code, overslaan
                </button>
              </div>
            )}

            {/* STAP 2: Persoonlijke info */}
            {stap === 'info' && (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Vertel ons iets over jezelf</h1>
                <p className="text-gray-500 mb-8">Alleen je naam is verplicht. De rest is optioneel.</p>

                <div className="flex flex-col gap-4 mb-8">
                  <div>
                    <label htmlFor="reg-naam" className="text-xs font-semibold text-gray-600 block mb-1.5">Jouw naam *</label>
                    <input
                      id="reg-naam"
                      type="text"
                      value={naam}
                      onChange={e => setNaam(e.target.value)}
                      placeholder="Jan Janssen"
                      autoFocus
                      autoComplete="name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>

                  {(type === 'hr') && (
                    <>
                      <div>
                        <label htmlFor="reg-organisatie" className="text-xs font-semibold text-gray-600 block mb-1.5">Organisatie</label>
                        <input
                          id="reg-organisatie"
                          type="text"
                          value={organisatie}
                          onChange={e => setOrganisatie(e.target.value)}
                          placeholder="Naam van je bedrijf"
                          autoComplete="organization"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-teamgrootte" className="text-xs font-semibold text-gray-600 block mb-1.5">Teamgrootte</label>
                        <select
                          id="reg-teamgrootte"
                          value={teamgrootte}
                          onChange={e => setTeamgrootte(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white appearance-none"
                        >
                          <option value="" disabled>Selecteer aantal medewerkers</option>
                          <option value="10-24">10 tot 24 medewerkers</option>
                          <option value="25-49">25 tot 49 medewerkers</option>
                          <option value="50-99">50 tot 99 medewerkers</option>
                          <option value="100-249">100 tot 249 medewerkers</option>
                          <option value="250+">250 of meer medewerkers</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="reg-functie" className="text-xs font-semibold text-gray-600 block mb-1.5">Functie (optioneel)</label>
                    <input
                      id="reg-functie"
                      type="text"
                      value={functie}
                      onChange={e => setFunctie(e.target.value)}
                      placeholder={type === 'hr' ? 'bijv. HR Manager' : 'bijv. Software Developer'}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-telefoon" className="text-xs font-semibold text-gray-600 block mb-1.5">Telefoonnummer (optioneel)</label>
                    <input
                      id="reg-telefoon"
                      type="tel"
                      value={telefoon}
                      autoComplete="tel"
                      onChange={e => setTelefoon(e.target.value)}
                      placeholder="+32 4xx xx xx xx"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStap(type === 'gebruiker' ? 'hrcode' : 'type')}
                    className="px-6 py-4 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Terug
                  </button>
                  <button
                    onClick={() => naam.trim() && setStap('account')}
                    disabled={!naam.trim()}
                    className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary, #1D9E75) 0%, var(--color-primary-dark, #15785A) 100%)',
                      boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                    }}
                  >
                    Verder
                  </button>
                </div>
              </div>
            )}

            {/* STAP 3: Account aanmaken */}
            {stap === 'account' && (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Maak je account aan</h1>
                <p className="text-gray-500 mb-6">Kies een sterk wachtwoord, of gebruik Google voor snelle toegang.</p>

                {/* Google SSO */}
                <button
                  onClick={async () => {
                    const { supabase } = await import('@/lib/supabase')
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: window.location.origin + '/onboarding' },
                    })
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 mb-5 font-semibold transition"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid #e5e7eb',
                    color: 'var(--text-2)',
                    fontSize: 15,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Account aanmaken met Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400">of met e-mail</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label htmlFor="reg-email" className="text-xs font-semibold text-gray-600 block mb-1.5">E-mailadres *</label>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setFout(null) }}
                      placeholder="jij@bedrijf.be"
                      autoFocus
                      autoComplete="email"
                      aria-describedby={emailFout ? 'reg-email-fout' : undefined}
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition bg-white"
                      style={{ borderColor: emailFout ? 'var(--mf-red)' : 'var(--border)' }}
                    />
                    {emailFout && (
                      <p id="reg-email-fout" className="text-xs mt-1" style={{ color: 'var(--mf-red)' }}>{emailFout}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-wachtwoord" className="text-xs font-semibold text-gray-600 block mb-1.5">Wachtwoord *</label>
                    <div className="relative">
                      <input
                        id="reg-wachtwoord"
                        type={toonWachtwoord ? 'text' : 'password'}
                        value={wachtwoord}
                        onChange={e => setWachtwoord(e.target.value)}
                        placeholder="Minimaal 8 tekens"
                        autoComplete="new-password"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setToonWachtwoord(t => !t)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        {toonWachtwoord ? 'Verberg' : 'Toon'}
                      </button>
                    </div>
                    {wachtwoord.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                            style={{ background: wachtwoordSterkte > i ? sterkteKleur : 'var(--border)' }} />
                        ))}
                        <span className="text-xs w-10 font-medium" style={{ color: sterkteKleur }}>{sterkteTekst}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-bevestig" className="text-xs font-semibold text-gray-600 block mb-1.5">Wachtwoord bevestigen *</label>
                    <input
                      id="reg-bevestig"
                      type={toonWachtwoord ? 'text' : 'password'}
                      value={bevestigWachtwoord}
                      onChange={e => setBevestigWachtwoord(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && registreer()}
                      placeholder="Herhaal wachtwoord"
                      autoComplete="new-password"
                      aria-describedby={bevestigWachtwoord && wachtwoord !== bevestigWachtwoord ? 'reg-mismatch' : undefined}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                      style={{ borderColor: bevestigWachtwoord && wachtwoord !== bevestigWachtwoord ? 'var(--mf-red)' : '' }}
                    />
                    {bevestigWachtwoord && wachtwoord !== bevestigWachtwoord && (
                      <p id="reg-mismatch" className="text-xs mt-1" style={{ color: 'var(--mf-red)' }}>Wachtwoorden komen niet overeen</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={akkoord}
                      onChange={e => setAkkoord(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded"
                      style={{ accentColor: 'var(--mf-green)' }}
                    />
                    <span className="text-sm text-gray-600">
                      Ik ga akkoord met de{' '}
                      <Link href="/voorwaarden" target="_blank" className="font-semibold underline" style={{ color: 'var(--mf-green)' }}>
                        Algemene Voorwaarden
                      </Link>{' '}
                      en het privacy beleid van MentaForce.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nieuwsbrief}
                      onChange={e => setNieuwsbrief(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded"
                      style={{ accentColor: 'var(--mf-green)' }}
                    />
                    <span className="text-sm text-gray-600">
                      Stuur mij tips over welzijn op het werk en updates over MentaForce. (optioneel)
                    </span>
                  </label>
                </div>

                {fout && (
                  <div role="alert" aria-live="assertive" className="rounded-xl px-4 py-3 text-sm mb-4"
                    style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', color: 'var(--mf-red)' }}>
                    {fout}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStap('info')}
                    className="px-6 py-4 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Terug
                  </button>
                  <button
                    onClick={registreer}
                    disabled={bezig || !email || !emailGeldig || !wachtwoord || wachtwoord.length < 8 || wachtwoord !== bevestigWachtwoord || !akkoord}
                    className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary, #1D9E75) 0%, var(--color-primary-dark, #15785A) 100%)',
                      boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                    }}
                  >
                    {bezig ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      'Account aanmaken'
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Je kunt altijd op elk moment je account verwijderen via Instellingen.
                </p>
              </div>
            )}

            {/* STAP 4: Bevestiging */}
            {stap === 'bevestig' && (
              <div className="text-center py-8">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-8"
                  style={{ background: 'var(--mf-green-light)' }}>
                  ✉️
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Bevestig je e-mail</h1>
                <p className="text-gray-500 mb-2 text-base leading-relaxed">
                  We hebben een bevestigingsmail gestuurd naar
                </p>
                <p className="font-semibold text-gray-900 mb-6 text-lg">{email}</p>
                <p className="text-sm text-gray-400 mb-10 leading-relaxed max-w-sm mx-auto">
                  Klik op de link in de mail om je account te activeren. Check ook je spam-map als je niets ontvangt.
                </p>

                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-8 text-left">
                  <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Wat nu?</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: '1', tekst: 'Open je e-mail en klik op de bevestigingslink' },
                      { icon: '2', tekst: 'Je wordt doorgestuurd naar het inlogscherm' },
                      { icon: '3', tekst: 'Log in en doe je eerste check-in' },
                    ].map(s => (
                      <div key={s.icon} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'var(--mf-green)' }}>
                          {s.icon}
                        </div>
                        <p className="text-sm text-gray-600">{s.tekst}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login"
                  className="inline-flex items-center justify-center w-full py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary, #1D9E75) 0%, var(--color-primary-dark, #15785A) 100%)',
                    boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
                  }}>
                  Ga naar inloggen
                </Link>
                {resendKlaar ? (
                  <p className="text-xs text-center mt-4" style={{ color: 'var(--mf-green-dark)' }}>
                    Mail opnieuw verstuurd. Controleer ook je spam-map.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 text-center mt-4">
                    Geen mail ontvangen?{' '}
                    <button
                      disabled={resendBezig}
                      onClick={async () => {
                        if (!email.trim()) return
                        setResendBezig(true)
                        await supabase.auth.resend({ type: 'signup', email: email.trim() })
                        setResendBezig(false)
                        setResendKlaar(true)
                      }}
                      className="underline hover:text-gray-600 transition disabled:opacity-50"
                    >
                      {resendBezig ? 'Versturen...' : 'Opnieuw versturen'}
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel - info */}
        {stap !== 'bevestig' && (
          <div className="hidden lg:flex flex-col justify-center px-14 py-12 lg:w-[440px] xl:w-[500px] relative overflow-hidden"
            style={{ background: '#0a0f1e' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 70% at 80% 30%, rgba(29,158,117,0.12) 0%, transparent 60%)' }} />

            <div className="relative z-10">
              <div className="mb-10">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--mf-green)' }}>
                  {type === 'hr' ? 'Voor HR-managers' : 'Voor gebruikers'}
                </p>
                <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                  {type === 'hr'
                    ? 'Houd vinger aan de pols van je team'
                    : 'Jouw welzijn in jouw handen'}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {type === 'hr'
                    ? 'MentaForce geeft je realtime inzicht in het welzijn van je team - zonder de privacy van medewerkers te schenden.'
                    : 'Volg je eigen vitaliteit, ontvang persoonlijk advies en gebruik tools die je dagelijks beter laten functioneren.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-10">
                {voordelen.map(v => (
                  <div key={v.tekst} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center flex-shrink-0">{v.icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{v.tekst}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {type === 'hr' ? '👥' : '🌿'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(29,158,117,0.2)', color: 'var(--mf-green)' }}>
                    {type === 'hr' ? 'HR Platform' : 'Gebruikersportaal'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {type === 'hr'
                    ? 'Stel in minuten je bedrijfsprofiel in, nodig gebruikers uit via een HR-code en begin direct met het monitoren van teamwelzijn.'
                    : 'Doe wekelijks je check-in, gebruik de AI-coach en volg je eigen vitaliteit — optioneel koppel je aan je werkgever.'}
                </p>
                <div className="flex flex-col gap-1.5">
                  {(type === 'hr' ? VOORDELEN_HR : VOORDELEN_WERKNEMER).slice(0, 3).map(v => (
                    <div key={v.tekst} className="flex items-center gap-2">
                      <span className="text-sm">{v.icon}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{v.tekst}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                {['Gratis te starten', 'AVG-conform', 'Geen creditcard'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--mf-green)' }}>✓</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
