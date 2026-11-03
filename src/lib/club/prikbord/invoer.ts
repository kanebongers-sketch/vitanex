// ─── Club, Prikbord: invoer van de API controleren (PUUR) ───────────────────
// Streng op de systeemgrens. Een fout is een sleutel; de route zet hem om in
// de tekst van het woordenboek (PRIKBORD.fouten, NL en EN).

import { isUuid } from '@/lib/club/kern/organisatie'
import { isRol, type Rol } from '@/lib/club/rollen/typen'
import { GRENZEN, isVoorbeeld, isWerkwijzeSoort, type Stap, type Voorbeeld, type WerkwijzeSoort } from './typen'
import type { NieuweVersieInvoer } from './model'

export type FoutSleutel =
  | 'ongeldig'
  | 'titel'
  | 'inhoud'
  | 'vestiging'
  | 'rol'
  | 'alleenEigenaar'
  | 'verloopt'
  | 'stappen'
  | 'watAnders'
  | 'notitie'
  | 'afgevinkt'

export type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: FoutSleutel }

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function schoon(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : ''
}

function titelVan(v: unknown): string | null {
  const t = schoon(v)
  return t.length >= 1 && t.length <= GRENZEN.titel ? t : null
}

/**
 * Een lijst vestigingen: alleen bekende (die van deze persoon), zonder dubbel.
 * Leeg betekent "alle vestigingen van de sportschool"; dat mag alleen wie ook
 * alle vestigingen heeft. Anders wordt leeg aangevuld met de eigen vestigingen.
 */
export function vestigingenVan(v: unknown, s: Pick<Schrijver, 'vestigingen' | 'alleVestigingen'>): string[] | null {
  if (v !== undefined && v !== null && (!Array.isArray(v) || !v.every((x) => typeof x === 'string' && s.vestigingen.includes(x)))) return null
  const lijst = Array.isArray(v) ? [...new Set(v as string[])] : []
  if (lijst.length > 0 || s.alleVestigingen) return lijst
  return s.vestigingen.length > 0 ? [...new Set(s.vestigingen)] : null
}

function rollenVan(v: unknown): Rol[] | null {
  if (v === undefined || v === null) return []
  if (!Array.isArray(v) || !v.every(isRol)) return null
  return [...new Set(v as Rol[])]
}

export interface Schrijver {
  /** Kane of een eigenaar: alleen die mag iets aan de eigenaar alleen richten. */
  eigenaar: boolean
  /** De vestigingen van de schrijver (sleutels). */
  vestigingen: readonly string[]
  /** Heeft de schrijver alle vestigingen van de sportschool? Alleen dan mag "alle" (een lege lijst). */
  alleVestigingen: boolean
}

/** Doelgroep: een clubmanager richt nooit iets aan de eigenaar alleen. */
function doelgroep(o: Record<string, unknown>, s: Schrijver): Lees<{ vestigingen: string[]; rollen: Rol[] }> {
  const vestigingen = vestigingenVan(o.vestigingen, s)
  if (!vestigingen) return { ok: false, fout: 'vestiging' }
  const rollen = rollenVan(o.rollen)
  if (!rollen) return { ok: false, fout: 'rol' }
  if (!s.eigenaar && rollen.length > 0 && rollen.every((r) => r === 'eigenaar')) return { ok: false, fout: 'alleenEigenaar' }
  return { ok: true, waarde: { vestigingen, rollen } }
}

export interface MededelingInvoer {
  titel: string
  inhoud: string
  vestigingen: string[]
  rollen: Rol[]
  verplicht: boolean
  verlooptOp: string | null
}

/** Een nieuwe mededeling. verlooptOp: een datum (jjjj-mm-dd) in de toekomst, of leeg. */
export function leesMededeling(body: unknown, s: Schrijver, nu: Date): Lees<MededelingInvoer> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'ongeldig' }
  const titel = titelVan(o.titel)
  if (!titel) return { ok: false, fout: 'titel' }
  const inhoud = schoon(o.inhoud)
  if (inhoud.length > GRENZEN.inhoud) return { ok: false, fout: 'inhoud' }
  const groep = doelgroep(o, s)
  if (!groep.ok) return groep
  let verlooptOp: string | null = null
  if (o.verlooptOp !== undefined && o.verlooptOp !== null && o.verlooptOp !== '') {
    if (typeof o.verlooptOp !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.verlooptOp)) return { ok: false, fout: 'verloopt' }
    const eind = new Date(`${o.verlooptOp}T23:59:59Z`)
    if (Number.isNaN(eind.getTime()) || eind.getTime() <= nu.getTime()) return { ok: false, fout: 'verloopt' }
    verlooptOp = eind.toISOString()
  }
  return { ok: true, waarde: { titel, inhoud, ...groep.waarde, verplicht: o.verplicht === true, verlooptOp } }
}

