// ─── AI Your Gym: eerlijk over wat het wel en niet doet (PUUR) ──────────────
// De vragen op de voorpagina, het blok "wat we wel en niet doen" en wat er bij
// overstappen meekomt. Alleen wat echt zo is gebouwd; waar het staat:
// - geen incasso, abonnementen of facturen van leden: Club werkt naast de ledenadministratie (.claude/CLAUDE.md)
// - jaarcontract per maand per vestiging, nu geen opstartkosten: besluit Kane 18-10-2026 (VRAAG_CONTRACT)
// - database en server in Frankfurt: docs/club/LIVEGANG.md (Supabase eu-central-1), Render Frankfurt sinds 23-10-2026
// - gescheiden per sportschool: elke club_*-query filtert op de sportschool (src/lib/club/toegang.ts)
// - meerdere vestigingen: club_vestigingen, rechten per rol (src/lib/club/beheerders/rechten.ts)
// - ledenimport: src/lib/club/leden/import (kolommen.ts, plan.ts: per vestiging, nooit verwijderen)
// - inloggen van leden: e-mailadres en wachtwoord na een eenmalige link (besluit Kane 23-10-2026)
// - poster met QR: /club/leden/app-poster
// Geen prijzen, geen concurrenten bij naam, geen koppelingen die er niet zijn.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { VRAAG_CONTRACT, type VeelgesteldeVraag } from './vertrouwen'

export interface VraagMetLink extends VeelgesteldeVraag {
  /** Een pad op de website (zonder /aiyourgym) voor wie meer wil lezen. */
  link?: { label: string; pad: string }
}

/** Vier vragen op de voorpagina, ingeklapt, vlak boven de afsluitende oproep.
 *  Overstappen en eigendom van gegevens staan op /overstappen en /prijzen. */
export const HOME_VRAGEN: readonly VraagMetLink[] = [
  {
    vraag: 'Doet AI Your Gym ook de incasso en abonnementen van mijn leden?',
    antwoord:
      'Nee. Incasso, abonnementen en facturen van leden blijven in je eigen ledenadministratie. AI Your Gym doet de rest van de club: check-in, lessen en reserveren, trainingsschema’s, de ledenapp, leads, personeel en cijfers. Je leden lees je in met een CSV- of Excel-bestand.',
    link: { label: 'Alles wat we wel en niet doen', pad: '/overstappen#wel-niet' },
  },
  VRAAG_CONTRACT,
  {
    vraag: 'Waar staan mijn gegevens?',
    antwoord:
      'In Frankfurt, binnen de EU: de database en de server die hem gebruikt. Elke sportschool heeft een eigen, strikt gescheiden omgeving. Gezondheidsgegevens uit een intake of meting worden alleen opgeslagen met uitdrukkelijke toestemming van het lid.',
    link: { label: 'Privacy en beveiliging', pad: '/privacy-en-beveiliging' },
  },
  {
    vraag: 'Werkt het voor meerdere vestigingen?',
    antwoord:
      'Ja. Per vestiging stel je zalen, openingstijden en regels in, en leden kunnen bij een vestiging horen. De eigenaar bepaalt per rol wat een clubmanager ziet. Het pakket Keten heeft geen grens aan het aantal vestigingen.',
  },
]

export interface WelNietPunt {
  titel: string
  tekst: string
}

/** Wat AI Your Gym doet. Elk punt bestaat echt in Club. */
export const WEL: readonly WelNietPunt[] = [
  { titel: 'Check-in en balie', tekst: 'Leden checken in met de QR-code in de ledenapp; de balie ziet wie er komt.' },
  { titel: 'Lessen en rooster', tekst: 'Groepslessen per zaal, reserveren met wachtlijst, en het personeelsrooster met uren.' },
  { titel: 'Trainingsschema’s', tekst: 'Intakes en schema’s met coaching en een bewegend beeld bij elke oefening.' },
  { titel: 'Ledenapp', tekst: 'Een web-app in je eigen naam en kleuren, voor lessen, schema en check-in.' },
  { titel: 'Leads en opvolgen', tekst: 'Belangstellenden en proeflessen, en leden die wegblijven op tijd in beeld.' },
  { titel: 'Cijfers', tekst: 'Bezoek, bezetting, leden en uren per kalendermaand, te exporteren als CSV.' },
]

