// ─── AI Your Gym: de pakketten (PUUR) ───────────────────────────────────────
// Eén bron voor de prijzenpagina, het aanmelden en Stripe. De prijzen kiest
// Kane; zolang een prijs null is toont de website "Prijs op aanvraag" en kan
// dat pakket niet via Stripe worden afgesloten. Het Stripe-prijs-id staat in
// Render als AIYOURGYM_STRIPE_PRIJS_<SLEUTEL> (bijv. AIYOURGYM_STRIPE_PRIJS_CLUB).

export type PakketSleutel = 'start' | 'club' | 'keten'

export interface Pakket {
  sleutel: PakketSleutel
  naam: string
  /** Voor wie het pakket is, in een zin. */
  voorWie: string
  /** Prijs in hele euro's per vestiging per maand, excl. btw. null = nog niet bepaald. */
  prijsPerVestiging: number | null
  /** Hoeveel vestigingen er maximaal in kunnen (null = onbeperkt). */
  maxVestigingen: number | null
  /** Wat erin zit: alleen functies die Club echt heeft. */
  inbegrepen: readonly string[]
  /** Het pakket dat de website uitlicht. */
  aanbevolen?: boolean
}

export const PROEFDAGEN = 14

export const PAKKETTEN: readonly Pakket[] = [
  {
    sleutel: 'start',
    naam: 'Start',
    voorWie: 'Voor een sportschool met een vestiging.',
    prijsPerVestiging: null,
    maxVestigingen: 1,
    inbegrepen: ['Leden en check-in', 'Groepslessen en reserveren', 'Ledenapp in je eigen huisstijl', 'Leads en opvolgen'],
  },
  {
    sleutel: 'club',
    naam: 'Club',
    voorWie: 'Alles voor trainers, coaching en ledenbehoud.',
    prijsPerVestiging: null,
    maxVestigingen: 3,
    inbegrepen: ['Alles uit Start', "Intakes en trainingsschema's met coaching", 'Afspraken en personeelsrooster', 'Challenges, badges en automatiseringen', 'Cijfers per maand', 'Persoonlijke hulp bij het inrichten'],
    aanbevolen: true,
  },
  {
    sleutel: 'keten',
    naam: 'Keten',
    voorWie: 'Voor ketens met meerdere vestigingen.',
    prijsPerVestiging: null,
    maxVestigingen: null,
    inbegrepen: ['Alles uit Club', 'Onbeperkt aantal vestigingen', 'Rechten per rol en clubmanagers', 'Eigen adres naam.aiyourgym.com', 'Persoonlijke hulp bij het inrichten'],
  },
]

export function vindPakket(sleutel: unknown): Pakket | null {
  return PAKKETTEN.find((p) => p.sleutel === sleutel) ?? null
}
