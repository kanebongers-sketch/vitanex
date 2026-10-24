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
// - Elk punt en elke maand ook in het Engels (`en`), met precies dezelfde
//   inhoud (docs/aiyourgym/TALEN.md). Tonen via puntTekst(p, taal) en
//   maandSamenvatting(m, taal); gelezen of niet blijft op de Nederlandse titel.

import type { Taal } from './taal/taal'

/** De hoofdstukken van de website (gelijk aan HoofdstukSleutel in inhoud/functies.ts; een test bewaakt dat). */
export type NieuwHoofdstuk = 'beheer' | 'coaching' | 'planning' | 'groei' | 'betrokkenheid'

/** De Engelse tekst van een punt (besluit Kane 24-10-2026: alles in Nederlands en Engels). */
export interface NieuwTekst {
  titel: string
  tekst: string
}

export interface NieuwPunt {
  /** Datum waarop het live ging, als jjjj-mm-dd. */
  datum: string
  /** Nederlands, de bron. Ook de vaste sleutel voor gelezen of niet (nieuwSleutel). */
  titel: string
  tekst: string
  hoofdstuk: NieuwHoofdstuk
  /** Dezelfde tekst in het Engels, niets meer en niets minder. */
  en: NieuwTekst
}

export interface NieuwMaand {
  /** jjjj-mm */
  maand: string
  /** Een korte zin over de maand. */
  samenvatting: string
  en: { samenvatting: string }
  punten: readonly NieuwPunt[]
}

