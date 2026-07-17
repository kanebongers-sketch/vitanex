// ─── LifeOS — notities: brain dump & journal ────────────────────────────────
// Vervangt Apple Notes / Google Keep (brain dump) en je journal-app (journal).
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 050). Dat is geen duplicatie
// maar diepteverdediging met verschillende doelen: de database garandeert dat
// er nooit twee journals op één dag staan, deze laag geeft je een nette
// Nederlandse foutmelding in plaats van "23505".
//
// Eén type voor beide soorten — zie de onderbouwing bovenin migratie 050.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { MAX_TITEL_LENGTE, normaliseerTitel } from './links'
import { leesTags } from './tags'

export const MAX_TEKST_LENGTE = 10_000

/**
 * Standaard- en maximumaantal notities per pagina.
 *
 * Zonder limiet groeit `GET /api/lifeos/notities?zoek=…` mee met de database:
 * een brain dump van drie jaar is één query die alles ophaalt. 100 is wat een
 * mens leest; 500 is de bovengrens voor wie bewust doorbladert.
 */
export const NOTITIES_LIMIET = 100
export const MAX_NOTITIES_LIMIET = 500

/**
 * Wat voor tekst dit is.
 *
 *   brain_dump — één tik, idee uit je hoofd. Onbeperkt veel per dag.
 *   journal    — de reflectie van die dag. Maximaal één per dag (DB-index).
 */
export type Soort = 'brain_dump' | 'journal'

export const SOORTEN: readonly Soort[] = Object.freeze(['brain_dump', 'journal'])

/**
 * De zes categorieën waarin een notitie kan vallen (migratie 090). Bewust géén
 * 'onbekend': dat is de AI-uitkomst "ik weet het niet", en die slaan we op als
 * `null` — één manier om "geen categorie" te zeggen. Zie `CategorieSuggestie`
 * voor de AI-kant, waar 'onbekend' wél bestaat.
 */
export const NOTITIE_CATEGORIEEN = [
  'Werk',
  'Ideeën',
  'Persoonlijk',
  'Projecten',
  'Training',
  'Klanten',
] as const

export type NotitieCategorie = (typeof NOTITIE_CATEGORIEEN)[number]

export function isNotitieCategorie(v: unknown): v is NotitieCategorie {
  return typeof v === 'string' && (NOTITIE_CATEGORIEEN as readonly string[]).includes(v)
}

/**
 * Wat de AI voorstelt: een echte categorie, óf 'onbekend' als het model niets
 * durfde te kiezen. 'onbekend' is nooit een opgeslagen waarde — de UI vertaalt
 * het naar "geen suggestie". Verzint niets.
 */
export type CategorieSuggestie = NotitieCategorie | 'onbekend'

export function isCategorieSuggestie(v: unknown): v is CategorieSuggestie {
  return v === 'onbekend' || isNotitieCategorie(v)
}

/** Een notitie, zoals hij uit de database komt én over de draad gaat. */
export interface Notitie {
  id: string
  tekst: string
  soort: Soort
  /** Dagsleutel (YYYY-MM-DD). Nooit null: een idee zonder dag ben je kwijt. */
  datum: string
  /**
   * De naam waaronder andere notities naar deze kunnen verwijzen (`[[Titel]]`),
   * of null. Null is de NORM, niet onaf: capture blijft één tik zonder titel.
   * Zie migratie 110 voor de onderbouwing.
   */
  titel: string | null
  /** Genormaliseerde labels (lowercase, dedup). Leeg is de norm, niet fout. */
  tags: string[]
  /** Eén van de zes categorieën, of null = nog niet ingedeeld. */
  categorie: NotitieCategorie | null
  aangemaaktOp: string
  bijgewerktOp: string
}

