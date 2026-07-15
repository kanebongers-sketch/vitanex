'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Sparkles, Target, Link2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Ring } from '@/components/ui/Ring'
import { PIJLER_ICOON } from '@/components/pijlers/iconen'
import { LaadFout } from '@/components/pijlers/LaadFout'
import { pijlerDef, isPijlerKey, type PijlerKey } from '@/lib/pijlers/pijlers'
import { scoreNiveau, type Trend } from '@/lib/pijlers/score'
import { PIJLER_ACTIE, challengeVoorVandaag } from '@/lib/pijlers/acties'
import type { PijlerOverzicht, PijlerResultaat } from '@/lib/pijlers/pijlers-server'

/* Eerlijke, algemeen geldende samenhang tussen de pijlers (geen verzonnen cijfers). */
const PIJLER_VERBAND: Record<PijlerKey, string> = {
  energie: 'Je energie leunt sterk op slaap en beweging — verbeter die en energie volgt vanzelf.',
  slaap: 'Betere slaap verlaagt je stress en tilt je energie én stemming mee omhoog.',
  stress: 'Minder stress verbetert je slaap en stemming; beweging is hier een sterke hefboom.',
  stemming: 'Je stemming beweegt vaak mee met je slaap en beweging — kleine stappen helpen.',
  beweging: 'Meer bewegen verhoogt je energie en verlaagt je stress — dubbele winst.',
  voeding: 'Goede hydratatie en voeding houden je energie door de dag stabiel.',
}

function analyseZin(r: PijlerResultaat, niveauKey: string): string {
  if (r.score === null) {
    return 'We hebben nog te weinig gegevens om deze pijler te scoren. Log het een paar dagen en je patroon verschijnt hier.'
  }
  const niveauZin =
    niveauKey === 'goed' ? 'Je zit in een goede zone.' :
    niveauKey === 'matig' ? 'Er is ruimte om te groeien.' :
    'Dit vraagt op dit moment je aandacht.'
  const t = r.trend
  const trendZin =
    t.richting === 'op' && t.deltaPct !== null ? ` Deze week ${t.deltaPct}% omhoog — mooie beweging.` :
    t.richting === 'neer' && t.deltaPct !== null ? ` Deze week ${Math.abs(t.deltaPct)}% omlaag — houd dit in de gaten.` :
    t.richting === 'stabiel' ? ' Stabiel ten opzichte van vorige week.' : ''
  return niveauZin + trendZin
}

function TrendPil({ trend }: { trend: Trend }) {
  if (trend.richting === 'geen' || trend.deltaPct === null) return null
  if (trend.richting === 'stabiel') {
    return <span className="mf-pd-trend" style={{ color: 'var(--text-4)' }}><Minus size={13} strokeWidth={2.4} aria-hidden /> stabiel</span>
  }
  const op = trend.richting === 'op'
  const Icon = op ? ArrowUpRight : ArrowDownRight
  return (
    <span className="mf-pd-trend" style={{ color: op ? 'var(--brand)' : 'var(--status-danger)' }}>
      <Icon size={13} strokeWidth={2.4} aria-hidden />{op ? '+' : ''}{trend.deltaPct}% vs vorige week
    </span>
  )
}

