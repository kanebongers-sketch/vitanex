'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import { LogoFull } from '@/components/layout/Logo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { HeartHandshake, LogIn, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react'

const TOKEN_OPSLAG_SLEUTEL = 'mf_coaching_uitnodiging_token'
const PRIVACY_KENMERKEN = ['AVG-conform', 'EU-gehost', 'Altijd intrekbaar'] as const

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
    <WelkomFrame>
      <span className="mf-coach-aura" aria-hidden style={{ top: '50%', left: '50%', transform: 'translate(-50%, -62%)' }} />
      <Card className="mf-card-glow mf-animate-up" style={{ position: 'relative', width: '100%', maxWidth: 460, padding: '36px 30px' }}>

        {fase === 'laden' && <LaadInhoud />}

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
            <p className="mf-overline" style={{ color: 'var(--mf-green)', margin: '18px 0 8px' }}>Uitnodiging van je coach</p>
            <h1 className="mf-h1" style={{ fontSize: 'clamp(22px, 4vw, 27px)', marginBottom: 10 }}>
              Je coach nodigt je uit
            </h1>
            <p className="mf-body" style={{ color: 'var(--text-3)', maxWidth: '38ch', margin: '0 auto 24px' }}>
              Accepteer de koppeling om samen met je coach aan je welzijn te werken. Jij bepaalt daarna
              zelf welke gegevens je deelt — en die keuze kun je altijd aanpassen.
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

            <PrivacyKenmerken />
          </div>
        )}

        {fase === 'uitgelogd' && (
          <div style={{ textAlign: 'center' }}>
            <IconRing />
            <p className="mf-overline" style={{ color: 'var(--mf-green)', margin: '18px 0 8px' }}>Uitnodiging van je coach</p>
            <h1 className="mf-h1" style={{ fontSize: 'clamp(22px, 4vw, 27px)', marginBottom: 10 }}>
              Je bent uitgenodigd
            </h1>
            <p className="mf-body" style={{ color: 'var(--text-3)', maxWidth: '38ch', margin: '0 auto 24px' }}>
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

            <PrivacyKenmerken />
          </div>
        )}

      </Card>
    </WelkomFrame>
  )
}

// ── Layout-frame: mesh-achtergrond + logo-header + gecentreerde inhoud ────────
function WelkomFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <header style={{ padding: '22px 26px', position: 'relative', zIndex: 1 }}>
        <Link href="/" aria-label="MentaForce home">
          <LogoFull iconSize={30} />
        </Link>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        {children}
      </main>
    </div>
  )
}

// ── Premium icoon-ring met cyaan-gloed ───────────────────────────────────────
function IconRing() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 60, height: 60, borderRadius: '50%',
        background: 'var(--mf-green-light)', color: 'var(--mf-green)',
        boxShadow: '0 0 32px rgba(0,229,255,0.22)',
      }}
    >
      <HeartHandshake size={26} strokeWidth={1.75} />
    </span>
  )
}

// ── Eerlijke privacy-kenmerken (echt: EU-gehost, AVG-conform, intrekbaar) ─────
function PrivacyKenmerken() {
  return (
    <ul aria-label="Privacy-waarborgen" style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, margin: '22px 0 0', padding: 0 }}>
      {PRIVACY_KENMERKEN.map(kenmerk => (
        <li
          key={kenmerk}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', padding: '4px 10px', borderRadius: 100, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <ShieldCheck size={11} aria-hidden style={{ color: 'var(--mf-green)' }} /> {kenmerk}
        </li>
      ))}
    </ul>
  )
}

// ── Laad-skeleton (shimmer i.p.v. spinner), gedeeld met de Suspense-fallback ──
function LaadInhoud() {
  return (
    <div role="status" aria-label="Bezig met laden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div className="mf-skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
      <div className="mf-skeleton" style={{ width: '68%', height: 22, borderRadius: 8 }} />
      <div className="mf-skeleton" style={{ width: '100%', height: 48, borderRadius: 10 }} />
      <div className="mf-skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-btn)' }} />
    </div>
  )
}

function FoutBlok({ titel, tekst, onNaarHome }: { titel: string; tekst: string; onNaarHome: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span
        aria-hidden
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-3)',
        }}
      >
        <AlertCircle size={26} strokeWidth={1.75} />
      </span>
      <h1 className="mf-h1" style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '18px 0 10px' }}>
        {titel}
      </h1>
      <p className="mf-body" style={{ color: 'var(--text-3)', maxWidth: '38ch', margin: '0 auto 24px' }}>
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
      <WelkomFrame>
        <Card style={{ width: '100%', maxWidth: 460, padding: '36px 30px' }}>
          <LaadInhoud />
        </Card>
      </WelkomFrame>
    }>
      <WelkomInhoud />
    </Suspense>
  )
}
