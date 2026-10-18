// ─── AI Your Gym: wat Club kan, in vijf hoofdstukken (PUUR) ─────────────────
// Alleen functies die Club echt heeft (zie src/components/club/shell/onderdelen.ts
// en src/lib/club/**). Nieuwe functie in Club? Pas hem hier pas aan als hij af is.
// De hoofdstukken zijn de indeling van de website (Beheer, Coaching, Planning,
// Groei, Betrokkenheid); het menu in Club zelf heeft een eigen indeling.
// Elk hoofdstuk heeft een eigen kleuraccent (--ayg-h-<sleutel> in aiyourgym.css,
// het contrast staat in contrast.test.ts) en een anker op /aiyourgym/functies.

export type HoofdstukSleutel = 'beheer' | 'coaching' | 'planning' | 'groei' | 'betrokkenheid'

export interface Functie {
  titel: string
  tekst: string
}

export interface Hoofdstuk {
  sleutel: HoofdstukSleutel
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
}

export const HOOFDSTUKKEN: readonly Hoofdstuk[] = [
  {
    sleutel: 'beheer',
    naam: 'Beheer',
    kop: 'Je club draait, ook als jij er niet bent.',
    intro: 'De balie, de dienst en de instellingen van je sportschool. Je team weet wat er moet gebeuren, jij bepaalt de regels.',
    functies: [
      { titel: 'Check-in aan de balie', tekst: 'Inchecken met de QR-code uit de ledenapp of op naam. Je ziet direct wie er binnen is, en AI Your Gym checkt of het lidmaatschap toegang geeft tot deze vestiging.' },
      { titel: 'Taken en poetslijsten', tekst: 'Dagelijkse taken, de afsluitronde en een poetsrooster met een minimum per week. In een overzichtelijke tabel per dag of per week, afvinken met een tik.' },
      { titel: 'Notities en overdracht', tekst: 'Afspraken en kennis voor de volgende dienst op een vaste plek, in plaats van op een briefje achter de balie.' },
      { titel: 'Meerdere vestigingen', tekst: 'Elke vestiging met eigen zalen, lessen, openingstijden en regels, en lidmaatschappen die bepalen waar een lid mag sporten.' },
      { titel: 'Rechten per rol', tekst: 'De eigenaar mag alles. Voor de clubmanager vink je zelf aan welke onderdelen die ziet.' },
      { titel: 'Eigen logo, kleuren en adres', tekst: 'Je eigen naam, logo en accentkleur in de software en in de ledenapp, op naam.aiyourgym.com. Een kleur met te weinig contrast wordt automatisch bijgesteld. Onderdelen die je niet gebruikt zet je uit.' },
    ],
  },
  {
    sleutel: 'coaching',
    naam: 'Coaching',
    kop: 'Schema’s waar een trainer trots op is.',
    intro: 'Van intake tot schema, met coaching bij elke oefening zoals een goede trainer die op de vloer geeft.',
    functies: [
      { titel: 'Intakes', tekst: 'Een intakeformulier dat je zelf samenstelt, met metingen en een gezondheidsvragenlijst. Uit de intake maakt AI Your Gym een startvoorstel voor een schema.' },
      { titel: 'Trainingsschema’s', tekst: 'Schema’s per trainingsdag, met sets, herhalingen, gewicht en rust. De trainer past het voorstel aan in de editor, het lid ziet het in de app en vinkt af.' },
      { titel: 'Coaching per oefening', tekst: 'Bij elke oefening 3 tot 5 genummerde kernpunten, de opstelling, de stappen, veelgemaakte fouten met correctie, ademhaling en tempo.' },
      { titel: 'Bewegende oefenbeelden', tekst: 'Begin- en eindhouding als illustratie die rustig in elkaar overloopt, in een stijl voor de hele bibliotheek.' },
      { titel: 'Voeding', tekst: 'Een voedingsplan per lid met calorieen, eiwit, koolhydraten en vet, maaltijden en adviezen. Een rekenhulp geeft de trainer een startpunt, sjablonen besparen tijd.' },
      { titel: 'Voortgang', tekst: 'Metingen en trainingen op een tijdlijn. Het lid ziet zijn eigen lichaamsmaten en trainingen terug, nooit de notities van de trainer.' },
    ],
  },
  {
    sleutel: 'planning',
    naam: 'Planning',
    kop: 'Lessen, afspraken en diensten zonder gepuzzel.',
    intro: 'Het groepslesrooster, afspraken met trainers en het personeelsrooster met uren, allemaal op dezelfde plek.',
    functies: [
      { titel: 'Groepslessen', tekst: 'Een lesrooster per vestiging en zaal. Leden reserveren in de app, met wachtlijst bij volle lessen en eigen regels voor annuleren en no-shows.' },
      { titel: 'Afspraken met trainers', tekst: 'Intakes, personal training en metingen per trainer. Leden boeken een vrij moment, de trainer ziet het in zijn agenda.' },
      { titel: 'Personeelsrooster en uren', tekst: 'Diensten van het fitnesspersoneel per week, met uren die van gepland naar gewerkt, goedgekeurd en verwerkt gaan. De uren exporteer je voor de administratie.' },
      { titel: 'Agenda en sluitingsdagen', tekst: 'Overleg en afspraken per week, plus feestdagen en afwijkende openingstijden die overal meteen kloppen.' },
    ],
  },
  {
    sleutel: 'groei',
    naam: 'Groei',
    kop: 'Meer leden binnen, en zien wat werkt.',
    intro: 'Van proefles tot nieuw lid, en cijfers die je per kalendermaand vergelijkt. Zo weet je waar je groei vandaan komt.',
    functies: [
      { titel: 'Leads en proeflessen', tekst: 'Nieuwe aanmeldingen met bron en status. Je ziet wie een proefles had en wie nog opgevolgd moet worden.' },
      { titel: 'Opvolgen', tekst: 'Een lijst van wie je vandaag belt of aanspreekt: nieuwe leden, proefleden, leden die lang niet zijn geweest. Zo valt niemand tussen wal en schip.' },
      { titel: 'Cijfers per kalendermaand', tekst: 'Groei, bezoek, bezetting van lessen en behoud, steeds van de eerste tot de laatste dag van de maand.' },
      { titel: 'Rapporten en exports', tekst: 'Ledenlijst, instroom en opzeggingen, bezoek, bezetting, no-shows, leads, afspraken, uren en opvolging. Als tabel of als CSV.' },
    ],
  },
  {
    sleutel: 'betrokkenheid',
    naam: 'Betrokkenheid',
    kop: 'Leden die blijven, omdat ze zich gezien voelen.',
    intro: 'Een eigen app voor je leden, alles over een lid op een kaart, en hulpmiddelen die leden betrokken houden.',
    functies: [
      { titel: 'Ledenapp in je eigen huisstijl', tekst: 'Een web-app met jouw naam, logo en kleuren die leden op hun beginscherm zetten. Lessen reserveren, inchecken met de QR-code, hun schema, voeding en voortgang.' },
      { titel: 'Ledenkaart', tekst: 'Gegevens, bezoek, lidmaatschap, labels, notities en status van een lid op een plek. Gezondheidsgegevens alleen met toestemming van het lid.' },
      { titel: 'Automatiseringen voor ledenbehoud', tekst: 'Zeven regels die je per sportschool aan of uit zet: welkomstgesprek, proeflid opvolgen, lang niet gezien, risico op afhaken, verjaardag, exitgesprek en mijlpaal. Met een eigen drempel en een voorbeeldtekst.' },
      { titel: 'Challenges en badges', tekst: 'Doelen voor je leden, zoals een aantal trainingen per maand. Voortgang en badges zijn zichtbaar in de ledenapp.' },
      { titel: 'Berichten', tekst: 'Nieuws en acties die je leden in de ledenapp zien.' },
    ],
  },
]
