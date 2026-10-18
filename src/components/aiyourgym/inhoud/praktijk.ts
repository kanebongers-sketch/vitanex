// ─── AI Your Gym: gebouwd vanuit de praktijk, en wat we beloven (PUUR) ──────
// Sociaal bewijs zonder te liegen: geen aantallen klanten, reviews, sterren of
// logo's (die hebben we nog niet). Wel een waar verhaal over wie het bouwt en
// beloftes die we waarmaken. Nooit de naam van een werkgever noemen.
// Waar het staat:
// - naam: besluit Kane 18-10-2026 (mag in het verhaal); null = geen naam tonen
// - reactie binnen een werkdag: Kane belt zelf (demo-aanvragen op /clubkane/platform)
// - persoonlijke hulp bij inrichten: de pakketten Club en Keten in src/lib/aiyourgym/pakketten.ts
// - gegevens mee: exports in src/lib/club/rapporten (CSV), voorwaarden

export const OPRICHTER: { naam: string | null } = {
  naam: 'Kane Bongers',
}

export const PRAKTIJK = {
  label: 'Gebouwd vanuit de praktijk',
  kop: 'Gemaakt door iemand die zelf op de vloer staat.',
  rol: 'Personal trainer en regiomanager',
  alineas: [
    'AI Your Gym is gebouwd door een personal trainer en regiomanager die al jaren meerdere clubs aanstuurt en een team van coaches opleidt.',
    'De problemen die het oplost komen van de werkvloer zelf: een balie die tegelijk moet inchecken en opvolgen, roosters in losse lijstjes, uren die iemand moet natellen, en schema’s die zonder uitleg in een la verdwijnen.',
    'Daarom zit coaching per oefening in elk schema, en is alles ingedeeld zoals een sportschool echt werkt. Elke maand komen er functies bij, op basis van wat clubs nodig hebben.',
  ],
  feiten: [
    { titel: 'Meerdere clubs', tekst: 'Jarenlang de dagelijkse aansturing van meerdere vestigingen.' },
    { titel: 'Coaches opleiden', tekst: 'Een team van trainers dat begeleid en opgeleid wordt.' },
    { titel: 'Zelf op de vloer', tekst: 'Personal trainer, dus de oefeningen en de coaching zijn uit de praktijk.' },
  ],
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
