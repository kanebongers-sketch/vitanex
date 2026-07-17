// ─── LifeOS — de kennisgrafiek opbouwen (puur) ──────────────────────────────
// Puur bestand: geen fetch, geen DB, geen React. `kennis.ts` haalt de rijen op,
// dit bestand maakt er een grafiek van — dezelfde splitsing als `notities.ts`
// (puur) naast `opslag.ts` (database).
//
// Waarom die splitsing hier extra loont: het interessante werk zit niet in de
// query maar in wat erna komt — graden tellen, wensen van notities onderscheiden
// en eerlijk afkappen. Dat is precies het soort logica dat je wilt kunnen testen
// zonder database, en dat is hier dus ook getest (grafiek.test.ts).

/**
 * Hoeveel kanten we maximaal ophalen, en hoeveel knopen we tonen.
 *
 * Niet omdat de database het niet aankan, maar omdat een grafiek met 2000 kanten
 * een wolk is waar je niets in ziet. Wie afkapt, moet het zeggen: `afgekapt`
 * gaat mee in het antwoord en de UI toont het. Stil afkappen is liegen over hoe
 * groot je eigen kennis is.
 */
export const MAX_KANTEN = 600
export const MAX_KNOPEN = 500

/** Hoe lang het label van een titelloze notitie mag zijn. */
const MAX_LABEL = 40

/** Eén knoop: een notitie, of een titel waar (nog) geen notitie bij hoort. */
export interface GrafiekKnoop {
  /** Stabiele sleutel: `n:<id>` voor een notitie, `w:<titelsleutel>` voor een wens. */
  sleutel: string
  /** Het notitie-id, of null als deze knoop nog niet bestaat. */
  id: string | null
  label: string
  /** False = "wanted link": er wordt naar verwezen, maar de notitie is er niet. */
  bestaat: boolean
  /** Aantal kanten dat deze knoop raakt. Geteld, niet geschat. */
  graad: number
}

export interface GrafiekKant {
  bron: string
  doel: string
}

export interface Grafiek {
  knopen: GrafiekKnoop[]
  kanten: GrafiekKant[]
  /** True = niet alles staat erin. De UI hoort dit te tonen, niet te negeren. */
  afgekapt: boolean
}

/** Eén rij uit `notitie_links`, al genarrowd door `kennis.ts`. */
export interface LinkRij {
  bron_id: string
  doel_id: string | null
  doel_titel: string
  doel_sleutel: string
}

/** Wat we van een betrokken notitie nodig hebben om 'm te kunnen labelen. */
export interface KnoopBron {
  titel: string | null
  tekst: string
}

/**
 * Kanten + notities → een grafiek.
 *
 * `teVeelKanten` komt van de caller: die weet of de query tegen `MAX_KANTEN`
 * aanliep. Het gaat één op één door naar `afgekapt`, samen met een eventuele
 * afkapping op knopen hieronder.
 */
export function bouwGrafiek(
  rijen: readonly LinkRij[],
  notities: ReadonlyMap<string, KnoopBron>,
  teVeelKanten: boolean,
): Grafiek {
  const knopen = new Map<string, GrafiekKnoop>()
  const kanten: GrafiekKant[] = []

  for (const rij of rijen) {
    const bron = notities.get(rij.bron_id)
    // Een bron die we niet konden ophalen overslaan i.p.v. 'm te verzinnen: een
    // knoop met een gegokt label is erger dan een knoop die er niet is.
    if (bron === undefined) continue

    const bronSleutel = zetKnoop(knopen, {
      sleutel: `n:${rij.bron_id}`,
      id: rij.bron_id,
      label: maakLabel(bron.titel, bron.tekst),
      bestaat: true,
    })
    const doelSleutel = zetDoel(knopen, rij, notities)

    kanten.push({ bron: bronSleutel, doel: doelSleutel })
  }

  for (const kant of kanten) {
    verhoogGraad(knopen, kant.bron)
    verhoogGraad(knopen, kant.doel)
  }

  return kapAf([...knopen.values()], kanten, teVeelKanten)
}

function zetKnoop(knopen: Map<string, GrafiekKnoop>, knoop: Omit<GrafiekKnoop, 'graad'>): string {
  if (!knopen.has(knoop.sleutel)) knopen.set(knoop.sleutel, { ...knoop, graad: 0 })
  return knoop.sleutel
}

/**
 * De doelknoop van een kant: een echte notitie, of een wens.
 *
 * `doel_id` staat maar is niet opgehaald? Dan is de notitie er wél maar zit hij
 * buiten onze selectie. Hem als wens tekenen zou liegen ("bestaat nog niet"),
 * dus houden we 'm als notitie-knoop met zijn titel als label.
 */