export default function PijlerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const raw = Array.isArray(params.pijler) ? params.pijler[0] : params.pijler
  const key = raw && isPijlerKey(raw) ? raw : null

  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(false)
  const [data, setData] = useState<PijlerOverzicht | null>(null)

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setFout(false)
    try {
      const res = await authFetch('/api/pijlers')
      if (!res.ok) throw new Error('pijlers')
      setData(await res.json() as PijlerOverzicht)
    } catch {
      // Niet terugvallen op "nog niet gemeten" — dat liegt over de inzet van
      // de gebruiker terwijl het onze laadfout is.
      setFout(true)
    } finally {
      setLaden(false)
    }
  }, [router])

  useEffect(() => { void Promise.resolve().then(laad) }, [laad])

  if (!key) {
    return (
      <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
        <Navbar />
        <main className="mf-pd">
          <p style={{ color: 'var(--text-3)', marginBottom: 16 }}>Onbekende pijler.</p>
          <Link href="/home" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>Terug naar Home</Link>
        </main>
      </div>
    )
  }

  const def = pijlerDef(key)!
  const Icon = PIJLER_ICOON[key]
  const r: PijlerResultaat = data?.pijlers.find((p) => p.key === key) ?? { key, score: null, vorigeScore: null, trend: { richting: 'geen', deltaPct: null }, bronnen: [] }
  const niveau = scoreNiveau(r.score)
  const actie = PIJLER_ACTIE[key]
  const heeftData = r.score !== null

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-pd">
        <Link href="/home" className="mf-pd-back">
          <ArrowLeft size={15} strokeWidth={2.2} aria-hidden /> Home
        </Link>

        {fout ? (
          <LaadFout wat={`je ${def.label.toLowerCase()}-gegevens`} onOpnieuw={() => { setLaden(true); void laad() }} />
        ) : laden && !data ? (
          <div className="mf-skeleton" style={{ height: 200, borderRadius: 'var(--radius-card)', marginTop: 12 }} aria-busy="true" aria-live="polite" />
        ) : (
          <>
            {/* Hero */}
            <header style={{
              display: 'flex', alignItems: 'center', gap: 20, marginTop: 6, marginBottom: 22,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '22px 24px',
            }}>
              <Ring
                value={r.score ?? 0}
                ariaLabel={heeftData ? `${def.label} ${r.score} van 100 — ${niveau.label}` : `${def.label}: nog geen data`}
                size={116} thickness={10}
                color={heeftData ? niveau.kleur : 'var(--border-strong)'}
              >
                {heeftData
                  ? <span style={{ fontSize: 30, fontWeight: 700, color: niveau.kleur, letterSpacing: '-0.03em' }}>{r.score}</span>
                  : <span style={{ fontSize: 11, color: 'var(--text-4)' }}>—</span>}
              </Ring>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mf-pd-ico" style={{ background: niveau.zacht, color: niveau.kleur }}>
                    <Icon size={16} strokeWidth={2} aria-hidden />
                  </span>
                  <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0 }}>{def.label}</h1>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 8px', lineHeight: 1.5 }}>{def.omschrijving}</p>
                <TrendPil trend={r.trend} />
              </div>
            </header>

            {/* Analyse */}
            <section className="mf-pd-card mf-pd-analyse">
              <span className="mf-pd-ico" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <Sparkles size={15} strokeWidth={2} aria-hidden />
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{analyseZin(r, niveau.niveau)}</p>
            </section>

            {/* Wat telt mee (eerlijk over de bronnen) */}
            <section className="mf-pd-card">
              <h2 className="mf-pd-h2">Wat telt mee</h2>
              {r.bronnen.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {r.bronnen.map((b) => (
                    <span key={b} style={{
                      fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
                      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                      borderRadius: 999, padding: '5px 12px',
                    }}>{b}</span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-4)' }}>Nog geen bronnen — begin met loggen.</p>
              )}
            </section>

            {/* Vandaag: challenge + tip + actie */}
            <section className="mf-pd-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="mf-pd-ico" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                  <Target size={14} strokeWidth={2.2} aria-hidden />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand)' }}>Vandaag</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>{challengeVoorVandaag(key)}</p>
              <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{actie.tip}</p>
              <Link href={actie.href} className="mf-pd-cta">{actie.actie}<ChevronRight size={15} strokeWidth={2.2} aria-hidden /></Link>
            </section>

            {/* Samenhang met andere pijlers */}
            <section className="mf-pd-card mf-pd-analyse">
              <span className="mf-pd-ico" style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>
                <Link2 size={15} strokeWidth={2} aria-hidden />
              </span>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-3)' }}>{PIJLER_VERBAND[key]}</p>
            </section>
          </>
        )}
      </main>

      <style>{style}</style>
    </div>
  )
}

const style = `
.mf-pd { max-width: 640px; margin: 0 auto; padding: 32px 20px 108px; }
@media (min-width: 1024px) { .mf-pd { max-width: 760px; padding-top: 48px; } }
.mf-pd-back {
  display: inline-flex; align-items: center; gap: 6px; margin-bottom: 8px;
  font-size: 13px; font-weight: 600; color: var(--text-3); text-decoration: none;
  transition: color 0.14s var(--ease);
}
.mf-pd-back:hover { color: var(--text-1); }
.mf-pd-back:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; border-radius: 6px; }
.mf-pd-ico { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
.mf-pd-trend { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.mf-pd-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 18px 19px; margin-bottom: 12px; }
.mf-pd-analyse { display: flex; align-items: flex-start; gap: 11px; }
.mf-pd-h2 { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-4); margin: 0 0 11px; }
.mf-pd-cta {
  display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 18px;
  background: var(--brand); color: var(--bg-app); border-radius: var(--radius-btn);
  font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em; text-decoration: none;
  transition: transform 0.16s var(--ease), box-shadow 0.16s var(--ease); box-shadow: 0 2px 10px var(--brand-soft);
}
.mf-pd-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px var(--brand-glow); }
.mf-pd-cta:active { transform: scale(0.98); }
.mf-pd-cta:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .mf-pd-back, .mf-pd-cta { transition: none; }
  .mf-pd-cta:hover, .mf-pd-cta:active { transform: none; }
}
`
