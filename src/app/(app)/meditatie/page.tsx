'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Sparkles, Square, Wind, Brain, Heart, Target, type LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { ActiviteitBadge } from '@/components/navigatie/ActiviteitBadge'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

const MeditationParticles = nextDynamic(() => import('@/components/three/MeditationParticles'), { ssr: false })

// Teksten in het woordenboek: mentaal.meditatie.sessie.<sleutel>.titel /
// .beschrijving / .stap<n> (stap 1 is de eerste).
const SESSIES = [
  { id: 'adem-1', sleutel: 'ademReset', duur: 3, Icon: Wind as LucideIcon, stappen: [{ duur: 15 }, { duur: 20 }, { duur: 20 }, { duur: 25 }, { duur: 100 }] },
  { id: 'body-scan-5', sleutel: 'bodyScan', duur: 5, Icon: Brain as LucideIcon, stappen: [{ duur: 15 }, { duur: 30 }, { duur: 40 }, { duur: 40 }, { duur: 40 }, { duur: 30 }, { duur: 105 }] },
  { id: 'dankbaar-3', sleutel: 'dankbaarheid', duur: 3, Icon: Heart as LucideIcon, stappen: [{ duur: 15 }, { duur: 40 }, { duur: 40 }, { duur: 40 }, { duur: 45 }] },
  { id: 'focus-5', sleutel: 'focusReset', duur: 5, Icon: Target as LucideIcon, stappen: [{ duur: 20 }, { duur: 30 }, { duur: 60 }, { duur: 60 }, { duur: 50 }, { duur: 80 }] },
]

interface MeditatieSessie {
  id: string
  duur_minuten: number
  type: string
  aangemaakt_op: string
}

export default function MeditatiePagina() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const titelVan = (s: typeof SESSIES[0]) => t(`mentaal.meditatie.sessie.${s.sleutel}.titel`)
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
          setLogs((json.logs ?? []).filter((l: MeditatieSessie) => l.type === 'adem'))
        }
      } catch {
        toast({ title: t('mentaal.meditatie.geschiedenisMislukt'), description: t('mentaal.meditatie.probeerLater'), variant: 'warning' })
      }
      setLaden(false)
    }
    check()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (stapTimerRef.current) clearTimeout(stapTimerRef.current)
    }
  }, [router, toast, t])

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
      toast({ title: t('mentaal.meditatie.nietOpgeslagen'), description: t('mentaal.meditatie.nietOpgeslagenTekst'), variant: 'warning' })
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
          <ActiviteitBadge activiteit="meditatie" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {t('mentaal.meditatie.titel')}
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
            return { ds, dag: d.toLocaleDateString(INTL_LOCALE[taal], { weekday: 'short' }).slice(0, 2), actief: datumSet.has(ds), isVandaag: ds === vandaagStr }
          })
          const sessiesDezeWeek = logs.filter(l => {
            const d = l.aangemaakt_op?.split('T')[0]
            return strip.some(s => s.ds === d)
          }).length

          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                role="img"
                aria-label={t('mentaal.meditatie.stripLabel', { aantal: strip.filter(s => s.actief).length })}
                style={{ flex: 1, display: 'flex', gap: 6 }}
              >
                {strip.map(({ ds, dag, actief, isVandaag }) => (
                  <div key={ds} aria-hidden="true" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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
                <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('mentaal.meditatie.min')}<br />{t('mentaal.meditatie.week')}</p>
              </div>
              {sessiesDezeWeek > 0 && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{sessiesDezeWeek}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('mentaal.meditatie.sessies')}<br />{t('mentaal.meditatie.week')}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Actieve sessie */}
        {bezig && gekozenSessie && (
          <section
            aria-label={t('mentaal.meditatie.actief', { titel: titelVan(gekozenSessie) })}
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
              <gekozenSessie.Icon size={44} strokeWidth={1.75} aria-label={titelVan(gekozenSessie)} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>{titelVan(gekozenSessie)}</p>

            <div
              role="timer"
              aria-label={t('mentaal.meditatie.resterend', { tijd: secNaarMinSec(secondsLeft) })}
              style={{ fontSize: 48, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}
            >
              {secNaarMinSec(secondsLeft)}
            </div>

            <div role="status" aria-live="polite" style={{
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)',
              padding: '16px 20px', margin: '20px 0',
              fontSize: 15, fontWeight: 600, lineHeight: 1.5,
              color: 'var(--text-2)',
            }}>
              {gekozenSessie.stappen[stapIndex] ? t(`mentaal.meditatie.sessie.${gekozenSessie.sleutel}.stap${stapIndex + 1}`) : ''}
            </div>

            {/* Voortgangsdots */}
            <div
              role="img"
              aria-label={t('mentaal.meditatie.stapVan', { nummer: stapIndex + 1, totaal: gekozenSessie.stappen.length })}
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
              aria-label={t('mentaal.meditatie.stoppenLabel')}
              className="mf-pressable"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                borderRadius: 10, padding: '10px 20px', color: 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Square size={13} aria-hidden />
              {t('mentaal.meditatie.stoppen')}
            </button>
          </section>
        )}

        {/* Klaar scherm */}
        {klaar && gekozenSessie && (
          <section
            aria-label={t('mentaal.meditatie.voltooid')}
            style={{
              background: 'var(--mf-green-light)', borderRadius: 24, padding: '32px 24px',
              textAlign: 'center', marginBottom: 24,
              border: '1px solid var(--mentaforce-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--mentaforce-primary)' }}>
              <Sparkles size={44} aria-hidden strokeWidth={1.75} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{t('mentaal.meditatie.goedGedaan')}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>
              {t('mentaal.meditatie.geoefend', { duur: gekozenSessie.duur, titel: titelVan(gekozenSessie).toLocaleLowerCase(taal) })}
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
              {t('mentaal.meditatie.nieuweSessie')}
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
                aria-label={t('mentaal.meditatie.startLabel', { titel: titelVan(sessie), duur: sessie.duur })}
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
                  <sessie.Icon size={22} aria-label={titelVan(sessie)} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{titelVan(sessie)}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-4)' }}>{t(`mentaal.meditatie.sessie.${sessie.sleutel}.beschrijving`)}</p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{t('mentaal.meditatie.minuten', { duur: sessie.duur })}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
