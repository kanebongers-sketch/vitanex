'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { KnopLink } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { PijlerKaart } from '@/components/pijlers/PijlerKaart'
import { haalJson, haalJsonGedeeld, isObject, getalOfNull } from '@/lib/lifeos/api/http'
import { luisterOpWijziging } from '@/lib/lifeos/events'
import { PIJLERS, PIJLER_KEYS, isPijlerKey, type PijlerKey } from '@/lib/pijlers/pijlers'
import { scoreNiveau, type TrendRichting } from '@/lib/pijlers/score'
import { weekdagKort, weekdagLang } from '@/lib/pijlers/week'
import { leesWellbeing, type WellbeingView } from './lees-welzijn'

// ─── LifeOS-cockpit — echte MentaForce-welzijnsdata ─────────────────────────
// Deze kaart leunt bewust NIET op de LifeOS-database, maar op het canonieke
// 6-pijler-model van MentaForce (`GET /api/pijlers` + `/api/pijlers/week`). Die
// routes draaien op Kane's gewone sessie (getAuthenticatedUser), niet op de
// LifeOS-founder-gate — dus vanuit dezelfde ingelogde cockpit gewoon fetchbaar.
//
// Eerlijkheid staat voorop: een pijler zonder data blijft `null` en krijgt een
// streepje, nooit een verzonnen 0. Fout en leeg zijn strikt gescheiden (fout =
// storing bij ons, leeg = jij hebt nog niets gelogd).

// ── Views: precies wat de kaart toont, los van het volledige server-antwoord ──
interface PijlerView {
  key: PijlerKey
  score: number | null
  richting: TrendRichting
  deltaPct: number | null
}

interface WelzijnView {
  wellbeing: WellbeingView
  pijlers: Map<PijlerKey, PijlerView>
}

interface WeekDagView {
  datum: string
  gelogd: Set<PijlerKey>
}

// ── Narrowing (geen cast, `unknown` → smalle view) ──────────────────────────
// `isObject`/`getalOfNull` stonden hier als eigen kopie, náást een identieke
// kopie in `gezondheid/lees.ts` en in `api/http.ts`. Ze bewaken de systeemgrens;
// drie versies daarvan is er twee te veel. Ze komen nu uit `api/http.ts`.

const RICHTINGEN: readonly TrendRichting[] = ['op', 'neer', 'stabiel', 'geen']

function leesRichting(v: unknown): TrendRichting {
  return typeof v === 'string' && (RICHTINGEN as readonly string[]).includes(v)
    ? (v as TrendRichting)
    : 'geen'
}

/** Narrowt het `/api/pijlers`-antwoord. `null` = onverwachte vorm → foutstaat. */
function leesWelzijn(ruw: unknown): WelzijnView | null {
  if (!isObject(ruw)) return null

  // Het wellbeing-blok wordt ook door het Gezondheid-domein gelezen; die
  // narrowing heeft één eigenaar (`lees-welzijn.ts`).
  const wellbeing = leesWellbeing(ruw)
  if (wellbeing === null) return null

  const rijen = ruw.pijlers
  if (!Array.isArray(rijen)) return null

  const pijlers = new Map<PijlerKey, PijlerView>()
  for (const rij of rijen) {
    if (!isObject(rij)) return null
    if (typeof rij.key !== 'string' || !isPijlerKey(rij.key)) continue
    const trend = isObject(rij.trend) ? rij.trend : {}
    pijlers.set(rij.key, {
      key: rij.key,
      score: getalOfNull(rij.score),
      richting: leesRichting(trend.richting),
      deltaPct: getalOfNull(trend.deltaPct),
    })
  }

  return { wellbeing, pijlers }
}

/** Narrowt het `/api/pijlers/week`-antwoord. De strip is optioneel/decoratief. */
function leesWeek(ruw: unknown): WeekDagView[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.dagen)) return null

  const dagen: WeekDagView[] = []
  for (const dag of ruw.dagen) {
    if (!isObject(dag) || typeof dag.datum !== 'string') return null
    const gelogd = new Set<PijlerKey>()
    if (Array.isArray(dag.gelogd)) {
      for (const k of dag.gelogd) {
        if (typeof k === 'string' && isPijlerKey(k)) gelogd.add(k)
      }
    }
    dagen.push({ datum: dag.datum, gelogd })
  }
  return dagen
}

// ── Container ────────────────────────────────────────────────────────────────
type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; welzijn: WelzijnView; week: WeekDagView[] | null }

