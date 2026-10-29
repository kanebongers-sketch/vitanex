// ─── AI Your Gym: voor welke sportschool (PUUR) ──────────────────────────────
// Per soort sportschool wat die aan Club heeft. Alleen functies die Club echt
// heeft (zie functies.ts en src/lib/club/**); geen beloftes over resultaat.

import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'

export type DoelgroepSleutel = 'zelfstandig' | 'boutique' | 'pt-studio' | 'keten' | 'yoga' | 'vechtsport' | 'bootcamp'

export interface Doelgroep {
  sleutel: DoelgroepSleutel
  naam: string
  /** Kort, voor het wisselende woord in de kop van de voorpagina. */
  kort: string
  /** Korte omschrijving van de sportschool zelf. */
  wie: string
  /** De kern in een zin: wat het oplost. */
  kop: string
  /** Wat ze eraan hebben, 3 tot 5 punten, alleen echte functies. */
  punten: readonly string[]
  /** Het pakket dat er meestal bij past. */
  pakket: PakketSleutel
}

export const DOELGROEPEN: readonly Doelgroep[] = [
  {
    sleutel: 'zelfstandig',
    kort: 'gym',
    naam: 'Zelfstandige sportschool',
    wie: 'Een vestiging en een klein team voor vloer en balie.',
    kop: 'Een systeem voor de hele dienst, van openen tot afsluiten.',
    punten: [
      'Check-in met QR, en meteen zien of het lidmaatschap toegang geeft',
      'Dagtaken, afsluitronde en poetsrooster in een tabel',
      'Een opvolglijst voor nieuwe leden en wie lang wegblijft',
    ],
    pakket: 'start',
  },
  {
    sleutel: 'boutique',
    kort: 'boutique studio',
    naam: 'Boutique studio',
    wie: 'Lessen staan centraal, in kleine groepen.',
    kop: 'Volle lessen, minder lege plekken.',
    punten: [
      'Een rooster per zaal met wachtlijst en jouw annuleerregels',
      'Leden reserveren zelf en schuiven vanzelf door',
      'Bezetting per les en per kalendermaand',
    ],
    pakket: 'club',
  },
  {
    sleutel: 'pt-studio',
    kort: 'PT-studio',
    naam: 'PT-studio',
    wie: 'Personal training en kleine groepen, waar begeleiding het verschil maakt.',
    kop: 'Elk lid een schema met een trainer erin.',
    punten: [
      'Intake met metingen, alleen met toestemming van het lid',
      'Coaching bij elke oefening: kernpunten, fouten, ademhaling',
      'Voedingsplan, afspraken en voortgang per lid',
    ],
    pakket: 'club',
  },
  {
    sleutel: 'keten',
    kort: 'keten',
    naam: 'Keten',
    wie: 'Meerdere vestigingen met clubmanagers en een centrale administratie.',
    kop: 'Elke vestiging eigen regels, een plek voor het overzicht.',
    punten: [
      'Lidmaatschappen bepalen waar een lid mag sporten',
      'Rechten per rol: jij bepaalt wat een clubmanager ziet',
      'Uren goedkeuren en exporteren voor de administratie',
    ],
    pakket: 'keten',
  },
  {
    sleutel: 'yoga',
    kort: 'yogastudio',
    naam: 'Yoga, pilates en dans',
    wie: 'Vaste lessen en kleine groepen, waar rust telt.',
    kop: 'Je lessen vol, zonder appjes heen en weer.',
    punten: [
      'Een rooster per zaal met plekken en wachtlijst',
      'Leden reserveren en annuleren zelf, volgens jouw regels',
      'Een ledenapp met de naam en kleuren van je studio',
    ],
    pakket: 'start',
  },
  {
    sleutel: 'vechtsport',
    kort: 'vechtsportschool',
    naam: 'Vechtsport en boksen',
    wie: 'Trainingen per groep en niveau, met vaste leden.',
    kop: 'Elke groep op tijd op de mat, elk lid in beeld.',
    punten: [
      'Lessen per groep en zaal, met wachtlijst',
      'Een ledenkaart met bezoek en notities van de trainers',
      'Challenges en badges in de app',
    ],
    pakket: 'club',
  },
  {
    sleutel: 'bootcamp',
    kort: 'bootcamp',
    naam: 'Bootcamp en HIIT',
    wie: 'Korte, intensieve groepstrainingen met een volle planning.',
    kop: 'Volle groepen en leden die terugkomen.',
    punten: [
      'Een wachtlijst die vanzelf doorschuift',
      'Opvolgregels voor proefleden en wie afhaakt',
      'Bezetting en no-shows per kalendermaand',
    ],
    pakket: 'club',
  },
]
