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
    kop: 'Je club draait, ook zonder jou.',
    intro: 'Je team weet wat er moet gebeuren. Jij bepaalt de regels.',
    functies: [
      { titel: 'Live in een kwartier', tekst: 'Acht stappen in de startwizard, inclusief je team en je ledenbestand.' },
      { titel: 'Balie en dienst', tekst: 'Check-in met QR of op naam, taken, poetslijsten en overdracht op een vaste plek.' },
      { titel: 'Vestigingen, rollen, huisstijl', tekst: 'Eigen regels per vestiging, rechten per rol, jouw logo en kleuren.' },
    ],
  },
  {
    sleutel: 'coaching',
    naam: 'Coaching',
    kop: 'Schema’s waar een trainer trots op is.',
    intro: 'Van intake tot schema, met de coaching die je anders op de vloer geeft.',
    functies: [
      { titel: 'Intake en schema', tekst: 'Een startvoorstel uit de intake, met supersets, RPE en tempo.' },
      { titel: 'Coaching in 3D', tekst: '3 tot 5 kernpunten per oefening en een beeld dat de herhalingen meetelt.' },
      { titel: 'Voeding en voortgang', tekst: 'Een voedingsplan per lid en elke gelogde set op een tijdlijn.' },
    ],
  },
  {
    sleutel: 'planning',
    naam: 'Planning',
    kop: 'Lessen, afspraken en diensten zonder gepuzzel.',
    intro: 'Rooster, agenda en uren op dezelfde plek.',
    functies: [
      { titel: 'Groepslessen', tekst: 'Reserveren in de app, met wachtlijst en jouw regels voor annuleren.' },
      { titel: 'Afspraken met trainers', tekst: 'Intakes en personal training, meteen in de agenda van de trainer.' },
      { titel: 'Rooster en uren', tekst: 'Diensten per week, uren van gepland tot verwerkt, klaar voor export.' },
    ],
  },
  {
    sleutel: 'groei',
    naam: 'Groei',
    kop: 'Meer leden binnen. En zien wat werkt.',
    intro: 'Van proefles tot lid, gemeten per kalendermaand.',
    functies: [
      { titel: 'Leads en opvolgen', tekst: 'Elke proefles in beeld en een lijst van wie je vandaag belt.' },
      { titel: 'Cijfers per maand', tekst: 'Groei, bezoek, bezetting en behoud, van de eerste tot de laatste dag.' },
      { titel: 'Rapporten', tekst: 'Elk overzicht als tabel of als CSV.' },
    ],
  },
  {
    sleutel: 'betrokkenheid',
    naam: 'Betrokkenheid',
    kop: 'Leden die blijven, omdat ze zich gezien voelen.',
    intro: 'Een eigen app voor je leden en alles over een lid op een kaart.',
    functies: [
      { titel: 'Ledenapp in jouw huisstijl', tekst: 'Reserveren, inchecken, schema en voortgang op het beginscherm.' },
      { titel: 'Ledenkaart', tekst: 'Alles over een lid op een plek. Gezondheidsgegevens alleen met toestemming.' },
      { titel: 'Ledenbehoud', tekst: 'Zeven opvolgregels die je aan of uit zet, plus challenges en berichten.' },
    ],
  },
]