/** Wat AI Your Gym (nu) niet doet. Eerlijk, zodat niemand voor verrassingen staat. */
export const NIET: readonly WelNietPunt[] = [
  { titel: 'Incasso en facturen van leden', tekst: 'Die blijven in je eigen ledenadministratie. AI Your Gym werkt ernaast.' },
  { titel: 'Abonnementen van leden beheren', tekst: 'De naam van het abonnement lees je mee in; het contract zelf blijft waar het nu staat.' },
  { titel: 'Een koppeling met je ledenadministratie', tekst: 'Er is nog geen automatische koppeling. Je leest je leden in met een CSV- of Excel-bestand, en opnieuw als er veel veranderd is.' },
  { titel: 'Een eigen app in de app stores', tekst: 'De ledenapp is een web-app die leden op hun beginscherm zetten, zonder app store.' },
]

/** Kort voor de voorpagina: vier dingen die het doet, vier die het (nu) niet doet.
 *  De volledige lijsten (WEL en NIET) staan op /overstappen#wel-niet. */
export const WEL_KORT: readonly string[] = ['Check-in met QR', 'Lessen en reserveren', 'Schema’s met coaching', 'Ledenapp in je huisstijl']
export const NIET_KORT: readonly string[] = [
  'Incasso en facturen van leden',
  'Abonnementen van leden',
  'Koppeling met je ledenadministratie',
  'Een app in de app stores',
]

/** Wat er bij het inlezen van een ledenbestand meekomt (de velden van de import). */
export const KOMT_MEE: readonly WelNietPunt[] = [
  { titel: 'Naam', tekst: 'Voornaam, tussenvoegsel en achternaam, of een kolom met de hele naam.' },
  { titel: 'Contact', tekst: 'E-mailadres en telefoonnummer.' },
  { titel: 'Persoon', tekst: 'Geboortedatum en geslacht.' },
  { titel: 'Lidmaatschap', tekst: 'Naam van het abonnement, status, lid sinds en einddatum.' },
  { titel: 'Nummers', tekst: 'Lidnummer en het klantnummer uit je huidige systeem.' },
  { titel: 'Vestiging', tekst: 'Je kiest bij het inlezen voor welke vestiging het bestand is.' },
]

/** Wat er niet meekomt, en wat je ermee doet. */
export const KOMT_NIET_MEE: readonly WelNietPunt[] = [
  { titel: 'Incasso en betaalgegevens', tekst: 'Blijven in je ledenadministratie, net als facturen en betaalhistorie.' },
  { titel: 'Bezoek en lesgeschiedenis', tekst: 'Oude check-ins en reserveringen komen niet mee. Je cijfers beginnen op de dag dat je start.' },
  { titel: 'Bestaande schema’s', tekst: 'Die zet je over in de editor, met de oefeningen uit de bibliotheek.' },
  { titel: 'Inloggegevens van leden', tekst: 'Leden kiezen zelf een wachtwoord via de link in hun mail of de QR-code op de poster.' },
]

/** Tips voor je eigen leden tijdens de overstap. */
export const OVERSTAP_TIPS: readonly string[] = [
  'Kondig de overstap aan in je huidige app of per mail, met de datum waarop de nieuwe app begint.',
  'Hang de poster met QR-code bij de balie, zodat leden de app ter plekke op hun telefoon zetten.',
  'Laat beide systemen kort naast elkaar lopen en kies een duidelijke einddatum voor het oude.',
  `Gebruik de ${PROEFDAGEN} dagen proefperiode om alles eerst met je eigen team te proberen.`,
]