function zetDoel(
  knopen: Map<string, GrafiekKnoop>,
  rij: LinkRij,
  notities: ReadonlyMap<string, KnoopBron>,
): string {
  if (rij.doel_id === null) {
    return zetKnoop(knopen, {
      sleutel: `w:${rij.doel_sleutel}`,
      id: null,
      label: rij.doel_titel,
      bestaat: false,
    })
  }

  const doel = notities.get(rij.doel_id)
  return zetKnoop(knopen, {
    sleutel: `n:${rij.doel_id}`,
    id: rij.doel_id,
    label: doel === undefined ? rij.doel_titel : maakLabel(doel.titel, doel.tekst),
    bestaat: true,
  })
}

function verhoogGraad(knopen: Map<string, GrafiekKnoop>, sleutel: string): void {
  const knoop = knopen.get(sleutel)
  if (knoop !== undefined) knopen.set(sleutel, { ...knoop, graad: knoop.graad + 1 })
}

/**
 * Te veel knopen? Houd de best verbonden over — die dragen de meeste betekenis.
 * Bij gelijke graad op label, zodat de uitkomst deterministisch is: dezelfde
 * data moet dezelfde grafiek geven, elke lading opnieuw.
 */
function kapAf(
  knopen: readonly GrafiekKnoop[],
  kanten: readonly GrafiekKant[],
  teVeelKanten: boolean,
): Grafiek {
  if (knopen.length <= MAX_KNOPEN) {
    return { knopen: [...knopen], kanten: [...kanten], afgekapt: teVeelKanten }
  }

  const gesorteerd = [...knopen].sort(
    (a, b) => b.graad - a.graad || a.label.localeCompare(b.label, 'nl'),
  )
  const behouden = gesorteerd.slice(0, MAX_KNOPEN)
  const sleutels = new Set(behouden.map((k) => k.sleutel))

  return {
    knopen: behouden,
    // Een kant naar een weggevallen knoop tekenen kan niet — die zou nergens
    // heen wijzen. Ze vallen weg mét de knoop, en `afgekapt` zegt dat er meer is.
    kanten: kanten.filter((k) => sleutels.has(k.bron) && sleutels.has(k.doel)),
    afgekapt: true,
  }
}

/** Een titelloze notitie heeft geen naam — dan maar het begin van zijn tekst. */
export function maakLabel(titel: string | null, tekst: string): string {
  if (titel !== null && titel.trim().length > 0) return titel.trim()

  const eersteRegel = tekst.trim().split('\n')[0]?.trim() ?? ''
  if (eersteRegel.length === 0) return '(lege notitie)'
  return eersteRegel.length > MAX_LABEL ? `${eersteRegel.slice(0, MAX_LABEL).trimEnd()}…` : eersteRegel
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// Geen cast: een grafiek met een half object erin crasht de tekening drie lagen
// verderop. Zie `notities.ts` voor dezelfde afweging.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leesKnoop(ruw: unknown): GrafiekKnoop | null {
  if (!isObject(ruw)) return null
  const { sleutel, id, label, bestaat, graad } = ruw

  if (typeof sleutel !== 'string' || sleutel.length === 0) return null
  if (typeof label !== 'string' || label.length === 0) return null
  if (typeof bestaat !== 'boolean') return null
  if (typeof graad !== 'number' || !Number.isFinite(graad)) return null

  return { sleutel, id: typeof id === 'string' ? id : null, label, bestaat, graad }
}

function leesKant(ruw: unknown): GrafiekKant | null {
  if (!isObject(ruw)) return null
  const { bron, doel } = ruw
  if (typeof bron !== 'string' || typeof doel !== 'string') return null
  return { bron, doel }
}

/**
 * Het antwoord van `GET /api/lifeos/notities/grafiek`.
 *
 * Kapotte knopen vallen weg, en dan moeten hun kanten óók weg: een lijn naar een
 * knoop die er niet is, wijst nergens heen. `afgekapt` blijft staan zodat de UI
 * eerlijk kan zeggen dat dit niet alles is.
 */
export function leesGrafiekAntwoord(ruw: unknown): Grafiek | null {
  if (!isObject(ruw) || !Array.isArray(ruw.knopen) || !Array.isArray(ruw.kanten)) return null

  const knopen = ruw.knopen.map(leesKnoop).filter((k): k is GrafiekKnoop => k !== null)
  const sleutels = new Set(knopen.map((k) => k.sleutel))
  const kanten = ruw.kanten
    .map(leesKant)
    .filter((k): k is GrafiekKant => k !== null && sleutels.has(k.bron) && sleutels.has(k.doel))

  return { knopen, kanten, afgekapt: ruw.afgekapt === true }
}
