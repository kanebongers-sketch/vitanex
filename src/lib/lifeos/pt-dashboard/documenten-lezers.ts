// ─── PT-app — documenten: de systeemgrens (PUUR) ────────────────────────────
// Lezers voor alles wat binnenkomt (request-bodies, API-antwoorden) en de
// groepering voor de lijsten. Faalt hard en met een NL-melding; geen casts.

import {
  BESCHRIJVING_MAX,
  CATEGORIEEN,
  CATEGORIE_LABEL,
  MAX_GROOTTE,
  TITEL_MAX,
  VOLGORDE_MAX,
  bestandsFout,
  isVeiligPad,
  type DocCategorie,
} from './documenten'

/** Wat de API's teruggeven. Het bucket-pad blijft bewust op de server. */
export interface PtDocument {
  id: string
  titel: string
  beschrijving: string | null
  categorie: DocCategorie
  mime: string
  grootte: number
  volgorde: number
  zichtbaar: boolean
  bijgewerktOp: string
}

export type Gelezen<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function isCategorie(v: unknown): v is DocCategorie {
  return typeof v === 'string' && (CATEGORIEEN as readonly string[]).includes(v)
}

// ─── Velden ──────────────────────────────────────────────────────────────────

function titelUit(v: unknown): Gelezen<string> {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
  if (!t) return { ok: false, fout: 'Geef het document een titel.' }
  if (t.length > TITEL_MAX) return { ok: false, fout: `De titel is te lang (max. ${TITEL_MAX} tekens).` }
  return { ok: true, waarde: t }
}

function beschrijvingUit(v: unknown): Gelezen<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'De beschrijving klopt niet.' }
  const t = v.trim()
  if (t.length > BESCHRIJVING_MAX) return { ok: false, fout: `De beschrijving is te lang (max. ${BESCHRIJVING_MAX} tekens).` }
  return { ok: true, waarde: t || null }
}

function volgordeUit(v: unknown): Gelezen<number> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: 0 }
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > VOLGORDE_MAX) {
    return { ok: false, fout: `Volgorde is een heel getal van 0 t/m ${VOLGORDE_MAX}.` }
  }
  return { ok: true, waarde: n }
}

// ─── Request-bodies ──────────────────────────────────────────────────────────

export interface UploadVerzoek {
  bestandsnaam: string
  grootte: number
}

/**
 * `{ bestandsnaam, grootte, mime? }`. De mime van de browser wordt genegeerd: de
 * server leidt de soort af uit de extensie (zie `soortVanBestand`).
 */
export function leesUploadVerzoek(body: unknown): Gelezen<UploadVerzoek> {
  const b = obj(body)
  const naam = typeof b?.bestandsnaam === 'string' ? b.bestandsnaam.trim() : ''
  const grootte = b?.grootte
  if (!naam || naam.length > 255) return { ok: false, fout: 'De bestandsnaam ontbreekt.' }
  if (typeof grootte !== 'number') return { ok: false, fout: 'De bestandsgrootte ontbreekt.' }
  const fout = bestandsFout(naam, grootte)
  return fout ? { ok: false, fout } : { ok: true, waarde: { bestandsnaam: naam, grootte } }
}

export interface DocumentInvoer {
  pad: string
  titel: string
  beschrijving: string | null
  categorie: DocCategorie
  volgorde: number
  zichtbaar: boolean
}

/** De metadata ná de upload. `pad` moet een pad zijn dat de upload-url-route zelf maakte. */
export function leesDocumentInvoer(body: unknown): Gelezen<DocumentInvoer> {
  const b = obj(body)
  if (!b) return { ok: false, fout: 'Lege aanvraag.' }
  if (typeof b.pad !== 'string' || !isVeiligPad(b.pad)) return { ok: false, fout: 'Onbekend bestandspad. Upload het bestand opnieuw.' }
  if (!isCategorie(b.categorie)) return { ok: false, fout: 'Kies een categorie.' }
  const titel = titelUit(b.titel)
  if (!titel.ok) return titel
  const beschrijving = beschrijvingUit(b.beschrijving)
  if (!beschrijving.ok) return beschrijving
  const volgorde = volgordeUit(b.volgorde)
  if (!volgorde.ok) return volgorde
  const zichtbaar = b.zichtbaar === undefined ? true : b.zichtbaar
  if (typeof zichtbaar !== 'boolean') return { ok: false, fout: 'Zichtbaar is ja of nee.' }
  return {
    ok: true,
    waarde: { pad: b.pad, titel: titel.waarde, beschrijving: beschrijving.waarde, categorie: b.categorie, volgorde: volgorde.waarde, zichtbaar },
  }
}