/** Alleen de meegestuurde velden worden gewijzigd — zie `leesNotitieWijziging`. */
export interface NotitieWijziging {
  /** De tekst zelf. Een typefout corrigeren hoort geen delete-en-opnieuw te zijn. */
  tekst?: string
  /** Nieuwe titel, of expliciet `null` om 'm weg te halen. */
  titel?: string | null
  tags?: string[]
  categorie?: NotitieCategorie | null
}

export interface NieuweNotitie {
  tekst: string
  soort: Soort
  datum: string
  /**
   * Optioneel. Bestaat voor precies één flow: je klikt op een `[[verwijzing]]`
   * naar een notitie die er nog niet is, en maakt 'm dan mét die titel aan —
   * waarna alle wachtende verwijzingen naar die titel vanzelf vastklikken.
   * Bij een gewone capture blijft dit weg.
   */
  titel?: string
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

// LET OP — `Validatie<T>` staat ook in `lib/taken/taken.ts`. Dat is bewust geen
// gedeelde import: het is een type-alias van één regel, en die over een
// feature-grens heen delen koppelt taken aan notities zonder dat ze iets met
// elkaar te maken hebben. Hoort op termijn in een neutrale `lib/api/`, samen met
// `haalJson` en `datum.ts` — dan één keer, voor iedereen.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isSoort(v: unknown): v is Soort {
  return v === 'brain_dump' || v === 'journal'
}

/**
 * Leest de tekst van een notitie.
 *
 * Trimt, want ' ' is leeg — en een lege notitie is geen notitie. De database
 * denkt er hetzelfde over (check-constraint op `length(btrim(tekst))`).
 */
