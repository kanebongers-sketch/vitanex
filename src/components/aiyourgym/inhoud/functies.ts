// ─── AI Your Gym: wat Club kan, in gewone taal (PUUR) ───────────────────────
// Alleen functies die Club echt heeft (zie src/components/club/shell/onderdelen.ts
// en src/lib/club/**). Nieuwe functie in Club? Pas hem hier pas aan als hij af is.

export type GroepSleutel = 'werkvloer' | 'leden' | 'planning' | 'coaching' | 'beheer'

export interface Functie {
  titel: string
  tekst: string
}

export interface FunctieGroep {
  sleutel: GroepSleutel
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
}

export const FUNCTIE_GROEPEN: readonly FunctieGroep[] = [
  {
    sleutel: 'werkvloer',
    naam: 'Werkvloer',
    kop: 'Wat er vandaag in je club gebeurt.',
    intro: 'Een startscherm voor de dienst: wie er binnen is, wat er nog moet gebeuren en wie je vandaag even aanspreekt.',
    functies: [
      { titel: 'Check-in aan de balie', tekst: 'Inchecken met de QR-code uit de ledenapp of op naam. Je ziet direct wie er binnen is, en AI Your Gym checkt of het lidmaatschap toegang geeft tot deze vestiging.' },
      { titel: 'Taken en poetslijsten', tekst: 'Dagelijkse taken, de afsluitronde en een poetsrooster met een minimum per week. In een overzichtelijke tabel per dag of per week, afvinken met een tik.' },
      { titel: 'Opvolgen', tekst: 'Een lijst van wie je vandaag belt of aanspreekt: nieuwe leden, proefleden, leden die lang niet zijn geweest. Zo valt niemand tussen wal en schip.' },
      { titel: 'Notities en overdracht', tekst: 'Afspraken en kennis voor de volgende dienst op een vaste plek, in plaats van op een briefje achter de balie.' },
    ],
  },
  {
    sleutel: 'leden',
    naam: 'Leden',
    kop: 'Ieder lid in beeld, en blijvend betrokken.',
    intro: 'Van eerste proefles tot trouw lid: alles over een lid op een kaart, en hulpmiddelen om leden te houden.',
    functies: [
      { titel: 'Ledenkaart', tekst: 'Gegevens, bezoek, lidmaatschap, labels, notities en status van een lid op een plek. Gezondheidsgegevens alleen met toestemming van het lid.' },
      { titel: 'Leads en proeflessen', tekst: 'Nieuwe aanmeldingen met bron en status. Je ziet wie een proefles had en wie nog opgevolgd moet worden.' },
      { titel: 'Automatiseringen voor ledenbehoud', tekst: 'Zeven regels die je per sportschool aan of uit zet: welkomstgesprek, proeflid opvolgen, lang niet gezien, risico op afhaken, verjaardag, exitgesprek en mijlpaal. Met een eigen drempel en een voorbeeldtekst.' },
      { titel: 'Challenges en badges', tekst: 'Doelen voor je leden, zoals een aantal trainingen per maand. Voortgang en badges zijn zichtbaar in de ledenapp.' },
      { titel: 'Berichten', tekst: 'Nieuws en acties die je leden in de ledenapp zien.' },
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
    sleutel: 'beheer',
    naam: 'Beheer',
    kop: 'Jouw sportschool, jouw regels.',
    intro: 'Een instellingencentrum waar de eigenaar alles regelt, en cijfers die je per kalendermaand vergelijkt.',
    functies: [
      { titel: 'Cijfers per kalendermaand', tekst: 'Groei, bezoek, bezetting van lessen en behoud, steeds van de eerste tot de laatste dag van de maand.' },
      { titel: 'Rapporten en exports', tekst: 'Ledenlijst, instroom en opzeggingen, bezoek, bezetting, no-shows, leads, afspraken, uren en opvolging. Als tabel of als CSV.' },
      { titel: 'Eigen logo en kleuren', tekst: 'Je eigen naam, logo, accentkleur en een donker of licht thema, in de software en in de ledenapp. Een kleur met te weinig contrast wordt automatisch bijgesteld.' },
      { titel: 'Rechten per rol', tekst: 'De eigenaar mag alles. Voor de clubmanager vink je zelf aan welke onderdelen die ziet.' },
      { titel: 'Meerdere vestigingen', tekst: 'Elke vestiging met eigen zalen, lessen, openingstijden en regels, en lidmaatschappen die bepalen waar een lid mag sporten.' },
      { titel: 'Eigen adres', tekst: 'Je eigen omgeving op naam.aiyourgym.com. Onderdelen die je niet gebruikt zet je uit.' },
    ],
  },
]
