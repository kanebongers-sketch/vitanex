'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Target, ChevronRight, ArrowUpRight, ArrowDownRight, CheckCircle2, TriangleAlert, Info, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { CockpitKop } from '@/components/lifeos/cockpit/CockpitKop'
import { Cockpit } from '@/components/lifeos/cockpit/Cockpit'
import { CoachNudgeBanner } from '@/components/coach/CoachNudgeBanner'
import { WellbeingHero } from '@/components/pijlers/WellbeingHero'
import { PijlerKaart } from '@/components/pijlers/PijlerKaart'
import { LaadFout } from '@/components/pijlers/LaadFout'
import { PIJLERS, pijlerDef, type PijlerKey } from '@/lib/pijlers/pijlers'
import { scoreNiveau } from '@/lib/pijlers/score'
import { PIJLER_ACTIE, challengeVoorVandaag } from '@/lib/pijlers/acties'
import type { PijlerOverzicht, PijlerResultaat } from '@/lib/pijlers/pijlers-server'

/* ── helpers ── */
function groetVoor(uur: number): string {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function nlDatum(): string {
  return new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function label(key: PijlerKey): string {
  return pijlerDef(key)?.label ?? key
}

/** Eén eerlijk, uit de data afgeleid inzicht — geen verzonnen cijfers. */
function bouwInzicht(
  ov: PijlerOverzicht,
  verbetering: PijlerResultaat | null,
  aandacht: PijlerResultaat | null,
  focus: PijlerResultaat | null,
): string {
  if (ov.wellbeing.gemeten === 0) {
    return 'Doe je eerste check-in — daarna staat hier je eerste inzicht.'
  }
  // Geen causaliteit claimen: de app meet géén verband tússen pijlers.
  if (verbetering && verbetering.trend.deltaPct !== null) {
    return `Je ${label(verbetering.key).toLowerCase()} ging deze week ${verbetering.trend.deltaPct}% omhoog. Mooi — houd vast wat je deed.`
  }
  if (aandacht && aandacht.trend.richting === 'neer' && aandacht.trend.deltaPct !== null) {
    return `Je ${label(aandacht.key).toLowerCase()} zakte ${Math.abs(aandacht.trend.deltaPct)}% deze week. Eén week zegt nog weinig — hieronder staat een kleine stap.`
  }
  // Alleen naar de laagste pijler sturen als die écht aandacht vraagt. Wie op
  // álles 88/100 staat, hoort niet te lezen dat er iets mis is.
  if (focus && focus.score !== null && scoreNiveau(focus.score).niveau !== 'goed') {
    return `${label(focus.key)} staat nu het laagst. Dat is een goed startpunt.`
  }
  return 'Je zes pijlers staan er deze week goed voor. Houd je ritme vast.'
}

/* ── skeleton ── */
function HomeSkeleton() {
  return (
    <main className="mf-home" aria-busy="true" aria-label="Home wordt geladen">
      <div className="mf-skeleton" style={{ height: 14, width: 160, borderRadius: 6, marginBottom: 12 }} />
      <div className="mf-skeleton" style={{ height: 178, borderRadius: 'var(--radius-card)', marginBottom: 20 }} />
      <div className="mf-skeleton" style={{ height: 88, borderRadius: 'var(--radius-card)', marginBottom: 12 }} />
      <div className="mf-home-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mf-skeleton" style={{ height: 116, borderRadius: 'var(--radius-card)' }} />
        ))}
      </div>
    </main>
  )
}

