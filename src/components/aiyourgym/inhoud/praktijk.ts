// ─── AI Your Gym: gebouwd vanuit de praktijk, en wat we beloven (PUUR) ──────
// Sociaal bewijs zonder te liegen: geen aantallen klanten, reviews, sterren of
// logo's (die hebben we nog niet). Wel een waar verhaal over wie het bouwt en
// beloftes die we waarmaken. Nooit de naam van een werkgever noemen.
// Waar het staat:
// - naam: besluit Kane 18-10-2026 (mag in het verhaal); null = geen naam tonen
// - reactie binnen een werkdag: Kane belt zelf (demo-aanvragen op /club/platform)
// - persoonlijk aanspreekpunt en elke maand nieuwe functies: besluit Kane 23-10-2026

export const OPRICHTER: { naam: string | null } = {
  naam: 'Kane Bongers',
}

export const PRAKTIJK = {
  label: 'Gebouwd vanuit de praktijk',
  kop: 'Gebouwd door iemand die de vloer kent.',
  rol: 'Personal trainer en PT-manager van 8 locaties',
  tekst:
    'Ik sta zelf als personal trainer op de vloer en begeleid als PT-manager de trainers van acht locaties. AI Your Gym bouw ik omdat ik elke week zie waar het schuurt. Dit zijn de drie dingen waar ik mee begon.',
} as const

export interface VloerProbleem {
  /** Wat er op de vloer misgaat. */
  probleem: string
  /** Wat AI Your Gym daaraan doet (alleen wat echt zo is gebouwd). */
  oplossing: string
}

// Waar het staat:
// - check-in en opvolgen op Vandaag: src/app/(aiyourgym)/(club)/club/page.tsx, components/club/vandaag
// - lesrooster, personeelsrooster en taken: src/lib/club (rooster, personeel, taken)
// - coaching per oefening en 3D-beeld: src/lib/club/training/coaching, src/lib/club/training/3d
export const VLOER: readonly VloerProbleem[] = [
  {
    probleem: 'Een balie die tegelijk incheckt en opvolgt',
    oplossing: 'Check-in, de ledenkaart en wie je moet bellen staan samen op het scherm Vandaag.',
  },
  {
    probleem: 'Roosters in losse lijstjes',
    oplossing: 'Lessen, diensten met uren en de poetslijst staan in een systeem in plaats van in een agenda, een Excel en op papier.',
  },
  {
    probleem: 'Schema’s zonder uitleg',
    oplossing: 'Bij elke oefening genummerde kernpunten en een figuur dat de beweging voordoet, ook thuis in de app.',
  },
]

export interface Belofte {
  titel: string
  tekst: string
}

export const BELOFTES: readonly Belofte[] = [
  {
    titel: 'Gemaakt voor een drukke avond',
    tekst: 'Elke functie bedenk ik vanuit de trainer met een telefoon in de hand. Daarom werkt alles op telefoon, tablet en pc.',
  },
  {
    titel: 'Elke maand nieuwe functies',
    tekst: 'Wat sportscholen vragen, komt op de lijst. Elke maand komt er iets bij.',
  },
  {
    titel: 'Een persoonlijk aanspreekpunt',
    tekst: 'Je praat met iemand die weet hoe jouw club is ingericht, niet met een wisselende helpdesk.',
  },
  {
    titel: 'Reactie binnen een werkdag',
    tekst: 'Vraag je een demo aan of heb je een vraag, dan hoor je binnen een werkdag van ons. Van een mens, geen automatische mail.',
  },
]
