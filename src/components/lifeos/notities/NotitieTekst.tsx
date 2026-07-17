'use client'

import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { ontleedMarkdown, type Blok, type Inline } from '@/lib/lifeos/notities/markdown'
import { titelSleutel } from '@/lib/lifeos/notities/links'

// De tekst van een notitie, met opmaak en klikbare `[[verwijzingen]]`.
//
// ─── GEEN `dangerouslySetInnerHTML`, EN DAT IS DE HELE TRUC ─────────────────
//   De normale route is markdown → HTML-string → `dangerouslySetInnerHTML`, en
//   dan een sanitizer om de XSS er weer uit te halen. Hier komt er nooit een
//   HTML-string aan te pas: `ontleedMarkdown` geeft een STRUCTUUR terug en dit
//   bestand maakt daar React-elementen van.
//
//   Het gevolg is dat onbekende tekst per constructie alleen tekst kan worden.
//   Plak je een `<script>` in je brain dump, dan staat er het woord "<script>" —
//   niet omdat we het eruit filteren (filters lekken), maar omdat er geen pad is
//   waarlangs een string ooit markup wordt. Er valt niets te saniteren.
//
// Presentational: krijgt props, geeft UI terug, weet niets van fetch of opslag.

interface NotitieTekstProps {
  tekst: string
  /**
   * De titels die écht bestaan (als titelsleutel: genormaliseerd + lowercase).
   *
   * WEGLATEN = "ik weet het niet", en dan claimen we niets: elke verwijzing
   * krijgt de neutrale stijl. Dat is bewust — een link "bestaat nog niet" noemen
   * terwijl je de titels niet hebt opgehaald, is een verzonnen bewering.
   */
  bestaandeTitels?: ReadonlySet<string>
  /** Weglaten = verwijzingen zijn tekst, geen knop. */
  onLinkKlik?: (titel: string) => void
  /**
   * Het kopniveau waarop de koppen van deze notitie beginnen. Een `#` in je
   * tekst wordt dus geen `<h1>` midden op een pagina: de hiërarchie van de
   * pagina wint van die van de notitie (zie accessibility.md — geen sprongen).
   */
  basisNiveau?: 2 | 3 | 4 | 5
}

export function NotitieTekst({
  tekst,
  bestaandeTitels,
  onLinkKlik,
  basisNiveau = 3,
}: NotitieTekstProps) {
  const blokken = ontleedMarkdown(tekst)
  if (blokken.length === 0) return null

  return (
    <div style={WIKKEL}>
      {blokken.map((blok, i) => (
        <BlokWeergave
          key={i}
          blok={blok}
          basisNiveau={basisNiveau}
          bestaandeTitels={bestaandeTitels}
          onLinkKlik={onLinkKlik}
        />
      ))}
    </div>
  )
}

interface BlokProps {
  blok: Blok
  basisNiveau: number
  bestaandeTitels?: ReadonlySet<string>
  onLinkKlik?: (titel: string) => void
}

