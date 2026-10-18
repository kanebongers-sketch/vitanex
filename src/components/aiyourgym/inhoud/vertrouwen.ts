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

/** Ook gebruikt op de prijzenpagina: het antwoord over vastzitten en betalen. */
export const VRAAG_CONTRACT: VeelgesteldeVraag = {
  vraag: 'Zit ik ergens aan vast?',
  antwoord: `Je begint met ${PROEFDAGEN} dagen gratis in je eigen omgeving. In die tijd stop je kosteloos. Daarna betaal je per maand, per vestiging. Je prijs krijg je vooraf en schriftelijk, en het bedrag zie je bij Stripe voordat je iets bevestigt.`,
}

/** Ook gebruikt op de prijzenpagina: van wie de gegevens zijn. */
export const VRAAG_GEGEVENS: VeelgesteldeVraag = {
  vraag: 'Van wie zijn mijn gegevens, en krijg ik ze mee?',
  antwoord:
    'Van jou. AI Your Gym gebruikt ze alleen om de software voor jou te laten werken. De ledenlijst, leads, bezoek, bezetting en gewerkte uren exporteer je als CSV via de rapporten, en per lid download je alle gegevens van de ledenkaart.',
}

// De volgorde volgt de bezwaren die een eigenaar heeft voor hij begint:
// overstappen, gegevens, vastzitten, hulp, privacy, en daarna de praktische vragen.
export const VEELGESTELDE_VRAGEN: readonly VeelgesteldeVraag[] = [
  {
    vraag: 'Is overstappen veel werk?',
    antwoord: `Minder dan je denkt. Je leest je leden in met een CSV-bestand uit je huidige systeem of uit Excel. Gangbare kolommen worden herkend en je ziet eerst wat er verandert; er wordt nooit iemand verwijderd. De startwizard zet daarna in ${STAPPEN.length} stappen, samen ongeveer ${START_MINUTEN} minuten, de rest neer. Elke stap kun je overslaan en later afmaken.`,
  },
  VRAAG_GEGEVENS,
  VRAAG_CONTRACT,
  {
    vraag: 'Krijg ik hulp bij het inrichten?',
    antwoord:
      'Ja. Elke sportschool krijgt de startwizard. In de pakketten Club en Keten zit daarnaast persoonlijke hulp bij het inrichten, zonder extra kosten: we lopen je ledenbestand, rooster en eerste schema’s samen met je door.',
  },
  {
    vraag: 'Is het veilig en volgens de AVG?',
    antwoord:
      'De gegevens staan in een database in Frankfurt, binnen de EU. Elke sportschool heeft een eigen, gescheiden omgeving. Gezondheidsgegevens slaan we alleen op met toestemming van het lid, en een lid kun je zelf exporteren of laten verwijderen.',
  },
  {
    vraag: 'Vervangt AI Your Gym mijn ledenadministratie?',
    antwoord:
      'Nee. Incasso, abonnementen en betalingen blijven waar ze nu zijn. AI Your Gym regelt de rest: check-in, lessen, personeel, coaching en de ledenapp. Zo kun je overstappen zonder dat je club stilvalt.',
  },
  {
    vraag: 'Moeten mijn leden een app downloaden?',
    antwoord:
      'Nee. De ledenapp is een web-app die leden met een tik op hun beginscherm zetten. Ze loggen in met een persoonlijke link en een pincode die ze zelf kiezen.',
  },
  {
    vraag: 'Kan ik het eerst zien?',
    antwoord: `Ja. In de demo bekijk je de echte schermen met voorbeeldgegevens, zonder account. Daarna probeer je alles ${PROEFDAGEN} dagen gratis in je eigen omgeving.`,
  },
  {
    vraag: 'Wat kost het?',
    antwoord:
      'Dat hangt af van het pakket en het aantal vestigingen. We rekenen een prijs die past bij je sportschool, scherp geprijsd, met elke maand nieuwe functies erbij.',
  },
]
