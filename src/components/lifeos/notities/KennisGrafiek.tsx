'use client'

import type { CSSProperties } from 'react'
import type { Grafiek, GrafiekKnoop } from '@/lib/lifeos/notities/grafiek'

// De kennisgrafiek: welke notities verwijzen naar welke.
//
// ─── GEEN GRAPH-LIBRARY, EN GEEN FORCE-SIMULATIE ────────────────────────────
//   De standaardzet is d3-force of vis-network: knopen die uit elkaar duwen tot
//   het uitgekristalliseerd is. Dat kost een dependency van tientallen KB's, het
//   draait een fysica-loop op elke frame (zie performance.md), en — het ergste —
//   het geeft elke keer een ANDERE layout. Een grafiek die na elke refresh
//   herschikt, kun je niet lezen: je herkent je eigen kennis niet terug.
//
//   Dit is een cirkel. Deterministisch (op label gesorteerd), dus dezelfde data
//   geeft altijd exact hetzelfde beeld. Geen loop, geen library, één render.
//
//   De eerlijke prijs: een cirkel toont geen clusters. Force-layout laat zien
//   "deze vijf notities horen bij elkaar"; een cirkel niet — die laat alleen
//   zien wát met wát verbonden is. Voor de vraag "waar had ik het hier eerder
//   over?" is dat genoeg. Wordt clustering ooit de vraag, dan is dit het moment
//   voor een echte layout — en dan bewust, niet omdat de library het toevallig kon.
//
// Presentational: krijgt een grafiek, tekent 'm. Geen fetch, geen state.

interface KennisGrafiekProps {
  grafiek: Grafiek
}

const MAAT = 720
const MIDDEN = MAAT / 2
/** Ruimte buiten de cirkel voor de labels. */
const STRAAL = 236
/** Boven dit aantal knopen worden labels een onleesbare kluwen; dan alleen stippen. */
const LABEL_GRENS = 26
/** Langere labels afkappen; de volledige tekst zit in de <title>. */
const MAX_LABEL = 22

interface Plek {
  knoop: GrafiekKnoop
  x: number
  y: number
  hoek: number
}

/**
 * Legt de knopen op een cirkel. Deterministisch: gesorteerd op label, zodat
 * dezelfde grafiek altijd hetzelfde beeld geeft.
 */
function berekenPlekken(knopen: readonly GrafiekKnoop[]): Plek[] {
  const gesorteerd = [...knopen].sort((a, b) => a.label.localeCompare(b.label, 'nl'))

  return gesorteerd.map((knoop, i) => {
    // Start bovenaan (-π/2) en loop met de klok mee — zo leest de cirkel als een
    // wijzerplaat i.p.v. willekeurig te beginnen.
    const hoek = (i / gesorteerd.length) * Math.PI * 2 - Math.PI / 2
    return {
      knoop,
      x: MIDDEN + Math.cos(hoek) * STRAAL,
      y: MIDDEN + Math.sin(hoek) * STRAAL,
      hoek,
    }
  })
}

/** Meer verbindingen = een grotere stip. Geteld, niet gevoeld. */
function stipStraal(graad: number): number {
  return 3 + Math.min(graad, 10) * 0.55
}

