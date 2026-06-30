'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Sparkles, Square, Wind, Brain, Heart, Target, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { getActiviteit } from '@/lib/activiteiten'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'

const ACT = getActiviteit('meditatie')

const MeditationParticles = nextDynamic(() => import('@/components/three/MeditationParticles'), { ssr: false })

const SESSIES = [
  {
    id: 'adem-1',
    titel: 'Korte adem reset',
    duur: 3,
    beschrijving: 'Kalm je zenuwstelsel in 3 minuten',
    Icon: Wind as LucideIcon,
    stappen: [
      { tekst: 'Ga comfortabel zitten. Sluit je ogen.', duur: 15 },
      { tekst: 'Adem diep in door je neus, 4 tellen.', duur: 20 },
      { tekst: 'Houd je adem vast, 4 tellen.', duur: 20 },
      { tekst: 'Adem langzaam uit door je mond, 6 tellen.', duur: 25 },
      { tekst: 'Herhaal dit ritme rustig...', duur: 100 },
    ],
  },
  {
    id: 'body-scan-5',
    titel: 'Body scan',
    duur: 5,
    beschrijving: 'Scan je lichaam op spanning',
    Icon: Brain as LucideIcon,
    stappen: [
      { tekst: 'Leg je handen op je knieën. Sluit je ogen.', duur: 15 },
      { tekst: 'Voel je voeten op de grond. Ontspan.', duur: 30 },
      { tekst: 'Ga omhoog via je benen. Laat spanning los.', duur: 40 },
      { tekst: 'Ontspan je buik en je borst.', duur: 40 },
      { tekst: 'Je schouders en nek. Laat alles los.', duur: 40 },
      { tekst: 'Je gezicht, je kaak. Volledige ontspanning.', duur: 30 },
      { tekst: 'Blijf even zo. Adem rustig.', duur: 105 },
    ],
  },
  {
    id: 'dankbaar-3',
    titel: 'Dankbaarheidsmeditatie',
    duur: 3,
    beschrijving: 'Focus op wat goed gaat',
    Icon: Heart as LucideIcon,
    stappen: [
      { tekst: 'Sluit je ogen. Haal diep adem.', duur: 15 },
      { tekst: 'Denk aan iemand voor wie je dankbaar bent.', duur: 40 },
      { tekst: 'Denk aan iets wat goed ging vandaag.', duur: 40 },
      { tekst: 'Denk aan je lichaam — dat het voor jou werkt.', duur: 40 },
      { tekst: 'Voel de warmte van dankbaarheid in je borst.', duur: 45 },
    ],
  },
  {
    id: 'focus-5',
    titel: 'Focus reset',
    duur: 5,
    beschrijving: 'Herstel je concentratie',
    Icon: Target as LucideIcon,
    stappen: [
      { tekst: 'Sluit alle tabs in je hoofd.', duur: 20 },
      { tekst: 'Adem in, tél: 1. Uit, tél: 2.', duur: 30 },
      { tekst: 'Blijf tellen tot 10. Begin opnieuw bij afleiding.', duur: 60 },
      { tekst: 'Als je afgeleid wordt, constateer dat en ga terug.', duur: 60 },
      { tekst: 'Nog één ronde van 1-10.', duur: 50 },
      { tekst: 'Open je ogen. Je bent klaar om te focussen.', duur: 80 },
    ],
  },
]

interface MeditatieSessie {
  id: string
  duur_minuten: number
  sessie_type: string
  aangemaakt_op: string
}

