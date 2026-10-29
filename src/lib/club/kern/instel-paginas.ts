// ─── Club: alle instel-pagina's op een plek (PUUR) ──────────────────────────
// Besluit Kane (18-10-2026): uitgebreid maar zo simpel mogelijk. Het menu is
// voor dagelijks werk; alles wat je instelt staat alleen in het
// instellingencentrum (/club/beheer), elk ding met een naam en een plek.
// Deze lijst stuurt het instellingencentrum, het kruimelpad op elke
// instel-pagina en het zoekveld in de balk. Wie een pagina mag zien volgt de
// rechten (sleutel = onderdeel uit ONDERDEEL_SLEUTELS); een test bewaakt dat
// elk pad bestaat en bij dat onderdeel hoort. De voorvertoning van de ledenapp
// staat niet hier maar onderaan in de hulpbalk (src/components/club/shell/hulpbalk.ts).

import type { Module } from './organisatie'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { INSTEL_TEKST } from '@/lib/aiyourgym/taal/woorden/club/instel-paginas'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld via
// instelPaginaInTaal() en instelGroepLabel(groep, taal).
const IG = INSTEL_TEKST.nl.groepen
const P = INSTEL_TEKST.nl.paginas

export const INSTEL_GROEPEN = [
  { sleutel: 'sportschool', label: IG.sportschool },
  { sleutel: 'locaties', label: IG.locaties },
  { sleutel: 'team', label: IG.team },
  { sleutel: 'planning', label: IG.planning },
  { sleutel: 'coaching', label: IG.coaching },
  { sleutel: 'leden', label: IG.leden },
  { sleutel: 'communicatie', label: IG.communicatie },
  { sleutel: 'betalen', label: IG.betalen },
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
  /** Alleen als lidgeld beschikbaar is (CLUB_LIDGELD_ACTIEF). */
  lidgeld?: boolean
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
  { id: 'start', titel: P.start.titel, uitleg: P.start.uitleg, groep: 'sportschool', pad: '/start', sleutel: 'start', alleenEigenaar: true, trefwoorden: 'inrichten beginnen nieuw' },
  { id: 'huisstijl', titel: P.huisstijl.titel, uitleg: P.huisstijl.uitleg, groep: 'sportschool', pad: '/huisstijl', sleutel: 'huisstijl', trefwoorden: 'logo kleur thema naam slogan' },
  { id: 'onderdelen', titel: P.onderdelen.titel, uitleg: P.onderdelen.uitleg, groep: 'sportschool', pad: '/huisstijl#modules-kop', sleutel: 'huisstijl', trefwoorden: 'modules uitzetten' },
  { id: 'adres', titel: P.adres.titel, uitleg: P.adres.uitleg, groep: 'sportschool', pad: '/huisstijl#adres-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'subdomein domein url' },
  { id: 'bedrijf', titel: P.bedrijf.titel, uitleg: P.bedrijf.uitleg, groep: 'sportschool', pad: '/beheer/bedrijf', sleutel: 'bedrijf', trefwoorden: 'kvk btw voorwaarden privacy' },
  { id: 'privacy', titel: P.privacy.titel, uitleg: P.privacy.uitleg, groep: 'sportschool', pad: '/beheer/privacy', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'avg gdpr bewaartermijn verwijderen anonimiseren' },
  // Locaties
  { id: 'vestigingen', titel: P.vestigingen.titel, uitleg: P.vestigingen.uitleg, groep: 'locaties', pad: '/instellingen/vestigingen', sleutel: 'instellingen', nietVoorMedewerker: true, trefwoorden: 'locatie club adres telefoon' },
  { id: 'regels', titel: P.regels.titel, uitleg: P.regels.uitleg, groep: 'locaties', pad: '/instellingen/regels', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'annuleren no-show open dicht' },
  { id: 'sluiting', titel: P.sluiting.titel, uitleg: P.sluiting.uitleg, groep: 'locaties', pad: '/beheer/sluiting', sleutel: 'sluiting', trefwoorden: 'feestdag kerst dicht' },
  { id: 'zalen', titel: P.zalen.titel, uitleg: P.zalen.uitleg, groep: 'locaties', pad: '/instellingen/zalen', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'ruimte capaciteit studio' },
  // Team en rechten
  { id: 'medewerkers', titel: P.medewerkers.titel, uitleg: P.medewerkers.uitleg, groep: 'team', pad: '/instellingen/medewerkers', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'personeel trainer instructeur team inloggen uitnodigen wachtwoord' },
  { id: 'rechten', titel: P.rechten.titel, uitleg: P.rechten.uitleg, groep: 'team', pad: '/beheer/rechten', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'toegang rollen autorisatie' },
  { id: 'beheerders', titel: P.beheerders.titel, uitleg: P.beheerders.uitleg, groep: 'team', pad: '/huisstijl#beheerders-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'eigenaar clubmanager inloggen uitnodigen wachtwoord' },
  // Planning
  { id: 'lestypen', titel: P.lestypen.titel, uitleg: P.lestypen.uitleg, groep: 'planning', pad: '/instellingen/lestypen', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'groepsles les soorten' },
  { id: 'weekrooster', titel: P.weekrooster.titel, uitleg: P.weekrooster.uitleg, groep: 'planning', pad: '/instellingen/weekrooster', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'lesrooster vaste lessen' },
  { id: 'afspraaktypen', titel: P.afspraaktypen.titel, uitleg: P.afspraaktypen.uitleg, groep: 'planning', pad: '/afspraken?tab=typen', sleutel: 'afspraken', module: 'afspraken', snelkoppeling: true, trefwoorden: 'intake personal training meting' },
  // Coaching
  { id: 'intake', titel: P.intake.titel, uitleg: P.intake.uitleg, groep: 'coaching', pad: '/beheer/intake', sleutel: 'beheer', module: 'training', trefwoorden: 'vragenlijst intakevragen' },
  { id: 'oefeningen', titel: P.oefeningen.titel, uitleg: P.oefeningen.uitleg, groep: 'coaching', pad: '/training?tab=oefeningen', sleutel: 'schemas', perVestiging: true, module: 'training', snelkoppeling: true, trefwoorden: 'oefenbibliotheek coachpunten' },
  // Leden en app
  { id: 'lidmaatschappen', titel: P.lidmaatschappen.titel, uitleg: P.lidmaatschappen.uitleg, groep: 'leden', pad: '/beheer/lidmaatschappen', sleutel: 'lidmaatschappen', trefwoorden: 'abonnementsvorm label dal' },
  { id: 'importeren', titel: P.importeren.titel, uitleg: P.importeren.uitleg, groep: 'leden', pad: '/leden/importeren', sleutel: 'leden', perVestiging: true, module: 'leden', snelkoppeling: true, trefwoorden: 'import csv excel sportivity virtuagym overstappen' },
  { id: 'checkin', titel: P.checkin.titel, uitleg: P.checkin.uitleg, groep: 'leden', pad: '/beheer/checkin', sleutel: 'beheer', module: 'checkin', trefwoorden: 'qr balie inchecken' },
  { id: 'ledenapp', titel: P.ledenapp.titel, uitleg: P.ledenapp.uitleg, groep: 'leden', pad: '/beheer/ledenapp', sleutel: 'beheer', module: 'app', trefwoorden: 'app tabbladen welkom' },
  { id: 'widget', titel: P.widget.titel, uitleg: P.widget.uitleg, groep: 'leden', pad: '/beheer/widget', sleutel: 'beheer', perVestiging: true, module: 'rooster', alleenEigenaar: true, trefwoorden: 'website rooster proefles inbedden iframe embed kennismaking' },
  // Communicatie
  { id: 'meldingen', titel: P.meldingen.titel, uitleg: P.meldingen.uitleg, groep: 'communicatie', pad: '/beheer/meldingen', sleutel: 'beheer', trefwoorden: 'herinnering mail push bevestiging' },
  { id: 'opvolgregels', titel: P.opvolgregels.titel, uitleg: P.opvolgregels.uitleg, groep: 'communicatie', pad: '/beheer/automatiseringen', sleutel: 'beheer', trefwoorden: 'automatiseringen opvolgen regels' },
  // Betalen en abonnement
  { id: 'betalen', titel: P.betalen.titel, uitleg: P.betalen.uitleg, groep: 'betalen', pad: '/beheer/betalen', sleutel: 'beheer', alleenEigenaar: true, betalen: true, trefwoorden: 'stripe strippenkaart producten kopen' },
  { id: 'kortingen', titel: P.kortingen.titel, uitleg: P.kortingen.uitleg, groep: 'betalen', pad: '/beheer/lidmaatschappen/kortingen', sleutel: 'lidmaatschappen', lidgeld: true, trefwoorden: 'korting actie code gezin gezinskorting procent' },
  { id: 'abonnement', titel: P.abonnement.titel, uitleg: P.abonnement.uitleg, groep: 'betalen', pad: '/beheer/abonnement', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'pakket factuur' },
]

export type InstelId = string

/** Wie kijkt: de rechten (null = alles, Kane of de eigenaar) en wat aan staat. */
export interface InstelKijker {
  uit: readonly Module[]
  toegestaan: readonly string[] | null
  medewerker: boolean
  betalenAan: boolean
  /** Staat lidgeld aan (CLUB_LIDGELD_ACTIEF)? Ontbreekt = uit. */
  lidgeldAan?: boolean
}

/** Mag deze persoon de pagina zien (los van het onderdeel dat uit staat)? */
export function magInstelPagina(p: InstelPagina, k: Omit<InstelKijker, 'uit'>): boolean {
  if (p.betalen && !k.betalenAan) return false
  if (p.lidgeld && !k.lidgeldAan) return false
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

export function instelGroepLabel(groep: InstelGroep, taal: Taal = 'nl'): string {
  return INSTEL_TEKST[taal].groepen[groep] ?? ''
}

/** Een instel-pagina met titel en uitleg in de gekozen taal. */
export function instelPaginaInTaal<T extends Pick<InstelPagina, 'id' | 'titel' | 'uitleg'>>(p: T, taal: Taal): T {
  const t = INSTEL_TEKST[taal].paginas[p.id as keyof typeof P]
  return t ? { ...p, titel: t.titel, uitleg: t.uitleg } : p
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

/** De titel van een instel-pagina in de gekozen taal (voor metadata en koppen). */
export function instelTitel(id: InstelId, taal: Taal = 'nl'): string {
  const p = instelPagina(id)
  return p ? instelPaginaInTaal(p, taal).titel : ''
}
