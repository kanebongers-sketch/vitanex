// ─── PT-app — documenten: opslag (SERVER-ONLY) ──────────────────────────────
// Metadata in `pt_documenten`, bestanden in de PRIVÉ bucket `pt-documenten`
// (migratie 355). Alleen de service-role komt erbij; een PT'er krijgt na de
// pincode een signed URL van 5 minuten, Kane uploadt via een signed upload URL.
//
// Waarom een signed UPLOAD URL: dan gaat een PT Academy-presentatie van 10 MB
// rechtstreeks van Kane's browser naar Supabase en niet door de Render-server
// (die dan ook geen uploadgrens of time-out in de weg zit).

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_GROOTTE, SIGNED_URL_SECONDEN, downloadNaam, soortVanBestand, soortVanMime, veiligPad } from './documenten'
import { isCategorie, type DocumentInvoer, type DocumentWijziging, type PtDocument, type UploadTicket } from './documenten-lezers'

export const BUCKET = 'pt-documenten'

export type OpslagUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' | 'opslag' | 'te_groot' | 'soort' }

/** Wat de opslag over een object vertelt; alleen wat wij controleren. */
interface ObjectInfo {
  grootte: number
  mime: string | null
}

/**
 * Leest grootte en content-type uit het antwoord van `storage.info()`. De
 * runtime geeft camelCase (`contentType`), de typedefinitie van storage-js
 * snake_case (`content_type`) — daarom via `unknown`, niet via een cast.
 */
export function leesObjectInfo(ruw: unknown): ObjectInfo | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const r = ruw as Record<string, unknown>
  if (typeof r.size !== 'number' || !Number.isFinite(r.size) || r.size < 0) return null
  const mime = typeof r.contentType === 'string' ? r.contentType : typeof r.content_type === 'string' ? r.content_type : null
  return { grootte: r.size, mime: mime ? mime.split(';')[0].trim().toLowerCase() : null }
}

const KOLOMMEN = 'id, titel, beschrijving, categorie, pad, mime, grootte, volgorde, zichtbaar, bijgewerkt_op'

interface Rij {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  pad: string
  mime: string
  grootte: number | string
  volgorde: number
  zichtbaar: boolean
  bijgewerkt_op: string
}

/** Een document mét pad — alleen voor de server (signed URLs, verwijderen). */
export interface DocMetPad {
  document: PtDocument
  pad: string
}

function vanRij(r: Rij): DocMetPad | null {
  if (!isCategorie(r.categorie)) return null
  const grootte = Number(r.grootte)
  return {
    pad: r.pad,
    document: {
      id: r.id,
      titel: r.titel,
      beschrijving: r.beschrijving,
      categorie: r.categorie,
      mime: r.mime,
      grootte: Number.isFinite(grootte) ? grootte : 0,
      volgorde: r.volgorde,
      zichtbaar: r.zichtbaar,
      bijgewerktOp: r.bijgewerkt_op,
    },
  }
}

function rijen(data: unknown): DocMetPad[] {
  return ((data ?? []) as Rij[]).map(vanRij).filter((d): d is DocMetPad => d !== null)
}

/** Alle documenten van de eigenaar; voor een PT'er alleen de zichtbare. */
export async function haalDocumenten(
  admin: SupabaseClient,
  userId: string,
  { alleenZichtbaar }: { alleenZichtbaar: boolean },
): Promise<OpslagUitkomst<PtDocument[]>> {
  let q = admin.from('pt_documenten').select(KOLOMMEN).eq('user_id', userId)
  if (alleenZichtbaar) q = q.eq('zichtbaar', true)
  const { data, error } = await q.order('categorie').order('volgorde').order('titel')
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: rijen(data).map((d) => d.document) }
}

export async function haalDocument(
  admin: SupabaseClient,
  userId: string,
  id: string,
  { alleenZichtbaar }: { alleenZichtbaar: boolean },
): Promise<OpslagUitkomst<DocMetPad>> {
  let q = admin.from('pt_documenten').select(KOLOMMEN).eq('user_id', userId).eq('id', id)
  if (alleenZichtbaar) q = q.eq('zichtbaar', true)
  const { data, error } = await q.maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  const d = data ? vanRij(data as Rij) : null
  return d ? { ok: true, waarde: d } : { ok: false, reden: 'niet_gevonden' }
}

