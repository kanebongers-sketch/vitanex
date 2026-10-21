// ─── Club: alle instel-pagina's op een plek (PUUR) ──────────────────────────
// Besluit Kane (18-10-2026): uitgebreid maar zo simpel mogelijk. Het menu is
// voor dagelijks werk; alles wat je instelt staat alleen in het
// instellingencentrum (/club/beheer), elk ding met een naam en een plek.
// Deze lijst stuurt het instellingencentrum, het kruimelpad op elke
// instel-pagina en het zoekveld in de balk. Wie een pagina mag zien volgt de
// rechten (sleutel = onderdeel uit ONDERDEEL_SLEUTELS); een test bewaakt dat
// elk pad bestaat en bij dat onderdeel hoort.

import type { Module } from './organisatie'

export const INSTEL_GROEPEN = [
  { sleutel: 'sportschool', label: 'Sportschool' },
  { sleutel: 'locaties', label: 'Locaties' },
  { sleutel: 'team', label: 'Team en rechten' },
  { sleutel: 'planning', label: 'Planning' },
  { sleutel: 'coaching', label: 'Coaching' },
  { sleutel: 'leden', label: 'Leden en app' },
  { sleutel: 'communicatie', label: 'Communicatie' },
  { sleutel: 'betalen', label: 'Betalen en abonnement' },
] as const

export type InstelGroep = (typeof INSTEL_GROEPEN)[number]['sleutel']

export interface InstelPagina {
  id: string
  titel: string
  uitleg: string
  groep: InstelGroep
  /** Pad binnen /club, eventueel met ?tab= of #anker. */
  pad: string
  /** Het onderdeel (rechten per rol) dat iemand nodig heeft. */
  sleutel: string
  /** Werkt per vestiging: de link neemt de gekozen vestiging mee en zonder vestiging is hij niet beschikbaar. */
  perVestiging?: boolean
  /** Het onderdeel dat een sportschool uit kan zetten; staat het uit, dan is de pagina er niet. */
  module?: Module
  /** Alleen Kane en de eigenaar (niet voor een clubmanager of medewerker). */
  alleenEigenaar?: boolean
  /** Niet voor een medewerker, ook niet met het recht (sportschoolbreed). */
  nietVoorMedewerker?: boolean
  /** Alleen als betalen in de ledenapp beschikbaar is (CLUB_BETALEN_ACTIEF). */
  betalen?: boolean
  /**
   * Een tabblad van een dagelijks onderdeel (Afspraken, Training, Leden). Staat
   * in het instellingencentrum, maar geeft op zichzelf geen toegang tot het
   * centrum: een trainer met alleen Leden krijgt geen menu-item Instellingen.
   */
  snelkoppeling?: boolean
  /** Extra woorden waarop het zoekveld deze pagina vindt. */
  trefwoorden?: string
}