/* ── main ── */
export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(false)
  const [voornaam, setVoornaam] = useState('')
  const [data, setData] = useState<PijlerOverzicht | null>(null)
  // `null` = nog niet nagegaan. Voor de founder wordt /home het volledige
  // dashboard (de cockpit met werk, notities, agenda, taken, mensen én welzijn);
  // voor elke andere gebruiker blijft /home exact het welzijn-overzicht hieronder.
  const [isFounder, setIsFounder] = useState<boolean | null>(null)

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profiel } = await supabase
      .from('profiles').select('naam, onboarding_voltooid').eq('id', user.id).single()
    if (!profiel?.onboarding_voltooid) { router.replace('/onboarding'); return }
    setVoornaam((profiel?.naam ?? '').split(' ')[0] || 'jij')

    // Founder-check via dezelfde gate als alle /api/lifeos-routes. FAIL-SAFE: een
    // fout of niet-founder valt door naar het welzijn-overzicht — /home mag voor
    // een gewone gebruiker (klantbedrijf) nooit breken op deze check.
    let founder = false
    try {
      const poort = await authFetch('/api/lifeos/toegang')
      founder = poort.ok
    } catch {
      founder = false
    }
    setIsFounder(founder)

    // De founder krijgt de cockpit, die zijn eigen data per kaart ophaalt — dus
    // geen pijler-fetch nodig. Een gewone gebruiker laadt het welzijn-overzicht.
    if (founder) {
      setLaden(false)
      return
    }

    try {
      const res = await authFetch('/api/pijlers')
      if (!res.ok) throw new Error('pijlers')
      setData(await res.json() as PijlerOverzicht)
    } catch {
      setFout(true)
    } finally {
      setLaden(false)
    }
  }, [router])

  useEffect(() => { void Promise.resolve().then(laad) }, [laad])

  // Anker-scroll voor de founder (bv. de nav-link /home#mensen). Het anker-element
  // (de Mensen-zone) bestaat pas als de cockpit gemount is — dat is ná de
  // founder-check, dus ruim ná de eerste paint. De browser scrollt zelf alleen bij
  // die eerste paint, toen het element er nog niet was; daarom scrollen we hier
  // zelf zodra we weten dat het de founder is. Kleine vertraging zodat de kaarten
  // eerst hun hoogte pakken. Same-page hash-klikken handelt de browser al af (dan
  // bestaat het element al) — deze effect vuurt alleen op de eerste founder-render.
  useEffect(() => {
    if (isFounder !== true) return
    const hash = window.location.hash
    if (hash.length < 2) return
    const t = setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
    }, 350)
    return () => clearTimeout(t)
  }, [isFounder])

  const groet = `${groetVoor(new Date().getHours())}, ${voornaam}`

  /* Afgeleide inzichten — pure logica op de pijlerdata. */
  const pijlers = data?.pijlers ?? []
  const metData = pijlers.filter((p) => p.score !== null)
  const focus: PijlerResultaat | null = metData.length
    ? metData.reduce((laagste, p) => ((p.score as number) < (laagste.score as number) ? p : laagste))
    : null
  const stijgers = pijlers.filter((p) => p.trend.richting === 'op' && p.trend.deltaPct !== null)
  const verbetering: PijlerResultaat | null = stijgers.length
    ? stijgers.reduce((beste, p) => ((p.trend.deltaPct as number) > (beste.trend.deltaPct as number) ? p : beste))
    : null
  const dalers = pijlers.filter((p) => p.trend.richting === 'neer' && p.trend.deltaPct !== null)
  const aandacht: PijlerResultaat | null = dalers.length
    ? dalers.reduce((ergste, p) => ((p.trend.deltaPct as number) < (ergste.trend.deltaPct as number) ? p : ergste))
    : focus

  // ── De founder: /home ÍS het volledige dashboard ──────────────────────────
  // Zelfde cockpit-surface als voorheen op /lifeos, nu op /home en mét de navbar
  // eromheen (die /lifeos niet had). De cockpit draagt zijn eigen `.lifeos-root`-
  // tokens; de navbar erbuiten houdt de MentaForce-tokens. Beide navy/cyan.
  if (isFounder === true) {
    return (
      <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div className="lifeos-root">
          <div className="os-sfeer" aria-hidden="true" />
          <main className="os-schil os-schil--breed">
            {/* Feedback na terugkeer uit de Google OAuth-flow (agenda / Gmail).
                Alleen voor de founder — de koppelingen leven in dit dashboard. */}
            <KoppelFeedback />
            <CockpitKop />
            <Cockpit />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      {laden || !data ? (
        fout ? (
          <main className="mf-home">
            <div style={{ marginTop: 40 }}>
              <LaadFout onOpnieuw={() => { setLaden(true); setFout(false); void laad() }} />
            </div>
          </main>
        ) : <HomeSkeleton />
      ) : (
        <main className="mf-home">
          <div className="mf-home-layout">
          <div className="mf-home-rail">
          <WellbeingHero groet={groet} datum={nlDatum()} wellbeing={data.wellbeing} />

          {/* Proactieve nudge — data-gedreven, met eigen cooldown per type */}
          <CoachNudgeBanner />

          {/* AI-inzicht — eerlijk uit je data afgeleid */}
          <div className="mf-insight">
            <span className="mf-insight-ico"><Sparkles size={15} strokeWidth={2} aria-hidden /></span>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)' }}>
              {bouwInzicht(data, verbetering, aandacht, focus)}
            </p>
          </div>

          {/* Today's Focus + Daily Challenge */}
          {focus && (
            <FocusKaart pijlerKey={focus.key} />
          )}
          </div>

          <div className="mf-home-main">
          {/* De 6 pijlers */}
          <div style={{ margin: '22px 0 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-2)', margin: 0, textTransform: 'uppercase' }}>
              Jouw zes pijlers
            </h2>
            <Link href="/inzichten" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              Voortgang <ChevronRight size={13} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
          <div className="mf-home-grid">
            {PIJLERS.map((def) => {
              const r = pijlers.find((p) => p.key === def.key)
              return (
                <PijlerKaart
                  key={def.key}
                  pijler={def}
                  score={r?.score ?? null}
                  trend={r?.trend ?? { richting: 'geen', deltaPct: null }}
                />
              )
            })}
          </div>

          {/* Deze week — grootste beweging */}
          {(verbetering || (aandacht && aandacht.trend.richting === 'neer')) && (
            <div className="mf-week-row">
              {verbetering && (
                <MiniStat
                  soort="op"
                  label="Sterkst gestegen"
                  pijler={label(verbetering.key)}
                  deltaPct={verbetering.trend.deltaPct}
                />
              )}
              {aandacht && aandacht.trend.richting === 'neer' && (
                <MiniStat
                  soort="neer"
                  label="Sterkst gedaald"
                  pijler={label(aandacht.key)}
                  deltaPct={aandacht.trend.deltaPct}
                />
              )}
            </div>
          )}
          </div>
          </div>
        </main>
      )}

      <style>{homeStyle}</style>
    </div>
  )
}

