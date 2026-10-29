// ─── AI Your Gym: eerlijk over wat het wel en niet doet (PUUR) ──────────────
// Het blok "wat we wel en niet doen" en wat er bij overstappen meekomt (/overstappen). Alleen wat echt zo is gebouwd; waar het staat:
// - geen incasso, abonnementen of facturen van leden: Club werkt naast de ledenadministratie (.claude/CLAUDE.md)
// - jaarcontract per maand per vestiging, nu geen opstartkosten: besluit Kane 18-10-2026 (VRAAG_CONTRACT)
// - database en server in Frankfurt: docs/club/LIVEGANG.md (Supabase eu-central-1), Render Frankfurt sinds 23-10-2026
// - gescheiden per sportschool: elke club_*-query filtert op de sportschool (src/lib/club/toegang.ts)
// - meerdere vestigingen: club_vestigingen, rechten per rol (src/lib/club/beheerders/rechten.ts)
// - ledenimport: src/lib/club/leden/import (kolommen.ts, plan.ts: per vestiging, nooit verwijderen)
// - inloggen van leden: e-mailadres en wachtwoord na een eenmalige link (besluit Kane 23-10-2026)
// - poster met QR: /club/leden/app-poster
// Geen prijzen, geen concurrenten bij naam, geen koppelingen die er niet zijn.


export interface WelNietPunt {
  titel: string
  tekst: string
}

/** Wat AI Your Gym doet. Elk punt bestaat echt in Club. */
export const WEL: readonly WelNietPunt[] = [
  { titel: 'Balie en lessen', tekst: 'Check-in met QR, groepslessen met wachtlijst en het personeelsrooster.' },
  { titel: 'Schema’s en ledenapp', tekst: 'Intakes en schema’s met coaching, in een app met jouw naam.' },
  { titel: 'Leads en cijfers', tekst: 'Proeflessen en opvolgen, en cijfers per kalendermaand als CSV.' },
]

/** Wat AI Your Gym (nu) niet doet. Eerlijk, zodat niemand voor verrassingen staat. */
export const NIET: readonly WelNietPunt[] = [
  { titel: 'Incasso, facturen en abonnementen van leden', tekst: 'Die blijven in je eigen ledenadministratie. AI Your Gym werkt ernaast.' },
  { titel: 'Een koppeling met je ledenadministratie', tekst: 'Nog niet. Je leest je leden in met een CSV- of Excel-bestand.' },
  { titel: 'Een app in de app stores', tekst: 'De ledenapp is een web-app op het beginscherm.' },
]

/** Wat er bij het inlezen van een ledenbestand meekomt (de velden van de import). */
export const KOMT_MEE: readonly WelNietPunt[] = [
  { titel: 'Persoon en contact', tekst: 'Naam, e-mailadres, telefoon, geboortedatum en geslacht.' },
  { titel: 'Lidmaatschap', tekst: 'Naam van het abonnement, status, lid sinds en einddatum.' },
  { titel: 'Nummers en vestiging', tekst: 'Lid- en klantnummer. Je kiest per bestand de vestiging.' },
]

/** Wat er niet meekomt, en wat je ermee doet. */
export const KOMT_NIET_MEE: readonly WelNietPunt[] = [
  { titel: 'Incasso en betaalgegevens', tekst: 'Blijven in je ledenadministratie, net als facturen.' },
  { titel: 'Bezoek en lesgeschiedenis', tekst: 'Je cijfers beginnen op de dag dat je start.' },
  { titel: 'Schema’s en wachtwoorden', tekst: 'Schema’s zet je over in de editor. Leden kiezen zelf een wachtwoord.' },
]

/** Tips voor je eigen leden tijdens de overstap. */
export const OVERSTAP_TIPS: readonly string[] = [
  'Kondig de overstap aan, met de datum waarop de nieuwe app begint.',
  'Hang de poster met QR-code bij de balie.',
  'Laat beide systemen kort naast elkaar lopen, met een vaste einddatum.',
]