function kortLabel(label: string): string {
  return label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL).trimEnd()}…` : label
}

export function KennisGrafiek({ grafiek }: KennisGrafiekProps) {
  const { knopen, kanten, afgekapt } = grafiek

  if (knopen.length === 0) {
    return (
      <NogGeenGrafiek />
    )
  }

  const plekken = berekenPlekken(knopen)
  const opSleutel = new Map(plekken.map((p) => [p.knoop.sleutel, p]))
  const metLabels = plekken.length <= LABEL_GRENS
  const wensen = knopen.filter((k) => !k.bestaat).length

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <style>{STIJL}</style>

      <svg
        viewBox={`0 0 ${MAAT} ${MAAT}`}
        role="img"
        // De cijfers hieronder zijn geteld, niet geschat. Voor wie de tekening
        // niet ziet is dit de samenvatting; de volledige lijst staat eronder.
        aria-label={`Kennisgrafiek: ${knopen.length} notities, ${kanten.length} verwijzingen.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Kanten eerst: lijnen horen achter de stippen. */}
        <g>
          {kanten.map((kant, i) => {
            const van = opSleutel.get(kant.bron)
            const naar = opSleutel.get(kant.doel)
            if (van === undefined || naar === undefined) return null
            return (
              <line
                key={i}
                x1={van.x}
                y1={van.y}
                x2={naar.x}
                y2={naar.y}
                className="os-grafiek__kant"
              />
            )
          })}
        </g>

        <g>
          {plekken.map((plek) => (
            <Knoop key={plek.knoop.sleutel} plek={plek} metLabel={metLabels} />
          ))}
        </g>
      </svg>

      <Legenda knopen={knopen.length} kanten={kanten.length} wensen={wensen} />

      {!metLabels ? (
        <p style={NOOT}>
          Te veel knopen voor leesbare namen — de namen staan in de lijst hieronder.
        </p>
      ) : null}

      {afgekapt ? (
        <p style={NOOT}>
          Dit is niet je hele netwerk: de grafiek toont de best verbonden notities. Er zijn er meer.
        </p>
      ) : null}

      {/* Het tekstuele alternatief. Een SVG met stippen is voor een screenreader
          niets; deze lijst is dezelfde informatie in woorden (accessibility.md).
          Ook de kluwen-zonder-labels hierboven leunt hierop. */}
      <ul style={VERBORGEN}>
        {kanten.map((kant, i) => (
          <li key={i}>
            {opSleutel.get(kant.bron)?.knoop.label} verwijst naar{' '}
            {opSleutel.get(kant.doel)?.knoop.label}
            {opSleutel.get(kant.doel)?.knoop.bestaat === false ? ' (bestaat nog niet)' : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Knoop({ plek, metLabel }: { plek: Plek; metLabel: boolean }) {
  const { knoop, x, y, hoek } = plek
  // Labels links van het midden lijnen rechts uit, en andersom — anders lopen ze
  // over de cirkel heen.
  const rechts = Math.cos(hoek) >= 0
  const label = `${knoop.label}${knoop.bestaat ? '' : ' (bestaat nog niet)'}`

  return (
    <g className="os-grafiek__knoop">
      <circle
        cx={x}
        cy={y}
        r={stipStraal(knoop.graad)}
        className={knoop.bestaat ? 'os-grafiek__stip' : 'os-grafiek__stip--wens'}
      >
        {/* Volledige naam bij hover, ook als het label is afgekapt. */}
        <title>{label}</title>
      </circle>
      {metLabel ? (
        <text
          x={x + (rechts ? 10 : -10)}
          y={y}
          textAnchor={rechts ? 'start' : 'end'}
          dominantBaseline="middle"
          className={knoop.bestaat ? 'os-grafiek__label' : 'os-grafiek__label--wens'}
        >
          {kortLabel(knoop.label)}
        </text>
      ) : null}
    </g>
  )
}

/**
 * De lege staat. Geen verzonnen voorbeeldgrafiek en geen nul die op een meting
 * lijkt — gewoon zeggen dat er nog niets is, en hoe het er komt.
 */
function NogGeenGrafiek() {
  return (
    <div>
      <p className="os-cijfer os-leeg__streep" aria-hidden="true">
        —
      </p>
      <p className="os-leeg__wat">Nog geen verbanden</p>
      <p className="os-leeg__waarom">
        Schrijf [[Titel]] in een notitie om er een andere aan te knopen.
      </p>
    </div>
  )
}

/**
 * Wat je ziet, in woorden. `wensen` is het interessante getal: dat zijn de
 * notities die je al noemde maar nog niet schreef.
 */
function Legenda({ knopen, kanten, wensen }: { knopen: number; kanten: number; wensen: number }) {
  return (
    <p style={{ ...NOOT, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <span>
        {knopen} {knopen === 1 ? 'notitie' : 'notities'} · {kanten}{' '}
        {kanten === 1 ? 'verwijzing' : 'verwijzingen'}
      </span>
      {wensen > 0 ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <svg width="9" height="9" aria-hidden="true" style={{ overflow: 'visible' }}>
            <circle cx="4.5" cy="4.5" r="3.5" className="os-grafiek__stip--wens" />
          </svg>
          {wensen} nog niet geschreven
        </span>
      ) : null}
    </p>
  )
}

// Hover leunt op CSS, niet op React-state: 500 stippen die elk een setState
// kunnen afvuren is precies de re-render-storm die performance.md verbiedt.
// Alleen `opacity` beweegt — dat is compositor-vriendelijk (animation.md).
const STIJL = `
.os-grafiek__kant {
  stroke: var(--brand);
  stroke-opacity: 0.22;
  stroke-width: 1;
}
.os-grafiek__stip {
  fill: var(--brand);
  fill-opacity: 0.85;
}
.os-grafiek__stip--wens {
  fill: none;
  stroke: var(--text-4);
  stroke-width: 1.2;
  stroke-dasharray: 2 2;
}
.os-grafiek__label {
  fill: var(--text-3);
  font-family: var(--font-grotesk);
  font-size: 11px;
}
.os-grafiek__label--wens {
  fill: var(--text-4);
  font-family: var(--font-grotesk);
  font-size: 11px;
  font-style: italic;
}
.os-grafiek__knoop {
  opacity: 1;
  transition: opacity 180ms var(--ease);
}
svg:hover > g > .os-grafiek__knoop { opacity: 0.45; }
svg:hover > g > .os-grafiek__knoop:hover { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .os-grafiek__knoop { transition: none; }
}
`

const NOOT: CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