/* ── Today's Focus + Daily Challenge ── */
function FocusKaart({ pijlerKey }: { pijlerKey: PijlerKey }) {
  const actie = PIJLER_ACTIE[pijlerKey]
  return (
    <div className="mf-focus">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="mf-focus-ico"><Target size={14} strokeWidth={2.2} aria-hidden /></span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand)' }}>
          Focus vandaag · {label(pijlerKey)}
        </span>
      </div>
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
        {challengeVoorVandaag(pijlerKey)}
      </p>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
        {actie.tip}
      </p>
      <Link href={actie.href} className="mf-focus-cta">
        {actie.actie}
        <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
      </Link>
    </div>
  )
}

/* ── Mini weekstat ── */
function MiniStat({ soort, label, pijler, deltaPct }: { soort: 'op' | 'neer'; label: string; pijler: string; deltaPct: number | null }) {
  const op = soort === 'op'
  const kleur = op ? 'var(--brand)' : 'var(--status-danger)'
  const Icon = op ? ArrowUpRight : ArrowDownRight
  return (
    <div className="mf-week-stat">
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{pijler}</span>
        {deltaPct !== null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: kleur, fontVariantNumeric: 'tabular-nums' }}>
            <Icon size={13} strokeWidth={2.4} aria-hidden />{op ? '+' : ''}{deltaPct}%
          </span>
        )}
      </span>
    </div>
  )
}

/* ── Koppel-feedback ──────────────────────────────────────────────────────────
   Na de Google OAuth-flow landt de gebruiker terug op /home met ?agenda=… of
   ?inbox=… (waarden: gekoppeld · geweigerd · fout, fout evt. met &reden=…). Zonder
   dit blijft succes én mislukking onzichtbaar. We lezen de param één keer bij mount,
   tonen een rustige banner, en poetsen de param meteen uit de URL zodat een refresh
   de melding niet herhaalt. */
type MeldingToon = 'ok' | 'fout' | 'info'
interface KoppelMelding {
  toon: MeldingToon
  tekst: string
}

/** Vertaalt één (dienst, status, reden) naar een eerlijke NL-melding. */
function meldingVoor(dienst: string, status: string, reden: string | null): KoppelMelding | null {
  if (status === 'gekoppeld') return { toon: 'ok', tekst: `${dienst} gekoppeld.` }
  if (status === 'geweigerd') {
    return { toon: 'info', tekst: `${dienst} koppelen geannuleerd — je gaf Google geen toestemming.` }
  }
  if (status === 'fout') {
    if (reden === 'niet_ingericht') {
      return { toon: 'fout', tekst: `${dienst} koppelen kan nog niet: deze koppeling is op de server niet ingericht.` }
    }
    if (reden === 'verlopen') {
      return { toon: 'fout', tekst: `${dienst} koppelen is verlopen. Start de koppeling opnieuw.` }
    }
    return { toon: 'fout', tekst: `${dienst} koppelen is niet gelukt. Probeer het zo opnieuw.` }
  }
  return null
}

/** Leest de koppel-status uit de query-params. Agenda gaat vóór inbox als beide er staan. */
function leesKoppelMelding(params: URLSearchParams): KoppelMelding | null {
  const reden = params.get('reden')
  const agenda = params.get('agenda')
  if (agenda) return meldingVoor('Google Agenda', agenda, reden)
  const inbox = params.get('inbox')
  if (inbox) return meldingVoor('Gmail', inbox, reden)
  return null
}

