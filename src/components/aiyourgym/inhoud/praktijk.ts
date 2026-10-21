// ─── AI Your Gym: gebouwd vanuit de praktijk, en wat we beloven (PUUR) ──────
// Sociaal bewijs zonder te liegen: geen aantallen klanten, reviews, sterren of
// logo's (die hebben we nog niet). Wel een waar verhaal over wie het bouwt en
// beloftes die we waarmaken. Nooit de naam van een werkgever noemen.
// Waar het staat:
// - naam: besluit Kane 18-10-2026 (mag in het verhaal); null = geen naam tonen
// - reactie binnen een werkdag: Kane belt zelf (demo-aanvragen op /club/platform)
// - persoonlijke hulp bij inrichten: de pakketten Club en Keten in src/lib/aiyourgym/pakketten.ts
// - gegevens mee: exports in src/lib/club/rapporten (CSV), voorwaarden

export const OPRICHTER: { naam: string | null } = {
  naam: 'Kane Bongers',
}

export const PRAKTIJK = {
  label: 'Gebouwd vanuit de praktijk',
  kop: 'Gemaakt door iemand die zelf op de vloer staat.',
  rol: 'Personal Trainer en PT-manager van 8 locaties',
  tekst:
    'De problemen die AI Your Gym oplost komen van de werkvloer zelf: een balie die tegelijk moet inchecken en opvolgen, roosters in losse lijstjes en schema’s die zonder uitleg in een la verdwijnen. Elke maand komen er functies bij, op basis van wat clubs nodig hebben.',
} as const

export interface Belofte {
  titel: string
  tekst: string
}

export const BELOFTES: readonly Belofte[] = [
  {
    titel: 'Reactie binnen een werkdag',
    tekst: 'Vraag je een demo aan of heb je een vraag, dan hoor je binnen een werkdag van ons. Van een mens, geen automatische mail.',
  },
  {
    titel: 'Persoonlijke hulp bij inrichten',
    tekst: 'In de pakketten Club en Keten helpen we je persoonlijk om je sportschool in te richten, gratis.',
  },
  {
    titel: 'Je gegevens gaan mee',
    tekst: 'Je gegevens blijven van jou. Stop je, dan neem je ze mee: ledenlijst, leads en uren exporteer je als CSV.',
  },
]
