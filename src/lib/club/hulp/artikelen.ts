// ─── Club: de handleidingen van het helpcentrum (PUUR) ──────────────────────
// Korte, echte handleidingen per onderdeel, gebaseerd op wat de pagina's doen.
// Elk artikel hoort bij een onderdeel uit src/components/club/shell/onderdelen.ts
// (of null: altijd zichtbaar), zodat iemand alleen handleidingen ziet van wat
// aan staat en wat hij mag openen. De test controleert dat elke link naar een
// bestaande pagina van een onderdeel wijst. Wijzig je een pagina: werk de tekst bij.

import { ONDERDELEN, actiefOnderdeel, isZichtbaar } from '@/components/club/shell/onderdelen'
import type { Module } from '@/lib/club/kern/organisatie'

export interface ArtikelLink {
  label: string
  /** Een pad binnen /club, eventueel met ?tab= of andere parameters. */
  pad: string
}

export interface Artikel {
  sleutel: string
  titel: string
  samenvatting: string
  /** Sleutel van het onderdeel (zichtbaarheid); null = altijd tonen. */
  onderdeel: string | null
  stappen: readonly string[]
  links: readonly ArtikelLink[]
  /** Extra zoekwoorden die niet in de tekst staan. */
  trefwoorden: readonly string[]
}

