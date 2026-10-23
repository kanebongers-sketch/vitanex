// ─── AI Your Gym: de gratis overstapchecklist (PUUR) ────────────────────────
// Een hulpmiddel zonder poort (geen e-mailadres): alles wat een sportschool
// regelt bij het overstappen naar nieuwe clubsoftware. De voortgang bewaart de
// browser van de bezoeker zelf (localStorage); hier staat alleen de inhoud en
// de rekenregels, zonder browser, zodat het te testen is.
// Eerlijk: wat niet meekomt (incasso, betaalhistorie, bezoekhistorie) staat
// ook in inhoud/eerlijk.ts (KOMT_NIET_MEE); de punten hier spreken dat niet tegen.

export interface ChecklistPunt {
  /** Vast en uniek, want de voortgang wordt hierop bewaard. Nooit hernoemen. */
  id: string
  tekst: string
  uitleg?: string
}

export interface ChecklistGroep {
  sleutel: string
  titel: string
  /** Wanneer je dit doet, kort. */
  wanneer: string
  punten: readonly ChecklistPunt[]
}

/** De sleutel in localStorage. Een nieuwe versie (v2) alleen als de id's veranderen. */
export const CHECKLIST_OPSLAG = 'ayg-overstapchecklist-v1'

export const OVERSTAP_CHECKLIST: readonly ChecklistGroep[] = [
  {
    sleutel: 'voorbereiden',
    titel: 'Voorbereiden',
    wanneer: 'Een paar weken vooraf',
    punten: [
      { id: 'startdatum', tekst: 'Kies een startdatum buiten je drukste weken', uitleg: 'Na een vakantie of begin van de maand werkt vaak het rustigst.' },
      { id: 'wat-nu', tekst: 'Schrijf op wat je huidige systeem nu voor je doet', uitleg: 'Check-in, lesrooster, schema’s, ledenapp, roosters van het team, cijfers.' },
      { id: 'wat-blijft', tekst: 'Bepaal wat in je ledenadministratie blijft', uitleg: 'Incasso, abonnementen en facturen van leden horen daar, niet in je clubsoftware.' },
      { id: 'opzegtermijn', tekst: 'Zoek je opzegtermijn en einddatum op bij je huidige leverancier' },
      { id: 'trekker', tekst: 'Spreek af wie in je team de overstap trekt', uitleg: 'Een persoon die het overzicht houdt en vragen van het team opvangt.' },
    ],
  },
  {
    sleutel: 'gegevens',
    titel: 'Gegevens verzamelen',
    wanneer: 'De week voor de start',
    punten: [
      { id: 'ledenlijst', tekst: 'Exporteer je ledenlijst als CSV', uitleg: 'Naam, e-mailadres, telefoon, geboortedatum, lidmaatschap, lid sinds en je eigen lidnummer.' },
      { id: 'opschonen', tekst: 'Haal dubbele leden en lege e-mailadressen uit de lijst', uitleg: 'Zonder e-mailadres kan een lid geen uitnodiging voor de app krijgen.' },
      { id: 'rooster', tekst: 'Noteer je lesrooster', uitleg: 'Lessen, zalen, dagen, tijden en het maximum aantal plekken.' },
      { id: 'regels', tekst: 'Schrijf je regels op voor reserveren, annuleren en niet komen' },
      { id: 'historie', tekst: 'Bewaar een export van bezoek en betalingen uit je oude systeem', uitleg: 'Die geschiedenis komt meestal niet mee; zo heb je hem toch.' },
      { id: 'schemas', tekst: 'Verzamel de lopende trainingsschema’s van je leden' },
    ],
  },
  {
    sleutel: 'inrichten',
    titel: 'Inrichten',
    wanneer: 'Een paar dagen voor de start',
    punten: [
      { id: 'huisstijl', tekst: 'Zet je logo en accentkleur klaar' },
      { id: 'vestigingen', tekst: 'Vul per vestiging de openingstijden en sluitingsdagen in' },
      { id: 'team', tekst: 'Nodig je team uit en bepaal wat elke rol mag zien' },
      { id: 'inlezen', tekst: 'Lees de ledenlijst in en controleer het voorbeeld voordat je opslaat' },
      { id: 'proefdraaien', tekst: 'Proefdraaien met je team', uitleg: 'Inchecken, een les reserveren, een schema maken en de ledenapp op een telefoon.' },
    ],
  },
  {
    sleutel: 'leden',
    titel: 'Leden meenemen',
    wanneer: 'Rond de startdatum',
    punten: [
      { id: 'aankondigen', tekst: 'Kondig de overstap aan, met de datum waarop de nieuwe app begint' },
      { id: 'poster', tekst: 'Hang een poster met QR-code bij de balie', uitleg: 'Dan zetten leden de app ter plekke op hun telefoon.' },
      { id: 'balie', tekst: 'Leg je team uit wat ze zeggen bij vragen van leden' },
      { id: 'naast-elkaar', tekst: 'Laat beide systemen kort naast elkaar lopen, met een duidelijke einddatum' },
    ],
  },
  {
    sleutel: 'na-de-start',
    titel: 'Na de start',
    wanneer: 'De eerste maand',
    punten: [
      { id: 'nog-niet-in-app', tekst: 'Kijk na een week wie nog niet in de app zit, en spreek ze aan' },
      { id: 'oude-opzeggen', tekst: 'Zeg het oude systeem op, op tijd voor de einddatum' },
      { id: 'evaluatie', tekst: 'Plan na een maand een korte evaluatie met je team' },
    ],
  },
]

