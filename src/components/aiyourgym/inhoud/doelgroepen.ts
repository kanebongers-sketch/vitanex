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
    wie: 'Een vestiging, een klein team dat de vloer en de balie samen doet.',
    kop: 'Een systeem voor de hele dienst, van openen tot afsluiten.',
    punten: [
      'Inchecken met de QR-code op de telefoon, en direct zien of het lidmaatschap toegang geeft',
      'Dagtaken, afsluitronde en poetsrooster in een tabel per dag of per week',
      'Een opvolglijst met nieuwe leden, proefleden en leden die lang niet zijn geweest',
      'Een ledenapp met jouw naam, logo en kleuren',
    ],
    pakket: 'start',
  },
  {
    sleutel: 'boutique',
    kort: 'boutique studio',
    naam: 'Boutique studio',
    wie: 'Lessen staan centraal: spinning, yoga, HIIT of kracht in kleine groepen.',
    kop: 'Volle lessen, minder lege plekken en geen gedoe met lijstjes.',
    punten: [
      'Een lesrooster per zaal met plekken, wachtlijst en jouw regels voor annuleren en niet komen',
      'Leden reserveren zelf in de app en schuiven automatisch door vanaf de wachtlijst',
      'Bevestigingen en herinneringen per e-mail of in de app',
      'Challenges zoals weken op rij, met voortgang in de app',
      'Bezetting per les en per kalendermaand in de cijfers',
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
      'Intakes met metingen en gezondheidsvragen, alleen met toestemming van het lid',
      'Uit de intake een startvoorstel voor het schema, dat de trainer aanpast',
      'Coaching bij elke oefening: kernpunten, fouten met correctie, ademhaling en tempo',
      'Een voedingsplan per lid met een rekenhulp en sjablonen',
      'Afspraken boeken bij een trainer en de voortgang op een tijdlijn',
    ],
    pakket: 'club',
  },
  {
    sleutel: 'keten',
    kort: 'keten',
    naam: 'Keten',
    wie: 'Meerdere vestigingen, clubmanagers per vestiging en een centrale administratie.',
    kop: 'Elke vestiging eigen regels, een plek voor het overzicht.',
    punten: [
      'Elke vestiging met eigen zalen, lessen, openingstijden en regels',
      'Lidmaatschappen die bepalen op welke vestigingen een lid mag sporten',
      'Rechten per rol: de eigenaar bepaalt wat een clubmanager ziet',
      'Personeelsrooster met uren die je goedkeurt en exporteert voor de administratie',
      'Rapporten per kalendermaand en een eigen adres op naam.aiyourgym.com',
    ],
    pakket: 'keten',
  },
  {
    sleutel: 'yoga',
    kort: 'yogastudio',
    naam: 'Yoga, pilates en dans',
    wie: 'Een studio met vaste lessen en kleine groepen, waar rust en een goede sfeer tellen.',
    kop: 'Je lessen vol, zonder lijstjes of appjes heen en weer.',
    punten: [
      'Een lesrooster per zaal met een maximum aantal plekken en een wachtlijst',
      'Leden reserveren en annuleren zelf in de app, volgens jouw regels',
      'Een ledenapp met de naam, het logo en de kleuren van je studio',
      'Challenges zoals weken op rij, met voortgang in de app',
      'Bezetting per les en per kalendermaand in de cijfers',
    ],
    pakket: 'start',
  },
  {
    sleutel: 'vechtsport',
    kort: 'vechtsportschool',
    naam: 'Vechtsport en boksen',
    wie: 'Trainingen per groep en niveau, met vaste leden die er week na week staan.',
    kop: 'Elke groep op tijd op de mat, elk lid in beeld.',
    punten: [
      'Lessen per groep en zaal, met een maximum aantal plekken en een wachtlijst',
      'Inchecken met de QR-code en zien of het lidmaatschap toegang geeft',
      'Een ledenkaart met bezoek, labels en notities van de trainers',
      'Een opvolglijst voor leden die lang niet zijn geweest',
      'Challenges en badges die leden in de app zien',
    ],
    pakket: 'club',
  },
  {
    sleutel: 'bootcamp',
    kort: 'bootcamp',
    naam: 'Bootcamp en HIIT',
    wie: 'Korte, intensieve groepstrainingen met een volle planning en veel energie.',
    kop: 'Volle groepen, vaste ritmes en leden die terugkomen.',
    punten: [
      'Een rooster met plekken per training en een wachtlijst die vanzelf doorschuift',
      'Leden reserveren in de app en krijgen een bevestiging',
      'Challenges zoals een aantal trainingen per maand',
      'Automatiseringen voor proefleden en leden die afhaken, met jouw drempels',
      'Bezetting en no-shows per kalendermaand in de cijfers en rapporten',
    ],
    pakket: 'club',
  },
]
