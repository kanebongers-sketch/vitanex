// ─── AI Your Gym: het platformoverzicht van Kane (PUUR) ─────────────────────
// Tellen en ordenen voor /club/platform: aanmeldingen uit ayg_aanmeldingen,
// de voortgang van de startwizard en de kerncijfers bovenaan. Alleen echte
// tellingen, nooit een geschatte omzet (de prijzen staan alleen in Stripe).
// Zonder Next, Supabase of env, zodat alles te testen is.

import { isAanmeldStatus, type AanmeldStatus } from '@/lib/aiyourgym/status'
import { OUDE_PAKKETTEN, leesPakketKeuze } from '@/lib/aiyourgym/pakketten'
import { pakkettenTekst } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { AANTAL_STAPPEN, leesStart } from '@/lib/club/start/stappen'

const ZONE = 'Europe/Amsterdam'
const UUR_MS = 60 * 60 * 1000

// ── Tijd ──────────────────────────────────────────────────────────────────

/** Het verschil tussen Nederlandse tijd en UTC op dit moment, in ms. */
function zoneVerschil(d: Date): number {
  const delen = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(d)
  const deel = (soort: string) => Number(delen.find((p) => p.type === soort)?.value ?? 0)
  const alsUtc = Date.UTC(deel('year'), deel('month') - 1, deel('day'), deel('hour'), deel('minute'), deel('second'))
  return alsUtc - Math.floor(d.getTime() / 1000) * 1000
}

/** Het begin van de kalendermaand (de 1e om 00:00 Nederlandse tijd) als ISO-tijd in UTC. */
export function maandBegin(nu: Date): string {
  const [jaar, maand] = new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE, year: 'numeric', month: '2-digit' }).format(nu).split('-').map(Number)
  const gok = Date.UTC(jaar, maand - 1, 1)
  const eerste = gok - zoneVerschil(new Date(gok))
  // Valt de overgang van zomer- naar wintertijd net tussen gok en echt moment: nog een keer.
  return new Date(gok - zoneVerschil(new Date(eerste))).toISOString()
}

/** Het moment zoveel uur geleden, als ISO-tijd. */
export function urenGeleden(nu: Date, uren: number): string {
  return new Date(nu.getTime() - uren * UUR_MS).toISOString()
}

/** De naam van de maand ("oktober"), voor de kop van de kolom check-ins. */
export function maandNaam(nu: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { timeZone: ZONE, month: 'long' }).format(nu)
}

// ── Aanmeldingen ──────────────────────────────────────────────────────────

export interface PlatformAanmelding {
  id: string
  pakket: string
  sportschoolNaam: string
  slug: string
  aantalVestigingen: number
  eigenaarNaam: string
  eigenaarEmail: string
  eigenaarTelefoon: string
  status: AanmeldStatus
  organisatieId: string | null
  /** Het abonnement bij Stripe (alleen op de server gebruikt), of null. */
  stripeAbonnementId: string | null
  aangemaaktOp: string
}

/** De kolommen die we uit ayg_aanmeldingen lezen. */
export const AANMELDING_KOLOMMEN = 'id, pakket, pakketten, sportschool_naam, slug, aantal_vestigingen, eigenaar_naam, eigenaar_email, eigenaar_telefoon, status, organisatie_id, stripe_subscription_id, aangemaakt_op'

function tekst(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/** Systeemgrens: een rij uit ayg_aanmeldingen, of null als hij niet klopt. */
export function aanmeldingUitRij(rij: unknown): PlatformAanmelding | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || !isAanmeldStatus(r.status)) return null
  return {
    id: r.id,
    // Een modulaire aanmelding: de losse pakketten als "lessen,groei" (pakketNaam maakt er namen van).
    pakket: r.pakket === 'los' ? (leesPakketKeuze(r.pakketten)?.join(',') ?? 'los') : tekst(r.pakket),
    sportschoolNaam: tekst(r.sportschool_naam),
    slug: tekst(r.slug),
    aantalVestigingen: typeof r.aantal_vestigingen === 'number' ? r.aantal_vestigingen : 1,
    eigenaarNaam: tekst(r.eigenaar_naam),
    eigenaarEmail: tekst(r.eigenaar_email),
    eigenaarTelefoon: tekst(r.eigenaar_telefoon),
    status: r.status,
    organisatieId: typeof r.organisatie_id === 'string' && r.organisatie_id ? r.organisatie_id : null,
    stripeAbonnementId: typeof r.stripe_subscription_id === 'string' && r.stripe_subscription_id ? r.stripe_subscription_id : null,
    aangemaaktOp: tekst(r.aangemaakt_op),
  }
}

