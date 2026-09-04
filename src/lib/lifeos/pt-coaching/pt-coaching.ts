// ─── LifeOS — PT-coaching: de evaluatie (puur) ──────────────────────────────
// Geen fetch, geen DB. De vorm van één coaching-evaluatie, de validatie op de
// systeemgrens, en de samenvatting die in de CRM-tijdlijn belandt. Eigen bestand
// zodat het zonder database testbaar is — de scores bepalen wat je later terugziet.

const MAX_NOTITIE = 4000
const MAX_AANDACHTSPUNT = 2000

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Drie korte scores, elk 1..5. Meer niet — kort in te vullen, goed te volgen. */
export interface EvaluatieScores {
  /** Algemeen gevoel over hoe het met de klant gaat. */
  algemeen: number
  /** Energie / motivatie. */
  energie: number
  /** Voortgang richting het doel. */
  voortgang: number
}

/** Wat je invult bij het afronden van een coaching. */
export interface EvaluatieInvoer {
  scores: EvaluatieScores
  /** Wat besproken is. Optioneel. */
  notitie?: string
  /** Aandachtspunt / rode vlag. Optioneel. */
  aandachtspunt?: string
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Een score is een heel getal 1..5. Alles anders is een kapot formulier, geen 0. */
function leesScore(v: unknown, naam: string): Validatie<number> {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
    return { ok: false, fout: `${naam} moet een score van 1 tot en met 5 zijn.` }
  }
  return { ok: true, waarde: v }
}

function leesTekstOptioneel(v: unknown, veld: string, max: number): Validatie<string | undefined> {
  if (v === null || v === undefined) return { ok: true, waarde: undefined }
  if (typeof v !== 'string') return { ok: false, fout: `${veld} moet tekst zijn.` }
  const tekst = v.trim()
  if (tekst.length === 0) return { ok: true, waarde: undefined }
  if (tekst.length > max) return { ok: false, fout: `${veld} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: tekst }
}

/** Een evaluatie uit onbekende invoer (request body). Faalt met een leesbare melding. */
export function leesEvaluatie(body: unknown): Validatie<EvaluatieInvoer> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const scoresRuw = body.scores
  if (!isObject(scoresRuw)) return { ok: false, fout: 'Scores ontbreken.' }

  const algemeen = leesScore(scoresRuw.algemeen, 'Algemeen gevoel')
  if (!algemeen.ok) return algemeen
  const energie = leesScore(scoresRuw.energie, 'Energie/motivatie')
  if (!energie.ok) return energie
  const voortgang = leesScore(scoresRuw.voortgang, 'Voortgang')
  if (!voortgang.ok) return voortgang

  const notitie = leesTekstOptioneel(body.notitie, 'Notitie', MAX_NOTITIE)
  if (!notitie.ok) return notitie
  const aandachtspunt = leesTekstOptioneel(body.aandachtspunt, 'Aandachtspunt', MAX_AANDACHTSPUNT)
  if (!aandachtspunt.ok) return aandachtspunt

  return {
    ok: true,
    waarde: {
      scores: { algemeen: algemeen.waarde, energie: energie.waarde, voortgang: voortgang.waarde },
      ...(notitie.waarde !== undefined ? { notitie: notitie.waarde } : {}),
      ...(aandachtspunt.waarde !== undefined ? { aandachtspunt: aandachtspunt.waarde } : {}),
    },
  }
}

/**
 * De regel die in de CRM-tijdlijn komt (als `notitie`-gebeurtenis). Zo staat de
 * coaching óók in het bestaande historie-logboek van de persoon, niet alleen in
 * de aparte tabel — je ziet 'm terug waar je de rest van het contact ziet.
 */
export function evaluatieSamenvatting(inv: EvaluatieInvoer): string {
  const { algemeen, energie, voortgang } = inv.scores
  let s = `Coaching afgerond — algemeen ${algemeen}/5, energie ${energie}/5, voortgang ${voortgang}/5.`
  if (inv.notitie) s += ` ${inv.notitie}`
  if (inv.aandachtspunt) s += ` Aandachtspunt: ${inv.aandachtspunt}`
  return s
}

// ─── De vorm over de draad (geschiedenis lezen) ─────────────────────────────

/** Eén opgeslagen evaluatie zoals de UI 'm terugleest. */
export interface EvaluatieJson {
  id: string
  aangemaaktOp: string
  scores: EvaluatieScores
  notitie: string | null
  aandachtspunt: string | null
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function leesEvaluatieJson(ruw: unknown): EvaluatieJson | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const aangemaaktOp = tekstOfNull(ruw.aangemaaktOp)
  const scores = ruw.scores
  if (id === null || aangemaaktOp === null || !isObject(scores)) return null
  const a = scores.algemeen, e = scores.energie, v = scores.voortgang
  if (typeof a !== 'number' || typeof e !== 'number' || typeof v !== 'number') return null
  return {
    id,
    aangemaaktOp,
    scores: { algemeen: a, energie: e, voortgang: v },
    notitie: tekstOfNull(ruw.notitie),
    aandachtspunt: tekstOfNull(ruw.aandachtspunt),
  }
}

/** De lijst evaluaties van `GET /api/lifeos/pt-coaching`, of null als het niet klopt. */
export function leesEvaluaties(ruw: unknown): EvaluatieJson[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.evaluaties)) return null
  const items = ruw.evaluaties.map(leesEvaluatieJson)
  if (items.some((i) => i === null)) return null
  return items.filter((i): i is EvaluatieJson => i !== null)
}

/**
 * Het resultaat van het afronden. De evaluatie is opgeslagen (anders was het een
 * foutstatus geweest); `afspraakFout` is niet-null als alléén het inplannen van de
 * volgende afspraak misging — dan is de coaching wél vastgelegd, maar moet je de
 * volgende nog handmatig zetten. Eerlijk gescheiden, geen alles-of-niets-leugen.
 */
export interface AfrondResultaat {
  afspraakFout: string | null
}

export function leesAfrondResultaat(ruw: unknown): AfrondResultaat | null {
  if (!isObject(ruw)) return null
  const f = ruw.afspraakFout
  return { afspraakFout: typeof f === 'string' && f.trim().length > 0 ? f : null }
}
