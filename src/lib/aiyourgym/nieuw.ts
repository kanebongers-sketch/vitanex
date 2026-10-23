// ─── AI Your Gym: wat er nieuw is (PUUR, gedeeld) ───────────────────────────
// Per maand wat er echt is bijgekomen en nu werkt voor elke sportschool. Een
// bron voor twee plekken: de pagina Wat er nieuw is op de website
// (src/components/aiyourgym/inhoud/nieuw.ts zet dit door) en Wat is nieuw
// onderaan Club (/club/nieuw, met een teller van wat je nog niet zag).
// Bron: de git-geschiedenis van src/app/(aiyourgym), src/lib/club,
// src/components/club en src/components/aiyourgym, vertaald naar gewone taal.
// Regels:
// - Alleen wat live is. Niet wat achter een schakelaar uit staat (eigen
//   subdomeinen, boekingswidget), niet wat alleen voor Kane is (notities,
//   prototypes zoals de 3D-oefenbeelden in de bibliotheek) en niet wat nog niet
//   gekoppeld is (online betalen via Stripe).
// - Nooit een belofte met een datum in de toekomst.
// - Geen namen van andere systemen of bedrijven.
// Nieuw werk komt bovenaan de eigen maand; een nieuwe maand bovenaan de lijst.

/** De hoofdstukken van de website (gelijk aan HoofdstukSleutel in inhoud/functies.ts; een test bewaakt dat). */
export type NieuwHoofdstuk = 'beheer' | 'coaching' | 'planning' | 'groei' | 'betrokkenheid'

export interface NieuwPunt {
  /** Datum waarop het live ging, als jjjj-mm-dd. */
  datum: string
  titel: string
  tekst: string
  hoofdstuk: NieuwHoofdstuk
}

export interface NieuwMaand {
  /** jjjj-mm */
  maand: string
  /** Een korte zin over de maand. */
  samenvatting: string
  punten: readonly NieuwPunt[]
}

