'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogoFull } from '@/components/layout/Logo'
import { Check, User, Users } from 'lucide-react'
import { HR_CODE_PATROON, type Stap, type GebruikerType } from '@/components/auth/register-helpers'
import { GoogleSsoKnop, RegisterStapAccount } from '@/components/auth/RegisterStapAccount'
import { RegisterStapHrCode, RegisterStapProfiel } from '@/components/auth/RegisterStapProfiel'
import { RegisterStapBevestig } from '@/components/auth/RegisterStapBevestig'
import { RegisterZijpaneel } from '@/components/auth/RegisterZijpaneel'

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
                  background: gedaan ? 'var(--mf-green)' : actief ? 'var(--bg-subtle)' : 'var(--border)',
                  color: gedaan ? 'var(--bg-app)' : actief ? 'var(--text-1)' : 'var(--text-3)',
                  border: actief ? '2px solid var(--mf-green)' : 'none',
                }}
              >
                {gedaan ? <Check size={16} strokeWidth={3} aria-hidden /> : i + 1}
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

interface StapKiesTypeProps {
  type: GebruikerType | null
  onKies: (type: GebruikerType) => void
  onVerder: () => void
  onGoogle: () => void
}

function StapKiesType({ type, onKies, onVerder, onGoogle }: StapKiesTypeProps) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-1)' }}>Wie ben je?</h1>
      <p className="mb-6" style={{ color: 'var(--text-3)' }}>We passen MentaForce aan op basis van jouw rol.</p>

      <GoogleSsoKnop label="Snel registreren met Google" onClick={onGoogle} />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-4)' }}>of kies je rol</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {[
          {
            id: 'gebruiker' as GebruikerType,
            icon: User,
            titel: 'Gebruiker',
            beschrijving: 'Ik wil mijn eigen welzijn bijhouden en persoonlijke tools gebruiken.',
            badge: null as string | null,
          },
          {
            id: 'hr' as GebruikerType,
            icon: Users,
            titel: 'HR-manager of leidinggevende',
            beschrijving: 'Ik wil het welzijn van mijn team monitoren en HR-inzichten ontvangen.',
            badge: 'Voor teams & organisaties',
          },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => onKies(o.id)}
            className="relative text-left p-5 rounded-2xl border-2 transition-all"
            style={{
              borderColor: type === o.id ? 'var(--mf-green)' : 'var(--border)',
              background: type === o.id ? 'var(--mf-green-light)' : 'var(--bg-card)',
            }}
          >
            {o.badge && (
              <span className="absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                {o.badge}
              </span>
            )}
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--mf-green-light)' }}
              >
                <o.icon size={18} style={{ color: 'var(--mf-green)' }} />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{o.titel}</p>
                  {type === o.id && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>{o.beschrijving}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onVerder}
        disabled={!type}
        className="w-full py-4 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
        style={{
          background: 'var(--mf-green)', color: 'var(--bg-app)',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
        }}
      >
        Verder
      </button>
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

  // Stap 3 - account (e-mail evt. vooraf ingevuld vanaf de landingspagina)
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email')?.trim() ?? '')
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

  async function valideerHrCode() {
    const code = hrCode.toUpperCase().trim()
    if (!HR_CODE_PATROON.test(code)) {
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

  async function registreerMetGoogle() {
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/onboarding' },
    })
  }

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
          nieuwsbrief,
          // Bewaar de gevalideerde HR-code in de user-metadata, zodat de
          // koppeling niet verloren gaat als de sessie pas na
          // e-mailbevestiging ontstaat (signUpData.session is dan null).
          ...(type === 'gebruiker' && hrCodeBedrijfId
            ? { hr_code: hrCode.toUpperCase().trim() }
            : {}),
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

  async function verstuurBevestigingOpnieuw() {
    if (!email.trim()) return
    setResendBezig(true)
    await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResendBezig(false)
    setResendKlaar(true)
  }

  return (
    <div className="mf-mesh-bg min-h-screen flex flex-col">

      {/* Header */}
      <header
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/" aria-label="MentaForce home">
          <LogoFull iconSize={32} />
        </Link>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Al een account?{' '}
          <Link href="/login" className="font-semibold transition" style={{ color: 'var(--mf-green)' }}>
            Inloggen
          </Link>
        </p>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">

        {/* Left panel - form */}
        <div className="flex-1 flex items-start justify-center px-6 py-12">
          <div className="w-full max-w-lg">

            {stap !== 'bevestig' && (
              <StapIndicator stap={stap} huidig={stap} type={type} />
            )}

            {/* STAP 1: Kies type */}
            {stap === 'type' && (
              <StapKiesType
                type={type}
                onKies={setType}
                onVerder={() => {
                  if (!type) return
                  // Gebruikers krijgen de HR-code stap; HR gaat direct naar info
                  setStap(type === 'gebruiker' ? 'hrcode' : 'info')
                }}
                onGoogle={registreerMetGoogle}
              />
            )}

            {/* STAP 1b: HR Code invoer (alleen voor werknemers) */}
            {stap === 'hrcode' && (
              <RegisterStapHrCode
                hrCode={hrCode}
                bedrijfsnaam={hrCodeBedrijfsnaam}
                bezig={hrCodeBezig}
                fout={hrCodeFout}
                onHrCodeChange={v => { setHrCode(v); setHrCodeFout(null) }}
                onValideer={valideerHrCode}
                onTerug={() => setStap('type')}
                onOverslaan={() => {
                  setHrCodeBedrijfId(null)
                  setHrCodeBedrijfsnaam('')
                  setStap('info')
                }}
              />
            )}

            {/* STAP 2: Persoonlijke info */}
            {stap === 'info' && (
              <RegisterStapProfiel
                type={type}
                naam={naam}
                organisatie={organisatie}
                teamgrootte={teamgrootte}
                functie={functie}
                telefoon={telefoon}
                onNaamChange={setNaam}
                onOrganisatieChange={setOrganisatie}
                onTeamgrootteChange={setTeamgrootte}
                onFunctieChange={setFunctie}
                onTelefoonChange={setTelefoon}
                onTerug={() => setStap(type === 'gebruiker' ? 'hrcode' : 'type')}
                onVerder={() => naam.trim() && setStap('account')}
              />
            )}

            {/* STAP 3: Account aanmaken */}
            {stap === 'account' && (
              <RegisterStapAccount
                email={email}
                wachtwoord={wachtwoord}
                bevestigWachtwoord={bevestigWachtwoord}
                toonWachtwoord={toonWachtwoord}
                akkoord={akkoord}
                nieuwsbrief={nieuwsbrief}
                bezig={bezig}
                fout={fout}
                onEmailChange={v => { setEmail(v); setFout(null) }}
                onWachtwoordChange={setWachtwoord}
                onBevestigWachtwoordChange={setBevestigWachtwoord}
                onToonWachtwoordToggle={() => setToonWachtwoord(t => !t)}
                onAkkoordChange={setAkkoord}
                onNieuwsbriefChange={setNieuwsbrief}
                onGoogle={registreerMetGoogle}
                onTerug={() => setStap('info')}
                onRegistreer={registreer}
              />
            )}

            {/* STAP 4: Bevestiging */}
            {stap === 'bevestig' && (
              <RegisterStapBevestig
                email={email}
                resendBezig={resendBezig}
                resendKlaar={resendKlaar}
                onOpnieuwVersturen={verstuurBevestigingOpnieuw}
              />
            )}
          </div>
        </div>

        {/* Right panel - info */}
        {stap !== 'bevestig' && <RegisterZijpaneel type={type} />}
      </main>
    </div>
  )
}
