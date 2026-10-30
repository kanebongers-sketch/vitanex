// ─── Club, leden-API: eigen schema's van een lid (SERVER-ONLY) ──────────────
// De stappen achter /api/club/lid/training/schemas/**. Het lid komt ALTIJD uit
// de sessie (LidToegang); een id uit de vraag of de body wordt altijd tegen
// dat lid en de sportschool gecontroleerd. Foutmeldingen in de taal van het lid.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import type { LidToegang } from '@/lib/club/ledenlogin/toegang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import type { SchemaInvoer } from '../invoer'
import {
  actiefSchemaId, eigenCoaching, haalAlleOefeningen, haalDetail, haalKeuzes, haalLidBibliotheek, haalLidSchemaInstelling, haalSchemaVanLid,
  heeftCoachingIn, kiesSchema, maakEigenSchema, oefeningenInSchema, telEigen, verwijderEigen, werkSchemaBij,
} from './opslag'
import { heeftOefeningen, leesLidSchema, leesSnelleStart, magBewerken, magVerwijderen, MAX_EIGEN_SCHEMAS, oefeningenToegestaan } from './regels'
import { lidVoorstel } from './voorstel'

async function woorden() {
  return EIGEN_SCHEMA[await getTaal()].fout
}

/** GET bibliotheek: de oefeningen die een lid mag kiezen. */
export async function bibliotheekAntwoord(l: LidToegang): Promise<NextResponse> {
  const lijst = await haalLidBibliotheek(l.admin, l.userId)
  if (!lijst) return clubFout((await woorden()).bibliotheek, 500)
  return clubJson({ oefeningen: lijst })
}

/** GET schemas: "Mijn schema's". */
export async function keuzesAntwoord(l: LidToegang): Promise<NextResponse> {
  const instelling = await haalLidSchemaInstelling(l.admin, l.userId)
  const keuzes = await haalKeuzes(l.admin, l.userId, l.lid.id, instelling.trainerAanpassen)
  if (!keuzes) return clubFout((await woorden()).laden, 500)
  return clubJson({ keuzes, trainerAanpassen: instelling.trainerAanpassen })
}

/** POST schemas/voorstel: een voorstel uit de snelle start (niets opgeslagen). */
export async function voorstelAntwoord(l: LidToegang, body: unknown): Promise<NextResponse> {
  const f = await woorden()
  const keuze = leesSnelleStart(body)
  if (!keuze) return clubFout(f.keuze, 400)
  const [alle, eigen] = await Promise.all([haalAlleOefeningen(l.admin, l.userId), eigenCoaching(l.admin, l.userId)])
  if (!alle) return clubFout(f.bibliotheek, 500)
  const v = lidVoorstel(keuze, alle, { heeftCoaching: heeftCoachingIn(eigen) })
  if (!v) return clubFout(f.geenVoorstel, 422)
  return clubJson({ voorstel: v })
}

/** Ids die een lid mag kiezen (de bibliotheek voor leden). Null bij een leesfout. */
async function kiesbareIds(l: LidToegang): Promise<Set<string> | null> {
  const lijst = await haalLidBibliotheek(l.admin, l.userId)
  return lijst ? new Set(lijst.map((o) => o.id)) : null
}

type Gelezen = { ok: true; schema: SchemaInvoer } | { ok: false; antwoord: NextResponse }

/** Lees en controleer een schema van het lid; alInSchema: oefeningen die er al in stonden. */
async function leesEnControleer(l: LidToegang, body: unknown, alInSchema?: ReadonlySet<string>): Promise<Gelezen> {
  const taal = await getTaal()
  const f = EIGEN_SCHEMA[taal].fout
  const invoer = leesLidSchema(body)
  // De melding van de controle is Nederlands; in het Engels een algemene melding.
  if (!invoer.ok) return { ok: false, antwoord: clubFout(taal === 'nl' ? invoer.fout : f.invoer, 400) }
  if (!heeftOefeningen(invoer.waarde)) return { ok: false, antwoord: clubFout(EIGEN_SCHEMA[taal].editor.geenOefening, 400) }
  const kiesbaar = await kiesbareIds(l)
  if (!kiesbaar) return { ok: false, antwoord: clubFout(f.opslaan, 500) }
  if (!oefeningenToegestaan(invoer.waarde.regels.map((r) => r.oefeningId), kiesbaar, alInSchema)) return { ok: false, antwoord: clubFout(f.oefeningNiet, 400) }
  return { ok: true, schema: invoer.waarde }
}

