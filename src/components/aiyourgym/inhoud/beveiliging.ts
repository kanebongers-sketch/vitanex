// ─── AI Your Gym: pagina Privacy en beveiliging (PUUR) ──────────────────────
// Alleen wat echt zo is gebouwd. Bronnen:
// - docs/club/AVG.md (register, rechten, opruimen, cookies, subverwerkers)
// - docs/aiyourgym/juridisch/verwerkersovereenkomst.md (nog concept, geen download op de site)
// - database: Supabase eu-central-1 Frankfurt (docs/club/LIVEGANG.md); server: Render Frankfurt sinds 23-10-2026
// - scheiding: elke club_*-query filtert op de sportschool (src/lib/club/toegang.ts); RLS aan, alleen de server leest
// - wachtwoorden: scrypt (src/lib/club/kern/wachtwoord.ts), regels in wachtwoord-regels.ts (minstens 12 tekens)
// - bewaartermijnen per sportschool: club_privacy_instellingen, pg_cron club_privacy_opruimen (migratie 449)
// - AVG-export en verwijderen in twee stappen: src/lib/club/leden/avg, club_lid_definitief_verwijderen
// - gezondheid alleen met toestemming: migratie 430, src/lib/club/training/intake.ts
// - IP alleen als HMAC: src/lib/club/kern/rem-hash.ts
// Geen keurmerken of certificaten noemen: die hebben we niet.

export interface Waarborg {
  titel: string
  tekst: string
}

export interface WaarborgGroep {
  sleutel: string
  label: string
  titel: string
  punten: readonly Waarborg[]
}

export const KERN: readonly Waarborg[] = [
  { titel: 'Frankfurt', tekst: 'Database en server staan in Frankfurt, binnen de EU.' },
  { titel: 'Gescheiden', tekst: 'Elke sportschool een eigen omgeving. Je ziet nooit gegevens van een ander.' },
  { titel: 'Van jou', tekst: 'Je gegevens zijn van jou. Exporteren kan altijd.' },
]

export const GROEPEN: readonly WaarborgGroep[] = [
  {
    sleutel: 'opslag',
    label: 'Opslag',
    titel: 'Waar de gegevens staan.',
    punten: [
      { titel: 'In de EU', tekst: 'Database en server in een datacenter in Frankfurt.' },
      { titel: 'Per sportschool gescheiden', tekst: 'Elke vraag aan de database blijft binnen je eigen sportschool. Alleen de server leest mee, nooit de browser.' },
      { titel: 'Geen AI-diensten met ledengegevens', tekst: 'Gegevens van je leden gaan niet naar AI-diensten van derden.' },
    ],
  },
  {
    sleutel: 'toegang',
    label: 'Toegang',
    titel: 'Wie erbij kan.',
    punten: [
      { titel: 'Sterke wachtwoorden', tekst: 'Nooit leesbaar opgeslagen (scrypt). Te korte of makkelijk te raden wachtwoorden worden geweigerd.' },
      { titel: 'Rechten per rol', tekst: 'De eigenaar bepaalt welke onderdelen elke rol ziet.' },
      { titel: 'Wat een lid ziet', tekst: 'Alleen de eigen gegevens. Notities, bloeddruk en hartslag blijven bij het team.' },
    ],
  },
  {
    sleutel: 'leden',
    label: 'Leden',
    titel: 'De rechten van je leden, in de software.',
    punten: [
      { titel: 'Inzage', tekst: 'Alle gegevens van een lid, lead of medewerker in een bestand.' },
      { titel: 'Verwijderen in twee stappen', tekst: 'Eerst 30 dagen terug te zetten, daarna definitief gewist. Alleen de eigenaar mag dit.' },
      { titel: 'Gezondheid alleen met toestemming', tekst: 'Alleen opgeslagen met uitdrukkelijke toestemming, en nooit in rapporten, mails of meldingen.' },
    ],
  },
  {
    sleutel: 'bewaren',
    label: 'Bewaren',
    titel: 'Niet langer dan nodig.',
    punten: [
      { titel: 'Termijnen per sportschool', tekst: 'Jij bepaalt hoe lang leads, oud-leden, bezoek en het logboek blijven. Elke nacht wordt opgeruimd.' },
      { titel: 'Geen IP-adressen', tekst: 'Tegen misbruik alleen een onomkeerbare code, nooit het adres zelf.' },
      { titel: 'Geen tracking', tekst: 'Alleen cookies om in te loggen. Geen advertentie- of analysecookies, geen scripts van derden.' },
    ],
  },
]

/** De diensten die we gebruiken (Bijlage 3 van de verwerkersovereenkomst). */
export const SUBVERWERKERS: readonly Waarborg[] = [
  { titel: 'Supabase', tekst: 'Database en opslag van logo’s, in Frankfurt.' },
  { titel: 'Render', tekst: 'De server van de software, in Frankfurt.' },
  { titel: 'Resend', tekst: 'E-mails, zoals uitnodigingen en meldingen.' },
  { titel: 'Stripe', tekst: 'Betalen van je abonnement bij AI Your Gym.' },
  { titel: 'Push van de browser', tekst: 'Alleen als meldingen op de telefoon aan staan. Het bericht is versleuteld.' },
]