function BlokWeergave({ blok, basisNiveau, bestaandeTitels, onLinkKlik }: BlokProps) {
  const inline = (nodes: readonly Inline[]): ReactNode => (
    <InlineReeks nodes={nodes} bestaandeTitels={bestaandeTitels} onLinkKlik={onLinkKlik} />
  )

  if (blok.soort === 'codeblok') {
    return (
      <pre style={CODEBLOK}>
        <code>{blok.waarde}</code>
      </pre>
    )
  }

  if (blok.soort === 'kop') {
    // Bron-niveau 1 op basis 3 → h3; niveau 2 → h4; nooit boven h6.
    const niveau = Math.min(basisNiveau + blok.niveau - 1, 6)
    const Kop = `h${niveau}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return <Kop style={{ ...KOP, fontSize: KOP_GROOTTE[Math.min(blok.niveau, 3)] }}>{inline(blok.inhoud)}</Kop>
  }

  if (blok.soort === 'lijst') {
    const Lijst = blok.geordend ? 'ol' : 'ul'
    return (
      <Lijst style={LIJST}>
        {blok.items.map((item, i) => (
          <li key={i} style={LIJST_ITEM}>
            {inline(item)}
          </li>
        ))}
      </Lijst>
    )
  }

  // Alinea. `pre-wrap` want de ontleder houdt enters binnen een alinea vast:
  // in een notitie is een enter een enter.
  return <p style={ALINEA}>{inline(blok.inhoud)}</p>
}

interface InlineProps {
  nodes: readonly Inline[]
  bestaandeTitels?: ReadonlySet<string>
  onLinkKlik?: (titel: string) => void
}

function InlineReeks({ nodes, bestaandeTitels, onLinkKlik }: InlineProps) {
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>
          <InlineNode node={node} bestaandeTitels={bestaandeTitels} onLinkKlik={onLinkKlik} />
        </Fragment>
      ))}
    </>
  )
}

function InlineNode({ node, bestaandeTitels, onLinkKlik }: { node: Inline } & Omit<InlineProps, 'nodes'>) {
  if (node.soort === 'tekst') return <>{node.waarde}</>
  if (node.soort === 'code') return <code style={CODE}>{node.waarde}</code>

  if (node.soort === 'vet') {
    return (
      <strong style={{ fontWeight: 650, color: 'var(--text-1)' }}>
        <InlineReeks nodes={node.kinderen} bestaandeTitels={bestaandeTitels} onLinkKlik={onLinkKlik} />
      </strong>
    )
  }

  if (node.soort === 'cursief') {
    return (
      <em style={{ fontStyle: 'italic' }}>
        <InlineReeks nodes={node.kinderen} bestaandeTitels={bestaandeTitels} onLinkKlik={onLinkKlik} />
      </em>
    )
  }

  return <Verwijzing titel={node.titel} bestaandeTitels={bestaandeTitels} onLinkKlik={onLinkKlik} />
}

interface VerwijzingProps {
  titel: string
  bestaandeTitels?: ReadonlySet<string>
  onLinkKlik?: (titel: string) => void
}

/**
 * Eén `[[verwijzing]]`.
 *
 * Drie toestanden, en het verschil ertussen is een eerlijkheidskwestie:
 *
 *   - ONBEKEND (`bestaandeTitels` niet meegegeven): neutrale stijl. We weten niet
 *     of het doel bestaat, dus we beweren niets.
 *   - BESTAAT: cyaan, met onderlijn. Een klik brengt je erheen.
 *   - BESTAAT NIET: gedempt met een stippellijn, plus een titel-attribuut dat het
 *     uitlegt. Bewust zichtbaar ánders — dit is Obsidians "wanted link": je
 *     schreef 'm op voordat de notitie bestond, en dat is geen fout maar een
 *     openstaande gedachte.
 */
function Verwijzing({ titel, bestaandeTitels, onLinkKlik }: VerwijzingProps) {
  const sleutel = titelSleutel(titel)
  const weten = bestaandeTitels !== undefined
  const bestaat = weten && sleutel !== null && bestaandeTitels.has(sleutel)

  const stijl: CSSProperties = weten && !bestaat ? LINK_WENS : LINK
  const uitleg = weten && !bestaat ? `${titel} — deze notitie bestaat nog niet` : titel

  if (onLinkKlik === undefined) {
    return (
      <span style={stijl} title={uitleg}>
        {titel}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onLinkKlik(titel)}
      title={uitleg}
      // Zegt in woorden wat de stippellijn visueel zegt — kleur en streepjes
      // alleen dragen geen betekenis over (accessibility.md).
      aria-label={weten && !bestaat ? `${titel} (bestaat nog niet)` : titel}
      style={{ ...stijl, ...LINK_KNOP }}
    >
      {titel}
    </button>
  )
}

const WIKKEL: CSSProperties = { display: 'grid', gap: 8 }

const ALINEA: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--text-2)',
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
}

const KOP: CSSProperties = {
  margin: '2px 0 0',
  fontWeight: 600,
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  color: 'var(--text-1)',
  overflowWrap: 'anywhere',
}

/** Hiërarchie via schaal, niet via drie keer dezelfde vette regel. */
const KOP_GROOTTE: Record<number, number> = { 1: 16, 2: 14, 3: 13 }

const LIJST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 3,
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--text-2)',
}

const LIJST_ITEM: CSSProperties = { overflowWrap: 'anywhere' }

const CODE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '1px 5px',
  borderRadius: 4,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
}

const CODEBLOK: CSSProperties = {
  margin: 0,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-2)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  lineHeight: 1.5,
  overflowX: 'auto',
}

const LINK: CSSProperties = {
  color: 'var(--brand)',
  textDecoration: 'underline',
  textDecorationColor: 'color-mix(in srgb, var(--brand) 40%, transparent)',
  textUnderlineOffset: 2,
}

/** De "wanted link": zichtbaar anders, zonder te schreeuwen. */
const LINK_WENS: CSSProperties = {
  color: 'var(--text-3)',
  textDecoration: 'underline dashed',
  textDecorationColor: 'var(--text-4)',
  textUnderlineOffset: 2,
}

/** Een knop die zich als tekst gedraagt — inclusief afbreken midden in een zin. */
const LINK_KNOP: CSSProperties = {
  display: 'inline',
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
}