export const NIEUW: readonly NieuwMaand[] = [
  {
    maand: '2026-10',
    samenvatting: 'De eerste maand: van een lege map tot software waarmee een sportschool de hele dag draait.',
    punten: [
      {
        datum: '2026-10-23',
        titel: 'De hulpbalk onderaan Club',
        tekst: 'Instellingen, Koppelingen, Ledenapp, Wat is nieuw en Hulp staan onderaan elke pagina, op de telefoon onder Meer. Bij Koppelingen zie je per koppeling of hij werkt, bij Wat is nieuw hoeveel updates je nog niet zag.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Club over de volle breedte',
        tekst: 'Club gebruikt je hele scherm. Onder de vijf groepen staat het submenu van de groep waar je bent, met het onderdeel waar je nu bent duidelijk gevuld.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'De startwizard richt alles echt in',
        tekst: 'Elke stap stelt zijn deel meteen in, zonder heen en weer naar andere pagina’s: lestypen en je vaste week met zaal en instructeur, je team en je ledenbestand. Een stap telt pas als af als het er echt staat, en de rest van Club gaat open zodra de wizard klaar is.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Je team uitnodigen vanuit de wizard',
        tekst: 'In de stap Team nodig je elke medewerker meteen uit. Club mailt een link om een wachtwoord te kiezen, en de link staat ook in beeld om zelf door te sturen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Ledenbestand inlezen als spreadsheet',
        tekst: 'Naast CSV lees je nu ook een .xlsx-bestand in, direct in de wizard of later bij Leden. Je ziet eerst wat er verandert voordat iets wordt opgeslagen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Live, met een lijstje voor je eerste dag',
        tekst: 'Pas als alles echt staat, zegt de wizard dat je sportschool live staat. Daarna drie dingen voor dag een: de poster met QR-code printen, je leden uitnodigen voor de app en inchecken aan de balie.',
        hoofdstuk: 'betrokkenheid',
      },
      {
        datum: '2026-10-23',
        titel: 'Aanmelden en meteen beginnen',
        tekst: 'Na het aanmelden staat je omgeving direct klaar en ben je meteen ingelogd. Zolang online betalen nog niet gekoppeld is, wordt er niets afgeschreven. Tot wanneer je proefperiode loopt, zie je in Club.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Een eigen adres voor je sportschool',
        tekst: 'Elke sportschool heeft een eigen adres, zoals aiyourgym.com/jouwgym. Daar loggen je team en je leden in.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'Inloggen met e-mailadres en wachtwoord',
        tekst: 'Eigenaar, clubmanager, medewerkers en leden loggen allemaal in met hun e-mailadres en een sterk wachtwoord. Een link is er alleen nog om de eerste keer een wachtwoord te kiezen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-23',
        titel: 'De startwizard denkt mee',
        tekst: 'De wizard laat zien hoeveel minuten je nog bezig bent, gaat verder waar je was gebleven en laat je een streefdatum kiezen om live te gaan. Bij elke stap staat hulp in gewone taal.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'AVG voor leads en medewerkers',
        tekst: 'Naast leden hebben nu ook leads en medewerkers inzage en wissen. Bewaartermijnen stel je per sportschool in, het opruimen gaat vanzelf.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'Startwizard in acht stappen',
        tekst: 'Kies je soort sportschool en de wizard zet onderdelen, lestypen, openingstijden en rechten alvast klaar. Jij zegt per stap of het klopt.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-20',
        titel: 'Makkelijker voor de trainer op de vloer',
        tekst: 'Een strakker menu met zoeken via Ctrl K, en een ledenapp die beter werkt op de telefoon.',
        hoofdstuk: 'betrokkenheid',
      },
      {
        datum: '2026-10-18',
        titel: 'Een schema-editor voor coaches',
        tekst: 'Supersets en circuits, per oefening sets, herhalingen of tijd, gewicht, RPE of RIR, rust en tempo. Slepen, ongedaan maken en een schema kopieren naar een ander lid.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-18',
        titel: 'Leden loggen per set',
        tekst: 'Leden vullen in de app per set in wat ze deden. De trainer ziet de voortgang per oefening en een vaste regel voor wanneer het zwaarder kan.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-18',
        titel: 'Inchecken met de telefoon',
        tekst: 'Leden checken in met de QR-code in hun ledenapp. De balie ziet direct of het lidmaatschap toegang geeft.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-18',
        titel: 'Gegevens van een lid downloaden of verwijderen',
        tekst: 'Op de ledenkaart download je alle gegevens van een lid, of zet je het lid op verwijderen. Binnen 30 dagen is dat nog terug te draaien.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-18',
        titel: 'Leden uitnodigen voor de app',
        tekst: 'Een uitnodiging per mail of een QR-code op de ledenkaart, zodat leden de app op hun beginscherm zetten.',
        hoofdstuk: 'betrokkenheid',
      },
      {
        datum: '2026-10-17',
        titel: 'Een instellingencentrum voor de eigenaar',
        tekst: 'Huisstijl, vestigingen, medewerkers en rechten per rol, regels, lessen en zalen, oefeningen en de ledenapp op een plek, met een zoekveld.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Coaching bij elke oefening',
        tekst: 'Genummerde kernpunten, opstelling, stappen, veelgemaakte fouten met correctie, ademhaling en tempo. Elke sportschool past de teksten aan in eigen woorden.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-17',
        titel: 'Ledenlijst inlezen uit een CSV-bestand',
        tekst: 'Gangbare kolommen worden herkend, en je ziet eerst wat er verandert voordat iets wordt opgeslagen.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Afspraken met trainers',
        tekst: 'Intakes, personal training en metingen per trainer, ook wekelijks herhalend. Leden boeken zelf een vrij moment.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-17',
        titel: 'Lidmaatschappen met regels',
        tekst: 'Lidmaatschapsvormen en labels bepalen waar en wanneer een lid mag inchecken en reserveren.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-17',
        titel: 'Eigen intake, challenges en opvolgen',
        tekst: 'Een intakeformulier dat je zelf samenstelt, challenges met badges in de app en een opvolglijst voor ledenbehoud.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-17',
        titel: 'Sluitingsdagen, berichten en voortgang',
        tekst: 'Feestdagen en afwijkende tijden die overal kloppen, nieuws voor je leden in de app en metingen op een tijdlijn.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-17',
        titel: 'Voeding per lid',
        tekst: 'Een voedingsplan met calorieen, eiwit, koolhydraten en vet. Een rekenhulp geeft een startpunt, sjablonen besparen tijd, het lid ziet het in de app.',
        hoofdstuk: 'coaching',
      },
      {
        datum: '2026-10-17',
        titel: 'Rapporten en exports',
        tekst: 'Ledenlijst, instroom en opzeggingen, bezoek, bezetting, leads, afspraken en uren per kalendermaand, als tabel of als CSV.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-15',
        titel: 'Cijfers per kalendermaand',
        tekst: 'Groei, bezoek, bezetting en behoud van de eerste tot de laatste dag van de maand, met de vorige maand ernaast en een overzicht van twaalf maanden.',
        hoofdstuk: 'groei',
      },
      {
        datum: '2026-10-14',
        titel: 'Personeelsrooster met uren',
        tekst: 'Diensten per week en uren die van gepland naar gewerkt, goedgekeurd en verwerkt gaan, klaar voor de administratie.',
        hoofdstuk: 'planning',
      },
      {
        datum: '2026-10-14',
        titel: 'Taken en poetslijsten',
        tekst: 'Dagtaken, de afsluitronde en een poetsrooster in een tabel per dag of per week. Afvinken met een tik.',
        hoofdstuk: 'beheer',
      },
      {
        datum: '2026-10-14',
        titel: 'De eerste versie',
        tekst: 'Leden, check-in, lesrooster met reserveren, leads, trainingsschema’s, cijfers en een ledenapp. Met een menu in vijf groepen, ook op de telefoon.',
        hoofdstuk: 'beheer',
      },
    ],
  },
]

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const

