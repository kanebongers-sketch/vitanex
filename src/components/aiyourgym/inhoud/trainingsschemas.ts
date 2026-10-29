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
    tekst: 'Doelen, niveau, beschikbare tijd en blessures, op de vloer of aan tafel.',
    punten: [
      'Metingen van gewicht tot bloeddruk',
      'Gezondheidsvragen, alleen bewaard met toestemming',
      'Eigen vragen in je eigen intakeformulier',
    ],
  },
  {
    sleutel: 'voorstel',
    naam: 'Schemavoorstel',
    kop: 'Een startvoorstel met een klik.',
    tekst: 'Vaste vakregels maken uit de intake een startschema. De trainer beslist.',
    punten: [
      'Indeling passend bij dagen en niveau',
      'Oefeningen die een blessure belasten vallen weg',
      'Een waarschuwing bij een ja op een gezondheidsvraag',
    ],
  },
  {
    sleutel: 'editor',
    naam: 'Schema-editor',
    kop: 'Aanpassen zoals jij traint.',
    tekst: 'Tot zeven trainingsdagen, met per oefening alles wat je op de vloer afspreekt.',
    punten: [
      'Supersets, RPE of RIR, rust en tempo',
      'Slepen, ongedaan maken en kopieren naar een ander lid',
      'Printen voor wie liever met papier traint',
    ],
  },
  {
    sleutel: 'bibliotheek',
    naam: 'Bibliotheek met coaching',
    kop: 'Elke oefening met een trainer erin.',
    tekst: 'Eerst de kernpunten die je hardop zegt, daarna de rest.',
    punten: [
      '3 tot 5 genummerde kernpunten',
      'Veelgemaakte fouten met de correctie',
      'Ademhaling, tempo en een lichtere en zwaardere variant',
    ],
  },
  {
    sleutel: 'eigen',
    naam: 'Eigen coachteksten',
    kop: 'Jouw trainers, jouw woorden.',
    tekst: 'Herschrijf de coaching en zet eigen oefeningen in de bibliotheek.',
    punten: [
      'Geldt alleen voor jouw sportschool',
      'Dezelfde controle als de standaard',
      'Met een klik terug naar de standaardtekst',
    ],
  },
  {
    sleutel: 'ledenapp',
    naam: 'In de ledenapp',
    kop: 'Het schema op zak, de trainer erbij.',
    tekst: 'Onder elke oefening de eerste twee kernpunten, tijdens het trainen in beeld.',
    punten: [
      'De volgende training al aangegeven',
      'Alle coaching en de notitie van de trainer met een tik',
      'Per set invullen of de training afvinken',
    ],
  },
  {
    sleutel: 'voortgang',
    naam: 'Voortgang',
    kop: 'Zien wat het oplevert.',
    tekst: 'Elke training en elke meting op een tijdlijn, voor trainer en lid.',
    punten: [
      'Weken op rij, met mijlpalen',
      'Per oefening zien wanneer het zwaarder kan',
      'Het lid ziet nooit de notities van de trainer',
    ],
  },
]