export function leesTekst(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Tekst ontbreekt.' }
  const tekst = v.trim()
  if (tekst.length === 0) return { ok: false, fout: 'Een lege notitie is geen notitie.' }
  if (tekst.length > MAX_TEKST_LENGTE) {
    return { ok: false, fout: `Tekst mag maximaal ${MAX_TEKST_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: tekst }
}

/** Dagsleutel uit een request. Faalt op onzin i.p.v. een Invalid Date door te geven. */
export function leesDatum(v: unknown): Validatie<string> {
  if (typeof v !== 'string' || leesDatumSleutel(v) === null) {
    return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  }
  return { ok: true, waarde: v }
}

function leesSoort(v: unknown): Validatie<Soort> {
  if (!isSoort(v)) return { ok: false, fout: 'Soort is "brain_dump" of "journal".' }
  return { ok: true, waarde: v }
}

/**
 * Leest een titel. Weigert i.p.v. af te kappen — een afgekapte titel wijst stil
 * naar een andere notitie dan je bedoelde. Zie `normaliseerTitel`.
 */
export function leesTitel(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Titel moet tekst zijn.' }
  const titel = normaliseerTitel(v)
  if (titel === null) {
    return v.trim().length === 0
      ? { ok: false, fout: 'Een lege titel is geen titel.' }
      : { ok: false, fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: titel }
}

/** Nieuwe notitie uit een request-body. Faalt met een leesbare melding. */
export function leesNieuweNotitie(body: unknown): Validatie<NieuweNotitie> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const tekst = leesTekst(body.tekst)
  if (!tekst.ok) return tekst
  const soort = leesSoort(body.soort)
  if (!soort.ok) return soort
  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum

  const nieuw: NieuweNotitie = { tekst: tekst.waarde, soort: soort.waarde, datum: datum.waarde }

  // Alleen als hij meekomt: een titelloze capture is de norm, geen fout.
  if (body.titel !== undefined && body.titel !== null) {
    const titel = leesTitel(body.titel)
    if (!titel.ok) return titel
    nieuw.titel = titel.waarde
  }

  return { ok: true, waarde: nieuw }
}

/**
 * Een wijziging (PATCH) uit een request-body: `tekst`, `titel`, `tags` en/of
 * `categorie`. Allemaal optioneel, want een PATCH mag er één raken. Minstens één
 * moet aanwezig zijn — een lege wijziging is een fout, geen stille no-op.
 *
 * `tekst` staat hier bewust bij. Het ontbrak, waardoor een typefout corrigeren
 * neerkwam op de notitie weggooien en opnieuw typen — met een nieuw id, een
 * nieuwe aangemaakt_op en verbroken backlinks. Dat is geen bewerken maar
 * dataverlies met een omweg.
 *
 * `titel` mag expliciet `null` zijn: dat is "haal de titel weg". Onderscheid met
 * "niet meegestuurd" loopt via `in body`, niet via undefined — anders kun je een
 * titel nooit meer wissen.
 */
export function leesNotitieWijziging(body: unknown): Validatie<NotitieWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: NotitieWijziging = {}

  if ('tekst' in body) {
    const tekst = leesTekst(body.tekst)
    if (!tekst.ok) return tekst
    wijziging.tekst = tekst.waarde
  }

  if ('titel' in body) {
    if (body.titel === null) {
      wijziging.titel = null
    } else {
      const titel = leesTitel(body.titel)
      if (!titel.ok) return titel
      wijziging.titel = titel.waarde
    }
  }

  if ('tags' in body) {
    if (!Array.isArray(body.tags)) return { ok: false, fout: 'Tags moeten een lijst zijn.' }
    wijziging.tags = leesTags(body.tags)
  }

  if ('categorie' in body) {
    if (body.categorie === null) {
      wijziging.categorie = null
    } else if (isNotitieCategorie(body.categorie)) {
      wijziging.categorie = body.categorie
    } else {
      return { ok: false, fout: 'Onbekende categorie.' }
    }
  }

  if (Object.keys(wijziging).length === 0) {
    return { ok: false, fout: 'Niets om te wijzigen.' }
  }
  return { ok: true, waarde: wijziging }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function tekstOfNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Eén rij uit Postgres naar een `Notitie`, of null als hij niet klopt.
 *
 * Geen cast: de database is een systeemgrens als elke andere. Een rij met een
 * onbekende `soort` (bv. na een migratie die de allowlist verruimde) wordt hier
 * geweigerd in plaats van als `Soort` doorgegeven te worden — dat is precies
 * het gat waar `any` doorheen glipt.
 */
export function notitieVanRij(rij: unknown): Notitie | null {
  if (!isObject(rij)) return null

  const id = tekstOfNull(rij.id)
  const tekst = tekstOfNull(rij.tekst)
  const datum = tekstOfNull(rij.datum)
  const aangemaaktOp = tekstOfNull(rij.aangemaakt_op)
  const bijgewerktOp = tekstOfNull(rij.bijgewerkt_op)
  if (id === null || tekst === null || datum === null) return null
  if (aangemaaktOp === null || bijgewerktOp === null) return null
  if (!isSoort(rij.soort)) return null

  return {
    id,
    tekst,
    soort: rij.soort,
    datum,
    // Een onleesbare titel (getal, leeg, te lang) valt terug op null i.p.v. de
    // hele rij te weigeren: de tekst is het kostbare deel, de titel is versiering.
    titel: normaliseerTitel(rij.titel),
    tags: leesTags(rij.tags),
    categorie: isNotitieCategorie(rij.categorie) ? rij.categorie : null,
    aangemaaktOp,
    bijgewerktOp,
  }
}

export function notitiesVanRijen(rijen: readonly unknown[]): Notitie[] {
  return rijen.map(notitieVanRij).filter((n): n is Notitie => n !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Dat is geen duplicatie maar
// twee echt verschillende vormen — en beide worden gelezen, niet gecast.

/** Eén notitie zoals hij over de draad komt. */
export function leesNotitieJson(ruw: unknown): Notitie | null {
  if (!isObject(ruw)) return null

  const id = tekstOfNull(ruw.id)
  const tekst = tekstOfNull(ruw.tekst)
  const datum = tekstOfNull(ruw.datum)
  const aangemaaktOp = tekstOfNull(ruw.aangemaaktOp)
  const bijgewerktOp = tekstOfNull(ruw.bijgewerktOp)
  if (id === null || tekst === null || datum === null) return null
  if (aangemaaktOp === null || bijgewerktOp === null) return null
  if (!isSoort(ruw.soort)) return null

  return {
    id,
    tekst,
    soort: ruw.soort,
    datum,
    titel: normaliseerTitel(ruw.titel),
    tags: leesTags(ruw.tags),
    categorie: isNotitieCategorie(ruw.categorie) ? ruw.categorie : null,
    aangemaaktOp,
    bijgewerktOp,
  }
}

/** Wat `GET /api/lifeos/notities` oplevert: de pagina plus wat erover te zeggen valt. */
export interface NotitiesAntwoord {
  notities: Notitie[]
  /**
   * Rijen die de server stuurde maar die we niet konden lezen. Bijna altijd 0.
   * Is het meer, dan MOET de UI dat zeggen — zie de onderbouwing hieronder.
   */
  onleesbaar: number
  /** Er zijn meer notities dan deze pagina. De UI hoort dat te tonen. */
  erIsMeer: boolean
}

/**
 * Het antwoord van `GET /api/lifeos/notities`.
 *
 * ─── PER RIJ TOLERANT, MAAR NOOIT STIL ──────────────────────────────────────
 *
 * Dit gaf eerst `null` zodra ÉÉN notitie onleesbaar was: dan verdween je hele
 * brain dump achter "Onverwacht antwoord van de server" — 200 goede notities
 * onbereikbaar door één rare rij. De redenering ("fout ≠ leeg") klopte, de
 * conclusie niet: één kapotte rij is geen kapot antwoord.
 *
 * Nu: kapotte rijen vallen weg, maar worden GETELD. Dat telletje is de hele
 * clou — zonder had je stille dataverdwijning, precies wat de oude versie
 * terecht wilde voorkomen. De UI zegt "1 notitie kon niet gelezen worden" en de
 * andere 200 staan er gewoon.
 *
 * `null` blijft bestaan voor een écht kapot antwoord: geen object, of `notities`
 * is geen lijst. Dan is er geen pagina, en dat is wél een storing.
 */
export function leesNotitiesAntwoord(ruw: unknown): NotitiesAntwoord | null {
  if (!isObject(ruw) || !Array.isArray(ruw.notities)) return null

  const gelezen = ruw.notities.map(leesNotitieJson)
  const notities = gelezen.filter((n): n is Notitie => n !== null)

  return {
    notities,
    onleesbaar: gelezen.length - notities.length,
    // Ontbreekt het veld, dan claimen we niet dat er meer is. Geen verzonnen
    // "er is meer" — dat is een belofte die we niet kunnen waarmaken.
    erIsMeer: ruw.erIsMeer === true,
  }
}

/** Wat `POST`/`PATCH` op een notitie oplevert. */
export interface NotitieAntwoord {
  notitie: Notitie
  /**
   * De notitie is opgeslagen, maar iets eromheen ging mis — in de praktijk: de
   * verwijzingen (`[[...]]`) konden niet bijgewerkt worden.
   *
   * Bewust GEEN reden om de hele call te laten falen: je tekst is veilig, en dat
   * is wat telt. Maar ook niet stil: dan zou de grafiek een kant missen zonder
   * dat iemand weet waarom. Null = niets aan de hand.
   */
  waarschuwing: string | null
}

/** Het antwoord van `POST`/`PATCH` op een notitie. */
export function leesNotitieAntwoord(ruw: unknown): NotitieAntwoord | null {
  if (!isObject(ruw)) return null

  const notitie = leesNotitieJson(ruw.notitie)
  if (notitie === null) return null

  return {
    notitie,
    waarschuwing: typeof ruw.waarschuwing === 'string' ? ruw.waarschuwing : null,
  }
}
