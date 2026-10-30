// ─── AI Your Gym: de losse pakketten (PUUR) ─────────────────────────────────
// Besluit Kane (29-10-2026, "enorm belangrijk"): AI Your Gym is modulair. Een
// sportschool kiest alleen wat ze nodig heeft (een of meer pakketten) en elk
// pakket werkt los van de andere. Een kleine kern zit altijd bij elk pakket
// (KERN_INBEGREPEN). Ontwerp: docs/aiyourgym/PAKKETTEN-MODULAIR.md.
//
// Eén bron voor de prijzenpagina, het aanmelden, Stripe en Club. Prijzen staan
// hier NIET: die kiest Kane en ze staan alleen in Stripe, per pakket als
// AIYOURGYM_STRIPE_PRIJS_<SLEUTEL> (bijvoorbeeld AIYOURGYM_STRIPE_PRIJS_LESSEN).
// Contract: jaarcontract, maandelijks betaald per vestiging (de hoeveelheid van
// elke regel in Stripe is het aantal vestigingen).
// Welke schermen, API's en tabbladen bij een pakket horen: src/lib/club/kern/pakketten.ts.
// Engelse teksten: src/lib/aiyourgym/taal/woorden/algemeen/pakketten.ts.

export const PAKKET_SLEUTELS = ['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei'] as const
export type PakketSleutel = (typeof PAKKET_SLEUTELS)[number]

export interface Pakket {
  sleutel: PakketSleutel
  naam: string
  /** Voor wie het pakket is, in een zin. */
  voorWie: string
  /** Wat erin zit: alleen functies die Club echt heeft. */
  inbegrepen: readonly string[]
}

// Geen proefperiode (besluit Kane 30-10-2026): bij het aanmelden wordt de
// eerste maand meteen betaald. Er is dus ook geen PROEFDAGEN meer.

export const PAKKETTEN: readonly Pakket[] = [
  {
    sleutel: 'administratie',
    naam: 'Ledenadministratie',
    voorWie: 'Voor wie lidmaatschappen, bezoek en cijfers bijhoudt.',
    inbegrepen: ['Lidmaatschapsvormen, pauzeren en opzeggen op de ledenkaart', 'Check-in met QR in de app of aan de balie', 'Cijfers per maand: instroom, uitstroom en bezoek', 'Rapporten en exports voor Excel'],
  },
  {
    sleutel: 'lessen',
    naam: 'Groepslessen',
    voorWie: "Voor studio's en clubs met een lesrooster.",
    inbegrepen: ['Lesrooster met lestypen, zalen en instructeurs', 'Leden boeken en annuleren zelf in de app', 'Wachtlijsten en reserveerregels', 'Boekingswidget voor je eigen website', 'Herinneringen voor lessen'],
  },
  {
    sleutel: 'training',
    naam: 'Training en coaching',
    voorWie: "Voor trainers die schema's maken en leden begeleiden.",
    inbegrepen: ['Intakes met een eigen vragenlijst', "Trainingsschema's met supersets, tempo en rust", 'Oefenbibliotheek met 3D-beelden en coaching per oefening', 'Voeding en voortgang per lid', 'Leden loggen hun sets in de app'],
  },
  {
    sleutel: 'afspraken',
    naam: 'Afspraken',
    voorWie: 'Voor personal training, intakes en metingen.',
    inbegrepen: ['Afspraaktypen met eigen duur', 'Leden boeken zelf een vrij moment in de app', 'Beschikbaarheid per trainer', 'Herinneringen voor afspraken'],
  },
  {
    sleutel: 'team',
    naam: 'Team en vloer',
    voorWie: 'Voor clubs met personeel op de vloer.',
    inbegrepen: ['Personeelsrooster met diensten', 'Uren: gepland, gewerkt en goedgekeurd', 'Dagelijkse taken, afsluitronde en poetsrooster'],
  },
  {
    sleutel: 'groei',
    naam: 'Groei',
    voorWie: 'Voor wie meer leden wil werven en houden.',
    inbegrepen: ['Leads en proeflessen opvolgen', 'Een opvolglijst voor het team', 'Opvolgregels die taken klaarzetten', 'Challenges, badges en community in de ledenapp', 'Berichten aan leden'],
  },
]

/** Wat altijd bij elk pakket zit (de kern). */
export const KERN_INBEGREPEN: readonly string[] = [
  'Ledenlijst en ledenkaart met naam en contact',
  'Ledenapp in je eigen huisstijl',
  'Vestigingen, team en rechten per rol',
  'Eigen adres, zoals aiyourgym.com/jouwgym',
  'Ledenbestand inlezen en AVG per lid',
]

export function isPakketSleutel(v: unknown): v is PakketSleutel {
  return typeof v === 'string' && (PAKKET_SLEUTELS as readonly string[]).includes(v)
}

export function vindPakket(sleutel: unknown): Pakket | null {
  return PAKKETTEN.find((p) => p.sleutel === sleutel) ?? null
}

/** Zijn dit alle zes pakketten (de bundel, besluit Kane 30-10-2026)? */
export function isAllePakketten(lijst: readonly PakketSleutel[]): boolean {
  return PAKKET_SLEUTELS.every((s) => lijst.includes(s))
}

/** In vaste volgorde en zonder dubbelen. */
export function sorteerPakketten(lijst: readonly PakketSleutel[]): PakketSleutel[] {
  return PAKKET_SLEUTELS.filter((s) => lijst.includes(s))
}

/**
 * Een keuze van pakketten van buiten (formulier, URL, metadata): een lijst of
 * een tekst "lessen,groei". Alleen bekende sleutels; leeg of onbekend = null.
 */
export function leesPakketKeuze(ruw: unknown): PakketSleutel[] | null {
  const lijst = typeof ruw === 'string' ? ruw.split(',') : Array.isArray(ruw) ? ruw : null
  if (!lijst || lijst.length === 0 || lijst.length > PAKKET_SLEUTELS.length * 2) return null
  const schoon = lijst.map((x) => (typeof x === 'string' ? x.trim() : x))
  if (!schoon.every(isPakketSleutel)) return null
  return sorteerPakketten(schoon as PakketSleutel[])
}

/**
 * De oude pakketten (Start, Club, Keten, tot 29-10-2026) in oude aanmeldingen:
 * alleen om ze te tonen. Wat ze kregen: alles (migratie 467).
 */
export const OUDE_PAKKETTEN: Readonly<Record<string, string>> = { start: 'Start', club: 'Club', keten: 'Keten' }

/** Een slim voorstel per soort sportschool (de eigenaar past het aan). */
export const VOORSTEL_PER_SOORT: Readonly<Record<string, readonly PakketSleutel[]>> = {
  gym: ['administratie', 'lessen', 'training', 'team', 'groei'],
  boutique: ['lessen', 'administratie', 'groei'],
  pt: ['training', 'afspraken'],
  keten: PAKKET_SLEUTELS,
  yoga: ['lessen'],
  vechtsport: ['lessen', 'administratie'],
  bootcamp: ['lessen', 'groei'],
}

export function voorstelVoor(soort: unknown): PakketSleutel[] | null {
  const v = typeof soort === 'string' ? VOORSTEL_PER_SOORT[soort] : undefined
  return v ? sorteerPakketten(v) : null
}
