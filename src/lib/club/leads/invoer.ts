// ─── Fit Factory Club: invoer van de leads-API controleren (PUUR) ───────────
// Elke route leest zijn body via een van deze functies. Alles wat van buiten
// komt is `unknown` en wordt hier genarrowd; foutteksten zijn Nederlands en
// kunnen zo in de interface getoond worden.

import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import { isLeadBron, type LeadBron } from './model'
import { isDagSleutel } from './regels'
import { isUuid } from './filters'
import { normaliseerEmail, normaliseerTelefoon } from './dubbel'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const goed = <T>(waarde: T): Uitkomst<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string): Uitkomst<T> => ({ ok: false, fout: tekst })

function obj(body: unknown): Record<string, unknown> | null {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}

/** Optionele tekst: leeg wordt null, te lang is een fout (undefined). */
function optTekst(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  if (t === '') return null
  return t.length <= max ? t : undefined
}

interface Contact {
  email: string | null
  telefoon: string | null
}

function leesContact(r: Record<string, unknown>): Uitkomst<Contact> {
  const email = optTekst(r.email, 160)
  const telefoon = optTekst(r.telefoon, 40)
  if (email === undefined) return fout('Het e-mailadres is te lang.')
  if (telefoon === undefined) return fout('Het telefoonnummer is te lang.')
  if (email && !normaliseerEmail(email)) return fout('Dit e-mailadres klopt niet.')
  if (telefoon && !normaliseerTelefoon(telefoon)) return fout('Dit telefoonnummer klopt niet.')
  return goed({ email: email ? email.toLowerCase() : null, telefoon })
}

function leesNaam(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const naam = v.trim().replace(/\s+/g, ' ')
  return naam.length >= 1 && naam.length <= 120 ? naam : null
}

export interface NieuweLead extends Contact {
  vestiging: Vestiging
  naam: string
  bron: LeadBron
  interesse: string | null
  medewerkerId: string | null
  opvolgenOp: string | null
}

export function leesNieuweLead(body: unknown): Uitkomst<NieuweLead> {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  if (!isVestiging(r.vestiging)) return fout('Onbekende vestiging.')
  const naam = leesNaam(r.naam)
  if (!naam) return fout('Vul een naam in (maximaal 120 tekens).')
  const contact = leesContact(r)
  if (!contact.ok) return contact
  if (!contact.waarde.email && !contact.waarde.telefoon) return fout('Vul een telefoonnummer of e-mailadres in, anders kun je niet opvolgen.')
  if (r.toestemming !== true) return fout('Vink aan dat deze persoon toestemming geeft om contact op te nemen.')
  if (!isLeadBron(r.bron)) return fout('Kies een bron.')
  const interesse = optTekst(r.interesse, 200)
  if (interesse === undefined) return fout('De interesse is te lang (maximaal 200 tekens).')
  const medewerkerId = r.medewerkerId === null || r.medewerkerId === undefined || r.medewerkerId === '' ? null : r.medewerkerId
  if (medewerkerId !== null && !isUuid(medewerkerId)) return fout('Onbekende medewerker.')
  const opvolgenOp = r.opvolgenOp === null || r.opvolgenOp === undefined || r.opvolgenOp === '' ? null : r.opvolgenOp
  if (opvolgenOp !== null && !isDagSleutel(opvolgenOp)) return fout('Ongeldige opvolgdatum.')
  return goed({ vestiging: r.vestiging, naam, ...contact.waarde, bron: r.bron, interesse, medewerkerId, opvolgenOp })
}

/** De statussen die je direct kunt kiezen. Proefles gaat via inplannen, lid via omzetten. */
export const VRIJE_STATUSSEN = ['nieuw', 'contact', 'proefles_geweest', 'verloren'] as const
export type VrijeStatus = (typeof VRIJE_STATUSSEN)[number]

function isVrijeStatus(v: unknown): v is VrijeStatus {
  return typeof v === 'string' && (VRIJE_STATUSSEN as readonly string[]).includes(v)
}

/** Kolomnamen zoals in club_leads; alleen wat meegestuurd is. */
export type LeadPatch = Partial<{
  naam: string
  email: string | null
  telefoon: string | null
  bron: LeadBron
  interesse: string | null
  toestemming_contact: boolean
  medewerker_id: string | null
  opvolgen_op: string | null
  status: VrijeStatus
  verloren_reden: string | null
}>

function leesStatus(r: Record<string, unknown>): Uitkomst<LeadPatch> {
  if (!('status' in r)) return goed({})
  if (!isVrijeStatus(r.status)) return fout('Deze stap kan niet direct: plan een proefles in of maak de lead lid.')
  if (r.status !== 'verloren') return goed({ status: r.status, verloren_reden: null })
  const reden = optTekst(r.verlorenReden, 200)
  if (!reden) return fout('Vul een reden in waarom deze lead verloren is (maximaal 200 tekens).')
  return goed({ status: 'verloren', verloren_reden: reden, opvolgen_op: null })
}