export const NIEUW: readonly NieuwMaand[] = [
  {
    maand: '2026-10',
    samenvatting: 'De eerste maand: van een lege map tot software waarmee een sportschool de hele dag draait.',
    en: { samenvatting: 'The first month: from an empty folder to software a gym can run its whole day on.' },
    punten: [
      {
        datum: '2026-10-23',
        titel: 'De hulpbalk onderaan Club',
        tekst: 'Instellingen, Koppelingen, Ledenapp, Wat is nieuw en Hulp staan onderaan elke pagina, op de telefoon onder Meer. Bij Koppelingen zie je per koppeling of hij werkt, bij Wat is nieuw hoeveel updates je nog niet zag.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'The help bar at the bottom of Club',
          tekst: 'Settings, Integrations, Member app, What’s new and Help sit at the bottom of every page, under More on your phone. Integrations shows whether each one is working, What’s new shows how many updates you have not seen yet.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Club over de volle breedte',
        tekst: 'Club gebruikt je hele scherm. Onder de vijf groepen staat het submenu van de groep waar je bent, met het onderdeel waar je nu bent duidelijk gevuld.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Club across the full width',
          tekst: 'Club uses your whole screen. Below the five groups sits the submenu of the group you are in, with the section you are on clearly highlighted.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'De startwizard richt alles echt in',
        tekst: 'Elke stap stelt zijn deel meteen in, zonder heen en weer naar andere pagina’s: lestypen en je vaste week met zaal en instructeur, je team en je ledenbestand. Een stap telt pas als af als het er echt staat, en de rest van Club gaat open zodra de wizard klaar is.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'The start wizard really sets everything up',
          tekst: 'Every step sets up its part straight away, without going back and forth to other pages: class types and your regular week with room and instructor, your team and your member file. A step only counts as done when it is really in place, and the rest of Club opens as soon as the wizard is finished.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Je team uitnodigen vanuit de wizard',
        tekst: 'In de stap Team nodig je elke medewerker meteen uit. Club mailt een link om een wachtwoord te kiezen, en de link staat ook in beeld om zelf door te sturen.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Invite your team from the wizard',
          tekst: 'In the Team step you invite each staff member straight away. Club emails them a link to choose a password, and the link is also shown on screen so you can pass it on yourself.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Ledenbestand inlezen als spreadsheet',
        tekst: 'Naast CSV lees je nu ook een .xlsx-bestand in, direct in de wizard of later bij Leden. Je ziet eerst wat er verandert voordat iets wordt opgeslagen.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Import your member file as a spreadsheet',
          tekst: 'Besides CSV you can now import an .xlsx file, directly in the wizard or later under Members. You see what will change before anything is saved.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Live, met een lijstje voor je eerste dag',
        tekst: 'Pas als alles echt staat, zegt de wizard dat je sportschool live staat. Daarna drie dingen voor dag een: de poster met QR-code printen, je leden uitnodigen voor de app en inchecken aan de balie.',
        hoofdstuk: 'betrokkenheid',
        en: {
          titel: 'Live, with a list for your first day',
          tekst: 'The wizard only says your gym is live once everything is really in place. Then three things for day one: print the poster with the QR code, invite your members to the app and check in at the front desk.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Aanmelden en meteen beginnen',
        tekst: 'Na het aanmelden staat je omgeving direct klaar en ben je meteen ingelogd. Zolang online betalen nog niet gekoppeld is, wordt er niets afgeschreven. Tot wanneer je proefperiode loopt, zie je in Club.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Sign up and start straight away',
          tekst: 'After signing up, your environment is ready immediately and you are signed in. As long as online payment is not connected, nothing is charged. Club shows you when your trial ends.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Een eigen adres voor je sportschool',
        tekst: 'Elke sportschool heeft een eigen adres, zoals aiyourgym.com/jouwgym. Daar loggen je team en je leden in.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Your own address for your gym',
          tekst: 'Every gym has its own address, such as aiyourgym.com/yourgym. That is where your team and your members sign in.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'Inloggen met e-mailadres en wachtwoord',
        tekst: 'Eigenaar, clubmanager, medewerkers en leden loggen allemaal in met hun e-mailadres en een sterk wachtwoord. Een link is er alleen nog om de eerste keer een wachtwoord te kiezen.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Sign in with email address and password',
          tekst: 'Owner, club manager, staff and members all sign in with their email address and a strong password. A link is only used to choose a password the first time.',
        },
      },
      {
        datum: '2026-10-23',
        titel: 'De startwizard denkt mee',
        tekst: 'De wizard laat zien hoeveel minuten je nog bezig bent, gaat verder waar je was gebleven en laat je een streefdatum kiezen om live te gaan. Bij elke stap staat hulp in gewone taal.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'The start wizard thinks along',
          tekst: 'The wizard shows how many minutes you have left, picks up where you left off and lets you choose a target date to go live. Every step has help in plain language.',
        },
      },
      {
        datum: '2026-10-20',
        titel: 'AVG voor leads en medewerkers',
        tekst: 'Naast leden hebben nu ook leads en medewerkers inzage en wissen. Bewaartermijnen stel je per sportschool in, het opruimen gaat vanzelf.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'GDPR for leads and staff',
          tekst: 'Alongside members, leads and staff now also have the right to see and erase their data. You set retention periods per gym, and the clean-up happens automatically.',
        },
      },
      {
        datum: '2026-10-20',
        titel: 'Startwizard in acht stappen',
        tekst: 'Kies je soort sportschool en de wizard zet onderdelen, lestypen, openingstijden en rechten alvast klaar. Jij zegt per stap of het klopt.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'A start wizard in eight steps',
          tekst: 'Choose your kind of gym and the wizard prepares sections, class types, opening hours and permissions. At each step you say whether it is right.',
        },
      },
      {
        datum: '2026-10-20',
        titel: 'Makkelijker voor de trainer op de vloer',
        tekst: 'Een strakker menu met zoeken via Ctrl K, en een ledenapp die beter werkt op de telefoon.',
        hoofdstuk: 'betrokkenheid',
        en: {
          titel: 'Easier for the trainer on the gym floor',
          tekst: 'A tighter menu with search via Ctrl K, and a member app that works better on the phone.',
        },
      },
      {
        datum: '2026-10-18',
        titel: 'Een schema-editor voor coaches',
        tekst: 'Supersets en circuits, per oefening sets, herhalingen of tijd, gewicht, RPE of RIR, rust en tempo. Slepen, ongedaan maken en een schema kopieren naar een ander lid.',
        hoofdstuk: 'coaching',
        en: {
          titel: 'A programme editor for coaches',
          tekst: 'Supersets and circuits, and per exercise sets, reps or time, weight, RPE or RIR, rest and tempo. Drag and drop, undo, and copy a programme to another member.',
        },
      },
      {
        datum: '2026-10-18',
        titel: 'Leden loggen per set',
        tekst: 'Leden vullen in de app per set in wat ze deden. De trainer ziet de voortgang per oefening en een vaste regel voor wanneer het zwaarder kan.',
        hoofdstuk: 'coaching',
        en: {
          titel: 'Members log every set',
          tekst: 'Members record in the app what they did in each set. The trainer sees progress per exercise and a fixed rule for when it can get heavier.',
        },
      },
      {
        datum: '2026-10-18',
        titel: 'Inchecken met de telefoon',
        tekst: 'Leden checken in met de QR-code in hun ledenapp. De balie ziet direct of het lidmaatschap toegang geeft.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Check in with your phone',
          tekst: 'Members check in with the QR code in their member app. The front desk sees straight away whether the membership gives access.',
        },
      },
      {
        datum: '2026-10-18',
        titel: 'Gegevens van een lid downloaden of verwijderen',
        tekst: 'Op de ledenkaart download je alle gegevens van een lid, of zet je het lid op verwijderen. Binnen 30 dagen is dat nog terug te draaien.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Download or delete a member’s data',
          tekst: 'On the member card you can download all of a member’s data, or mark the member for deletion. That can still be undone within 30 days.',
        },
      },
      {
        datum: '2026-10-18',
        titel: 'Leden uitnodigen voor de app',
        tekst: 'Een uitnodiging per mail of een QR-code op de ledenkaart, zodat leden de app op hun beginscherm zetten.',
        hoofdstuk: 'betrokkenheid',
        en: {
          titel: 'Invite members to the app',
          tekst: 'An invitation by email or a QR code on the member card, so members add the app to their home screen.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Een instellingencentrum voor de eigenaar',
        tekst: 'Huisstijl, vestigingen, medewerkers en rechten per rol, regels, lessen en zalen, oefeningen en de ledenapp op een plek, met een zoekveld.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'A settings centre for the owner',
          tekst: 'Branding, locations, staff and permissions per role, rules, classes and rooms, exercises and the member app in one place, with a search field.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Coaching bij elke oefening',
        tekst: 'Genummerde kernpunten, opstelling, stappen, veelgemaakte fouten met correctie, ademhaling en tempo. Elke sportschool past de teksten aan in eigen woorden.',
        hoofdstuk: 'coaching',
        en: {
          titel: 'Coaching with every exercise',
          tekst: 'Numbered key points, set-up, steps, common mistakes with corrections, breathing and tempo. Every gym can rewrite the texts in its own words.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Ledenlijst inlezen uit een CSV-bestand',
        tekst: 'Gangbare kolommen worden herkend, en je ziet eerst wat er verandert voordat iets wordt opgeslagen.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Import your member list from a CSV file',
          tekst: 'Common columns are recognised, and you see what will change before anything is saved.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Afspraken met trainers',
        tekst: 'Intakes, personal training en metingen per trainer, ook wekelijks herhalend. Leden boeken zelf een vrij moment.',
        hoofdstuk: 'planning',
        en: {
          titel: 'Appointments with trainers',
          tekst: 'Intakes, personal training and measurements per trainer, including weekly repeats. Members book an open slot themselves.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Lidmaatschappen met regels',
        tekst: 'Lidmaatschapsvormen en labels bepalen waar en wanneer een lid mag inchecken en reserveren.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Memberships with rules',
          tekst: 'Membership types and labels decide where and when a member can check in and book.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Eigen intake, challenges en opvolgen',
        tekst: 'Een intakeformulier dat je zelf samenstelt, challenges met badges in de app en een opvolglijst voor ledenbehoud.',
        hoofdstuk: 'groei',
        en: {
          titel: 'Your own intake, challenges and follow-up',
          tekst: 'An intake form you put together yourself, challenges with badges in the app and a follow-up list for member retention.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Sluitingsdagen, berichten en voortgang',
        tekst: 'Feestdagen en afwijkende tijden die overal kloppen, nieuws voor je leden in de app en metingen op een tijdlijn.',
        hoofdstuk: 'planning',
        en: {
          titel: 'Closing days, messages and progress',
          tekst: 'Public holidays and special opening hours that are right everywhere, news for your members in the app and measurements on a timeline.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Voeding per lid',
        tekst: 'Een voedingsplan met calorieen, eiwit, koolhydraten en vet. Een rekenhulp geeft een startpunt, sjablonen besparen tijd, het lid ziet het in de app.',
        hoofdstuk: 'coaching',
        en: {
          titel: 'Nutrition per member',
          tekst: 'A nutrition plan with calories, protein, carbohydrates and fat. A calculator gives a starting point, templates save time, and the member sees it in the app.',
        },
      },
      {
        datum: '2026-10-17',
        titel: 'Rapporten en exports',
        tekst: 'Ledenlijst, instroom en opzeggingen, bezoek, bezetting, leads, afspraken en uren per kalendermaand, als tabel of als CSV.',
        hoofdstuk: 'groei',
        en: {
          titel: 'Reports and exports',
          tekst: 'Member list, joiners and cancellations, visits, occupancy, leads, appointments and hours per calendar month, as a table or as CSV.',
        },
      },
      {
        datum: '2026-10-15',
        titel: 'Cijfers per kalendermaand',
        tekst: 'Groei, bezoek, bezetting en behoud van de eerste tot de laatste dag van de maand, met de vorige maand ernaast en een overzicht van twaalf maanden.',
        hoofdstuk: 'groei',
        en: {
          titel: 'Figures per calendar month',
          tekst: 'Growth, visits, occupancy and retention from the first to the last day of the month, with the previous month alongside and a twelve-month overview.',
        },
      },
      {
        datum: '2026-10-14',
        titel: 'Personeelsrooster met uren',
        tekst: 'Diensten per week en uren die van gepland naar gewerkt, goedgekeurd en verwerkt gaan, klaar voor de administratie.',
        hoofdstuk: 'planning',
        en: {
          titel: 'Staff rota with hours',
          tekst: 'Shifts per week, and hours that move from planned to worked, approved and processed, ready for your admin.',
        },
      },
      {
        datum: '2026-10-14',
        titel: 'Taken en poetslijsten',
        tekst: 'Dagtaken, de afsluitronde en een poetsrooster in een tabel per dag of per week. Afvinken met een tik.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'Tasks and cleaning lists',
          tekst: 'Daily tasks, the closing round and a cleaning rota in a table per day or per week. Tick them off with a tap.',
        },
      },
      {
        datum: '2026-10-14',
        titel: 'De eerste versie',
        tekst: 'Leden, check-in, lesrooster met reserveren, leads, trainingsschema’s, cijfers en een ledenapp. Met een menu in vijf groepen, ook op de telefoon.',
        hoofdstuk: 'beheer',
        en: {
          titel: 'The first version',
          tekst: 'Members, check-in, a class timetable with booking, leads, training programmes, figures and a member app. With a menu in five groups, also on your phone.',
        },
      },
    ],
  },
]

const MAANDEN: Readonly<Record<Taal, readonly string[]>> = {
  nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** "2026-10" wordt "Oktober 2026" (Engels: "October 2026"). */
export function maandNaam(maand: string, taal: Taal = 'nl'): string {
  const [jaar, nr] = maand.split('-')
  const naam = MAANDEN[taal][Number(nr) - 1] ?? ''
  return `${naam.charAt(0).toUpperCase()}${naam.slice(1)} ${jaar}`
}

/** "2026-10-23" wordt "23 okt" (Engels: "23 Oct"). */
export function korteDatum(datum: string, taal: Taal = 'nl'): string {
  const [, nr, dag] = datum.split('-')
  const naam = MAANDEN[taal][Number(nr) - 1] ?? ''
  return `${Number(dag)} ${naam.slice(0, 3)}`
}

/** Titel en tekst van een punt in een taal. De sleutel (nieuwSleutel) blijft altijd de Nederlandse titel. */
export function puntTekst(p: Pick<NieuwPunt, 'titel' | 'tekst' | 'en'>, taal: Taal): NieuwTekst {
  return taal === 'en' ? p.en : { titel: p.titel, tekst: p.tekst }
}

/** De samenvatting van een maand in een taal. */
export function maandSamenvatting(m: Pick<NieuwMaand, 'samenvatting' | 'en'>, taal: Taal): string {
  return taal === 'en' ? m.en.samenvatting : m.samenvatting
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
