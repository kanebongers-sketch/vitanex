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
  { titel: 'Gescheiden', tekst: 'Elke sportschool heeft een eigen omgeving. Je ziet nooit gegevens van een ander.' },
  { titel: 'Van jou', tekst: 'Je gegevens zijn van jou. Je exporteert ze wanneer je wilt.' },
]

export const GROEPEN: readonly WaarborgGroep[] = [
  {
    sleutel: 'opslag',
    label: 'Opslag',
    titel: 'Waar de gegevens staan.',
    punten: [
      { titel: 'In de EU', tekst: 'De database staat in een datacenter in Frankfurt, net als de server die hem gebruikt.' },
      { titel: 'Per sportschool gescheiden', tekst: 'Elke vraag aan de database is beperkt tot je eigen sportschool. Alleen de server leest de database, nooit de browser.' },
      { titel: 'Geen AI-diensten met ledengegevens', tekst: 'Gegevens van je leden gaan niet naar AI-diensten van derden.' },
    ],
  },
  {
    sleutel: 'toegang',
    label: 'Toegang',
    titel: 'Wie erbij kan.',
    punten: [
      { titel: 'Sterke wachtwoorden', tekst: 'Iedereen logt in met e-mailadres en wachtwoord. Wachtwoorden staan nooit leesbaar opgeslagen (scrypt), en te korte of makkelijk te raden wachtwoorden worden geweigerd.' },
      { titel: 'Rechten per rol', tekst: 'Per rol stel je in welke onderdelen iemand ziet. De eigenaar bepaalt wat een clubmanager mag.' },
      { titel: 'Wat een lid ziet', tekst: 'In de ledenapp ziet een lid alleen de eigen gegevens. Notities van trainers, bloeddruk en hartslag blijven bij het team.' },
    ],
  },
  {
    sleutel: 'leden',
    label: 'Leden',
    titel: 'De rechten van je leden, in de software.',
    punten: [
      { titel: 'Inzage', tekst: 'Op de ledenkaart download je alle gegevens van een lid in een bestand. Ook voor leads en medewerkers.' },
      { titel: 'Verwijderen in twee stappen', tekst: 'Een verwijderd lid staat eerst 30 dagen klaar om terug te zetten. Daarna wordt het definitief gewist. Alleen de eigenaar mag dit.' },
      { titel: 'Gezondheid alleen met toestemming', tekst: 'Metingen en gezondheidsantwoorden uit een intake worden alleen opgeslagen met uitdrukkelijke toestemming van het lid. Ze staan niet in rapporten, mails of meldingen.' },
    ],
  },
  {
    sleutel: 'bewaren',
    label: 'Bewaren',
    titel: 'Niet langer dan nodig.',
    punten: [
      { titel: 'Termijnen per sportschool', tekst: 'Je stelt zelf in hoe lang leads, oud-leden, bezoek en het logboek bewaard blijven. Elke nacht ruimt het systeem op wat over de termijn is.' },
      { titel: 'Geen IP-adressen', tekst: 'Tegen misbruik bewaren we alleen een onomkeerbare code van een IP-adres, nooit het adres zelf.' },
      { titel: 'Geen tracking', tekst: 'Alleen cookies die nodig zijn om in te loggen. Geen advertentie- of analysecookies en geen scripts van derden die meekijken.' },
    ],
  },
]

/** De diensten die we gebruiken (Bijlage 3 van de verwerkersovereenkomst). */
export const SUBVERWERKERS: readonly Waarborg[] = [
  { titel: 'Supabase', tekst: 'Database en opslag van logo’s, in Frankfurt.' },
  { titel: 'Render', tekst: 'De server waarop de software draait, in Frankfurt.' },
  { titel: 'Resend', tekst: 'Het versturen van e-mails, zoals uitnodigingen en meldingen.' },
  { titel: 'Stripe', tekst: 'Het betalen van je abonnement bij AI Your Gym.' },
  { titel: 'Push van de browser', tekst: 'Meldingen op de telefoon van leden die ze aanzetten. Het bericht is versleuteld.' },
]