/** Alle id's in de volgorde van de lijst. */
export function alleIds(groepen: readonly ChecklistGroep[] = OVERSTAP_CHECKLIST): string[] {
  return groepen.flatMap((g) => g.punten.map((p) => p.id))
}

/**
 * De bewaarde voortgang uit localStorage. Alles wat geen lijst van bekende id's
 * is (oude versie, handmatig aangepast, kapot) telt niet mee.
 */
export function leesVoortgang(ruw: string | null, groepen: readonly ChecklistGroep[] = OVERSTAP_CHECKLIST): ReadonlySet<string> {
  if (!ruw) return new Set()
  let waarde: unknown
  try {
    waarde = JSON.parse(ruw)
  } catch {
    return new Set()
  }
  if (!Array.isArray(waarde)) return new Set()
  const bekend = new Set(alleIds(groepen))
  return new Set(waarde.filter((v): v is string => typeof v === 'string' && bekend.has(v)))
}

/** Om te bewaren: de afgevinkte id's in de volgorde van de lijst. */
export function bewaarVoortgang(gedaan: ReadonlySet<string>, groepen: readonly ChecklistGroep[] = OVERSTAP_CHECKLIST): string {
  return JSON.stringify(alleIds(groepen).filter((id) => gedaan.has(id)))
}

/** Een nieuwe set met dit punt omgezet (aan of uit). */
export function wissel(gedaan: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const nieuw = new Set(gedaan)
  if (nieuw.has(id)) nieuw.delete(id)
  else nieuw.add(id)
  return nieuw
}

export interface Voortgang {
  klaar: number
  totaal: number
  /** Afgerond naar beneden, zodat 100 pas staat als alles af is. */
  procent: number
}

export function voortgangVan(gedaan: ReadonlySet<string>, punten: readonly ChecklistPunt[]): Voortgang {
  const totaal = punten.length
  const klaar = punten.filter((p) => gedaan.has(p.id)).length
  return { klaar, totaal, procent: totaal === 0 ? 0 : Math.floor((klaar / totaal) * 100) }
}

export function totaleVoortgang(gedaan: ReadonlySet<string>, groepen: readonly ChecklistGroep[] = OVERSTAP_CHECKLIST): Voortgang {
  return voortgangVan(gedaan, groepen.flatMap((g) => g.punten))
}