function leesGegevens(r: Record<string, unknown>): Uitkomst<LeadPatch> {
  const p: LeadPatch = {}
  if ('naam' in r) {
    const naam = leesNaam(r.naam)
    if (!naam) return fout('Vul een naam in (maximaal 120 tekens).')
    p.naam = naam
  }
  if ('email' in r || 'telefoon' in r) {
    const c = leesContact(r)
    if (!c.ok) return c
    if ('email' in r && 'telefoon' in r && !c.waarde.email && !c.waarde.telefoon) return fout('Houd een telefoonnummer of e-mailadres over, anders kun je niet opvolgen.')
    if ('email' in r) p.email = c.waarde.email
    if ('telefoon' in r) p.telefoon = c.waarde.telefoon
  }
  if ('bron' in r) {
    if (!isLeadBron(r.bron)) return fout('Kies een bron.')
    p.bron = r.bron
  }
  if ('interesse' in r) {
    const i = optTekst(r.interesse, 200)
    if (i === undefined) return fout('De interesse is te lang (maximaal 200 tekens).')
    p.interesse = i
  }
  if ('toestemming' in r) {
    if (typeof r.toestemming !== 'boolean') return fout('Ongeldige toestemming.')
    p.toestemming_contact = r.toestemming
  }
  return goed(p)
}

function leesPlanning(r: Record<string, unknown>): Uitkomst<LeadPatch> {
  const p: LeadPatch = {}
  if ('medewerkerId' in r) {
    if (r.medewerkerId !== null && !isUuid(r.medewerkerId)) return fout('Onbekende medewerker.')
    p.medewerker_id = r.medewerkerId
  }
  if ('opvolgenOp' in r) {
    if (r.opvolgenOp !== null && !isDagSleutel(r.opvolgenOp)) return fout('Ongeldige opvolgdatum.')
    p.opvolgen_op = r.opvolgenOp
  }
  return goed(p)
}

export function leesLeadPatch(body: unknown): Uitkomst<LeadPatch> {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  const delen = [leesGegevens(r), leesPlanning(r), leesStatus(r)]
  const mis = delen.find((d) => !d.ok)
  if (mis && !mis.ok) return mis
  const patch = delen.reduce<LeadPatch>((acc, d) => (d.ok ? { ...acc, ...d.waarde } : acc), {})
  if (Object.keys(patch).length === 0) return fout('Er is niets om te wijzigen.')
  return goed(patch)
}

export type ContactSoort = 'gebeld' | 'gemaild' | 'notitie'

export interface HistorieInvoer {
  soort: ContactSoort
  tekst: string | null
  /** Optioneel: meteen de volgende opvolgdatum zetten (null = opvolging klaar). */
  opvolgenOp?: string | null
}

export function leesHistorie(body: unknown): Uitkomst<HistorieInvoer> {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  if (r.soort !== 'gebeld' && r.soort !== 'gemaild' && r.soort !== 'notitie') return fout('Onbekende soort.')
  const tekst = optTekst(r.tekst, 1000)
  if (tekst === undefined) return fout('De tekst is te lang (maximaal 1000 tekens).')
  if (r.soort === 'notitie' && !tekst) return fout('Een notitie mag niet leeg zijn.')
  const uit: HistorieInvoer = { soort: r.soort, tekst }
  if ('opvolgenOp' in r) {
    if (r.opvolgenOp !== null && !isDagSleutel(r.opvolgenOp)) return fout('Ongeldige opvolgdatum.')
    uit.opvolgenOp = r.opvolgenOp
  }
  return goed(uit)
}

export type ProeflesInvoer =
  | { actie: 'les'; lesId: string }
  | { actie: 'tijdstip'; tijdstip: string; omschrijving: string | null }
  | { actie: 'geweest' }
  | { actie: 'niet_gekomen' }

export function leesProefles(body: unknown, nu: Date): Uitkomst<ProeflesInvoer> {
  const r = obj(body)
  if (!r) return fout('Ongeldig verzoek.')
  if (r.actie === 'geweest' || r.actie === 'niet_gekomen') return goed({ actie: r.actie })
  if (r.actie === 'les') return isUuid(r.lesId) ? goed({ actie: 'les', lesId: r.lesId }) : fout('Kies een les.')
  if (r.actie !== 'tijdstip') return fout('Onbekende actie.')
  const moment = typeof r.tijdstip === 'string' ? new Date(r.tijdstip) : null
  if (!moment || Number.isNaN(moment.getTime())) return fout('Kies een geldig tijdstip.')
  if (moment.getTime() < nu.getTime() - 5 * 60_000) return fout('Dit tijdstip is al voorbij.')
  if (moment.getTime() > nu.getTime() + 90 * 86_400_000) return fout('Plan maximaal 90 dagen vooruit.')
  const omschrijving = optTekst(r.omschrijving, 200)
  if (omschrijving === undefined) return fout('De omschrijving is te lang.')
  return goed({ actie: 'tijdstip', tijdstip: moment.toISOString(), omschrijving })
}

export interface OmzetInvoer {
  /** Koppel aan dit bestaande lid in plaats van een nieuw lid te maken. */
  bestaandLidId: string | null
  /** Toch een nieuw lid maken, ook al lijkt er een dubbele te zijn. */
  negeerDubbel: boolean
}

export function leesOmzetten(body: unknown): Uitkomst<OmzetInvoer> {
  const r = obj(body) ?? {}
  const id = r.bestaandLidId ?? null
  if (id !== null && !isUuid(id)) return fout('Onbekend lid.')
  return goed({ bestaandLidId: id, negeerDubbel: r.negeerDubbel === true })
}
