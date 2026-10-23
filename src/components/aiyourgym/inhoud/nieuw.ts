// ─── AI Your Gym: wat er nieuw is (PUUR) ────────────────────────────────────
// Per maand wat er echt is bijgekomen en nu werkt voor elke sportschool. Bron:
// de git-geschiedenis van src/app/(aiyourgym), src/lib/club, src/components/club
// en src/components/aiyourgym (git log --since=2026-10-01), vertaald naar
// gewone taal. Regels:
// - Alleen wat live is. Niet wat achter een schakelaar uit staat (eigen
//   subdomeinen, boekingswidget), niet wat alleen voor Kane is (notities,
//   prototypes zoals de 3D-oefenbeelden in de bibliotheek) en niet wat nog niet
//   gekoppeld is (online betalen via Stripe).
// - Nooit een belofte met een datum in de toekomst.
// - Geen namen van andere systemen of bedrijven.
// Nieuw werk komt bovenaan de eigen maand; een nieuwe maand bovenaan de lijst.

import type { HoofdstukSleutel } from './functies'

export interface NieuwPunt {
  /** Datum waarop het live ging, als jjjj-mm-dd. */
  datum: string
  titel: string
  tekst: string
  hoofdstuk: HoofdstukSleutel
}

export interface NieuwMaand {
  /** jjjj-mm */
  maand: string
  /** Een korte zin over de maand. */
  samenvatting: string
  punten: readonly NieuwPunt[]
}

