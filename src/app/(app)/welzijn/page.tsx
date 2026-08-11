'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Wind, NotebookPen, Leaf, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'
import { gemiddelde, reflectiePrompt, kiesWelzijnSignaal, type WelzijnLog, type WelzijnAs } from '@/lib/welzijn/stats'

// De mentale kern: één daglog (stemming + energie + stress), trends en Vita op
// één plek. Vouwt de oude losse schermen (stemming/stress/mood) samen.

interface Log extends WelzijnLog { aangemaakt_op: string }

const STEMMING = ['😫', '😕', '😐', '🙂', '😄']
const ENERGIE = ['Leeg', 'Laag', 'Oké', 'Fit', 'Vol']
const STRESS = ['Kalm', 'Rustig', 'Wat druk', 'Gespannen', 'Overspoeld']

const ACCENT = 'var(--brand, var(--mentaforce-primary))'

interface AsDef { as: WelzijnAs; label: string; opties: string[]; emoji?: boolean; omgekeerd?: boolean }
const ASSEN: AsDef[] = [
  { as: 'stemming', label: 'Stemming', opties: STEMMING, emoji: true },
  { as: 'energie', label: 'Energie', opties: ENERGIE },
  { as: 'stress', label: 'Stress', opties: STRESS, omgekeerd: true },
]

