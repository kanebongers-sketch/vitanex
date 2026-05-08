'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Stap = 'type' | 'info' | 'account' | 'bevestig'
type GebruikerType = 'werknemer' | 'hr' | 'zelfstandige'

const VOORDELEN_WERKNEMER = [
  { icon: '??', tekst: 'Zie je eigen vitaliteitsverloop over tijd' },
  { icon: '??', tekst: 'AI-coach beschikbaar voor persoonlijk advies' },
  { icon: '??', tekst: 'Privé journal voor reflectie en notities' },
  { icon: '??', tekst: 'Volledig anoniem tegenover je werkgever' },
  { icon: '??', tekst: 'Gewoontetracker met dagelijkse streaks' },
  { icon: '??', tekst: 'Focus- en hersteltools voor op het werk' },
]

const VOORDELEN_HR = [
  { icon: '??', tekst: 'Realtime welzijnsdata van je hele team' },
  { icon: '?', tekst: 'Vroege signalen bij burn-out risicos' },
  { icon: '??', tekst: 'AI-inzichten en concrete HR-adviezen' },
  { icon: '??', tekst: 'Anonieme pulse surveys met templates' },
  { icon: '??', tekst: 'Exporteerbare rapporten voor management' },
  { icon: '??', tekst: 'Privacy-by-design - AVG-conform' },
]

const VOORDELEN_ZELFSTANDIGE = [
  { icon: '??', tekst: 'Persoonlijk vitaliteitsdashboard' },
  { icon: '??', tekst: 'AI-coach voor welzijn en productiviteit' },
  { icon: '??', tekst: 'Burn-out scan en vroege signalen' },
  { icon: '??', tekst: 'Journal en reflectietools' },
  { icon: '??', tekst: 'Gewoontetracker en focus timers' },
  { icon: '??', tekst: 'Persoonlijke trendanalyse over tijd' },
]

