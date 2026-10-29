// ─── Club: alle instel-pagina's op een plek (PUUR) ──────────────────────────
// Besluit Kane (18-10-2026): uitgebreid maar zo simpel mogelijk. Het menu is
// voor dagelijks werk; alles wat je instelt staat alleen in het
// instellingencentrum (/club/beheer), elk ding met een naam en een plek.
// Besluit Kane (29-10-2026, "dit moet overzichtelijker"): het centrum toont acht
// categorieen (links op de pc, eerst de lijst op de telefoon) en per categorie
// een paar regels. Wat bij een andere pagina hoort staat er als kleine link
// onder (onder), de startwizard is een losse link (losseLink).
// Deze lijst stuurt het instellingencentrum, het kruimelpad op elke
// instel-pagina en het zoekveld in de balk. Wie een pagina mag zien volgt de
// rechten (sleutel = onderdeel uit ONDERDEEL_SLEUTELS); een test bewaakt dat
// elk pad bestaat en bij dat onderdeel hoort. Wat een sportschool niet afneemt
// of uit heeft gezet (module) staat er niet. De voorvertoning van de ledenapp
// staat niet hier maar onderaan in de hulpbalk (src/components/club/shell/hulpbalk.ts).

import type { Module } from './organisatie'
import { pakketZichtbaar, zichtbaar, type PakketSleutel, type Verborgen } from './pakketten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { INSTEL_TEKST } from '@/lib/aiyourgym/taal/woorden/club/instel-paginas'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld via
// instelPaginaInTaal() en instelGroepLabel(groep, taal).
const IG = INSTEL_TEKST.nl.groepen
const P = INSTEL_TEKST.nl.paginas

export const INSTEL_GROEPEN = [
  { sleutel: 'merk', label: IG.merk },
  { sleutel: 'vestigingen', label: IG.vestigingen },
  { sleutel: 'team', label: IG.team },
  { sleutel: 'groepslessen', label: IG.groepslessen },
  { sleutel: 'coaching', label: IG.coaching },
  { sleutel: 'leden', label: IG.leden },
  { sleutel: 'communicatie', label: IG.communicatie },
  { sleutel: 'bedrijf', label: IG.bedrijf },
] as const

export type InstelGroep = (typeof INSTEL_GROEPEN)[number]['sleutel']

export type InstelId = string

export interface InstelPagina {
  id: InstelId
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
  /**
   * Het pakket waar deze pagina bij hoort, als de sleutel dat niet al zegt
   * (zie kern/pakketten.ts); niet afgenomen = de pagina is er niet.
   */
  pakket?: PakketSleutel
  /**
   * Staat in het centrum als kleine link onder deze pagina (zelfde categorie),
   * niet als eigen regel. Mag iemand de hoofdpagina niet zien, dan wordt hij
   * gewoon een eigen regel.
   */
  onder?: InstelId
  /** Een tweede plek die bij deze regel hoort (Abonnement bij Pakketten), als kleine link en alleen als iemand hem mag zien. */
  ookNaar?: InstelId
  /** Geen regel in een categorie maar een losse link bovenaan (de startwizard). */
  losseLink?: boolean
}