/** "2026-10" wordt "Oktober 2026". */
export function maandNaam(maand: string): string {
  const [jaar, nr] = maand.split('-')
  const naam = MAANDEN[Number(nr) - 1] ?? ''
  return `${naam.charAt(0).toUpperCase()}${naam.slice(1)} ${jaar}`
}

/** "2026-10-23" wordt "23 okt". */
export function korteDatum(datum: string): string {
  const [, nr, dag] = datum.split('-')
  const naam = MAANDEN[Number(nr) - 1] ?? ''
  return `${Number(dag)} ${naam.slice(0, 3)}`
}

/** Het totaal aantal punten, voor de kop van de pagina. */
export function aantalNieuw(lijst: readonly NieuwMaand[] = NIEUW): number {
  return lijst.reduce((som, m) => som + m.punten.length, 0)
}

// ── Gelezen of niet (Wat is nieuw in Club) ──────────────────────────────────
// Per persoon onthoudt de browser welke punten al gezien zijn, als een lijst
// sleutels. Een punt dat later bijkomt telt vanzelf als ongelezen.

/** Een vaste sleutel per punt: datum plus titel. */
export function nieuwSleutel(p: Pick<NieuwPunt, 'datum' | 'titel'>): string {
  return `${p.datum}|${p.titel}`
}

/** Alle punten, nieuwste eerst. */
export function allePunten(lijst: readonly NieuwMaand[] = NIEUW): NieuwPunt[] {
  return lijst.flatMap((m) => m.punten)
}

/** Leest de bewaarde lijst; alles wat geen lijst met teksten is telt als niets gezien. */
export function leesGezien(ruw: string | null): ReadonlySet<string> {
  if (!ruw) return new Set()
  try {
    const data: unknown = JSON.parse(ruw)
    return new Set(Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/** De punten die deze persoon nog niet zag. */
export function ongelezenPunten(ruw: string | null, lijst: readonly NieuwMaand[] = NIEUW): NieuwPunt[] {
  const gezien = leesGezien(ruw)
  return allePunten(lijst).filter((p) => !gezien.has(nieuwSleutel(p)))
}

/** Wat er bewaard wordt als alles gezien is. */
export function allesGezien(lijst: readonly NieuwMaand[] = NIEUW): string {
  return JSON.stringify(allePunten(lijst).map(nieuwSleutel))
}

/** De teller in beeld: leeg bij 0, en nooit meer dan 9+. */
export function tellerTekst(aantal: number): string | null {
  if (aantal <= 0) return null
  return aantal > 9 ? '9+' : String(aantal)
}