/** Een mededeling archiveren of terugzetten. */
export function leesMededelingWijziging(body: unknown): Lees<{ gearchiveerd: boolean }> {
  const o = object(body)
  if (!o || typeof o.gearchiveerd !== 'boolean') return { ok: false, fout: 'ongeldig' }
  return { ok: true, waarde: { gearchiveerd: o.gearchiveerd } }
}

/** Gelezen markeren, of bij een verplichte mededeling "Gelezen en begrepen". */
export function leesGelezen(body: unknown): Lees<{ mededelingId: string; bevestig: boolean }> {
  const o = object(body)
  if (!o || !isUuid(o.mededelingId)) return { ok: false, fout: 'ongeldig' }
  return { ok: true, waarde: { mededelingId: o.mededelingId, bevestig: o.bevestig === true } }
}

/** Stappen: 1 tot 40, elk met een tekst en optioneel uitleg. */
export function leesStappen(v: unknown): Stap[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > GRENZEN.stappen) return null
  const uit: Stap[] = []
  for (const ruw of v) {
    const o = object(ruw)
    const tekst = schoon(o?.tekst)
    const uitleg = schoon(o?.uitleg)
    if (!tekst || tekst.length > GRENZEN.stapTekst || uitleg.length > GRENZEN.stapUitleg) return null
    uit.push({ tekst, uitleg: uitleg || null })
  }
  return uit
}

export type WerkwijzeInvoer =
  | { soort: 'voorbeeld'; voorbeeld: Voorbeeld; vestigingen: string[]; rollen: Rol[] }
  | { soort: 'notitie'; notitieId: string }
  | {
      soort: 'eigen'
      titel: string
      werkwijzeSoort: WerkwijzeSoort
      vestigingen: string[]
      rollen: Rol[]
      stappen: Stap[]
      takenlijstId: string | null
    }

/** Een nieuwe werkwijze: een gekozen voorbeeld, uit een notitie, of helemaal eigen. */
export function leesWerkwijze(body: unknown, s: Schrijver): Lees<WerkwijzeInvoer> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'ongeldig' }
  if (o.notitieId !== undefined) {
    return isUuid(o.notitieId) ? { ok: true, waarde: { soort: 'notitie', notitieId: o.notitieId } } : { ok: false, fout: 'ongeldig' }
  }
  const groep = doelgroep(o, s)
  if (!groep.ok) return groep
  if (o.voorbeeld !== undefined) {
    return isVoorbeeld(o.voorbeeld) ? { ok: true, waarde: { soort: 'voorbeeld', voorbeeld: o.voorbeeld, ...groep.waarde } } : { ok: false, fout: 'ongeldig' }
  }
  const titel = titelVan(o.titel)
  if (!titel) return { ok: false, fout: 'titel' }
  const stappen = leesStappen(o.stappen)
  if (!stappen) return { ok: false, fout: 'stappen' }
  const werkwijzeSoort = isWerkwijzeSoort(o.werkwijzeSoort) ? o.werkwijzeSoort : 'eigen'
  const takenlijstId = isUuid(o.takenlijstId) ? o.takenlijstId : null
  return { ok: true, waarde: { soort: 'eigen', titel, werkwijzeSoort, ...groep.waarde, stappen, takenlijstId } }
}

export interface WerkwijzeMeta {
  titel?: string
  vestigingen?: string[]
  rollen?: Rol[]
  takenlijstId?: string | null
  gearchiveerd?: boolean
}

export type WerkwijzeWijziging = { soort: 'meta'; meta: WerkwijzeMeta } | { soort: 'versie'; versie: NieuweVersieInvoer } | { soort: 'melding' }

/**
 * Een werkwijze wijzigen: de gegevens (titel, voor wie, takenlijst, archief),
 * een nieuwe versie van de stappen, of { meldingOpnieuw: true } (de verplichte
 * mededeling van de huidige versie opnieuw plaatsen als die mislukte).
 */