function StapIndicator({ stap, huidig }: { stap: Stap; huidig: Stap }) {
  const stappen: Stap[] = ['type', 'info', 'account', 'bevestig']
  const labels = ['Jouw rol', 'Gegevens', 'Account', 'Bevestiging']
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
                  background: gedaan ? '#1D9E75' : actief ? '#0a0f1e' : '#e5e7eb',
                  color: gedaan ? 'white' : actief ? 'white' : '#9ca3af',
                  border: actief ? '2px solid #1D9E75' : 'none',
                }}
              >
                {gedaan ? 'v' : i + 1}
              </div>
              <span className="text-xs mt-1.5 font-medium hidden sm:block"
                style={{ color: actief ? '#1D9E75' : gedaan ? '#374151' : '#9ca3af' }}>
                {labels[i]}
              </span>
            </div>
            {i < stappen.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-0 sm:-mt-4 transition-all"
                style={{ background: gedaan ? '#1D9E75' : '#e5e7eb' }} />
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

  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [resendBezig, setResendBezig] = useState(false)
  const [resendKlaar, setResendKlaar] = useState(false)

  const wachtwoordSterkte = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3
  const sterkteTekst = ['Te kort', 'Matig', 'Goed', 'Sterk'][wachtwoordSterkte]
  const sterkteKleur = ['#E24B4A', '#BA7517', '#1D9E75', '#1D9E75'][wachtwoordSterkte]

  const voordelen = type === 'hr' ? VOORDELEN_HR : type === 'zelfstandige' ? VOORDELEN_ZELFSTANDIGE : VOORDELEN_WERKNEMER

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
    setBezig(false)
    setStap('bevestig')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-app)', fontFamily: 'var(--font-geist-sans)' }}>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1D9E75' }}>
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">MentaForce</span>
        </Link>
        <p className="text-sm text-gray-500">
          Al een account?{' '}
          <Link href="/login" className="font-semibold transition" style={{ color: '#1D9E75' }}>
            Inloggen
          </Link>
        </p>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">

        {/* Left panel - form */}
        <div className="flex-1 flex items-start justify-center px-6 py-12">
          <div className="w-full max-w-lg">

            {stap !== 'bevestig' && (
              <StapIndicator stap={stap} huidig={stap} />
            )}

            {/* STAP 1: Kies type */}
            {stap === 'type' && (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Wie ben je?</h1>
                <p className="text-gray-500 mb-8">We passen MentaForce aan op basis van jouw rol.</p>

                <div className="flex flex-col gap-4 mb-8">
                  {[
                    {
                      id: 'werknemer' as GebruikerType,
                      icon: '??',
                      titel: 'Werknemer',
                      beschrijving: 'Ik wil mijn eigen welzijn bijhouden en persoonlijke tools gebruiken.',
                      badge: null,
                    },
                    {
                      id: 'hr' as GebruikerType,
                      icon: '??',
                      titel: 'HR-manager of leidinggevende',
                      beschrijving: 'Ik wil het welzijn van mijn team monitoren en HR-inzichten ontvangen.',
                      badge: 'Populairste keuze',
                    },
                    {
                      id: 'zelfstandige' as GebruikerType,
                      icon: '??',
                      titel: 'Zelfstandige of freelancer',
                      beschrijving: 'Ik werk voor mezelf en wil burn-out voorkomen en mijn energie bewaken.',
                      badge: null,
                    },
                  ].map(o => (
                    <button
                      key={o.id}
                      onClick={() => setType(o.id)}
                      className="relative text-left p-5 rounded-2xl border-2 transition-all"
                      style={{
                        borderColor: type === o.id ? '#1D9E75' : '#e5e7eb',
                        background: type === o.id ? '#F0FBF7' : 'white',
                      }}
                    >
                      {o.badge && (
                        <span className="absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full text-white"
                          style={{ background: '#1D9E75' }}>
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
                                style={{ background: '#1D9E75' }}>v</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{o.beschrijving}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => type && setStap('info')}
                  disabled={!type}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
                  style={{ background: '#1D9E75' }}
                >
                  Verder
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
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Jouw naam *</label>
                    <input
                      type="text"
                      value={naam}
                      onChange={e => setNaam(e.target.value)}
                      placeholder="Jan Janssen"
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>

                  {(type === 'hr') && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Organisatie</label>
                        <input
                          type="text"
                          value={organisatie}
                          onChange={e => setOrganisatie(e.target.value)}
                          placeholder="Naam van je bedrijf"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Teamgrootte</label>
                        <select
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
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Functie (optioneel)</label>
                    <input
                      type="text"
                      value={functie}
                      onChange={e => setFunctie(e.target.value)}
                      placeholder={type === 'hr' ? 'bijv. HR Manager' : 'bijv. Software Developer'}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Telefoonnummer (optioneel)</label>
                    <input
                      type="tel"
                      value={telefoon}
                      onChange={e => setTelefoon(e.target.value)}
                      placeholder="+32 4xx xx xx xx"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStap('type')}
                    className="px-6 py-4 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Terug
                  </button>
                  <button
                    onClick={() => naam.trim() && setStap('account')}
                    disabled={!naam.trim()}
                    className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
                    style={{ background: '#1D9E75' }}
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
                <p className="text-gray-500 mb-8">Kies een sterk wachtwoord. Je kunt altijd later een foto toevoegen.</p>

                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">E-mailadres *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jij@bedrijf.be"
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Wachtwoord *</label>
                    <div className="relative">
                      <input
                        type={toonWachtwoord ? 'text' : 'password'}
                        value={wachtwoord}
                        onChange={e => setWachtwoord(e.target.value)}
                        placeholder="Minimaal 8 tekens"
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
                            style={{ background: wachtwoordSterkte > i ? sterkteKleur : '#e5e7eb' }} />
                        ))}
                        <span className="text-xs w-10 font-medium" style={{ color: sterkteKleur }}>{sterkteTekst}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Wachtwoord bevestigen *</label>
                    <input
                      type={toonWachtwoord ? 'text' : 'password'}
                      value={bevestigWachtwoord}
                      onChange={e => setBevestigWachtwoord(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && registreer()}
                      placeholder="Herhaal wachtwoord"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                      style={{ borderColor: bevestigWachtwoord && wachtwoord !== bevestigWachtwoord ? '#E24B4A' : '' }}
                    />
                    {bevestigWachtwoord && wachtwoord !== bevestigWachtwoord && (
                      <p className="text-xs text-red-500 mt-1">Wachtwoorden komen niet overeen</p>
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
                      style={{ accentColor: '#1D9E75' }}
                    />
                    <span className="text-sm text-gray-600">
                      Ik ga akkoord met de{' '}
                      <Link href="/voorwaarden" target="_blank" className="font-semibold underline" style={{ color: '#1D9E75' }}>
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
                      style={{ accentColor: '#1D9E75' }}
                    />
                    <span className="text-sm text-gray-600">
                      Stuur mij tips over welzijn op het werk en updates over MentaForce. (optioneel)
                    </span>
                  </label>
                </div>

                {fout && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
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
                    disabled={bezig || !email || !wachtwoord || wachtwoord !== bevestigWachtwoord || !akkoord}
                    className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
                    style={{ background: '#1D9E75' }}
                  >
                    {bezig ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Account aanmaken...
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
                  style={{ background: '#E1F5EE' }}>
                  ??
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
                          style={{ background: '#1D9E75' }}>
                          {s.icon}
                        </div>
                        <p className="text-sm text-gray-600">{s.tekst}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login"
                  className="inline-flex items-center justify-center w-full py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                  style={{ background: '#1D9E75' }}>
                  Ga naar inloggen
                </Link>
                {resendKlaar ? (
                  <p className="text-xs text-center mt-4" style={{ color: '#0F6E56' }}>
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
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4ECBA5' }}>
                  {type === 'hr' ? 'Voor HR-managers' : type === 'zelfstandige' ? 'Voor zelfstandigen' : 'Voor werknemers'}
                </p>
                <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                  {type === 'hr'
                    ? 'Houd vinger aan de pols van je team'
                    : type === 'zelfstandige'
                    ? 'Jouw welzijn, jouw verantwoordelijkheid'
                    : 'Jouw welzijn in jouw handen'}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {type === 'hr'
                    ? 'MentaForce geeft je realtime inzicht in het welzijn van je team - zonder de privacy van medewerkers te schenden.'
                    : type === 'zelfstandige'
                    ? 'Zelfstandigen missen vaak de HR-structuur van een bedrijf. MentaForce vult dat op met persoonlijke tools.'
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
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-yellow-400 text-sm">?</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {type === 'hr'
                    ? '"We hebben een dreigende burn-out kunnen voorkomen dankzij de vroege signaaldetectie. De ROI was bewezen na de eerste maand."'
                    : type === 'zelfstandige'
                    ? '"Als freelancer had ik geen HR-support. MentaForce is nu mijn persoonlijke coach voor welzijn en productiviteit."'
                    : '"Eindelijk een tool die ik echt gebruik. De anonimiteit geeft me de vrijheid om eerlijk te zijn over hoe ik me voel."'}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#1D9E75' }}>
                    {type === 'hr' ? 'E' : type === 'zelfstandige' ? 'M' : 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {type === 'hr' ? 'Emma Baert' : type === 'zelfstandige' ? 'Mark Hendrix' : 'Sarah V.'}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {type === 'hr' ? 'HR Directeur' : type === 'zelfstandige' ? 'Freelance designer' : 'Marketing medewerker'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                {['Gratis te starten', 'AVG-conform', 'Geen creditcard'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: '#1D9E75' }}>v</span>
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