export function WelzijnScoreKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    // De week-strip is bewust decoratief: faalt die, dan tonen we de kaart
    // zónder strip in plaats van de hele kaart op fout te zetten. Het
    // wellbeing-antwoord is wél verplicht — faalt dát, dan is het een storing.
    return Promise.all([
      // Gedeeld: GezondheidDomein haalt /api/pijlers ook op deze paginaload.
      haalJsonGedeeld('/api/pijlers', leesWelzijn),
      haalJson('/api/pijlers/week', leesWeek),
    ]).then(([welzijn, week]) => {
      if (mijn !== generatie.current) return
      setStaat(
        welzijn.ok
          ? { fase: 'ok', welzijn: welzijn.waarde, week: week.ok ? week.waarde : null }
          : { fase: 'fout', bericht: welzijn.fout },
      )
    })
  }, [])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad])

  // Herlaad zodra stress of stemming elders gelogd wordt: die schrijven naar de
  // pijler-data waar deze score op leunt, en anders blijft "x van 6 gemeten"
  // achter terwijl het scherm belooft dat het bijwerkt. Deze kaart schrijft zelf
  // niets, dus de melding kan geen herlaad-lus met zichzelf vormen. `laad` laadt
  // op de achtergrond (zonder skelet-flits) en verzoent via de generatieteller.
  // `luisterOpWijziging` geeft de opzeg-functie terug; die is meteen de cleanup.
  useEffect(() => luisterOpWijziging('welzijn', () => void laad()), [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    // nadruk="normaal", niet "dragend". `Kaart` schrijft één dragende kaart per
    // moment voor, en die stond hier én op `FocusKaart` — waardoor de luidste
    // kaart op het scherm een pomodoro-timer was, naast een even luide
    // welzijnsscore. Twee kaarten die allebei schreeuwen is geen hiërarchie.
    // Vita draagt het moment; deze kaart ondersteunt.
    <Kaart titel="Welzijn" nadruk="normaal">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <Inhoud welzijn={staat.welzijn} week={staat.week} /> : null}
    </Kaart>
  )
}

// ── Presentational ────────────────────────────────────────────────────────────
function Inhoud({ welzijn, week }: { welzijn: WelzijnView; week: WeekDagView[] | null }) {
  const { wellbeing } = welzijn

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {wellbeing.score === null ? (
        <NogNiets
          wat="Nog niets gemeten deze week"
          waarom="Doe een check-in of log je dag in MentaForce, dan verschijnt je welzijnsscore hier."
        />
      ) : (
        <Overall score={wellbeing.score} gemeten={wellbeing.gemeten} totaal={wellbeing.totaal} />
      )}

      {/* De originele MentaForce-pijlerkaarten (`.mf-pk`), niet een eigen
          dashboard-variant: elk kader is een knop naar het pijler-detail
          (/pijler/{key}), met de score, het niveau en de trend erin. Zo zien de
          6 vlakken er door de hele app hetzelfde uit — hier, op /welzijn én op
          /inzichten. Een pijler zonder data toont een eerlijk streepje. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        {PIJLERS.map((def) => {
          const view = welzijn.pijlers.get(def.key)
          return (
            <PijlerKaart
              key={def.key}
              pijler={def}
              score={view?.score ?? null}
              trend={{ richting: view?.richting ?? 'geen', deltaPct: view?.deltaPct ?? null }}
            />
          )
        })}
      </div>

      {week && week.length > 0 ? <WeekStrip dagen={week} /> : null}

      <KnopLink href="/checkin">Check-in doen</KnopLink>
    </div>
  )
}

/** De grote overall wellbeing-score, met eerlijk "x van y pijlers gemeten". */
function Overall({ score, gemeten, totaal }: { score: number; gemeten: number; totaal: number }) {
  const niveau = scoreNiveau(score)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <p
        className="os-cijfer"
        style={{ fontSize: 52, fontWeight: 500, color: niveau.kleur, margin: 0, lineHeight: 0.9 }}
      >
        {score}
      </p>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 2px' }}>
          Welzijn · {niveau.label}
        </p>
        {/* Eerlijk: de score is het gemiddelde van ALLEEN de gemeten pijlers.
            Dat zeggen we hardop i.p.v. te doen alsof alle 6 meetellen. */}
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
          {gemeten} van {totaal} pijlers gemeten
        </p>
      </div>
    </div>
  )
}

/**
 * De 7-daagse strip: per dag hoeveel van de 6 pijlers gelogd zijn. De POSITIE
 * van een stip identificeert de pijler (canonieke volgorde), niet de kleur —
 * consistent met de sidebar-strip. Puur decoratief-interactief, dus elke dag
 * krijgt een tekstueel alternatief via aria-label.
 */
function WeekStrip({ dagen }: { dagen: WeekDagView[] }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          margin: '0 0 10px',
        }}
      >
        Afgelopen 7 dagen
      </p>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${dagen.length}, 1fr)`,
          gap: 6,
        }}
      >
        {dagen.map((dag) => (
          <li
            key={dag.datum}
            style={{ display: 'grid', justifyItems: 'center', gap: 6 }}
            aria-label={`${weekdagLang(dag.datum)}: ${dag.gelogd.size} van ${PIJLER_KEYS.length} pijlers gelogd`}
          >
            <span
              aria-hidden="true"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}
            >
              {PIJLER_KEYS.map((key) => (
                <span
                  key={key}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: dag.gelogd.has(key) ? 'var(--brand)' : 'var(--line-strong)',
                  }}
                />
              ))}
            </span>
            <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--text-4)' }}>
              {weekdagKort(dag.datum)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
      <div style={{ height: 46, width: '42%', borderRadius: 8, background: 'var(--bg-raised)' }} />
      {[70, 64, 68, 60, 66, 58].map((breedte, i) => (
        <div
          key={i}
          style={{ height: 13, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
