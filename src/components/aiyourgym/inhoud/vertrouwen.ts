// ─── AI Your Gym: start, veiligheid en vragen (PUUR) ────────────────────────
// Teksten voor "Zo simpel start je", "Veilig en volgens de AVG" en de
// veelgestelde vragen. Alleen maatregelen die echt zo zijn gebouwd:
// - database in Frankfurt: docs/club/LIVEGANG.md (Supabase eu-central-1)
// - gescheiden data: elke club_*-query filtert op de sportschool (src/lib/club/toegang.ts)
// - gehashte pincodes en blokkade: src/lib/club/ledenlogin/opslag.ts
// - gezondheid alleen met toestemming: src/lib/club/training/intake.ts, voortgang/meting.ts
// - export en verwijderen per lid: src/lib/club/leden/avg (ledenkaart, 30 dagen, dan definitief)

import { STAPPEN } from '@/lib/club/start/stappen'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

export interface StartStap {
  nr: number
  titel: string
  kort: string
}

/** De negen stappen van de startwizard, uit Club zelf. */
export const START_STAPPEN: readonly StartStap[] = STAPPEN.map((s, i) => ({ nr: i + 1, titel: s.titel, kort: s.kort }))

/** Hoe lang de wizard samen ongeveer duurt, in minuten (uit Club). */
export const START_MINUTEN = STAPPEN.reduce((som, s) => som + s.minuten, 0)

export interface Maatregel {
  titel: string
  tekst: string
}

export const MAATREGELEN: readonly Maatregel[] = [
  {
    titel: 'Database in Frankfurt',
    tekst: 'De gegevens van je sportschool en je leden staan in een database in Frankfurt, binnen de EU.',
  },
  {
    titel: 'Gescheiden per sportschool',
    tekst: 'Elke sportschool heeft een eigen omgeving. Je team ziet alleen de eigen sportschool, nooit die van een ander.',
  },
  {
    titel: 'Pincodes gehasht',
    tekst: 'We bewaren nooit de pincode zelf, alleen een onleesbare afdruk. Na vijf foute pogingen moet je eerst wachten.',
  },
  {
    titel: 'Gezondheid alleen met toestemming',
    tekst: 'Gezondheidsvragen en metingen zoals bloeddruk slaan we alleen op als het lid daar toestemming voor gaf. De notities van de trainer gaan nooit naar de app.',
  },
  {
    titel: 'Exporteren en verwijderen',
    tekst: 'Vraagt een lid om zijn gegevens, dan download je ze met een klik van de ledenkaart. Wil een lid verwijderd worden, dan doe je dat zelf: na 30 dagen is alles weg, en je maandcijfers blijven kloppen.',
  },
]

export interface VeelgesteldeVraag {
  vraag: string
  antwoord: string
}

export const VEELGESTELDE_VRAGEN: readonly VeelgesteldeVraag[] = [
  {
    vraag: 'Vervangt AI Your Gym mijn ledenadministratie?',
    antwoord:
      'Nee. Incasso, abonnementen en betalingen blijven waar ze nu zijn. AI Your Gym regelt de rest: check-in, lessen, personeel, coaching en de ledenapp. Je leden lees je in met een CSV-bestand.',
  },
  {
    vraag: 'Hoe snel staat mijn sportschool erin?',
    antwoord: `Na het aanmelden loop je een startwizard van ${STAPPEN.length} stappen door, samen ongeveer ${START_MINUTEN} minuten. Elke stap kun je overslaan en later afmaken. Hoe groot je ledenbestand en rooster zijn bepaalt hoeveel tijd de rest kost.`,
  },
  {
    vraag: 'Krijg ik hulp bij het inrichten?',
    antwoord:
      'In de pakketten Club en Keten zit persoonlijke hulp bij het inrichten, zonder extra kosten. We lopen je ledenbestand, rooster en eerste schema’s samen met je door.',
  },
  {
    vraag: 'Moeten mijn leden een app downloaden?',
    antwoord:
      'Nee. De ledenapp is een web-app die leden met een tik op hun beginscherm zetten. Ze loggen in met een persoonlijke link en een pincode die ze zelf kiezen.',
  },
  {
    vraag: 'Kan ik het eerst zien?',
    antwoord: `Ja. In de demo bekijk je de schermen met voorbeeldgegevens, zonder account. Daarna probeer je alles ${PROEFDAGEN} dagen gratis in je eigen omgeving.`,
  },
  {
    vraag: 'Wat kost het?',
    antwoord:
      'Dat hangt af van het pakket en het aantal vestigingen. We rekenen een prijs die past bij je sportschool, scherp geprijsd, met elke maand nieuwe functies erbij.',
  },
]