export const INSTEL_PAGINAS: readonly InstelPagina[] = [
  // Sportschool
  { id: 'start', titel: 'Startwizard', uitleg: 'Je sportschool stap voor stap inrichten, te hervatten wanneer je wilt.', groep: 'sportschool', pad: '/start', sleutel: 'start', alleenEigenaar: true, trefwoorden: 'inrichten beginnen nieuw' },
  { id: 'huisstijl', titel: 'Huisstijl', uitleg: 'Naam, slogan, logo, accentkleur en donker of licht.', groep: 'sportschool', pad: '/huisstijl', sleutel: 'huisstijl', trefwoorden: 'logo kleur thema naam slogan' },
  { id: 'onderdelen', titel: 'Onderdelen aan of uit', uitleg: 'Zet uit wat je sportschool niet gebruikt; het verdwijnt dan overal.', groep: 'sportschool', pad: '/huisstijl#modules-kop', sleutel: 'huisstijl', trefwoorden: 'modules uitzetten' },
  { id: 'adres', titel: 'Adres', uitleg: 'Je eigen webadres voor medewerkers en leden.', groep: 'sportschool', pad: '/huisstijl#adres-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'subdomein domein url' },
  { id: 'bedrijf', titel: 'Bedrijf en huisregels', uitleg: 'KvK, btw, hoofdkantoor, social links, huisregels, voorwaarden en privacy.', groep: 'sportschool', pad: '/beheer/bedrijf', sleutel: 'bedrijf', trefwoorden: 'kvk btw voorwaarden privacy' },
  { id: 'privacy', titel: 'Privacy en bewaren', uitleg: 'Hoe lang Club leads, oud-leden, bezoeken en het logboek bewaart.', groep: 'sportschool', pad: '/beheer/privacy', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'avg gdpr bewaartermijn verwijderen anonimiseren' },
  // Locaties
  { id: 'vestigingen', titel: 'Vestigingen', uitleg: 'Toevoegen, naam, contact, volgorde en welke standaard open gaat.', groep: 'locaties', pad: '/instellingen/vestigingen', sleutel: 'instellingen', nietVoorMedewerker: true, trefwoorden: 'locatie club adres telefoon' },
  { id: 'regels', titel: 'Regels en openingstijden', uitleg: 'Boeken, annuleren, no-shows en openingstijden per vestiging.', groep: 'locaties', pad: '/instellingen/regels', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'annuleren no-show open dicht' },
  { id: 'sluiting', titel: 'Sluitingsdagen', uitleg: 'Feestdagen, sluitingen en andere openingstijden; het rooster houdt er rekening mee.', groep: 'locaties', pad: '/beheer/sluiting', sleutel: 'sluiting', trefwoorden: 'feestdag kerst dicht' },
  { id: 'zalen', titel: 'Zalen', uitleg: 'De ruimtes voor groepslessen en hoeveel mensen erin passen.', groep: 'locaties', pad: '/instellingen/zalen', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'ruimte capaciteit studio' },
  // Team en rechten
  { id: 'medewerkers', titel: 'Medewerkers', uitleg: 'Wie er werkt, in welke rol, op welke vestiging, en hun inloglink.', groep: 'team', pad: '/instellingen/medewerkers', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'personeel trainer instructeur team inloggen' },
  { id: 'rechten', titel: 'Rechten per rol', uitleg: 'Welke onderdelen trainers, instructeurs, clubmanagers en de administratie zien.', groep: 'team', pad: '/beheer/rechten', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'toegang rollen autorisatie' },
  { id: 'beheerders', titel: 'Beheerders', uitleg: 'Eigenaren en clubmanagers met een eigen inlog voor deze sportschool.', groep: 'team', pad: '/huisstijl#beheerders-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'eigenaar clubmanager inloggen pincode' },
  // Planning
  { id: 'lestypen', titel: 'Lestypen', uitleg: 'De groepslessen die je geeft, voor alle vestigingen.', groep: 'planning', pad: '/instellingen/lestypen', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'groepsles les soorten' },
  { id: 'weekrooster', titel: 'Weekrooster', uitleg: 'De vaste lessen per week; daaruit maak je de echte lessen aan.', groep: 'planning', pad: '/instellingen/weekrooster', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'lesrooster vaste lessen' },
  { id: 'afspraaktypen', titel: 'Afspraaktypen', uitleg: 'Soorten afspraken, duur, buffer en boekregels voor de app.', groep: 'planning', pad: '/afspraken?tab=typen', sleutel: 'afspraken', module: 'afspraken', snelkoppeling: true, trefwoorden: 'intake personal training meting' },
  // Coaching
  { id: 'intake', titel: 'Intakeformulier', uitleg: 'De vragen bij een intake: eigen vragen, secties, volgorde en wat aan staat.', groep: 'coaching', pad: '/beheer/intake', sleutel: 'beheer', module: 'training', trefwoorden: 'vragenlijst intakevragen' },
  { id: 'oefeningen', titel: 'Oefeningen en coaching', uitleg: 'Je bibliotheek met beelden, eigen oefeningen en je eigen coachteksten.', groep: 'coaching', pad: '/training?tab=oefeningen', sleutel: 'schemas', perVestiging: true, module: 'training', snelkoppeling: true, trefwoorden: 'oefenbibliotheek coachpunten' },
  // Leden en app
  { id: 'lidmaatschappen', titel: 'Lidmaatschappen en labels', uitleg: 'Vormen zoals in Sportivity, met vestigingen, groepslessen en daluren, en de labels voor leden.', groep: 'leden', pad: '/beheer/lidmaatschappen', sleutel: 'lidmaatschappen', trefwoorden: 'abonnementsvorm label dal' },
  { id: 'importeren', titel: 'Ledenbestand inlezen', uitleg: 'Een export uit Sportivity of Excel inlezen.', groep: 'leden', pad: '/leden/importeren', sleutel: 'leden', perVestiging: true, module: 'leden', snelkoppeling: true, trefwoorden: 'import csv excel sportivity' },
  { id: 'checkin', titel: 'Check-in', uitleg: 'Hoe leden inchecken: QR-code in de app, zoeken aan de balie, of allebei.', groep: 'leden', pad: '/beheer/checkin', sleutel: 'beheer', module: 'checkin', trefwoorden: 'qr balie inchecken' },
  { id: 'ledenapp', titel: 'Ledenapp', uitleg: 'Welkomsttekst, welke tabbladen aan staan en de check-in code in de app.', groep: 'leden', pad: '/beheer/ledenapp', sleutel: 'beheer', module: 'app', trefwoorden: 'app tabbladen welkom' },
  { id: 'widget', titel: 'Boekingswidget', uitleg: 'Je lesrooster en proeflesaanvragen op je eigen website.', groep: 'leden', pad: '/beheer/widget', sleutel: 'beheer', perVestiging: true, module: 'rooster', alleenEigenaar: true, trefwoorden: 'website rooster proefles inbedden iframe embed kennismaking' },
  { id: 'ledenapp-bekijken', titel: 'Ledenapp bekijken', uitleg: 'Zo ziet een lid de app op zijn telefoon.', groep: 'leden', pad: '/app', sleutel: 'app', perVestiging: true, module: 'app', trefwoorden: 'voorvertoning voorbeeld telefoon' },
  // Communicatie
  { id: 'meldingen', titel: 'Meldingen aan leden', uitleg: 'Bevestigingen, herinneringen en annuleringen van lessen en afspraken, per mail en in de app.', groep: 'communicatie', pad: '/beheer/meldingen', sleutel: 'beheer', trefwoorden: 'herinnering mail push bevestiging' },
  { id: 'opvolgregels', titel: 'Opvolgregels', uitleg: 'Wie Club op de opvolglijst zet: nieuwe leden, proefleden, wegblijvers, verjaardagen, opzeggingen en mijlpalen.', groep: 'communicatie', pad: '/beheer/automatiseringen', sleutel: 'beheer', trefwoorden: 'automatiseringen opvolgen regels' },
  // Betalen en abonnement
  { id: 'betalen', titel: 'Betalen in de ledenapp', uitleg: 'Losse lessen, strippenkaarten, PT-pakketten en producten verkopen via Stripe.', groep: 'betalen', pad: '/beheer/betalen', sleutel: 'beheer', alleenEigenaar: true, betalen: true, trefwoorden: 'stripe strippenkaart producten kopen' },
  { id: 'abonnement', titel: 'Abonnement en facturen', uitleg: 'Je pakket, betalingen en facturen van AI Your Gym.', groep: 'betalen', pad: '/beheer/abonnement', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'pakket factuur' },
]

export type InstelId = string

/** Wie kijkt: de rechten (null = alles, Kane of de eigenaar) en wat aan staat. */
export interface InstelKijker {
  uit: readonly Module[]
  toegestaan: readonly string[] | null
  medewerker: boolean
  betalenAan: boolean
}

/** Mag deze persoon de pagina zien (los van het onderdeel dat uit staat)? */
export function magInstelPagina(p: InstelPagina, k: Omit<InstelKijker, 'uit'>): boolean {
  if (p.betalen && !k.betalenAan) return false
  if (p.nietVoorMedewerker && k.medewerker) return false
  if (k.toegestaan === null) return true
  if (p.alleenEigenaar) return false
  return k.toegestaan.includes(p.sleutel)
}

/** De pagina's die deze persoon ziet en die aan staan, in vaste volgorde. */
export function zichtbareInstelPaginas(k: InstelKijker): InstelPagina[] {
  return INSTEL_PAGINAS.filter((p) => magInstelPagina(p, k) && !(p.module && k.uit.includes(p.module)))
}

/** Heeft deze persoon iets in het instellingencentrum te zoeken? Dan staat Instellingen in het menu. */
export function heeftInstellingen(k: InstelKijker): boolean {
  return zichtbareInstelPaginas(k).some((p) => !p.snelkoppeling)
}

export function instelPagina(id: InstelId): InstelPagina | undefined {
  return INSTEL_PAGINAS.find((p) => p.id === id)
}

export function instelGroepLabel(groep: InstelGroep): string {
  return INSTEL_GROEPEN.find((g) => g.sleutel === groep)?.label ?? ''
}

/** Het pad zonder ?zoek en #anker. */
export function kaalInstelPad(pad: string): string {
  return pad.split(/[?#]/)[0]
}

/** De link naar een instel-pagina, met de vestiging erbij als die per vestiging werkt. */
export function instelHref(p: Pick<InstelPagina, 'pad' | 'perVestiging'>, vestiging: string | null): string {
  const [voor, anker] = p.pad.split('#')
  const basis = `/club${voor}`
  if (!p.perVestiging || !vestiging) return anker ? `${basis}#${anker}` : basis
  const sep = basis.includes('?') ? '&' : '?'
  return `${basis}${sep}v=${encodeURIComponent(vestiging)}${anker ? `#${anker}` : ''}`
}