export type DocumentWijziging = Partial<Omit<DocumentInvoer, 'pad'>>

/** Een gedeeltelijke wijziging (PATCH). Minstens één bekend veld. */
export function leesDocumentWijziging(body: unknown): Gelezen<DocumentWijziging> {
  const b = obj(body)
  if (!b) return { ok: false, fout: 'Lege aanvraag.' }
  const uit: DocumentWijziging = {}
  if ('titel' in b) {
    const t = titelUit(b.titel)
    if (!t.ok) return t
    uit.titel = t.waarde
  }
  if ('beschrijving' in b) {
    const t = beschrijvingUit(b.beschrijving)
    if (!t.ok) return t
    uit.beschrijving = t.waarde
  }
  if ('categorie' in b) {
    if (!isCategorie(b.categorie)) return { ok: false, fout: 'Kies een categorie.' }
    uit.categorie = b.categorie
  }
  if ('volgorde' in b) {
    const v = volgordeUit(b.volgorde)
    if (!v.ok) return v
    uit.volgorde = v.waarde
  }
  if ('zichtbaar' in b) {
    if (typeof b.zichtbaar !== 'boolean') return { ok: false, fout: 'Zichtbaar is ja of nee.' }
    uit.zichtbaar = b.zichtbaar
  }
  return Object.keys(uit).length > 0 ? { ok: true, waarde: uit } : { ok: false, fout: 'Niets om te wijzigen.' }
}

// ─── API-antwoorden (client) ─────────────────────────────────────────────────

export function leesDocument(ruw: unknown): PtDocument | null {
  const r = obj(ruw)
  if (!r) return null
  const { id, titel, beschrijving, categorie, mime, grootte, volgorde, zichtbaar, bijgewerktOp } = r
  if (typeof id !== 'string' || typeof titel !== 'string' || !isCategorie(categorie) || typeof mime !== 'string') return null
  if (typeof grootte !== 'number' || grootte < 0 || grootte > MAX_GROOTTE * 2) return null
  if (typeof volgorde !== 'number' || typeof zichtbaar !== 'boolean' || typeof bijgewerktOp !== 'string') return null
  if (beschrijving !== null && typeof beschrijving !== 'string') return null
  return { id, titel, beschrijving, categorie, mime, grootte, volgorde, zichtbaar, bijgewerktOp }
}

/** `{ documenten: [...] }`. Eén kapotte rij → het hele antwoord is onbetrouwbaar. */
export function leesDocumenten(ruw: unknown): PtDocument[] | null {
  const lijst = obj(ruw)?.documenten
  if (!Array.isArray(lijst)) return null
  const uit = lijst.map(leesDocument)
  return uit.every((d): d is PtDocument => d !== null) ? uit : null
}

export interface UploadTicket {
  pad: string
  signedUrl: string
  token: string
}

export function leesUploadTicket(ruw: unknown): UploadTicket | null {
  const r = obj(ruw)
  if (typeof r?.pad !== 'string' || typeof r.signedUrl !== 'string' || typeof r.token !== 'string') return null
  if (!isVeiligPad(r.pad) || !/^https:\/\//.test(r.signedUrl)) return null
  return { pad: r.pad, signedUrl: r.signedUrl, token: r.token }
}

// ─── Weergave ────────────────────────────────────────────────────────────────

export interface DocGroep<T> {
  categorie: DocCategorie
  label: string
  documenten: T[]
}

/** Per categorie (vaste volgorde), binnen een categorie op volgorde en dan titel. Lege groepen vallen weg. */
export function groepeerPerCategorie<T extends Pick<PtDocument, 'categorie' | 'volgorde' | 'titel'>>(docs: readonly T[]): DocGroep<T>[] {
  return CATEGORIEEN.map((categorie) => ({
    categorie,
    label: CATEGORIE_LABEL[categorie],
    documenten: docs
      .filter((d) => d.categorie === categorie)
      .sort((a, b) => a.volgorde - b.volgorde || a.titel.localeCompare(b.titel, 'nl')),
  })).filter((g) => g.documenten.length > 0)
}
