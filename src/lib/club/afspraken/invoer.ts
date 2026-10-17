// ─── Club, afspraken: invoer van de API controleren (PUUR) ──────────────────
// Alles wat van buiten komt is `unknown` en wordt hier genarrowd; foutteksten
// zijn Nederlands en kunnen zo in de interface getoond worden.

import { isVestigingSlug, type VestigingSleutel } from '@/lib/club/kern/vestigingen'
import { isDatum, isTijd } from '@/lib/club/rooster/tijd'
import { isKleur, isStatus, type AfspraakStatus, type Kleur } from './model'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const goed = <T>(waarde: T): Uitkomst<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string): Uitkomst<T> => ({ ok: false, fout: tekst })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

function obj(body: unknown): Record<string, unknown> | null {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}

/** Optionele tekst: leeg wordt null, te lang of geen tekst is een fout (undefined). */
function optTekst(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  if (t === '') return null
  return t.length <= max ? t : undefined
}

/** Een geheel getal binnen grenzen, of null. */
function heelGetal(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

/** "09:15" of "09:15:00" naar "09:15" als het een kwartier-tijd is. */
function tijdOpStap(v: unknown): string | null {
  if (!isTijd(v)) return null
  const t = v.slice(0, 5)
  return Number(t.slice(3)) % 5 === 0 ? t : null
}

interface Moment {
  datum: string
  tijd: string
}

function leesMoment(r: Record<string, unknown>): Uitkomst<Moment> {
  if (!isDatum(r.datum)) return fout('Kies een geldige datum.')
  const tijd = tijdOpStap(r.tijd)
  if (!tijd) return fout('Kies een geldige begintijd (per 5 minuten).')
  return goed({ datum: r.datum, tijd })
}

export interface NieuweAfspraak extends Moment {
  vestiging: VestigingSleutel
  typeId: string
  medewerkerId: string
  lidId: string
  leadId: string | null
  notitie: string | null
  geboektDoor: 'balie' | 'trainer'
}

/** POST /api/club/afspraken: een afspraak vanuit de balie of door een trainer. */
export function leesNieuweAfspraak(body: unknown): Uitkomst<NieuweAfspraak> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (!isVestigingSlug(r.vestiging)) return fout('Onbekende vestiging.')
  if (!isUuid(r.typeId)) return fout('Kies een soort afspraak.')
  if (!isUuid(r.medewerkerId)) return fout('Kies een trainer.')
  if (!isUuid(r.lidId)) return fout('Kies een lid.')
  if (r.leadId !== undefined && r.leadId !== null && r.leadId !== '' && !isUuid(r.leadId)) return fout('Onbekende lead.')
  const moment = leesMoment(r)
  if (!moment.ok) return moment
  const notitie = optTekst(r.notitie, 1000)
  if (notitie === undefined) return fout('De notitie is te lang (hooguit 1000 tekens).')
  return goed({
    ...moment.waarde,
    vestiging: r.vestiging,
    typeId: r.typeId,
    medewerkerId: r.medewerkerId,
    lidId: r.lidId,
    leadId: isUuid(r.leadId) ? r.leadId : null,
    notitie,
    geboektDoor: r.geboektDoor === 'trainer' ? 'trainer' : 'balie',
  })
}

export type AfspraakPatch =
  | { soort: 'status'; status: AfspraakStatus }
  | { soort: 'verplaats'; datum: string; tijd: string; medewerkerId: string }
  | { soort: 'notitie'; notitie: string | null }

/** PATCH /api/club/afspraken/[id]: status, verplaatsen of notitie (een per keer). */
export function leesAfspraakPatch(body: unknown): Uitkomst<AfspraakPatch> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (r.status !== undefined) {
    return isStatus(r.status) ? goed({ soort: 'status', status: r.status }) : fout('Onbekende status.')
  }
  if (r.datum !== undefined || r.tijd !== undefined) {
    const moment = leesMoment(r)
    if (!moment.ok) return moment
    if (!isUuid(r.medewerkerId)) return fout('Kies een trainer.')
    return goed({ soort: 'verplaats', ...moment.waarde, medewerkerId: r.medewerkerId })
  }
  if (r.notitie !== undefined) {
    const notitie = optTekst(r.notitie, 1000)
    return notitie === undefined ? fout('De notitie is te lang (hooguit 1000 tekens).') : goed({ soort: 'notitie', notitie })
  }
  return fout('Er is niets om te wijzigen.')
}

