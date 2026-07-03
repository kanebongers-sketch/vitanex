'use client'

import Link from 'next/link'
import { isEmailGeldig, berekenWachtwoordSterkte } from './register-helpers'

interface GoogleSsoKnopProps {
  label: string
  onClick: () => void
}

export function GoogleSsoKnop({ label, onClick }: GoogleSsoKnopProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 mb-5 font-semibold transition"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-strong)',
        color: 'var(--text-2)',
        fontSize: 15,
      }}
    >
      {/* Officiële Google-merkkleuren; vast onderdeel van het logo, geen thematokens */}
      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  )
}

export interface RegisterStapAccountProps {
  email: string
  wachtwoord: string
  bevestigWachtwoord: string
  toonWachtwoord: boolean
  akkoord: boolean
  nieuwsbrief: boolean
  bezig: boolean
  fout: string | null
  onEmailChange: (waarde: string) => void
  onWachtwoordChange: (waarde: string) => void
  onBevestigWachtwoordChange: (waarde: string) => void
  onToonWachtwoordToggle: () => void
  onAkkoordChange: (waarde: boolean) => void
  onNieuwsbriefChange: (waarde: boolean) => void
  onGoogle: () => void
  onTerug: () => void
  onRegistreer: () => void
}

export function RegisterStapAccount({
  email, wachtwoord, bevestigWachtwoord, toonWachtwoord, akkoord, nieuwsbrief,
  bezig, fout,
  onEmailChange, onWachtwoordChange, onBevestigWachtwoordChange,
  onToonWachtwoordToggle, onAkkoordChange, onNieuwsbriefChange,
  onGoogle, onTerug, onRegistreer,
}: RegisterStapAccountProps) {
  const emailGeldig = isEmailGeldig(email)
  const emailFout = !emailGeldig ? 'Voer een geldig e-mailadres in.' : null
  const sterkte = berekenWachtwoordSterkte(wachtwoord)

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-1)' }}>Maak je account aan</h1>
      <p className="mb-6" style={{ color: 'var(--text-3)' }}>Kies een sterk wachtwoord, of gebruik Google voor snelle toegang.</p>

      <GoogleSsoKnop label="Account aanmaken met Google" onClick={onGoogle} />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-4)' }}>of met e-mail</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label htmlFor="reg-email" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>E-mailadres *</label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="jij@bedrijf.be"
            autoFocus
            autoComplete="email"
            aria-describedby={emailFout ? 'reg-email-fout' : undefined}
            className="mf-input"
            style={{ borderColor: emailFout ? 'var(--mf-red)' : undefined }}
          />
          {emailFout && (
            <p id="reg-email-fout" className="text-xs mt-1" style={{ color: 'var(--mf-red)' }}>{emailFout}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-wachtwoord" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Wachtwoord *</label>
          <div className="relative">
            <input
              id="reg-wachtwoord"
              type={toonWachtwoord ? 'text' : 'password'}
              value={wachtwoord}
              onChange={e => onWachtwoordChange(e.target.value)}
              placeholder="Minimaal 8 tekens"
              autoComplete="new-password"
              className="mf-input pr-16"
            />
            <button
              type="button"
              onClick={onToonWachtwoordToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1 transition hover:opacity-70"
              style={{ color: 'var(--text-3)' }}
            >
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
          {wachtwoord.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: sterkte.niveau > i ? sterkte.kleur : 'var(--border)' }} />
              ))}
              <span className="text-xs w-10 font-medium" style={{ color: sterkte.kleur }}>{sterkte.tekst}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reg-bevestig" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-2)' }}>Wachtwoord bevestigen *</label>
          <input
            id="reg-bevestig"
            type={toonWachtwoord ? 'text' : 'password'}
            value={bevestigWachtwoord}
            onChange={e => onBevestigWachtwoordChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onRegistreer()}
            placeholder="Herhaal wachtwoord"
            autoComplete="new-password"
            aria-describedby={bevestigWachtwoord && wachtwoord !== bevestigWachtwoord ? 'reg-mismatch' : undefined}
            className="mf-input"
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
            onChange={e => onAkkoordChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded"
            style={{ accentColor: 'var(--mf-green)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>
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
            onChange={e => onNieuwsbriefChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded"
            style={{ accentColor: 'var(--mf-green)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>
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
          onClick={onTerug}
          className="px-6 py-4 rounded-xl text-sm font-medium transition hover:opacity-80"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border-strong)' }}
        >
          Terug
        </button>
        <button
          onClick={onRegistreer}
          disabled={bezig || !email || !emailGeldig || !wachtwoord || wachtwoord.length < 8 || wachtwoord !== bevestigWachtwoord || !akkoord}
          className="flex-1 py-4 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
          style={{
            background: 'var(--mf-green)', color: 'var(--bg-app)',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
          }}
        >
          {bezig ? (
            <>
              <div
                aria-hidden
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'color-mix(in srgb, var(--bg-app) 30%, transparent)', borderTopColor: 'var(--bg-app)' }}
              />
              Bezig...
            </>
          ) : (
            'Account aanmaken'
          )}
        </button>
      </div>

      <p className="text-xs text-center mt-4" style={{ color: 'var(--text-4)' }}>
        Je kunt altijd op elk moment je account verwijderen via Instellingen.
      </p>
    </div>
  )
}
