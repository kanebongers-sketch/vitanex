// ─── AI Your Gym: de pagina Trainingsschema's (PUUR) ────────────────────────
// De route van intake tot voortgang, in de volgorde waarin een trainer werkt.
// Alleen wat Club echt doet: zie src/lib/club/training/** (intake, voorstel,
// editor, coaching), src/components/club/app/SchemaTab.tsx (ledenapp) en
// src/lib/club/voortgang/** (voortgang).

export type SchemaStapSleutel = 'intake' | 'voorstel' | 'editor' | 'bibliotheek' | 'eigen' | 'ledenapp' | 'voortgang'

export interface SchemaStap {
  sleutel: SchemaStapSleutel
  naam: string
  kop: string
  tekst: string
  punten: readonly string[]
}

export const SCHEMA_STAPPEN: readonly SchemaStap[] = [
  {
    sleutel: 'intake',
    naam: 'Intake',
    kop: 'Begin bij het lid, niet bij een sjabloon.',
    tekst: 'De trainer neemt de intake af op de vloer of aan tafel. Doelen, niveau, hoeveel dagen en minuten iemand kan trainen, en wat er speelt aan blessures en gezondheid.',
    punten: [
      'Metingen: gewicht, lengte, vetpercentage, buikomtrek, rusthartslag en bloeddruk',
      'Zeven gezondheidsvragen en blessures per lichaamsdeel',
      'Gezondheidsgegevens worden alleen bewaard als het lid daar toestemming voor geeft',
      'Eigen vragen toevoegen aan het intakeformulier van je sportschool',
    ],
  },
  {
    sleutel: 'voorstel',
    naam: 'Schemavoorstel',
    kop: 'Een startvoorstel met een klik.',
    tekst: 'Uit de intake maakt AI Your Gym een startschema op vaste vakregels, zonder giswerk en zonder extra kosten. Een begin, geen eindoordeel: de trainer beslist.',
    punten: [
      'De indeling past bij het aantal dagen en het niveau: full body, boven en onder, of duwen, trekken, benen',
      'Sets, herhalingen en rust passend bij het doel, een beginner start lichter',
      'Oefeningen die een blessure belasten worden weggelaten',
      'Een duidelijke waarschuwing als er ja is geantwoord op een gezondheidsvraag',
    ],
  },
  {
    sleutel: 'editor',
    naam: 'Schema-editor',
    kop: 'Aanpassen zoals jij traint.',
    tekst: 'In de editor zet de trainer het schema naar zijn hand. Tot zeven trainingsdagen, per oefening alles wat je op de vloer wilt afspreken.',
    punten: [
      'Per oefening sets, herhalingen, gewicht, rust en een notitie voor het lid',
      'Oefeningen zoeken op naam en filteren op spier, materiaal en niveau',
      'Opslaan als sjabloon en een sjabloon toepassen op een ander lid',
      'Printen voor wie liever met papier traint',
    ],
  },
  {
    sleutel: 'bibliotheek',
    naam: 'Bibliotheek met coaching',
    kop: 'Elke oefening met een trainer erin.',
    tekst: 'Bij elke oefening staat de coaching die een goede trainer op de vloer geeft. Eerst de kernpunten die je hardop zegt, daarna de rest.',
    punten: [
      '3 tot 5 genummerde kernpunten, de belangrijkste eerst',
      'Opstelling, uitvoering in stappen en veelgemaakte fouten met de correctie',
      'Ademhaling, tempo en een lichtere en zwaardere variant',
      'Een bewegende illustratie van begin- en eindhouding, en welke spieren je traint',
    ],
  },
  {
    sleutel: 'eigen',
    naam: 'Eigen coachteksten',
    kop: 'Jouw trainers, jouw woorden.',
    tekst: 'De basis is een start, geen keurslijf. Elke sportschool past de coaching aan in de eigen taal en zet eigen oefeningen in de bibliotheek.',
    punten: [
      'Kernpunten, stappen, fouten en correcties zelf herschrijven',
      'Dezelfde controle als de standaard, zodat het kort en leesbaar blijft',
      'Met een klik terug naar de standaardtekst',
      'Eigen tekst geldt alleen voor jouw sportschool',
    ],
  },
  {
    sleutel: 'ledenapp',
    naam: 'In de ledenapp',
    kop: 'Het schema op zak, de trainer erbij.',
    tekst: 'Het lid ziet het schema in de app van de sportschool. Onder elke oefening de eerste twee kernpunten, zodat ze tijdens het trainen in beeld zijn.',
    punten: [
      'Dag A, B en C, met de volgende training al aangegeven',
      'Tik op een oefening voor de bewegende illustratie en alle coaching',
      'De notitie van de trainer bij de oefening',
      'Na de training afvinken met een tik, en ongedaan maken als het per ongeluk was',
    ],
  },
  {
    sleutel: 'voortgang',
    naam: 'Voortgang',
    kop: 'Zien wat het oplevert.',
    tekst: 'Elke afgevinkte training en elke meting komt op een tijdlijn. De trainer ziet of het schema gevolgd wordt, het lid ziet zijn eigen vooruitgang.',
    punten: [
      'Trainingen per week en hoeveel weken op rij, met mijlpalen',
      'Lichaamsmaten in een grafiek: gewicht, omtrek, vetpercentage en spiermassa',
      'Het lid ziet alleen zijn eigen maten en trainingen, nooit de notities van de trainer',
      'De trainer ziet het verloop van de metingen over alle intakes',
    ],
  },
]
