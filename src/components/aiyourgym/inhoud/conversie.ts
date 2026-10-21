// ─── AI Your Gym: geruststelling, pijnpunten en de vergelijking (PUUR) ──────
// Teksten die een bezoeker over de streep helpen. Alleen wat Club echt doet;
// waar het staat:
// - geen opstartkosten (actie) en jaarcontract: besluit Kane 18-10-2026, zie .claude/CLAUDE.md
// - proefperiode: PROEFDAGEN in src/lib/aiyourgym/pakketten.ts, trial_period_days in stripe-api.ts
// - gegevens van jou en exporteren: voorwaarden, src/lib/club/rapporten (ledenlijst, leads, uren als CSV)
// - persoonlijke hulp: de pakketten Club en Keten in pakketten.ts
// - database in Frankfurt: inhoud/vertrouwen.ts
// - ledenapp in eigen huisstijl in elk pakket: 'Ledenapp in je eigen huisstijl' in Start, de rest bouwt daarop
// - ledenimport met voorbeeld, nooit verwijderen: src/lib/club/leden/import
// - opvolgen met eigen drempels: src/lib/club/automatisering/regels.ts
// - uren goedkeuren en exporteren: src/lib/club/personeel/uren.ts, src/app/(aiyourgym)/api/club/personeel/uren/csv
// Geen prijzen, geen concurrenten bij naam, geen aantallen klanten of reviews.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { START_MINUTEN } from './vertrouwen'

/** Korte zinnen die het risico wegnemen, vlak bij elke aanmeldknop. */
export const GERUSTSTELLING = [
  `${PROEFDAGEN} dagen gratis proberen`,
  'Nu geen opstartkosten',
  'Je gegevens blijven van jou',
  'Persoonlijke hulp in Club en Keten',
  'Data in de EU',
] as const

export interface Pijnpunt {
  pijn: string
  uitleg: string
  oplossing: string
}

export const PIJNPUNTEN: readonly Pijnpunt[] = [
  {
    pijn: 'Losse systemen voor alles',
    uitleg: 'Check-in hier, het rooster daar, uren in Excel en schema’s in een map. Niemand ziet het hele plaatje.',
    oplossing: 'Een systeem voor de balie, de vloer en de eigenaar. Check-in, lessen, personeel, schema’s en cijfers kennen dezelfde leden.',
  },
  {
    pijn: 'Een eigen app is een dure extra',
    uitleg: 'Je wilt dat leden jouw naam en kleuren zien, niet die van je softwareleverancier.',
    oplossing: 'De ledenapp in je eigen naam, logo en kleuren zit in elk pakket. Leden zetten hem met een tik op hun beginscherm.',
  },
  {
    pijn: 'Overstappen voelt als een berg werk',
    uitleg: 'Alles overtypen, je team opnieuw leren werken en ondertussen moet de club gewoon draaien.',
    oplossing: `Je leest je leden in met een CSV-bestand en ziet eerst wat er verandert. Een startwizard zet de rest in ongeveer ${START_MINUTEN} minuten neer.`,
  },
]

export interface VergelijkRegel {
  onderwerp: string
  zonder: string
  met: string
}

/** Zonder of met AI Your Gym: de situatie, nooit een concurrent of een prijs. */
export const VERGELIJKING: readonly VergelijkRegel[] = [
  {
    onderwerp: 'Je systemen',
    zonder: 'Losse programma’s, lijstjes en Excel naast elkaar',
    met: 'Een systeem voor check-in, lessen, personeel, coaching en cijfers',
  },
  {
    onderwerp: 'Je ledenapp',
    zonder: 'Geen app, of een app met de naam van een ander',
    met: 'Je eigen naam, logo en kleuren, in elk pakket',
  },
  {
    onderwerp: 'Trainingsschema’s',
    zonder: 'Op papier of in losse documenten',
    met: 'In de app van het lid, met coaching per oefening',
  },
  {
    onderwerp: 'Leden die afhaken',
    zonder: 'Je merkt het pas als ze opzeggen',
    met: 'Een opvolglijst voor vandaag, met drempels die jij kiest',
  },
  {
    onderwerp: 'Uren van je team',
    zonder: 'Nalopen in een agenda en overtypen',
    met: 'Gepland, gewerkt, goedgekeurd en als export naar de administratie',
  },
  {
    onderwerp: 'Overstappen',
    zonder: 'Alles opnieuw invoeren',
    met: 'Ledenbestand inlezen met een CSV, eerst zien wat er verandert',
  },
]