export interface TypeInvoer {
  naam: string
  duurMin: number
  bufferMin: number
  kleur: Kleur
  medewerkerIds: string[]
  appBoekbaar: boolean
  boekenUrenVooraf: number
  annulerenUrenVooraf: number
  actief: boolean
}

/** POST en PATCH van een afspraaktype: altijd het hele type. */
export function leesType(body: unknown): Uitkomst<TypeInvoer> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  const naam = optTekst(r.naam, 80)
  if (!naam) return fout('Geef het type een naam (hooguit 80 tekens).')
  const duurMin = heelGetal(r.duurMin, 5, 480)
  if (duurMin === null) return fout('De duur moet tussen 5 en 480 minuten liggen.')
  const bufferMin = heelGetal(r.bufferMin ?? 0, 0, 120)
  if (bufferMin === null) return fout('De buffer moet tussen 0 en 120 minuten liggen.')
  if (!isKleur(r.kleur)) return fout('Kies een kleur uit de lijst.')
  const ids = Array.isArray(r.medewerkerIds) ? r.medewerkerIds : []
  if (!ids.every(isUuid) || ids.length > 100) return fout('Onbekende medewerker in de lijst.')
  const boeken = heelGetal(r.boekenUrenVooraf ?? 0, 0, 336)
  const annuleren = heelGetal(r.annulerenUrenVooraf ?? 0, 0, 336)
  if (boeken === null || annuleren === null) return fout('Uren van tevoren moet tussen 0 en 336 liggen.')
  return goed({
    naam,
    duurMin,
    bufferMin,
    kleur: r.kleur,
    medewerkerIds: [...new Set(ids)],
    appBoekbaar: r.appBoekbaar !== false,
    boekenUrenVooraf: boeken,
    annulerenUrenVooraf: annuleren,
    actief: r.actief !== false,
  })
}

export interface SlotVraag {
  vestiging: VestigingSleutel
  typeId: string
  datum: string
  /** null = maakt niet uit. */
  medewerkerId: string | null
}

/** GET-parameters voor vrije tijden: ?v=&type=&datum=&medewerker= */
export function leesSlotVraag(params: URLSearchParams): Uitkomst<SlotVraag> {
  const vestiging = params.get('v')
  const typeId = params.get('type')
  const datum = params.get('datum')
  const mw = params.get('medewerker')
  if (!isVestigingSlug(vestiging)) return fout('Onbekende vestiging.')
  if (!isUuid(typeId)) return fout('Kies een soort afspraak.')
  if (!isDatum(datum)) return fout('Kies een geldige datum.')
  if (mw && !isUuid(mw)) return fout('Onbekende trainer.')
  return goed({ vestiging, typeId, datum, medewerkerId: mw || null })
}

export interface AppBoeking extends Moment {
  lidId: string
  typeId: string
  medewerkerId: string | null
}

/** POST /api/club/afspraken/app: een lid boekt zelf. */
export function leesAppBoeking(body: unknown): Uitkomst<AppBoeking> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (!isUuid(r.lidId)) return fout('Onbekend lid.')
  if (!isUuid(r.typeId)) return fout('Kies een soort afspraak.')
  if (r.medewerkerId !== null && r.medewerkerId !== undefined && r.medewerkerId !== '' && !isUuid(r.medewerkerId)) return fout('Onbekende trainer.')
  const moment = leesMoment(r)
  if (!moment.ok) return moment
  return goed({ ...moment.waarde, lidId: r.lidId, typeId: r.typeId, medewerkerId: isUuid(r.medewerkerId) ? r.medewerkerId : null })
}