export function leesWerkwijzeWijziging(body: unknown, s: Schrijver): Lees<WerkwijzeWijziging> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'ongeldig' }
  if (o.meldingOpnieuw !== undefined) return o.meldingOpnieuw === true ? { ok: true, waarde: { soort: 'melding' } } : { ok: false, fout: 'ongeldig' }
  if (o.stappen !== undefined) {
    const stappen = leesStappen(o.stappen)
    if (!stappen) return { ok: false, fout: 'stappen' }
    const watAnders = schoon(o.watAnders)
    if (watAnders.length > GRENZEN.watAnders) return { ok: false, fout: 'watAnders' }
    const belangrijk = o.belangrijk === true
    if (belangrijk && !watAnders) return { ok: false, fout: 'watAnders' }
    return { ok: true, waarde: { soort: 'versie', versie: { stappen, watAnders: watAnders || null, belangrijk } } }
  }
  const meta: WerkwijzeMeta = {}
  if (o.titel !== undefined) {
    const titel = titelVan(o.titel)
    if (!titel) return { ok: false, fout: 'titel' }
    meta.titel = titel
  }
  if (o.vestigingen !== undefined || o.rollen !== undefined) {
    const groep = doelgroep(o, s)
    if (!groep.ok) return groep
    if (o.vestigingen !== undefined) meta.vestigingen = groep.waarde.vestigingen
    if (o.rollen !== undefined) meta.rollen = groep.waarde.rollen
  }
  if (o.takenlijstId !== undefined) {
    if (o.takenlijstId !== null && !isUuid(o.takenlijstId)) return { ok: false, fout: 'ongeldig' }
    meta.takenlijstId = o.takenlijstId
  }
  if (o.gearchiveerd !== undefined) {
    if (typeof o.gearchiveerd !== 'boolean') return { ok: false, fout: 'ongeldig' }
    meta.gearchiveerd = o.gearchiveerd
  }
  if (Object.keys(meta).length === 0) return { ok: false, fout: 'ongeldig' }
  return { ok: true, waarde: { soort: 'meta', meta } }
}

export interface UitvoeringInvoer {
  werkwijzeId: string
  versie: number
  vestiging: string
  gestartOp: string
  afgevinkt: number[]
  notitie: string | null
  lidId: string | null
}

/** Een afgeronde uitvoering: de versie die je zag, de afgevinkte stappen en een notitie. */
export function leesUitvoering(body: unknown, vestigingen: readonly string[], nu: Date): Lees<UitvoeringInvoer> {
  const o = object(body)
  if (!o || !isUuid(o.werkwijzeId) || typeof o.versie !== 'number' || !Number.isInteger(o.versie) || o.versie < 1) return { ok: false, fout: 'ongeldig' }
  if (typeof o.vestiging !== 'string' || !vestigingen.includes(o.vestiging)) return { ok: false, fout: 'vestiging' }
  if (!Array.isArray(o.afgevinkt) || o.afgevinkt.length > GRENZEN.stappen || !o.afgevinkt.every((n) => Number.isInteger(n) && n >= 0 && n < GRENZEN.stappen)) {
    return { ok: false, fout: 'afgevinkt' }
  }
  const notitie = schoon(o.notitie)
  if (notitie.length > GRENZEN.notitie) return { ok: false, fout: 'notitie' }
  const start = typeof o.gestartOp === 'string' ? new Date(o.gestartOp) : null
  // Een start in de toekomst of meer dan een dag terug: dan telt nu.
  const geldig = start && !Number.isNaN(start.getTime()) && start.getTime() <= nu.getTime() && nu.getTime() - start.getTime() < 86_400_000
  return {
    ok: true,
    waarde: {
      werkwijzeId: o.werkwijzeId,
      versie: o.versie,
      vestiging: o.vestiging,
      gestartOp: (geldig ? start : nu).toISOString(),
      afgevinkt: [...new Set(o.afgevinkt as number[])].sort((a, b) => a - b),
      notitie: notitie || null,
      lidId: isUuid(o.lidId) ? o.lidId : null,
    },
  }
}

/** Wat een notitie moet hebben om er een werkwijze van te maken. */
export interface NotitieKenmerken {
  map: string
  gearchiveerd: boolean
  /** null = een notitie voor alle vestigingen. */
  vestiging: string | null
}

/**
 * Mag deze persoon van deze notitie een werkwijze maken? Alleen uit de map
 * Kennis, niet uit het archief, en alleen een notitie van een eigen vestiging
 * (een notitie voor alle vestigingen mag iedereen).
 */
export function notitieMagWerkwijze(n: NotitieKenmerken, s: Pick<Schrijver, 'vestigingen'>): boolean {
  if (n.map !== 'kennis' || n.gearchiveerd) return false
  return n.vestiging === null || s.vestigingen.includes(n.vestiging)
}

/** Voor wie de werkwijze uit een notitie is: de vestiging van de notitie, anders alle (of de eigen). */
export function vestigingenVanNotitie(n: Pick<NotitieKenmerken, 'vestiging'>, s: Pick<Schrijver, 'vestigingen' | 'alleVestigingen'>): string[] {
  if (n.vestiging !== null) return [n.vestiging]
  return s.alleVestigingen ? [] : [...new Set(s.vestigingen)]
}
