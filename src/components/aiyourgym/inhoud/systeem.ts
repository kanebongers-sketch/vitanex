// ─── AI Your Gym: alles in een systeem (PUUR) ───────────────────────────────
// Wie er in een sportschool met Club werkt en wat ze daar doen. Alleen functies
// die Club echt heeft (dezelfde bron als functies.ts). Het moment hieronder is
// een voorbeeld met een verzonnen lid, geen klantverhaal.

export type RolSleutel = 'balie' | 'vloer' | 'trainer' | 'eigenaar' | 'lid'

export interface Rol {
  sleutel: RolSleutel
  /** Kort, voor in het schema: "Balie". */
  naam: string
  /** Een zin: wat deze plek met Club doet. */
  kop: string
  punten: readonly string[]
}

export const ROLLEN: readonly Rol[] = [
  {
    sleutel: 'balie',
    naam: 'Balie',
    kop: 'Inchecken, opzoeken en overdragen.',
    punten: [
      'Inchecken met de QR-code uit de ledenapp of op naam, met direct een lijst van wie er binnen is',
      'Een controle of het lidmaatschap toegang geeft tot deze vestiging',
      'De ledenkaart met bezoek, lidmaatschap, labels en notities',
      'Notities voor de volgende dienst op een vaste plek',
    ],
  },
  {
    sleutel: 'vloer',
    naam: 'Vloer',
    kop: 'Lessen, diensten en taken van vandaag.',
    punten: [
      'Het lesrooster per zaal, met bezetting en wachtlijst',
      'De diensten van vandaag: wie staat er nu en wie komt nog',
      'Dagtaken, afsluitronde en poetslijst, afvinken met een tik',
    ],
  },
  {
    sleutel: 'trainer',
    naam: 'Trainer',
    kop: 'Van intake tot schema met coaching.',
    punten: [
      'Een intake met metingen en gezondheidsvragen',
      'Een startvoorstel voor het schema, aan te passen in de editor',
      'Coaching bij elke oefening: kernpunten, fouten met correctie, ademhaling en tempo',
      'Zien welke trainingen het lid in de app afvinkte',
    ],
  },
  {
    sleutel: 'eigenaar',
    naam: 'Eigenaar',
    kop: 'Overzicht en de regels van je club.',
    punten: [
      'Groei, bezoek, bezetting en behoud per kalendermaand',
      'Rechten per rol en onderdelen die je aan of uit zet',
      'Je eigen logo, kleuren en adres, ook in de ledenapp',
      'Meerdere vestigingen in dezelfde omgeving',
    ],
  },
  {
    sleutel: 'lid',
    naam: 'Lid',
    kop: 'Jouw app op zak.',
    punten: [
      'Een web-app in de huisstijl van de sportschool, op het beginscherm',
      'Lessen reserveren en inchecken met de QR-code',
      'Het eigen schema met coaching, en afvinken wat gedaan is',
      'De eigen voortgang: lichaamsmaten en trainingen',
    ],
  },
]

/** Wat iedereen deelt: een bron in plaats van losse lijstjes. */
export const GEDEELD = ['Leden', 'Rooster', 'Schema’s', 'Cijfers'] as const

export interface Moment {
  rol: RolSleutel
  tijd: string
  tekst: string
}

/** Een avond in de club, gevolgd over de vijf plekken (voorbeeld). */
export const MOMENT: readonly Moment[] = [
  { rol: 'lid', tijd: '17:40', tekst: 'Sanne reserveert in de app een plek bij de spinningles van 18:30.' },
  { rol: 'balie', tijd: '18:21', tekst: 'Ze checkt in met haar QR-code en staat meteen bij wie er binnen is.' },
  { rol: 'vloer', tijd: '18:30', tekst: 'Haar plek telt mee in de bezetting van de les in het rooster.' },
  { rol: 'trainer', tijd: '19:15', tekst: 'Ze vinkt dag B af. Haar trainer ziet het bij haar schema.' },
  { rol: 'eigenaar', tijd: '23:00', tekst: 'Haar bezoek telt mee in de cijfers van deze maand.' },
]