/** Maakt een uniek pad en een signed upload URL (2 uur geldig, niet overschrijven). */
export async function maakUploadTicket(admin: SupabaseClient, bestandsnaam: string): Promise<OpslagUitkomst<UploadTicket>> {
  // 8 tekens a-z0-9 uit 6 random bytes; botsingen zijn in de praktijk uitgesloten
  // en zouden door `upsert: false` + de unique op `pad` toch falen, niet overschrijven.
  const uniek = randomBytes(6).readUIntBE(0, 6).toString(36).padStart(8, '0').slice(-8)
  const pad = veiligPad(bestandsnaam, uniek)
  if (!pad) return { ok: false, reden: 'opslag' }
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(pad)
  if (error || !data) return { ok: false, reden: 'opslag' }
  return { ok: true, waarde: { pad, signedUrl: data.signedUrl, token: data.token } }
}

/**
 * Legt de metadata vast ná de upload. Controleert eerst dat het object er echt
 * staat en neemt grootte én content-type uit de opslag (niet van de browser).
 * Te groot, of een ander type dan de extensie belooft (bv. HTML achter
 * `.pdf`, wat de opslag-host dan als pagina zou serveren) → object weer weg.
 */
export async function voegDocumentToe(
  admin: SupabaseClient,
  userId: string,
  invoer: DocumentInvoer,
): Promise<OpslagUitkomst<PtDocument>> {
  const soort = soortVanBestand(invoer.pad)
  if (!soort) return { ok: false, reden: 'opslag' }
  const info = await admin.storage.from(BUCKET).info(invoer.pad)
  if (info.error || !info.data) return { ok: false, reden: 'niet_gevonden' }
  const object = leesObjectInfo(info.data)
  if (!object) return { ok: false, reden: 'opslag' }
  if (object.grootte > MAX_GROOTTE) {
    await admin.storage.from(BUCKET).remove([invoer.pad])
    return { ok: false, reden: 'te_groot' }
  }
  if (object.mime !== soort.mime) {
    await admin.storage.from(BUCKET).remove([invoer.pad])
    return { ok: false, reden: 'soort' }
  }
  const grootte = object.grootte

  const { data, error } = await admin
    .from('pt_documenten')
    .insert({
      user_id: userId,
      titel: invoer.titel,
      beschrijving: invoer.beschrijving,
      categorie: invoer.categorie,
      pad: invoer.pad,
      mime: soort.mime,
      grootte,
      volgorde: invoer.volgorde,
      zichtbaar: invoer.zichtbaar,
    })
    .select(KOLOMMEN)
    .single()
  const d = !error && data ? vanRij(data as Rij) : null
  return d ? { ok: true, waarde: d.document } : { ok: false, reden: 'db' }
}

export async function wijzigDocument(
  admin: SupabaseClient,
  userId: string,
  id: string,
  w: DocumentWijziging,
): Promise<OpslagUitkomst<PtDocument>> {
  const { data, error } = await admin
    .from('pt_documenten')
    .update({ ...w, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .select(KOLOMMEN)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  const d = data ? vanRij(data as Rij) : null
  return d ? { ok: true, waarde: d.document } : { ok: false, reden: 'niet_gevonden' }
}

/**
 * Eerst het bestand, dan de rij. Andersom zou bij een fout een onvindbaar
 * bestand in de bucket achterlaten; zo blijft de rij staan en kan Kane het
 * gewoon opnieuw proberen (een al verwijderd object geeft geen fout).
 */
export async function verwijderDocument(admin: SupabaseClient, userId: string, id: string): Promise<OpslagUitkomst<true>> {
  const doc = await haalDocument(admin, userId, id, { alleenZichtbaar: false })
  if (!doc.ok) return doc
  const weg = await admin.storage.from(BUCKET).remove([doc.waarde.pad])
  if (weg.error) return { ok: false, reden: 'opslag' }
  const { error } = await admin.from('pt_documenten').delete().eq('user_id', userId).eq('id', id)
  return error ? { ok: false, reden: 'db' } : { ok: true, waarde: true }
}

/**
 * Signed URL van 5 minuten. PDF en afbeeldingen inline (de browser of iOS toont
 * ze direct); Word/PowerPoint/Excel met een nette bestandsnaam.
 */
export async function tekenDownload(admin: SupabaseClient, doc: DocMetPad): Promise<OpslagUitkomst<string>> {
  const inline = soortVanMime(doc.document.mime)?.inline ?? false
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.pad, SIGNED_URL_SECONDEN, inline ? undefined : { download: downloadNaam(doc.document.titel, doc.document.mime) })
  return error || !data ? { ok: false, reden: 'opslag' } : { ok: true, waarde: data.signedUrl }
}