/** POST schemas: een nieuw eigen schema, meteen actief in de app. */
export async function maakAntwoord(l: LidToegang, body: unknown): Promise<NextResponse> {
  const f = await woorden()
  const aantal = await telEigen(l.admin, l.userId, l.lid.id)
  if (aantal === null) return clubFout(f.opslaan, 500)
  if (aantal >= MAX_EIGEN_SCHEMAS) return clubFout(f.max(MAX_EIGEN_SCHEMAS), 409)
  const gelezen = await leesEnControleer(l, body)
  if (!gelezen.ok) return gelezen.antwoord
  const id = await maakEigenSchema(l.admin, l.userId, l.lid.id, gelezen.schema)
  if (!id) return clubFout(f.opslaan, 500)
  return clubJson({ id }, 201)
}

/** GET schemas/[id]: het schema om te bewerken of te bekijken. */
export async function detailAntwoord(l: LidToegang, id: string): Promise<NextResponse> {
  const f = await woorden()
  const s = await haalSchemaVanLid(l.admin, l.userId, l.lid.id, id)
  if (!s) return clubFout(f.onbekend, 404)
  const [detail, instelling] = await Promise.all([haalDetail(l.admin, l.userId, s), haalLidSchemaInstelling(l.admin, l.userId)])
  if (!detail) return clubFout(f.laden, 500)
  return clubJson({ schema: detail, magBewerken: magBewerken(s, l.lid.id, instelling.trainerAanpassen), magVerwijderen: magVerwijderen(s, l.lid.id) })
}

/** PUT schemas/[id]: eigen schema bijwerken, of dat van de trainer als de sportschool dat toestaat. */
export async function bewaarAntwoord(l: LidToegang, id: string, body: unknown): Promise<NextResponse> {
  const f = await woorden()
  const s = await haalSchemaVanLid(l.admin, l.userId, l.lid.id, id)
  if (!s) return clubFout(f.onbekend, 404)
  const instelling = await haalLidSchemaInstelling(l.admin, l.userId)
  if (!magBewerken(s, l.lid.id, instelling.trainerAanpassen)) return clubFout(f.nietAanpassen, 403)
  const al = await oefeningenInSchema(l.admin, l.userId, s.id)
  if (!al) return clubFout(f.opslaan, 500)
  const gelezen = await leesEnControleer(l, body, al)
  if (!gelezen.ok) return gelezen.antwoord
  if (!(await werkSchemaBij(l.admin, l.userId, l.lid.id, s.id, gelezen.schema))) return clubFout(f.opslaan, 500)
  return clubJson({ id: s.id })
}

/** DELETE schemas/[id]: alleen een eigen schema. */
export async function verwijderAntwoord(l: LidToegang, id: string): Promise<NextResponse> {
  const f = await woorden()
  const s = await haalSchemaVanLid(l.admin, l.userId, l.lid.id, id)
  if (!s) return clubFout(f.onbekend, 404)
  if (!magVerwijderen(s, l.lid.id)) return clubFout(f.nietVerwijderen, 403)
  if (!(await verwijderEigen(l.admin, l.userId, l.lid.id, s.id))) return clubFout(f.opslaan, 500)
  const nu = await actiefSchemaId(l.admin, l.userId, l.lid.id)
  return clubJson({ id: s.id, actief: nu?.id ?? null })
}

/** POST schemas/[id]/actief: dit schema gebruiken in de app. */
export async function kiesAntwoord(l: LidToegang, id: string): Promise<NextResponse> {
  const f = await woorden()
  const s = await haalSchemaVanLid(l.admin, l.userId, l.lid.id, id)
  if (!s) return clubFout(f.onbekend, 404)
  if (!(await kiesSchema(l.admin, l.userId, l.lid.id, s.id))) return clubFout(f.opslaan, 500)
  return clubJson({ id: s.id })
}