export default function MeditatiePagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [gekozenSessie, setGekozenSessie] = useState<typeof SESSIES[0] | null>(null)
  const [bezig, setBezig] = useState(false)
  const [stapIndex, setStapIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [klaar, setKlaar] = useState(false)
  const [logs, setLogs] = useState<MeditatieSessie[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/focus/log?limit=10')
        if (res.ok) {
          const json = await res.json() as { logs: MeditatieSessie[] }
          setLogs((json.logs ?? []).filter((l: MeditatieSessie) => l.sessie_type === 'adem'))
        }
      } catch {
        toast({ title: 'Kon je geschiedenis niet laden', description: 'Probeer het later opnieuw.', variant: 'warning' })
      }
      setLaden(false)
    }
    check()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (stapTimerRef.current) clearTimeout(stapTimerRef.current)
    }
  }, [router, toast])

  // Escape sluit een actieve sessie af (geen toetsenbordval).
  useEffect(() => {
    if (!bezig) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') stopSessie()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bezig])

  function startSessie(sessie: typeof SESSIES[0]) {
    setGekozenSessie(sessie)
    setBezig(true)
    setStapIndex(0)
    setKlaar(false)
    const totaalSecs = sessie.duur * 60
    setSecondsLeft(totaalSecs)

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    loopStappen(sessie, 0)
  }

  function loopStappen(sessie: typeof SESSIES[0], idx: number) {
    if (idx >= sessie.stappen.length) {
      eindigSessie(sessie)
      return
    }
    setStapIndex(idx)
    stapTimerRef.current = setTimeout(() => loopStappen(sessie, idx + 1), sessie.stappen[idx].duur * 1000)
  }

  function eindigSessie(sessie: typeof SESSIES[0]) {
    if (timerRef.current) clearInterval(timerRef.current)
    setBezig(false)
    setKlaar(true)
    setSecondsLeft(0)
    vitaEvent('habit_completed', { kind: 'meditatie' })
    authFetch('/api/focus/log', {
      method: 'POST',
      body: JSON.stringify({ duur_minuten: sessie.duur, type: 'adem' }),
    }).catch(() => {
      toast({ title: 'Sessie niet opgeslagen', description: 'Je oefening telt nog steeds — we konden hem alleen niet vastleggen.', variant: 'warning' })
    })
  }

  function stopSessie() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (stapTimerRef.current) clearTimeout(stapTimerRef.current)
    setBezig(false)
    setGekozenSessie(null)
    setKlaar(false)
    setSecondsLeft(0)
  }

  const secNaarMinSec = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const totaalMeditatie = logs.reduce((s, l) => s + (l.duur_minuten ?? 0), 0)

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACT.kleur, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACT.kleur, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ACT.label}</span>
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Mindfulness & Meditatie
          </h1>
        </header>

        {/* 7-daagse activiteitsstrip */}
        {(() => {
          const vandaag = new Date()
          const vandaagStr = vandaag.toISOString().split('T')[0]
          const datumSet = new Set(logs.map(l => l.aangemaakt_op?.split('T')[0]).filter(Boolean))
          const strip = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(vandaag)
            d.setDate(d.getDate() - (6 - i))
            const ds = d.toISOString().split('T')[0]
            return { ds, dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2), actief: datumSet.has(ds), isVandaag: ds === vandaagStr }
          })
          const sessiesDezeWeek = logs.filter(l => {
            const d = l.aangemaakt_op?.split('T')[0]
            return strip.some(s => s.ds === d)
          }).length

          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                {strip.map(({ ds, dag, actief, isVandaag }) => (
                  <div key={ds} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: 28, borderRadius: 6,
                      background: actief ? 'var(--mf-purple)' : 'var(--bg-subtle)',
                      opacity: actief ? 0.85 : 0.5,
                      outline: isVandaag ? `2px solid ${actief ? 'var(--mf-purple)' : 'var(--border-strong)'}` : 'none',
                      outlineOffset: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <Brain size={12} aria-hidden style={{ color: 'var(--bg-app)' }} />}
                    </div>
                    <span style={{ fontSize: 8, color: isVandaag ? 'var(--text-2)' : 'var(--text-4)', fontWeight: isVandaag ? 800 : 400, textTransform: 'capitalize' }}>{dag}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-purple)', margin: 0, lineHeight: 1 }}>{totaalMeditatie}</p>
                <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>min<br />week</p>
              </div>
              {sessiesDezeWeek > 0 && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{sessiesDezeWeek}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>sessies<br />week</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Actieve sessie */}
        {bezig && gekozenSessie && (
          <section
            aria-label={`Actieve sessie: ${gekozenSessie.titel}`}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-strong)',
              borderRadius: 24, padding: '32px 24px',
              textAlign: 'center', marginBottom: 24,
              color: 'var(--text-1)',
            }}
          >
            <MeditationParticles active={bezig} />
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: 'var(--mentaforce-primary)' }}>
              <gekozenSessie.Icon size={44} strokeWidth={1.75} aria-label={gekozenSessie.titel} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>{gekozenSessie.titel}</p>

            <div
              role="timer"
              aria-label={`Resterende tijd: ${secNaarMinSec(secondsLeft)}`}
              style={{ fontSize: 48, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}
            >
              {secNaarMinSec(secondsLeft)}
            </div>

            <div style={{
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)',
              padding: '16px 20px', margin: '20px 0',
              fontSize: 15, fontWeight: 600, lineHeight: 1.5,
              color: 'var(--text-2)',
            }}>
              {gekozenSessie.stappen[stapIndex]?.tekst ?? ''}
            </div>

            {/* Voortgangsdots */}
            <div
              role="img"
              aria-label={`Stap ${stapIndex + 1} van ${gekozenSessie.stappen.length}`}
              style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}
            >
              {gekozenSessie.stappen.map((_, i) => (
                <div key={i} aria-hidden style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i <= stapIndex ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            <button
              type="button"
              onClick={stopSessie}
              aria-label="Sessie stoppen (of druk op Escape)"
              className="mf-pressable"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                borderRadius: 10, padding: '10px 20px', color: 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Square size={13} aria-hidden />
              Stoppen
            </button>
          </section>
        )}

        {/* Klaar scherm */}
        {klaar && gekozenSessie && (
          <section
            aria-label="Sessie voltooid"
            style={{
              background: 'var(--mf-green-light)', borderRadius: 24, padding: '32px 24px',
              textAlign: 'center', marginBottom: 24,
              border: '1px solid var(--mentaforce-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--mentaforce-primary)' }}>
              <Sparkles size={44} aria-hidden strokeWidth={1.75} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Goed gedaan!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>
              Je hebt {gekozenSessie.duur} minuten {gekozenSessie.titel.toLowerCase()} geoefend.
            </p>
            <button
              type="button"
              onClick={() => { setKlaar(false); setGekozenSessie(null) }}
              className="mf-pressable"
              style={{
                background: 'var(--mentaforce-primary)',
                color: 'var(--bg-app)', border: 'none',
                borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Nieuwe sessie
            </button>
          </section>
        )}

        {/* Sessiekeuze (niet bezig) */}
        {!bezig && !klaar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SESSIES.map(sessie => (
              <button
                key={sessie.id}
                type="button"
                onClick={() => startSessie(sessie)}
                aria-label={`Start ${sessie.titel}, ${sessie.duur} minuten`}
                className="mf-pressable"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 16, padding: '16px 18px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'var(--mf-green-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mentaforce-primary)',
                  }}
                >
                  <sessie.Icon size={22} aria-label={sessie.titel} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{sessie.titel}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-4)' }}>{sessie.beschrijving}</p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{sessie.duur} min</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