export const INSTEL_PAGINAS: readonly InstelPagina[] = [
  // Losse link: de startwizard (hoort bij Merk en adres voor het kruimelpad en zoeken).
  { id: 'start', titel: P.start.titel, uitleg: P.start.uitleg, groep: 'merk', pad: '/start', sleutel: 'start', alleenEigenaar: true, losseLink: true, trefwoorden: 'inrichten beginnen nieuw wizard' },
  // Merk en adres
  { id: 'huisstijl', titel: P.huisstijl.titel, uitleg: P.huisstijl.uitleg, groep: 'merk', pad: '/huisstijl', sleutel: 'huisstijl', trefwoorden: 'logo kleur thema naam bedrijfsnaam sportschool sportschoolnaam slogan merk' },
  { id: 'adres', titel: P.adres.titel, uitleg: P.adres.uitleg, groep: 'merk', pad: '/huisstijl#adres-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'adres subdomein domein url' },
  // Vestigingen en openingstijden
  { id: 'vestigingen', titel: P.vestigingen.titel, uitleg: P.vestigingen.uitleg, groep: 'vestigingen', pad: '/instellingen/vestigingen', sleutel: 'instellingen', nietVoorMedewerker: true, trefwoorden: 'locatie club adres telefoon' },
  { id: 'regels', titel: P.regels.titel, uitleg: P.regels.uitleg, groep: 'vestigingen', pad: '/instellingen/regels', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'annuleren no-show open dicht' },
  { id: 'sluiting', titel: P.sluiting.titel, uitleg: P.sluiting.uitleg, groep: 'vestigingen', pad: '/beheer/sluiting', sleutel: 'sluiting', onder: 'regels', trefwoorden: 'feestdag kerst dicht' },
  // Team en rechten
  { id: 'medewerkers', titel: P.medewerkers.titel, uitleg: P.medewerkers.uitleg, groep: 'team', pad: '/instellingen/medewerkers', sleutel: 'instellingen', perVestiging: true, trefwoorden: 'personeel trainer instructeur team inloggen uitnodigen wachtwoord' },
  { id: 'beheerders', titel: P.beheerders.titel, uitleg: P.beheerders.uitleg, groep: 'team', pad: '/huisstijl#beheerders-kop', sleutel: 'huisstijl', alleenEigenaar: true, trefwoorden: 'eigenaar clubmanager inloggen uitnodigen wachtwoord' },
  { id: 'rechten', titel: P.rechten.titel, uitleg: P.rechten.uitleg, groep: 'team', pad: '/beheer/rechten', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'toegang rollen autorisatie' },
  // Groepslessen (zalen horen bij het rooster: staat dat uit, dan zijn ze er ook niet)
  { id: 'lestypen', titel: P.lestypen.titel, uitleg: P.lestypen.uitleg, groep: 'groepslessen', pad: '/instellingen/lestypen', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'groepsles les soorten' },
  { id: 'weekrooster', titel: P.weekrooster.titel, uitleg: P.weekrooster.uitleg, groep: 'groepslessen', pad: '/instellingen/weekrooster', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'lesrooster vaste lessen' },
  { id: 'zalen', titel: P.zalen.titel, uitleg: P.zalen.uitleg, groep: 'groepslessen', pad: '/instellingen/zalen', sleutel: 'instellingen', perVestiging: true, module: 'rooster', trefwoorden: 'ruimte capaciteit studio' },
  // Coaching
  { id: 'intake', titel: P.intake.titel, uitleg: P.intake.uitleg, groep: 'coaching', pad: '/beheer/intake', sleutel: 'beheer', module: 'training', pakket: 'training', trefwoorden: 'vragenlijst intakevragen' },
  { id: 'oefeningen', titel: P.oefeningen.titel, uitleg: P.oefeningen.uitleg, groep: 'coaching', pad: '/training?tab=oefeningen', sleutel: 'schemas', perVestiging: true, module: 'training', snelkoppeling: true, trefwoorden: 'oefenbibliotheek coachpunten' },
  { id: 'afspraaktypen', titel: P.afspraaktypen.titel, uitleg: P.afspraaktypen.uitleg, groep: 'coaching', pad: '/afspraken?tab=typen', sleutel: 'afspraken', module: 'afspraken', snelkoppeling: true, trefwoorden: 'intake personal training meting buffer' },
  // Leden en app
  { id: 'lidmaatschappen', titel: P.lidmaatschappen.titel, uitleg: P.lidmaatschappen.uitleg, groep: 'leden', pad: '/beheer/lidmaatschappen', sleutel: 'lidmaatschappen', trefwoorden: 'abonnementsvorm label dal' },
  { id: 'kortingen', titel: P.kortingen.titel, uitleg: P.kortingen.uitleg, groep: 'leden', pad: '/beheer/lidmaatschappen/kortingen', sleutel: 'lidmaatschappen', lidgeld: true, onder: 'lidmaatschappen', trefwoorden: 'korting actie code gezin gezinskorting procent' },
  { id: 'importeren', titel: P.importeren.titel, uitleg: P.importeren.uitleg, groep: 'leden', pad: '/leden/importeren', sleutel: 'leden', perVestiging: true, module: 'leden', snelkoppeling: true, trefwoorden: 'import csv excel sportivity virtuagym overstappen' },
  { id: 'checkin', titel: P.checkin.titel, uitleg: P.checkin.uitleg, groep: 'leden', pad: '/beheer/checkin', sleutel: 'beheer', module: 'checkin', trefwoorden: 'qr balie inchecken' },
  { id: 'ledenapp', titel: P.ledenapp.titel, uitleg: P.ledenapp.uitleg, groep: 'leden', pad: '/beheer/ledenapp', sleutel: 'beheer', module: 'app', trefwoorden: 'app tabbladen welkom' },
  { id: 'widget', titel: P.widget.titel, uitleg: P.widget.uitleg, groep: 'leden', pad: '/beheer/widget', sleutel: 'beheer', perVestiging: true, module: 'rooster', alleenEigenaar: true, trefwoorden: 'website rooster proefles inbedden iframe embed kennismaking' },
  // Communicatie
  { id: 'meldingen', titel: P.meldingen.titel, uitleg: P.meldingen.uitleg, groep: 'communicatie', pad: '/beheer/meldingen', sleutel: 'beheer', trefwoorden: 'herinnering mail push bevestiging annulering' },
  { id: 'opvolgregels', titel: P.opvolgregels.titel, uitleg: P.opvolgregels.uitleg, groep: 'communicatie', pad: '/beheer/automatiseringen', sleutel: 'beheer', pakket: 'groei', trefwoorden: 'automatiseringen opvolgen regels' },
  // Bedrijf en abonnement
  { id: 'bedrijf', titel: P.bedrijf.titel, uitleg: P.bedrijf.uitleg, groep: 'bedrijf', pad: '/beheer/bedrijf', sleutel: 'bedrijf', trefwoorden: 'kvk btw voorwaarden privacy hoofdkantoor social' },
  { id: 'privacy', titel: P.privacy.titel, uitleg: P.privacy.uitleg, groep: 'bedrijf', pad: '/beheer/privacy', sleutel: 'beheer', alleenEigenaar: true, onder: 'bedrijf', trefwoorden: 'avg gdpr bewaartermijn verwijderen anonimiseren' },
  { id: 'onderdelen', titel: P.onderdelen.titel, uitleg: P.onderdelen.uitleg, groep: 'bedrijf', pad: '/huisstijl#modules-kop', sleutel: 'huisstijl', ookNaar: 'abonnement', trefwoorden: 'modules onderdelen aan uit uitzetten aanzetten pakket' },
  { id: 'betalen', titel: P.betalen.titel, uitleg: P.betalen.uitleg, groep: 'bedrijf', pad: '/beheer/betalen', sleutel: 'beheer', alleenEigenaar: true, betalen: true, trefwoorden: 'stripe strippenkaart producten kopen' },
  { id: 'abonnement', titel: P.abonnement.titel, uitleg: P.abonnement.uitleg, groep: 'bedrijf', pad: '/beheer/abonnement', sleutel: 'beheer', alleenEigenaar: true, trefwoorden: 'pakket pakketten factuur' },
]

/** Wie kijkt: de rechten (null = alles, Kane of de eigenaar) en wat aan staat. */
export interface InstelKijker {
  /** Wat er niet is: modules die uit staan en pakketten die niet zijn afgenomen (organisatie.uit). */
  uit: readonly Verborgen[]
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

/**
 * Staat het onderdeel van deze pagina aan en is het pakket afgenomen? `uit`
 * bevat beide (kern/pakketten.ts): de eigen keuze en wat niet is afgenomen.
 */
export function instelModuleAan(p: Pick<InstelPagina, 'module'> & { sleutel?: string; pakket?: PakketSleutel }, uit: readonly Verborgen[]): boolean {
  if (p.pakket && !pakketZichtbaar(uit, p.pakket)) return false
  return zichtbaar(uit, { sleutel: p.sleutel, module: p.module })
}

/** De pagina's die deze persoon ziet en die aan staan, in vaste volgorde. */
export function zichtbareInstelPaginas(k: InstelKijker): InstelPagina[] {
  return INSTEL_PAGINAS.filter((p) => magInstelPagina(p, k) && instelModuleAan(p, k.uit))
}

/** Heeft deze persoon iets in het instellingencentrum te zoeken? Dan staat Instellingen in het menu. */
export function heeftInstellingen(k: InstelKijker): boolean {
  return zichtbareInstelPaginas(k).some((p) => !p.snelkoppeling)
}

export function instelPagina(id: InstelId): InstelPagina | undefined {
  return INSTEL_PAGINAS.find((p) => p.id === id)
}

// ── De indeling van het centrum ──────────────────────────────────────────────

/** Een regel in een categorie, met de kleine links eronder. */
export interface InstelRij {
  pagina: InstelPagina
  /** Pagina's die onder deze regel staan (onder) en de tweede plek (ookNaar). */
  links: InstelPagina[]
}

export interface InstelCategorie {
  sleutel: InstelGroep
  rijen: InstelRij[]
}

/** Is dit een bestaande categorie (bijvoorbeeld uit ?categorie=)? */
export function isInstelGroep(x: unknown): x is InstelGroep {
  return typeof x === 'string' && INSTEL_GROEPEN.some((g) => g.sleutel === x)
}

/**
 * Wat deze persoon in het centrum ziet: per categorie de regels, met de kleine
 * links eronder. Lege categorieen vallen weg; de startwizard (losseLink) staat
 * er niet in.
 */
export function instelIndeling(k: InstelKijker): InstelCategorie[] {
  const zichtbaar = zichtbareInstelPaginas(k)
  const ziet = new Map(zichtbaar.map((p) => [p.id, p]))
  const isLink = (p: InstelPagina) => Boolean(p.onder && ziet.get(p.onder)?.groep === p.groep)
  return INSTEL_GROEPEN.map((g) => ({
    sleutel: g.sleutel,
    rijen: zichtbaar
      .filter((p) => p.groep === g.sleutel && !p.losseLink && !isLink(p))
      .map((pagina) => {
        const onder = zichtbaar.filter((p) => p.onder === pagina.id && isLink(p))
        const ook = pagina.ookNaar ? ziet.get(pagina.ookNaar) : undefined
        return { pagina, links: ook ? [...onder, ook] : onder }
      }),
  })).filter((c) => c.rijen.length > 0)
}

// ── Teksten en links ─────────────────────────────────────────────────────────

export function instelGroepLabel(groep: InstelGroep, taal: Taal = 'nl'): string {
  return INSTEL_TEKST[taal].groepen[groep] ?? ''
}

export function instelGroepUitleg(groep: InstelGroep, taal: Taal = 'nl'): string {
  return INSTEL_TEKST[taal].groepUitleg[groep] ?? ''
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

/** Het pad (binnen /club) van een categorie in het centrum. */
export function instelCategoriePad(groep: InstelGroep): string {
  return `/beheer?categorie=${groep}`
}

/** De link naar een categorie in het centrum, met de gekozen vestiging erbij. */
export function instelCategorieHref(groep: InstelGroep, vestiging: string | null): string {
  return instelHref({ pad: instelCategoriePad(groep), perVestiging: true }, vestiging)
}

/** De titel van een instel-pagina in de gekozen taal (voor metadata en koppen). */
export function instelTitel(id: InstelId, taal: Taal = 'nl'): string {
  const p = instelPagina(id)
  return p ? instelPaginaInTaal(p, taal).titel : ''
}