function KoppelFeedback() {
  const [melding, setMelding] = useState<KoppelMelding | null>(null)

  // Client component: geen useSearchParams (die vraagt een Suspense-grens); we
  // lezen window.location één keer na mount. Force-dynamic, dus dit is veilig.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nieuw = leesKoppelMelding(params)
    if (!nieuw) return

    // Param opruimen (de URL is het externe systeem) — anders toont een refresh de
    // melding opnieuw. Pad en hash (bv. #mensen) blijven staan.
    ;['agenda', 'inbox', 'reden'].forEach((k) => params.delete(k))
    const zoek = params.toString()
    const schone = `${window.location.pathname}${zoek ? `?${zoek}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', schone)

    // setState niet synchroon in de effect-body (cascading renders): in een
    // microtask, net als de dataload elders op deze pagina.
    let timer: ReturnType<typeof setTimeout> | undefined
    let afgebroken = false
    void Promise.resolve().then(() => {
      if (afgebroken) return
      setMelding(nieuw)
      // Bevestiging en annulering verdwijnen vanzelf; een fout blijft staan tot de
      // gebruiker 'm sluit — een mislukking stilletjes wegpoetsen is oneerlijk.
      if (nieuw.toon !== 'fout') timer = setTimeout(() => setMelding(null), 6000)
    })

    return () => {
      afgebroken = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!melding) return null

  const Icon = melding.toon === 'ok' ? CheckCircle2 : melding.toon === 'fout' ? TriangleAlert : Info
  const accent =
    melding.toon === 'ok'
      ? 'var(--status-success)'
      : melding.toon === 'fout'
        ? 'var(--status-danger)'
        : 'var(--status-info)'
  const vlak =
    melding.toon === 'ok'
      ? 'var(--status-success-soft)'
      : melding.toon === 'fout'
        ? 'var(--status-danger-soft)'
        : 'var(--status-info-soft)'

  return (
    <div
      className="koppel-melding"
      role={melding.toon === 'fout' ? 'alert' : 'status'}
      style={{ background: vlak, borderColor: `color-mix(in srgb, ${accent} 34%, transparent)` }}
    >
      <span className="koppel-melding-ico" style={{ color: accent }}>
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <p className="koppel-melding-tekst">{melding.tekst}</p>
      <button
        type="button"
        className="koppel-melding-sluit"
        onClick={() => setMelding(null)}
        aria-label="Melding sluiten"
      >
        <X size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <style>{koppelMeldingStyle}</style>
    </div>
  )
}

const koppelMeldingStyle = `
.koppel-melding {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 13px 15px; margin-bottom: 18px;
  border: 1px solid transparent; border-radius: var(--radius-card);
  animation: koppel-melding-in 0.28s var(--ease) both;
}
.koppel-melding-ico { flex-shrink: 0; display: inline-flex; margin-top: 1px; }
.koppel-melding-tekst { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--text-1); }
.koppel-melding-sluit {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0; border: 0; border-radius: 7px;
  background: transparent; color: var(--text-2); cursor: pointer;
  transition: background 0.15s var(--ease), color 0.15s var(--ease);
}
.koppel-melding-sluit:hover { background: color-mix(in srgb, var(--text-1) 10%, transparent); color: var(--text-1); }
.koppel-melding-sluit:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
@keyframes koppel-melding-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .koppel-melding { animation: none; }
  .koppel-melding-sluit { transition: none; }
}
`

/* Page-scoped layout + ontworpen states. Reduced-motion veilig. */
const homeStyle = `
.mf-home { max-width: 640px; margin: 0 auto; padding: 40px 20px 108px; }
.mf-home-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 560px) { .mf-home-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) {
  .mf-home { max-width: 1140px; padding: 52px 32px 72px; }
  .mf-home-layout { display: grid; grid-template-columns: 388px minmax(0, 1fr); gap: 26px; align-items: start; }
  .mf-home-rail { position: sticky; top: 24px; }
  .mf-home-main { padding-top: 2px; }
}
.mf-insight {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 15px 17px; margin-bottom: 12px;
  background: color-mix(in srgb, var(--brand) 7%, var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--brand) 22%, transparent);
  border-radius: var(--radius-card);
}
.mf-insight-ico {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--brand-soft); color: var(--brand);
}
.mf-focus {
  padding: 18px 19px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius-card); box-shadow: var(--shadow-card);
}
.mf-focus-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 7px; background: var(--brand-soft); color: var(--brand);
}
.mf-focus-cta {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 18px; background: var(--brand); color: var(--bg-app);
  border-radius: var(--radius-btn); font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em;
  text-decoration: none; transition: transform 0.16s var(--ease), box-shadow 0.16s var(--ease);
  box-shadow: 0 2px 10px var(--brand-soft);
}
.mf-focus-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px var(--brand-glow); }
.mf-focus-cta:active { transform: scale(0.98); }
.mf-focus-cta:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.mf-week-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
.mf-week-stat { padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); }
@media (prefers-reduced-motion: reduce) {
  .mf-focus-cta { transition: none; }
  .mf-focus-cta:hover, .mf-focus-cta:active { transform: none; }
}
`
