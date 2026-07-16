'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { PIJLERS, PIJLER_KEYS, isPijlerKey, type PijlerKey } from '@/lib/pijlers/pijlers'
import { scoreNiveau, type NiveauInfo, type TrendRichting } from '@/lib/pijlers/score'
import { weekdagKort, weekdagLang } from '@/lib/pijlers/week'

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
  wellbeing: { score: number | null; gemeten: number; totaal: number }
  pijlers: Map<PijlerKey, PijlerView>
}

interface WeekDagView {
  datum: string
  gelogd: Set<PijlerKey>
}

// ── Narrowing (geen cast, `unknown` → smalle view) ──────────────────────────
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Eindig getal of `null` — nooit NaN, nooit een string die op een getal lijkt. */
function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

const RICHTINGEN: readonly TrendRichting[] = ['op', 'neer', 'stabiel', 'geen']

function leesRichting(v: unknown): TrendRichting {
  return typeof v === 'string' && (RICHTINGEN as readonly string[]).includes(v)
    ? (v as TrendRichting)
    : 'geen'
}

/** Narrowt het `/api/pijlers`-antwoord. `null` = onverwachte vorm → foutstaat. */
function leesWelzijn(ruw: unknown): WelzijnView | null {
  if (!isObject(ruw)) return null

  const wb = ruw.wellbeing
  if (!isObject(wb)) return null
  const gemeten = getalOfNull(wb.gemeten)
  const totaal = getalOfNull(wb.totaal)
  if (gemeten === null || totaal === null) return null

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

  return {
    wellbeing: { score: getalOfNull(wb.score), gemeten, totaal },
    pijlers,
  }
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
      haalJson('/api/pijlers', leesWelzijn),
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

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <Kaart titel="Welzijn" nadruk="dragend">
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

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
        {PIJLERS.map((def) => (
          <PijlerRij key={def.key} label={def.label} view={welzijn.pijlers.get(def.key) ?? null} />
        ))}
      </ul>

      {week && week.length > 0 ? <WeekStrip dagen={week} /> : null}

      <Link href="/checkin" className="os-knop-link" style={KNOP_STIJL}>
        Check-in doen
      </Link>
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

/** Eén pijler: naam, score (of streepje) en trendrichting. */
function PijlerRij({ label, view }: { label: string; view: PijlerView | null }) {
  const score = view?.score ?? null
  const niveau: NiveauInfo = scoreNiveau(score)

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '9px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 0 }}>{label}</span>

      {score === null ? (
        // Geen data voor deze pijler. Een streepje, geen 0 — het label eronder
        // zou "nog niet gemeten" zeggen; hier houden we de rij compact.
        <span
          className="os-cijfer"
          style={{ fontSize: 15, color: 'var(--text-4)' }}
          aria-label={`${label}: nog niet gemeten`}
        >
          —
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <Trend richting={view?.richting ?? 'geen'} deltaPct={view?.deltaPct ?? null} />
          <span
            className="os-cijfer"
            style={{ fontSize: 17, fontWeight: 500, color: niveau.kleur, minWidth: 26, textAlign: 'right' }}
          >
            {score}
          </span>
        </span>
      )}
    </li>
  )
}

function Trend({ richting, deltaPct }: { richting: TrendRichting; deltaPct: number | null }) {
  if (richting === 'geen' || richting === 'stabiel') {
    return (
      <Minus
        size={14}
        strokeWidth={2.4}
        aria-label={richting === 'stabiel' ? 'stabiel t.o.v. vorige week' : 'geen trend'}
        style={{ color: 'var(--text-4)' }}
      />
    )
  }

  const omhoog = richting === 'op'
  const Icoon = omhoog ? TrendingUp : TrendingDown
  const pct = deltaPct !== null ? `${Math.abs(deltaPct)}%` : ''
  return (
    <Icoon
      size={14}
      strokeWidth={2.4}
      aria-label={`${omhoog ? 'omhoog' : 'omlaag'} ${pct} t.o.v. vorige week`.trim()}
      style={{ color: omhoog ? 'var(--brand)' : 'var(--status-warning)' }}
    />
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

// De check-in-link deelt het uiterlijk van de primaire Knop, maar is een echte
// <a> (navigatie), geen <button> — daarom niet de Knop-primitive hergebruikt.
const KNOP_STIJL = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--brand)',
  background: 'var(--brand-soft)',
  color: 'var(--brand)',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  justifySelf: 'start',
} as const
