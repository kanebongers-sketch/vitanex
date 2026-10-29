// ─── Club: de sportschool (organisatie) (PUUR) ──────────────────────────────
// Een organisatie is een sportschool met een eigen omgeving. Het id is tegelijk
// de user_id waarop alle club_*-tabellen filteren: zo is data per sportschool
// strikt gescheiden (zie migratie 401). Fit Factory heeft het bestaande id.

import { HEX, THEMAS, type Thema } from './huisstijl'
import { leesSlug } from './subdomein'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij, type OrgInstellingen } from './org-instellingen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { KERN_LABELS } from '@/lib/aiyourgym/taal/woorden/club/kern'
import { leesAfgenomen, verborgenVoor, type PakketSleutel, type Verborgen } from './pakketten'

export const MODULES = ['leden', 'checkin', 'rooster', 'afspraken', 'personeel', 'taken', 'leads', 'training', 'cijfers', 'app'] as const
export type Module = (typeof MODULES)[number]

export const MODULE_LABEL: Record<Module, { label: string; uitleg: string }> = {
  leden: { label: 'Leden', uitleg: 'Ledenlijst, ledenkaart, behoud en ledenbestand inlezen.' },
  checkin: { label: 'Check-in', uitleg: 'Inchecken bij de balie met QR of zoeken.' },
  rooster: { label: 'Groepslessen', uitleg: 'Lesrooster, reserveren en wachtlijsten.' },
  afspraken: { label: 'Afspraken', uitleg: 'Intakes, personal training en metingen met trainers boeken.' },
  personeel: { label: 'Personeelsrooster', uitleg: 'Diensten, beschikbaarheid en uren.' },
  taken: { label: 'Taken en poetslijsten', uitleg: 'Dagelijkse taken, afsluitronde en poetsrooster.' },
  leads: { label: 'Leads', uitleg: 'Proeflessen en aanmeldingen opvolgen.' },
  training: { label: 'Training', uitleg: 'Intakes, schema\'s en de oefenbibliotheek.' },
  cijfers: { label: 'Cijfers', uitleg: 'Maandcijfers per vestiging.' },
  app: { label: 'Ledenapp', uitleg: 'De app voor leden met schema, lessen en QR.' },
}

/** Het ingebouwde Fit Factory-logo (een React-component in plaats van een bestand). */
export const LOGO_FIT_FACTORY = 'ingebouwd:fitfactory'

export interface Organisatie {
  id: string
  naam: string
  slogan: string | null
  /** Pad in de bucket club-logo, LOGO_FIT_FACTORY, of null (dan tonen we de naam). */
  logo: string | null
  kleurAccent: string
  thema: Thema
  /**
   * Wat er voor deze sportschool niet te zien is: de eigen keuze (eigenUit)
   * plus alles van de pakketten die niet zijn afgenomen (zie kern/pakketten.ts).
   * Voor zichtbaarheid altijd deze; om de eigen keuze op te slaan eigenUit.
   */
  uit: Verborgen[]
  /** Alleen de onderdelen die de sportschool zelf uit zette (club_organisaties.modules). */
  eigenUit: Module[]
  /** De afgenomen pakketten (licentie via het abonnement, club_organisaties.pakketten). */
  afgenomen: PakketSleutel[]
  demo: boolean
  /** De slug van het eigen adres (aiyourgym.com/<slug>, later <slug>.aiyourgym.com), of null als hij nog niet gekozen is. */
  slug: string | null
  /** Ledenapp en rechten per rol (club_organisaties.instellingen). */
  instellingen: OrgInstellingen
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const LOGO_PAD = /^[0-9a-f-]{36}\/[a-z0-9-]{1,60}\.(png|webp|svg|jpg)$/

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

function isModule(v: string): v is Module {
  return (MODULES as readonly string[]).includes(v)
}

/** Uit de jsonb { lessen: false } de lijst met onderdelen die uit staan. */
export function modulesUit(ruw: unknown): Module[] {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return []
  return Object.entries(ruw)
    .filter(([sleutel, aan]) => isModule(sleutel) && aan === false)
    .map(([sleutel]) => sleutel as Module)
}

/** Staat dit onderdeel aan EN is het afgenomen? (`uit` bevat beide.) */
export function moduleAan(org: Pick<Organisatie, 'uit'>, module: Module): boolean {
  return !org.uit.includes(module)
}

/** Systeemgrens: een databaserij naar een Organisatie, of null. */
export function organisatieUitRij(rij: unknown): Organisatie | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || typeof r.naam !== 'string' || !r.naam.trim()) return null
  const eigenUit = modulesUit(r.modules)
  const afgenomen = leesAfgenomen(r.pakketten)
  const logo = r.logo === LOGO_FIT_FACTORY || (typeof r.logo === 'string' && LOGO_PAD.test(r.logo)) ? r.logo : null
  return {
    id: r.id,
    naam: r.naam,
    slogan: typeof r.slogan === 'string' && r.slogan.trim() ? r.slogan : null,
    logo,
    kleurAccent: typeof r.kleur_accent === 'string' && HEX.test(r.kleur_accent) ? r.kleur_accent.toUpperCase() : '#B58E5C',
    thema: (THEMAS as readonly unknown[]).includes(r.thema) ? (r.thema as Thema) : 'donker',
    uit: verborgenVoor(eigenUit, afgenomen),
    eigenUit,
    afgenomen,
    demo: r.demo === true,
    slug: typeof r.slug === 'string' && leesSlug(r.slug).ok ? r.slug : null,
    instellingen: orgInstellingenUitRij(r.instellingen, ONDERDEEL_SLEUTELS),
  }
}

export const ORGANISATIE_KOLOMMEN = 'id, naam, slogan, logo, kleur_accent, thema, modules, pakketten, demo, slug, instellingen'

/** De cookie waarin staat welke sportschool Kane nu bekijkt. */
export const ORGANISATIE_COOKIE = 'club-org'

/** Naam en uitleg van een onderdeel (module) in de gekozen taal. */
export function moduleTekst(m: Module, taal: Taal = 'nl'): { label: string; uitleg: string } {
  return KERN_LABELS[taal].modules[m]
}