export const ARTIKELEN: readonly Artikel[] = [
  {
    sleutel: 'eerste-stappen',
    titel: 'Eerste stappen',
    samenvatting: 'Hoe het menu werkt, de vestiging kiezen en wat Vandaag laat zien.',
    onderdeel: null,
    stappen: [
      'Bovenin staan vijf groepen: Werkvloer, Leden, Planning, Coaching en Beheer. Kies een groep; de onderdelen staan eronder. Op de telefoon open je alles met de knop Menu. Zoek je iets, druk dan op Zoeken (of Ctrl K): dat vindt elk onderdeel en elke instelling.',
      'Kies rechts in de balk de vestiging. Je blijft op dezelfde pagina, alleen de vestiging wisselt. Zonder keuze opent de standaard vestiging.',
      'Vandaag is het dagscherm voor de vloer: bovenaan de check-in en wie er nu binnen is, dan de cijfers, lessen en proeflessen, wie er werkt en de overdracht, de taken van vandaag om af te vinken, opvolgen (leden en leads) met de verjaardagen, en de leden om op te letten. Check-in, Taken en Opvolgen hebben dus geen eigen tabblad meer; zoeken op die woorden brengt je naar de juiste plek op Vandaag.',
      'Nog geen vestiging? Voeg die eerst toe bij Instellingen, Vestigingen. Daarna werken alle pagina\'s per vestiging.',
      'Onderdelen die je sportschool niet gebruikt zet je uit bij Instellingen, Onderdelen aan of uit. Ze verdwijnen dan uit het menu.',
    ],
    links: [
      { label: 'Vandaag', pad: '/club' },
      { label: 'Vestiging toevoegen', pad: '/club/instellingen/vestigingen' },
      { label: 'Instellingen', pad: '/club/beheer' },
    ],
    trefwoorden: ['start', 'begin', 'menu', 'vestiging wisselen', 'dashboard'],
  },
  {
    sleutel: 'leden-inlezen',
    titel: 'Leden inlezen en de ledenlijst',
    samenvatting: 'Een export uit je huidige systeem of Excel inlezen, en leden zoeken en filteren.',
    onderdeel: 'leden',
    stappen: [
      'Exporteer je leden uit je huidige systeem (zoals Virtuagym of Sportivity) als CSV (puntkomma, komma of tab; Club herkent het zelf), of kies gewoon je Excel-lijst (.xlsx). Club leest het eerste werkblad. Hooguit 10 MB en 5000 rijen per bestand.',
      'Ga naar Leden, Ledenbestand inlezen, en sleep het bestand erin. Koppel de kolommen: voornaam en achternaam zijn verplicht (of een kolom met de volledige naam), de rest kies je of zet je op Niet inlezen.',
      'Druk op Controleren. Elke rij krijgt Nieuw, Bijwerken, Al gelijk of Dubbel. Daarna lees je de leden in voor de gekozen vestiging.',
      'Inlezen verwijdert nooit iemand, en een lege cel wist niets. Coach, tags en QR-code blijven zoals ze zijn.',
      'In de ledenlijst zoek je op naam en filter je op status, abonnement, tag en coach. De tegel Risico toont leden met een behoudsscore onder 45. Klik een lid aan voor de ledenkaart met bezoek, reserveringen, afspraken, voortgang en notities. Daar pas je ook status, coach en tags aan, bijvoorbeeld als een proeflid lid wordt.',
    ],
    links: [
      { label: 'Ledenbestand inlezen', pad: '/club/leden/importeren' },
      { label: 'Ledenlijst', pad: '/club/leden' },
    ],
    trefwoorden: ['import', 'importeren', 'csv', 'excel', 'sportivity', 'virtuagym', 'overstappen', 'ledenkaart', 'behoud'],
  },
  {
    sleutel: 'checkin',
    titel: 'Check-in aan de balie',
    samenvatting: 'Leden inchecken met QR, bandje, naam of lidnummer.',
    onderdeel: 'checkin',
    stappen: [
      'Bovenaan Vandaag staat de check-in: scan de QR-code (Scan met camera) of het bandje, en het lid is meteen ingecheckt. Voor een vaste balie met scanner of bandjeslezer open je Volledig scherm.',
      'Of typ een naam of lidnummer, kies met de pijltjestoetsen en druk op Enter. Esc maakt het veld leeg.',
      'Je ziet direct de uitkomst: Welkom, Al binnen, Niet actief, Geen toegang, of Let op met de keuze Toch inchecken of Niet inchecken.',
      'Ernaast staan Nu binnen en de laatste check-ins met de bron (balie, QR, bandje of les). Nu binnen is een schatting: er is geen uitchecken.',
      'Een tweede check-in binnen 30 minuten telt niet nog een keer. Vandaag ververst om de paar minuten vanzelf, het volledige scherm elke minuut.',
    ],
    links: [
      { label: 'Check-in op Vandaag', pad: '/club#checkin' },
      { label: 'Volledig scherm', pad: '/club/checkin' },
    ],
    trefwoorden: ['balie', 'scannen', 'qr', 'bandje', 'binnen'],
  },
  {
    sleutel: 'rooster',
    titel: 'Groepslessen, reserveren en wachtlijst',
    samenvatting: 'Het weekrooster, deelnemers beheren en lessen aanpassen.',
    onderdeel: 'rooster',
    stappen: [
      'De vaste lessen per week zet je klaar bij Instellingen, tabblad Weekrooster. Lestypen en zalen staan daar ook.',
      'In Groepslessen blader je per week en filter je op zaal, les en instructeur. De tegels tonen het aantal lessen, de gemiddelde bezetting, de wachtlijst en no-shows.',
      'Klik een les aan voor de deelnemers. Zodra de check-in open is, zet je iemand op Aanwezig of No-show.',
      'Iemand toevoegen: zoek op naam, lidnummer of telefoon en druk op Boek. Is de les vol, dan gaat het lid op de wachtlijst en schuift vanzelf door als er plek vrijkomt.',
      'Met Deze les aanpassen wijzig je capaciteit, zaal of instructeur. Les annuleren vraagt een reden; de reserveringen vervallen dan.',
    ],
    links: [
      { label: 'Groepslessen', pad: '/club/rooster' },
      { label: 'Weekrooster', pad: '/club/instellingen/weekrooster' },
      { label: 'Regels en openingstijden', pad: '/club/instellingen/regels' },
    ],
    trefwoorden: ['les', 'lessen', 'reserveren', 'boeken', 'wachtlijst', 'no-show', 'capaciteit', 'zaal'],
  },
  {
    sleutel: 'afspraken',
    titel: 'Afspraken plannen',
    samenvatting: 'Intakes, personal training en metingen per trainer.',
    onderdeel: 'afspraken',
    stappen: [
      'Leg eerst je soorten afspraken vast bij Afspraaktypen: naam, duur, buffer na afloop, kleur, wie hem geeft en tot hoeveel uur van tevoren leden in de app boeken en annuleren.',
      'In de agenda kies je Week of Dag en filter je op trainer.',
      'Nieuwe afspraak: kies de soort, een trainer (of de eerste die vrij is), de dag en een vrije tijd. Alleen vrije tijden zijn te kiezen, dus dubbel boeken kan niet.',
      'Na afloop zet je de afspraak op Geweest of Niet gekomen. Verplaatsen, annuleren en een notitie kan ook.',
    ],
    links: [
      { label: 'Afspraken', pad: '/club/afspraken' },
      { label: 'Afspraaktypen', pad: '/club/afspraken?tab=typen' },
    ],
    trefwoorden: ['intake', 'personal training', 'meting', 'agenda', 'trainer'],
  },
  {
    sleutel: 'personeel',
    titel: 'Personeelsrooster en uren',
    samenvatting: 'Diensten plannen, gewerkte uren bevestigen en exporteren.',
    onderdeel: 'personeel',
    stappen: [
      'In het Weekrooster maak je diensten met datum, begin, eind, medewerker en uursoort (werk, ziek of verlof). Kopieer vorige week of gebruik een vast patroon.',
      'Medewerkers geven hun vaste week en afwezigheid op bij Beschikbaarheid.',
      'Na een dienst vul je de gewerkte tijd en pauze in en druk je op Bevestig gewerkt. Een dienst gaat van Gepland naar Gewerkt, Goedgekeurd en Verwerkt.',
      'Op het tabblad Uren (eigenaar, clubmanager en administratie) kies je week of maand. Keur alles in een keer goed (afwijkingen blijven over), markeer als verwerkt en download de CSV voor het salaris. Trainers en instructeurs bevestigen alleen hun eigen uren.',
    ],
    links: [
      { label: 'Personeel', pad: '/club/personeel' },
      { label: 'Uren', pad: '/club/personeel?tab=uren' },
      { label: 'Beschikbaarheid', pad: '/club/personeel?tab=team' },
    ],
    trefwoorden: ['dienst', 'diensten', 'rooster', 'uren', 'salaris', 'ziek', 'verlof', 'administratie'],
  },
  {
    sleutel: 'taken',
    titel: 'Taken en poetslijsten',
    samenvatting: 'Dagelijkse taken afvinken en de afsluitronde.',
    onderdeel: 'taken',
    stappen: [
      'De taken van vandaag staan op Vandaag. Kies bij Afvinken als wie je bent, en tik taken af. Iets anders gedaan? Zet het erbij als notitie.',
      'Sluit de dag af met de Afsluitronde.',
      'Week toont dezelfde tabel voor de hele week; Overzicht toont gemiste dagtaken, weektaken die achterlopen en afgemelde afsluitrondes.',
      'Bij Beheer maak je lijsten en taken met hoe vaak (elke dag, minimaal een aantal keer per week, indien nodig) en het moment. Een lijst kopieer je naar een andere vestiging.',
    ],
    links: [
      { label: 'Taken op Vandaag', pad: '/club#taken' },
      { label: 'Dag (andere dagen)', pad: '/club/taken' },
      { label: 'Week', pad: '/club/taken/week' },
      { label: 'Overzicht', pad: '/club/taken/overzicht' },
      { label: 'Taken beheren', pad: '/club/taken/beheer' },
    ],
    trefwoorden: ['poetsen', 'schoonmaak', 'afsluiten', 'checklist'],
  },
  {
    sleutel: 'training',
    titel: "Intakes en trainingsschema's",
    samenvatting: 'Een intake afnemen, een schema maken en sjablonen gebruiken.',
    onderdeel: 'schemas',
    stappen: [
      'Ga naar Training en druk op Intake afnemen bij een lid. Alle vragen staan op een scherm. Gezondheidsgegevens worden alleen bewaard met toestemming.',
      'Na Intake opslaan maakt Maak schemavoorstel een eerste schema. Of begin met een leeg schema of een sjabloon.',
      'In het schema geef je naam, status (concept, actief of afgerond), doel, niveau en weken op, en per dag (A tot en met G) de oefeningen met sets, herhalingen, kg en rust.',
      'Opslaan kan ook met Ctrl+S. Rechts zie je wat het lid in de app heeft afgevinkt. Een goed schema bewaar je als sjabloon.',
      'De vragen van de intake pas je aan bij Instellingen, Intakeformulier; oefeningen en coaching staan op het tabblad Oefeningen.',
    ],
    links: [
      { label: "Schema's", pad: '/club/training' },
      { label: 'Intakes', pad: '/club/training?tab=intakes' },
      { label: 'Oefeningen', pad: '/club/training?tab=oefeningen' },
    ],
    trefwoorden: ['schema', 'oefening', 'oefeningen', 'sjabloon', 'coaching', 'intakeformulier'],
  },
  {
    sleutel: 'voeding',
    titel: 'Voeding per lid',
    samenvatting: 'Een dagdoel met rekenhulp, adviezen en sjablonen.',
    onderdeel: 'voeding',
    stappen: [
      'Zoek bij Voeding een lid en open het plan.',
      'Stel het dagdoel in: kcal, eiwit, koolhydraten en vet. De rekenhulp schat het met de formule van Mifflin-St Jeor op basis van geslacht, activiteit en doel.',
      'Voeg adviezen en een voorbeeld van een dag toe. De notitie voor trainers ziet het lid niet.',
      'Maak bij Sjablonen een vast plan dat je op meer leden toepast.',
    ],
    links: [
      { label: 'Voeding', pad: '/club/voeding' },
      { label: 'Sjablonen', pad: '/club/voeding?tab=sjablonen' },
    ],
    trefwoorden: ['kcal', 'calorieen', 'eiwit', 'macro', 'dieet'],
  },
  {
    sleutel: 'challenges',
    titel: 'Challenges en badges',
    samenvatting: 'Doelen voor leden met voortgang en een ranglijst.',
    onderdeel: 'challenges',
    stappen: [
      'Druk op Nieuwe challenge en kies wat telt: bezoeken, trainingen, groepslessen of weken op rij. Geef een doel, start en eind.',
      'Kies voor welke vestigingen hij geldt, en of iedereen meedoet of leden zich inschrijven.',
      'Zet aan of hij in de ledenapp staat en of de ranglijst zichtbaar is (voornaam en eerste letter).',
      'Challenges staan in lopend, gepland en afgelopen. Een lopende challenge kun je stoppen.',
    ],
    links: [{ label: 'Challenges', pad: '/club/challenges' }],
    trefwoorden: ['doel', 'wedstrijd', 'ranglijst', 'motivatie'],
  },
  {
    sleutel: 'opvolgen',
    titel: 'Opvolgen en opvolgregels',
    samenvatting: 'Wie je vandaag belt of aanspreekt, en de regels daarachter.',
    onderdeel: 'opvolgen',
    stappen: [
      'Op Vandaag staat bij Opvolgen per regel wie je vandaag spreekt, met een voorbeeldtekst, en ernaast de leads die vandaag aan de beurt zijn. Zet een notitie en druk op Gedaan of Overslaan.',
      'Club verstuurt zelf niets: jij of het team belt, appt of spreekt het lid aan.',
      'De zeven regels (welkomstgesprek, proeflid, lang niet gezien, risico op afhaken, verjaardag, exitgesprek en mijlpaal) zet je aan of uit bij Opvolgregels (Instellingen), met een drempel, wie het oppakt en de voorbeeldtekst.',
      'De volledige lijst toont ook wat de afgelopen 7 dagen is afgehandeld.',
    ],
    links: [
      { label: 'Opvolgen op Vandaag', pad: '/club#opvolgen' },
      { label: 'Volledige lijst', pad: '/club/opvolgen' },
      { label: 'Opvolgregels', pad: '/club/beheer/automatiseringen' },
    ],
    trefwoorden: ['bellen', 'retentie', 'behoud', 'opzegging', 'verjaardag'],
  },
  {
    sleutel: 'rapporten',
    titel: 'Rapporten en cijfers',
    samenvatting: 'Exports per kalendermaand en de cijfers van je club.',
    onderdeel: 'rapporten',
    stappen: [
      'Kies bij Rapporten het rapport, de kalendermaand en de vestigingen. Niets aangevinkt is de vestiging uit de balk.',
      'Er zijn negen rapporten, onder meer de ledenlijst, nieuwe leden en opzeggingen, bezoek, bezetting, no-shows, leads, afspraken, uren en opvolgtaken.',
      'Download CSV geeft een bestand met puntkomma\'s dat Excel goed opent. Elke download wordt gelogd.',
      'Cijfers toont leden, bezoek, lessen en leads per maand, vergeleken met de vorige maand en dezelfde maand vorig jaar. Kies Alle vestigingen voor het totaal.',
    ],
    links: [
      { label: 'Rapporten', pad: '/club/rapporten' },
      { label: 'Cijfers', pad: '/club/cijfers' },
    ],
    trefwoorden: ['export', 'excel', 'csv', 'maand', 'statistiek', 'kpi'],
  },
  {
    sleutel: 'instellingen',
    titel: 'Huisstijl en instellingen',
    samenvatting: 'Logo en kleuren, onderdelen aan of uit, en alles op een plek.',
    onderdeel: 'beheer',
    stappen: [
      'Alles wat je instelt staat op een plek: Instellingen in de groep Beheer. Per regel zie je de huidige stand; een klik opent de plek waar je het aanpast, met bovenaan de weg terug.',
      'Bij Huisstijl stel je naam, slogan, logo (PNG, WebP, SVG of JPEG, hooguit 1 MB), donker of licht en je eigen kleur in. Het geldt meteen voor Club en de ledenapp.',
      'Ook bij Huisstijl zet je onderdelen uit die je niet gebruikt, zoals check-in of personeel.',
      'Per vestiging stel je de regels en openingstijden, zalen, het weekrooster en medewerkers in. Lestypen gelden voor alle vestigingen.',
      'Bij Rechten per rol kies je welke onderdelen trainers, instructeurs, clubmanagers en de administratie zien.',
      'Je team logt in op de inlogpagina met het eigen e-mailadres en een eigen wachtwoord. Open bij Medewerkers iemand en kies Uitnodigen; je krijgt een link (of QR-code) die je doorstuurt. Daarmee kiest de medewerker een keer een wachtwoord. Een tweede eigenaar of een clubmanager die mee beheert nodig je op dezelfde manier uit bij Huisstijl, Beheerders.',
    ],
    links: [
      { label: 'Instellingen', pad: '/club/beheer' },
      { label: 'Huisstijl', pad: '/club/huisstijl' },
      { label: 'Medewerkers', pad: '/club/instellingen/medewerkers' },
      { label: 'Rechten per rol', pad: '/club/beheer/rechten' },
    ],
    trefwoorden: ['logo', 'kleur', 'thema', 'modules', 'openingstijden', 'medewerkers', 'rollen', 'inloggen', 'uitnodigen', 'wachtwoord'],
  },
  {
    sleutel: 'ledenapp',
    titel: 'Ledenapp en berichten',
    samenvatting: 'Wat leden in de app zien, en nieuws en acties plaatsen.',
    onderdeel: 'app',
    stappen: [
      'Een lid nodig je uit op de ledenkaart, blok Ledenapp: het lid scant de QR-code, bevestigt het e-mailadres en kiest een wachtwoord. Daarna logt het in met e-mailadres en wachtwoord.',
      'Bij Instellingen, Ledenapp bekijken, zie je de app zoals een lid hem ziet: kies een lid en blader door Home, Lessen, Afspraken, Schema, Voeding, Voortgang en Profiel.',
      'Bij Instellingen, Ledenapp, stel je de welkomsttekst in, welke tabbladen aan staan en of de QR-code voor de check-in zichtbaar is.',
      'Bij Berichten plaats je nieuws, een actie of iets belangrijks, met begin en eind, voor welke vestigingen en eventueel alleen voor bepaalde leden. Een bericht kun je vastpinnen of meteen stoppen.',
      'Abonnementen en incasso van leden blijven in je eigen ledenadministratie; Club regelt die niet.',
    ],
    links: [
      { label: 'Ledenapp bekijken', pad: '/club/app' },
      { label: 'Ledenapp', pad: '/club/beheer/ledenapp' },
      { label: 'Berichten', pad: '/club/berichten' },
    ],
    trefwoorden: ['app', 'telefoon', 'nieuws', 'mededeling', 'qr'],
  },
]