export const NIEUW: readonly NieuwMaand[] = [
  {
    maand: '2026-10',
    samenvatting: 'De eerste maand: van een lege map tot software waarmee een sportschool de hele dag draait.',
    punten: [
      {
        datum: '2026-10-23',
        titel: 'Een eigen adres voor je sportschool',
        tekst: 'Elke sportschool heeft een eigen adres, zoals aiyourgym.com/jouwgym. Daar loggen je team en je leden in.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Inloggen met e-mailadres en wachtwoord',
        tekst: 'Eigenaar, clubmanager, medewerkers en leden loggen allemaal in met hun e-mailadres en een sterk wachtwoord. Een link is er alleen nog om de eerste keer een wachtwoord te kiezen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'De startwizard denkt mee',
        tekst: 'De wizard laat zien hoeveel minuten je nog bezig bent, gaat verder waar je was gebleven en laat je een streefdatum kiezen om live te gaan. Aan het eind staat een lijstje voor je eerste dag.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'AVG voor leads en medewerkers',
        tekst: 'Naast leden hebben nu ook leads en medewerkers inzage en wissen. Bewaartermijnen stel je per sportschool in, het opruimen gaat vanzelf.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'Startwizard in acht stappen',
        tekst: 'Kies je soort sportschool en de wizard zet onderdelen, lestypen, openingstijden en rechten alvast klaar. Jij zegt per stap of het klopt.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'Makkelijker voor de trainer op de vloer',
        tekst: 'Een strakker menu met zoeken via Ctrl K, en een ledenapp die beter werkt op de telefoon.',
        hoofdstuk: 'betrokkenheid',
      },
      {
        datum: '2026-10-18',
        titel: 'Een schema-editor voor coaches',
        tekst: 'Supersets en circuits, per oefening sets, herhalingen of tijd, gewicht, RPE of RIR, rust en tempo. Slepen, ongedaan maken en een schema kopieren naar een ander lid.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-18',
        titel: 'Leden loggen per set',
        tekst: 'Leden vullen in de app per set in wat ze deden. De trainer ziet de voortgang per oefening en een vaste regel voor wanneer het zwaarder kan.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-18',
        titel: 'Inchecken met de telefoon',
        tekst: 'Leden checken in met de QR-code in hun ledenapp. De balie ziet direct of het lidmaatschap toegang geeft.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-18',
        titel: 'Gegevens van een lid downloaden of verwijderen',
        tekst: 'Op de ledenkaart download je alle gegevens van een lid, of zet je het lid op verwijderen. Binnen 30 dagen is dat nog terug te draaien.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-18',
        titel: 'Leden uitnodigen voor de app',
        tekst: 'Een uitnodiging per mail of een QR-code op de ledenkaart, zodat leden de app op hun beginscherm zetten.',
        hoofdstuk: 'betrokkenheid',
      },
      {
        datum: '2026-10-17',
        titel: 'Een instellingencentrum voor de eigenaar',
        tekst: 'Huisstijl, vestigingen, medewerkers en rechten per rol, regels, lessen en zalen, oefeningen en de ledenapp op een plek, met een zoekveld.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Coaching bij elke oefening',
        tekst: 'Genummerde kernpunten, opstelling, stappen, veelgemaakte fouten met correctie, ademhaling en tempo. Elke sportschool past de teksten aan in eigen woorden.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-17',
        titel: 'Ledenlijst inlezen uit een CSV-bestand',
        tekst: 'Gangbare kolommen worden herkend, en je ziet eerst wat er verandert voordat iets wordt opgeslagen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Afspraken met trainers',
        tekst: 'Intakes, personal training en metingen per trainer, ook wekelijks herhalend. Leden boeken zelf een vrij moment.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-17',
        titel: 'Lidmaatschappen met regels',
        tekst: 'Lidmaatschapsvormen en labels bepalen waar en wanneer een lid mag inchecken en reserveren.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Eigen intake, challenges en opvolgen',
        tekst: 'Een intakeformulier dat je zelf samenstelt, challenges met badges in de app en een opvolglijst voor ledenbehoud.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-17',
        titel: 'Sluitingsdagen, berichten en voortgang',
        tekst: 'Feestdagen en afwijkende tijden die overal kloppen, nieuws voor je leden in de app en metingen op een tijdlijn.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-17',
        titel: 'Voeding per lid',
        tekst: 'Een voedingsplan met calorieen, eiwit, koolhydraten en vet. Een rekenhulp geeft een startpunt, sjablonen besparen tijd, het lid ziet het in de app.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-17',
        titel: 'Rapporten en exports',
        tekst: 'Ledenlijst, instroom en opzeggingen, bezoek, bezetting, leads, afspraken en uren per kalendermaand, als tabel of als CSV.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-15',
        titel: 'Cijfers per kalendermaand',
        tekst: 'Groei, bezoek, bezetting en behoud van de eerste tot de laatste dag van de maand, met de vorige maand ernaast en een overzicht van twaalf maanden.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-14',
        titel: 'Personeelsrooster met uren',
        tekst: 'Diensten per week en uren die van gepland naar gewerkt, goedgekeurd en verwerkt gaan, klaar voor de administratie.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-14',
        titel: 'Taken en poetslijsten',
        tekst: 'Dagtaken, de afsluitronde en een poetsrooster in een tabel per dag of per week. Afvinken met een tik.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-14',
        titel: 'De eerste versie',
        tekst: 'Leden, check-in, lesrooster met reserveren, leads, trainingsschema’s, cijfers en een ledenapp. Met een menu in vijf groepen, ook op de telefoon.',
        hoofdstuk: 'beheer',
      },
    ],
  },
]

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const

/** "2026-10" wordt "Oktober 2026". */
export function maandNaam(maand: string): string {
  const [jaar, nr] = maand.split('-')
  const naam = MAANDEN[Number(nr) - 1] ?? ''
  return `${naam.charAt(0).toUpperCase()}${naam.slice(1)} ${jaar}`
}

/** "2026-10-23" wordt "23 okt". */
export function korteDatum(datum: string): string {
  const [, nr, dag] = datum.split('-')
  const naam = MAANDEN[Number(nr) - 1] ?? ''
  return `${Number(dag)} ${naam.slice(0, 3)}`
}

/** Het totaal aantal punten, voor de kop van de pagina. */
export function aantalNieuw(lijst: readonly NieuwMaand[] = NIEUW): number {
  return lijst.reduce((som, m) => som + m.punten.length, 0)
}