/** Nieuwste eerst; een kapotte datum achteraan. */
export function nieuwsteEerst(lijst: readonly PlatformAanmelding[]): PlatformAanmelding[] {
  const tijd = (a: PlatformAanmelding) => {
    const t = Date.parse(a.aangemaaktOp)
    return Number.isNaN(t) ? -Infinity : t
  }
  return [...lijst].sort((a, b) => tijd(b) - tijd(a))
}

/** Per sportschool de nieuwste aanmelding die eraan hangt. */
export function aanmeldingPerOrganisatie(lijst: readonly PlatformAanmelding[]): Map<string, PlatformAanmelding> {
  const uit = new Map<string, PlatformAanmelding>()
  for (const a of nieuwsteEerst(lijst)) {
    if (a.organisatieId && !uit.has(a.organisatieId)) uit.set(a.organisatieId, a)
  }
  return uit
}

/** Een aanvraag zonder Stripe: Kane moet zelf contact opnemen. */
export function isAanvraag(a: Pick<PlatformAanmelding, 'status'>): boolean {
  return a.status === 'aanvraag'
}

export type Toon = 'ok' | 'let-op' | 'info' | 'merk' | 'uit'

export const STATUS_WEERGAVE: Record<AanmeldStatus, { label: string; toon: Toon }> = {
  aanvraag: { label: 'Aanvraag', toon: 'merk' },
  wacht_op_betaling: { label: 'Wacht op betaling', toon: 'info' },
  inrichten: { label: 'Wordt ingericht', toon: 'info' },
  actief: { label: 'Actief', toon: 'ok' },
  betaling_mislukt: { label: 'Betaling mislukt', toon: 'let-op' },
  gepauzeerd: { label: 'Gepauzeerd', toon: 'uit' },
  opgezegd: { label: 'Opgezegd', toon: 'uit' },
  test: { label: 'Test', toon: 'info' },
}

/** De naam van de losse pakketten ("Groepslessen en Groei") of van een oud pakket, of de sleutel als die onbekend is. */
export function pakketNaam(sleutel: string): string {
  const los = leesPakketKeuze(sleutel)
  if (los) return pakkettenTekst(los, 'nl')
  return OUDE_PAKKETTEN[sleutel] ?? (sleutel || 'Onbekend')
}

// ── Startwizard ───────────────────────────────────────────────────────────

export type StartStand =
  | { soort: 'niet'; klaar: 0; totaal: number }
  | { soort: 'bezig'; klaar: number; totaal: number }
  | { soort: 'af'; klaar: number; totaal: number; afgerondOp: string }

/** De voortgang van de startwizard uit club_organisaties.instellingen. */
export function startStand(instellingen: unknown): StartStand {
  const v = leesStart(instellingen)
  if (!v) return { soort: 'niet', klaar: 0, totaal: AANTAL_STAPPEN }
  if (v.afgerondOp) return { soort: 'af', klaar: v.klaar.length, totaal: AANTAL_STAPPEN, afgerondOp: v.afgerondOp }
  return { soort: 'bezig', klaar: v.klaar.length, totaal: AANTAL_STAPPEN }
}

// ── Kerncijfers ───────────────────────────────────────────────────────────

/** Een telling die niet te lezen was is null: de pagina toont dan een vraagteken. */
export interface KerncijfersInvoer {
  aanmeldingen: readonly PlatformAanmelding[] | null
  /** Statussen van supportmeldingen die nog niet klaar zijn; null = niet te lezen. */
  supportStatussen: readonly string[] | null
  /** Verschillende fouten die de laatste 24 uur voorkwamen; null = niet te lezen. */
  fouten24: number | null
}

export interface Kerncijfers {
  actief: number | null
  /** Open demo-aanvragen van de website (los geteld, zie demo-aanvragen.ts); null = niet te lezen. */
  demoOpen?: number | null
  aanvragen: number | null
  supportOpen: number | null
  supportNietOpgepakt: number | null
  fouten24: number | null
}

/** Actieve sportscholen: verschillende sportscholen met een lopend abonnement (status actief). */
export function telActief(lijst: readonly PlatformAanmelding[]): number {
  return new Set(lijst.filter((a) => a.status === 'actief' && a.organisatieId).map((a) => a.organisatieId)).size
}

export function kerncijfers(i: KerncijfersInvoer): Kerncijfers {
  const support = i.supportStatussen
  return {
    actief: i.aanmeldingen ? telActief(i.aanmeldingen) : null,
    aanvragen: i.aanmeldingen ? i.aanmeldingen.filter(isAanvraag).length : null,
    supportOpen: support ? support.filter((s) => s === 'open' || s === 'bezig').length : null,
    supportNietOpgepakt: support ? support.filter((s) => s === 'open').length : null,
    fouten24: i.fouten24,
  }
}
