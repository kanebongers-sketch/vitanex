'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import { LogoFull } from '@/components/layout/Logo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { HeartHandshake, LogIn, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react'

const TOKEN_OPSLAG_SLEUTEL = 'mf_coaching_uitnodiging_token'

type Fase = 'laden' | 'geen-token' | 'ingelogd' | 'uitgelogd'

function WelkomInhoud() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [fase, setFase] = useState<Fase>('laden')
  const [token, setToken] = useState<string | null>(null)
  const [accepteerBezig, setAccepteerBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      // Token uit de URL, of uit eerdere opslag als de gebruiker terugkeert na inloggen.
      const urlToken = searchParams.get('token')?.trim() || null
      let opgeslagen: string | null = null
      try {
        opgeslagen = window.localStorage.getItem(TOKEN_OPSLAG_SLEUTEL)
      } catch {
        opgeslagen = null
      }
      const actiefToken = urlToken ?? opgeslagen

      if (!actiefToken) {
        setFase('geen-token')
        return
      }
      setToken(actiefToken)

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Opslag opruimen: we hebben nu een sessie en gaan direct accepteren.
        try { window.localStorage.removeItem(TOKEN_OPSLAG_SLEUTEL) } catch { /* opslag niet beschikbaar */ }
        setFase('ingelogd')
      } else {
        // Bewaar de token zodat die na registratie/inloggen behouden blijft.
        try { window.localStorage.setItem(TOKEN_OPSLAG_SLEUTEL, actiefToken) } catch { /* opslag niet beschikbaar */ }
        setFase('uitgelogd')
      }
    }
    init()
  }, [searchParams])

  const accepteer = useCallback(async () => {
    if (!token || accepteerBezig) return
    setAccepteerBezig(true)
    setFout(null)
    const res = await authFetch('/api/coaching/uitnodiging/accepteer', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    if (res.ok) {
      try { window.localStorage.removeItem(TOKEN_OPSLAG_SLEUTEL) } catch { /* opslag niet beschikbaar */ }
      router.push('/mijn-coach')
      return
    }
    const data = await res.json().catch(() => ({})) as { error?: string }
    setFout(data.error ?? 'Koppelen mislukt. Probeer het later opnieuw.')
    setAccepteerBezig(false)
  }, [token, accepteerBezig, router])

  const retourPad = token ? `/coaching/welkom?token=${encodeURIComponent(token)}` : '/coaching/welkom'
  const registerHref = `/register?next=${encodeURIComponent(retourPad)}`
  const loginHref = `/login?next=${encodeURIComponent(retourPad)}`

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 24px' }}>
        <Link href="/" aria-label="MentaForce home">
          <LogoFull iconSize={30} />
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Card style={{ width: '100%', maxWidth: 460, padding: '32px 28px' }}>

          {fase === 'laden' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div className="mf-spinner" aria-label="Laden" />
            </div>
          )}

          {fase === 'geen-token' && (
            <FoutBlok
              titel="Geen geldige uitnodiging"
              tekst="We konden geen uitnodiging vinden. Open de link uit je e-mail opnieuw, of vraag je coach om een nieuwe uitnodiging."
              onNaarHome={() => router.push('/home')}
            />
          )}

          {fase === 'ingelogd' && (
            <div style={{ textAlign: 'center' }}>
              <IconRing />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: '18px 0 8px' }}>
                Je coach nodigt je uit
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 22px' }}>
                Accepteer de koppeling om samen met je coach te werken aan je welzijn. Je bepaalt daarna
                zelf welke gegevens je deelt — die keuze kun je altijd aanpassen.
              </p>

              <Button
                onClick={accepteer}
                loading={accepteerBezig}
                leftIcon={<ShieldCheck size={16} aria-hidden />}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Koppeling accepteren
              </Button>

              {fout && (
                <p role="alert" style={{ fontSize: 13, color: 'var(--mf-red)', marginTop: 14, fontWeight: 600 }}>
                  {fout}
                </p>
              )}
            </div>
          )}

          {fase === 'uitgelogd' && (
            <div style={{ textAlign: 'center' }}>
              <IconRing />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: '18px 0 8px' }}>
                Je bent uitgenodigd
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 22px' }}>
                Maak een account aan of log in om de koppeling met je coach af te ronden. Kom daarna
                terug via de link in je e-mail om te bevestigen.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button
                  onClick={() => router.push(registerHref)}
                  leftIcon={<UserPlus size={16} aria-hidden />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Account aanmaken
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push(loginHref)}
                  leftIcon={<LogIn size={16} aria-hidden />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Ik heb al een account
                </Button>
              </div>
            </div>
          )}

        </Card>
      </main>
    </div>
  )
}

function IconRing() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--mf-green-light)', color: 'var(--mf-green)',
      }}
    >
      <HeartHandshake size={26} />
    </span>
  )
}

function FoutBlok({ titel, tekst, onNaarHome }: { titel: string; tekst: string; onNaarHome: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span
        aria-hidden
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-3)',
        }}
      >
        <AlertCircle size={26} />
      </span>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: '18px 0 8px' }}>
        {titel}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 22px' }}>
        {tekst}
      </p>
      <Button variant="secondary" onClick={onNaarHome} style={{ width: '100%', justifyContent: 'center' }}>
        Naar MentaForce
      </Button>
    </div>
  )
}

export default function CoachingWelkomPagina() {
  return (
    <Suspense fallback={
      <main className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mf-spinner" aria-hidden style={{ width: 32, height: 32 }} />
      </main>
    }>
      <WelkomInhoud />
    </Suspense>
  )
}