export default function WelzijnPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [logs, setLogs] = useState<Log[]>([])
  const [stemming, setStemming] = useState<number | null>(null)
  const [energie, setEnergie] = useState<number | null>(null)
  const [stress, setStress] = useState<number | null>(null)
  const [notitie, setNotitie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [succes, setSucces] = useState(false)

  const laad = useCallback((): Promise<void> => {
    return supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      return authFetch('/api/stemming?limit=30')
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j?.logs) setLogs(j.logs as Log[]) })
        .catch(() => { /* stil: lege staat toont gewoon de logger */ })
        .finally(() => setLaden(false))
    }).catch(() => setLaden(false))
  }, [router])

  useEffect(() => { void laad() }, [laad])

  function waardeVan(as: WelzijnAs): number | null {
    return as === 'stemming' ? stemming : as === 'energie' ? energie : stress
  }
  function zet(as: WelzijnAs, v: number) {
    if (as === 'stemming') setStemming(v)
    else if (as === 'energie') setEnergie(v)
    else setStress(v)
  }

  function opslaan() {
    if (stemming === null) { toast({ title: 'Kies je stemming', description: 'Stemming is het minimum om te loggen.', variant: 'warning' }); return }
    setBezig(true)
    authFetch('/api/stemming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stemming,
        energie: energie ?? undefined,
        stress: stress ?? undefined,
        emoji: STEMMING[stemming - 1],
        notitie: notitie.trim() || undefined,
      }),
    }).then((r) => {
      setBezig(false)
      if (!r.ok) { toast({ title: 'Opslaan mislukt', description: 'Probeer het opnieuw.', variant: 'error' }); return }
      setSucces(true)
      vitaEvent('data_logged', { kind: 'welzijn' })
      setStemming(null); setEnergie(null); setStress(null); setNotitie('')
      setTimeout(() => setSucces(false), 2500)
      void laad()
    }).catch(() => { setBezig(false); toast({ title: 'Opslaan mislukt', description: 'Probeer het opnieuw.', variant: 'error' }) })
  }

  const prompt = reflectiePrompt(stemming, stress)
  const signaal = kiesWelzijnSignaal(logs)

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px calc(96px + var(--safe-bottom, 0px))', maxWidth: 560, margin: '0 auto' }}>
        <header style={{ marginBottom: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mentaal</span>
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>Mentaal welzijn</h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>Hoe gaat het nu? Eén korte check — stemming, energie en stress.</p>
        </header>

        {/* Voorzichtig Vita-signaal bij een aanhoudend patroon */}
        {signaal && (
          <div style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${ACCENT}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>{signaal.emoji}</span>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vita</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{signaal.tekst}</span>
            </div>
          </div>
        )}

        {/* Daglog */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px', marginBottom: 16 }}>
          {ASSEN.map((a) => (
            <div key={a.as} style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px' }}>{a.label}</p>
              <div role="radiogroup" aria-label={a.label} style={{ display: 'flex', gap: 8 }}>
                {a.opties.map((opt, i) => {
                  const v = i + 1
                  const actief = waardeVan(a.as) === v
                  return (
                    <button key={v} type="button" role="radio" aria-checked={actief} aria-label={`${a.label}: ${opt}`}
                      onClick={() => zet(a.as, v)} className="mf-welzijn-keuze"
                      style={{
                        flex: 1, minHeight: 52, borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${actief ? ACCENT : 'var(--border)'}`,
                        background: actief ? 'var(--brand-soft, var(--mentaforce-primary-light))' : 'var(--bg-app)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px 2px',
                      }}>
                      {a.emoji
                        ? <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>{opt}</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: actief ? ACCENT : 'var(--text-3)', textAlign: 'center', lineHeight: 1.2 }}>{opt}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Zachte reflectie-prompt + optionele notitie */}
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 6px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden>{prompt.emoji}</span> {prompt.vraag} <span style={{ color: 'var(--text-4)' }}>(optioneel)</span>
            </p>
            <Textarea value={notitie} onChange={(e) => setNotitie(e.target.value)} rows={2} placeholder="Een zin voor jezelf…" aria-label="Reflectie (optioneel)" />
          </div>

          <Button onClick={opslaan} loading={bezig} disabled={bezig} style={{ width: '100%', marginTop: 14 }}>
            {succes ? <><Check size={16} aria-hidden /> Opgeslagen!</> : 'Loggen'}
          </Button>
        </section>

        {/* Trends per as */}
        <TrendKaarten logs={logs} />

        {/* Bijbehorende tools (aparte oefeningen) */}
        <nav aria-label="Mentale tools" style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          {[
            { href: '/ademhaling', label: 'Ademhaling', sub: 'Verlaag je spanning', icon: Wind },
            { href: '/journal', label: 'Journal', sub: 'Schrijf van je af', icon: NotebookPen },
            { href: '/meditatie', label: 'Meditatie', sub: 'Rust je hoofd', icon: Leaf },
          ].map((t) => (
            <Link key={t.href} href={t.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px' }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <t.icon size={17} aria-hidden style={{ color: 'var(--text-3)' }} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)' }}>{t.sub}</span>
              </span>
              <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)' }} />
            </Link>
          ))}
        </nav>
      </main>
      <style>{`.mf-welzijn-keuze:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; }`}</style>
    </div>
  )
}

function TrendKaarten({ logs }: { logs: readonly WelzijnLog[] }) {
  const assen: { as: WelzijnAs; label: string }[] = [
    { as: 'stemming', label: 'Stemming' },
    { as: 'energie', label: 'Energie' },
    { as: 'stress', label: 'Stress' },
  ]
  const zichtbaar = assen.map((a) => ({ ...a, gem: gemiddelde(logs, a.as), reeks: reeksVan(logs, a.as) })).filter((a) => a.reeks.length >= 3)
  if (zichtbaar.length === 0) return null
  return (
    <section aria-label="Trends" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Afgelopen weken</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {zichtbaar.map((a) => (
          <div key={a.as} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px' }}>
            <span style={{ minWidth: 92 }}>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-4)' }}>{a.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{a.gem !== null ? a.gem.toFixed(1) : '–'}<span style={{ fontSize: 12, color: 'var(--text-4)' }}>/5</span></span>
            </span>
            <Sparkline punten={a.reeks.slice(-12)} />
          </div>
        ))}
      </div>
    </section>
  )
}

/** Reeks voor één as, chronologisch (oud → nieuw). logs komen nieuwste-eerst. */
function reeksVan(logs: readonly WelzijnLog[], as: WelzijnAs): number[] {
  return logs.map((l) => l[as]).filter((v): v is number => typeof v === 'number').reverse()
}

function Sparkline({ punten }: { punten: readonly number[] }) {
  const b = 100, h = 30
  if (punten.length < 2) return <span style={{ flex: 1 }} />
  const min = Math.min(...punten), max = Math.max(...punten)
  const span = max - min || 1
  const stap = b / (punten.length - 1)
  const d = punten.map((w, i) => `${i === 0 ? 'M' : 'L'} ${(i * stap).toFixed(1)} ${(h - 2 - ((w - min) / span) * (h - 4)).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${b} ${h}`} preserveAspectRatio="none" role="img" aria-label="Trend" style={{ flex: 1, minWidth: 0, height: h }}>
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
