// ─── LifeOS — Vita's geheugen: de vorm en de grens ──────────────────────────
// `vita_geheugen` bestaat sinds migratie 040 en wordt gelezen door `context.ts`
// (de sectie "Wat ik over Kane onthoud"). Er was tot nu toe geen enkele INSERT in
// de codebase — de sectie was dus permanent leeg. Dit is de vorm van de schrijfkant;
// de database-operaties staan in `geheugen-opslag.ts` (zelfde split als
// `taken/taken.ts` + `taken/opslag.ts`).
//
// PUUR en gedeeld: dit bestand wordt zowel op de server als in de browser
// geïmporteerd (het geheugenpaneel leest er zijn types en grenzen uit). Er mag hier
// dus niets in dat maar aan één van beide kanten bestaat — geen Supabase-client,
// geen `process.env`.
//
// ─── DE GRENS: VITA SCHRIJFT HIER NIET ──────────────────────────────────────
//
//   Alleen Kane legt een feit vast. Vita niet — niet uit een gesprek, niet "omdat
//   hij het opving", niet als suggestie die stilletjes blijft staan.
//
//   Dat is geen belofte maar een eigenschap van de constructie:
//
//     1. Het model heeft geen tool-use in `/api/lifeos/vita/vraag`. Het kan geen
//        route aanroepen. Het produceert tekst, meer niet.
//     2. Deze module wordt uitsluitend aangeroepen vanuit
//        `/api/lifeos/vita/geheugen`, achter de founder-gate. Dat endpoint vuurt
//        alleen op een expliciete handeling van Kane.
//     3. `bron` wordt server-side gezet, niet door de client meegegeven. Een
//        opgeslagen herkomst kan dus niet liegen.
//
//   Zou Vita zelf mogen onthouden, dan slaat hij vroeg of laat een aanname op als
//   feit ("Kane traint 's ochtends" na één zin over één ochtend). Vanaf dat moment
//   staat die aanname in élke systeemprompt, als waarheid, zonder dat iemand het
//   ooit bevestigd heeft. Dat is exact de leugen die dit project niet vertelt.
//   Wil je hier ooit een "Vita stelt voor te onthouden"-pad bij bouwen: dan hoort
//   dat een aparte staat te zijn (voorgesteld ≠ bevestigd), geen extra `bron`.
//
// De validatie hieronder is de systeemgrens (user input). De regels staan óók in de
// database (040 + 120). Dat is geen duplicatie maar diepteverdediging met twee
// doelen: de database garandeert de invariant, deze laag geeft er een Nederlandse
// zin bij in plaats van "23514".

// ─── Vorm ───────────────────────────────────────────────────────────────────

/** De drie soorten uit 040. Allowlist — spiegelt de check-constraint. */
export const GEHEUGEN_SOORTEN = ['voorkeur', 'feit', 'doel'] as const

export type GeheugenSoort = (typeof GEHEUGEN_SOORTEN)[number]

/**
 * Plafond op de inhoud, gelijk aan de check-constraint in 120.
 *
 * Elk geheugen gaat bij ELKE Vita-request mee in de systeemprompt. Dit is dus
 * geen kosmetische grens: het is de rem op een prompt die volloopt met geplakte
 * tekst waar je per vraag opnieuw voor betaalt.
 */
export const MAX_INHOUD_LENGTE = 500

export interface NieuwGeheugen {
  soort: GeheugenSoort
  inhoud: string
  /** Waar dit vandaan komt. `null` = onbekend → lees het als onbevestigd. */
  bron: string | null
}

/** Eén geheugenregel zoals hij uit de database komt én over de draad gaat. */
export interface GeheugenRegel {
  id: string
  soort: GeheugenSoort
  inhoud: string
  bron: string | null
  aangemaaktOp: string
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export function isGeheugenSoort(v: unknown): v is GeheugenSoort {
  return typeof v === 'string' && (GEHEUGEN_SOORTEN as readonly string[]).includes(v)
}

// ─── Systeemgrens: de request-body ──────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Leest een nieuw geheugen uit een request-body.
 *
 * `bron` staat hier bewust NIET in: die zet de route server-side (zie de kop van
 * dit bestand). Zou de client 'm mogen meesturen, dan kon een schrijver zichzelf
 * een herkomst geven die niet klopt — en dan is `bron` geen bewijs meer maar een
 * bewering.
 */
export function leesNieuwGeheugen(body: unknown): Validatie<Omit<NieuwGeheugen, 'bron'>> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  if (!isGeheugenSoort(body.soort)) {
    return { ok: false, fout: `Soort moet ${GEHEUGEN_SOORTEN.join(', ')} zijn.` }
  }

  if (typeof body.inhoud !== 'string') return { ok: false, fout: 'Inhoud ontbreekt.' }
  const inhoud = body.inhoud.trim()
  if (inhoud.length === 0) {
    return { ok: false, fout: 'Een leeg geheugen is geen geheugen.' }
  }
  if (inhoud.length > MAX_INHOUD_LENGTE) {
    return { ok: false, fout: `Hou het onder ${MAX_INHOUD_LENGTE} tekens — dit gaat bij elke vraag mee.` }
  }

  return { ok: true, waarde: { soort: body.soort, inhoud } }
}

/** Ruwe UUID-vorm. Genoeg om een onzin-id af te wijzen vóór de database. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function leesGeheugenId(v: unknown): Validatie<string> {
  if (typeof v !== 'string' || !UUID.test(v)) {
    return { ok: false, fout: 'Geen geldig id.' }
  }
  return { ok: true, waarde: v }
}

// ─── Systeemgrens: de databaserij ───────────────────────────────────────────

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

/** Narrowt een rij; een rij die niet klopt wordt `null` en verdwijnt, niet gecast. */
export function geheugenVanRij(rij: unknown): GeheugenRegel | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const inhoud = tekst(rij.inhoud)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || inhoud === null || aangemaaktOp === null) return null
  if (!isGeheugenSoort(rij.soort)) return null

  return { id, soort: rij.soort, inhoud, bron: tekst(rij.bron), aangemaaktOp }
}