/** Alles waarop een artikel gevonden wordt, in kleine letters. */
function zoektekst(a: Artikel): string {
  return [a.titel, a.samenvatting, ...a.stappen, ...a.trefwoorden, ...a.links.map((l) => l.label)].join(' ').toLowerCase()
}

/** Kleine letters en zonder accenten, zodat zoeken met of zonder accent hetzelfde vindt. */
export function normaliseer(tekst: string): string {
  return tekst.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Simpel filter: elk woord van de zoekvraag moet ergens in het artikel staan. */
export function filterArtikelen(lijst: readonly Artikel[], zoek: string): Artikel[] {
  const woorden = normaliseer(zoek).split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return [...lijst]
  return lijst.filter((a) => {
    const tekst = normaliseer(zoektekst(a))
    return woorden.every((w) => tekst.includes(w))
  })
}

/** Het pad zonder parameters of anker. */
export function kaalPad(pad: string): string {
  return pad.split(/[?#]/)[0]
}

/**
 * De artikelen die deze persoon ziet: van onderdelen die aan staan en die hij
 * mag openen, en alleen met links naar pagina's die hij ook mag openen.
 */
export function zichtbareArtikelen(uit: readonly Module[], toegestaan: readonly string[] | null): Artikel[] {
  const mag = (sleutel: string) => {
    const o = ONDERDELEN.find((x) => x.sleutel === sleutel)
    return o !== undefined && isZichtbaar(o, uit, toegestaan)
  }
  return ARTIKELEN.filter((a) => a.onderdeel === null || mag(a.onderdeel))
    .map((a) => ({ ...a, links: a.links.filter((l) => mag(actiefOnderdeel(kaalPad(l.pad)).sleutel)) }))
}
