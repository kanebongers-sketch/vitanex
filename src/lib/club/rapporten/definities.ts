// ─── Club: rapporten en exports, de definities (PUUR) ───────────────────────
// Elk rapport is een tabel over een kalendermaand (de 1e tot en met de laatste
// dag) en een of meer vestigingen van de sportschool. De kolommen staan hier,
// zodat voorbeeld en CSV altijd dezelfde opbouw hebben. Nooit gezondheidsdata:
// geen metingen, intake-antwoorden, notities of geboortedata.

import { REGEL_DEFINITIES, REGEL_SLEUTELS } from '@/lib/club/automatisering/regels'

export const RAPPORT_SLEUTELS = ['ledenlijst', 'instroom', 'bezoek', 'bezetting', 'noshows', 'leads', 'afspraken', 'uren', 'opvolging'] as const
export type RapportSleutel = (typeof RAPPORT_SLEUTELS)[number]

export const RAPPORT_GROEPEN = ['leden', 'lessen', 'team'] as const
export type RapportGroep = (typeof RAPPORT_GROEPEN)[number]

export const GROEP_LABEL: Record<RapportGroep, string> = {
  leden: 'Leden en bezoek',
  lessen: 'Lessen en leads',
  team: 'Team',
}

export interface RapportDefinitie {
  sleutel: RapportSleutel
  titel: string
  /** Wat erin staat, in gewone taal. */
  uitleg: string
  /** Hoe er geteld is, onder het voorbeeld. */
  telling: string
  groep: RapportGroep
  kolommen: readonly string[]
}

const OPVOLG_KOLOMMEN = REGEL_SLEUTELS.map((s) => REGEL_DEFINITIES[s].titel)

export const RAPPORTEN: Record<RapportSleutel, RapportDefinitie> = {
  ledenlijst: {
    sleutel: 'ledenlijst',
    titel: 'Ledenlijst',
    uitleg: 'Iedereen die in de maand lid was, met contactgegevens en abonnement.',
    telling: 'Lid als de startdatum op of voor de laatste dag ligt en er geen einddatum is, of de einddatum op of na de eerste dag. Zonder geboortedatum of gezondheidsgegevens.',
    groep: 'leden',
    kolommen: ['Lidnummer', 'Voornaam', 'Achternaam', 'E-mail', 'Telefoon', 'Vestiging', 'Abonnement', 'Status', 'Lid sinds', 'Einddatum'],
  },
  instroom: {
    sleutel: 'instroom',
    titel: 'Nieuwe leden en opzeggingen',
    uitleg: 'Wie er in de maand bij kwam en wiens lidmaatschap in de maand eindigde.',
    telling: 'Nieuw: startdatum in de maand. Opzegging: einddatum in de maand. Een lid kan in beide staan.',
    groep: 'leden',
    kolommen: ['Soort', 'Datum', 'Lidnummer', 'Voornaam', 'Achternaam', 'Vestiging', 'Abonnement', 'Status'],
  },
  bezoek: {
    sleutel: 'bezoek',
    titel: 'Bezoek per lid',
    uitleg: 'Per lid hoe vaak het in de maand kwam, met het eerste en laatste bezoek.',
    telling: 'Een bezoekdag is een kalenderdag (Nederlandse tijd) met minstens een check-in in een van de gekozen vestigingen. Leden zonder check-in staan er niet in.',
    groep: 'leden',
    kolommen: ['Lidnummer', 'Voornaam', 'Achternaam', 'Thuisvestiging', 'Bezoekdagen', 'Check-ins', 'Eerste bezoek', 'Laatste bezoek', 'Bezochte vestigingen'],
  },
  bezetting: {
    sleutel: 'bezetting',
    titel: 'Bezetting groepslessen',
    uitleg: 'Elke les van de maand met capaciteit, boekingen, aanwezigen en wachtlijst.',
    telling: 'Bezet = geboekt, aanwezig of no-show. Bezetting = bezet gedeeld door capaciteit. Geannuleerde lessen staan erin met de status Geannuleerd.',
    groep: 'lessen',
    kolommen: ['Datum', 'Begintijd', 'Les', 'Instructeur', 'Vestiging', 'Capaciteit', 'Bezet', 'Aanwezig', 'No-show', 'Wachtlijst', 'Bezetting (%)', 'Status'],
  },
  noshows: {
    sleutel: 'noshows',
    titel: 'No-shows',
    uitleg: 'Wie een les of afspraak had en niet kwam, of te laat afmeldde.',
    telling: 'Lessen: reserveringen met de status no-show en annuleringen die te laat waren. Afspraken: de status Niet gekomen.',
    groep: 'lessen',
    kolommen: ['Datum', 'Tijd', 'Soort', 'Les of afspraak', 'Lidnummer', 'Voornaam', 'Achternaam', 'Vestiging'],
  },
  leads: {
    sleutel: 'leads',
    titel: 'Leads met bron en status',
    uitleg: 'Alle leads die in de maand binnenkwamen, met bron, status en proefles.',
    telling: 'Een lead telt in de maand waarin hij is aangemaakt. De status is die van nu.',
    groep: 'lessen',
    kolommen: ['Binnengekomen', 'Naam', 'E-mail', 'Telefoon', 'Vestiging', 'Bron', 'Interesse', 'Status', 'Proefles', 'Verloren reden', 'Medewerker'],
  },
  afspraken: {
    sleutel: 'afspraken',
    titel: 'Afspraken per trainer',
    uitleg: 'Per trainer en vestiging hoeveel afspraken er waren en hoe ze afliepen.',
    telling: 'Afspraken met een begintijd in de maand. Uren tellen alle afspraken behalve geannuleerde, zonder buffer.',
    groep: 'team',
    kolommen: ['Medewerker', 'Vestiging', 'Afspraken', 'Geweest', 'Niet gekomen', 'Geannuleerd', 'Nog gepland', 'Uren'],
  },
  uren: {
    sleutel: 'uren',
    titel: 'Gewerkte en goedgekeurde uren',
    uitleg: 'Per medewerker de uren uit het personeelsrooster: gepland, gewerkt, goedgekeurd en verwerkt.',
    telling: 'Gewerkt = werkelijke tijd min pauze, vanaf de status Gewerkt. Goedgekeurd telt ook wat al verwerkt is. Ziek en verlof op de geplande tijd. Open diensten zonder medewerker tellen niet.',
    groep: 'team',
    kolommen: ['Medewerker', 'Vestiging', 'Diensten', 'Gepland (uren)', 'Gewerkt (uren)', 'Goedgekeurd (uren)', 'Verwerkt (uren)', 'Nog goed te keuren (uren)', 'Ziek (uren)', 'Verlof (uren)'],
  },
  opvolging: {
    sleutel: 'opvolging',
    titel: 'Opvolgtaken afgehandeld',
    uitleg: 'Per medewerker hoeveel opvolgtaken voor ledenbehoud in de maand zijn afgehandeld.',
    telling: 'Taken met de status Gedaan of Overgeslagen en een afhandeldatum in de maand, op naam van wie ze afhandelde. Notities gaan niet mee.',
    groep: 'team',
    kolommen: ['Afgehandeld door', 'Vestiging', 'Totaal', 'Gedaan', 'Overgeslagen', ...OPVOLG_KOLOMMEN],
  },
}

export function isRapport(v: unknown): v is RapportSleutel {
  return typeof v === 'string' && (RAPPORT_SLEUTELS as readonly string[]).includes(v)
}

/** Rapport uit de URL; onbekend = de ledenlijst. */
export function kiesRapport(ruw: string | string[] | undefined | null): RapportSleutel {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  return isRapport(waarde) ? waarde : 'ledenlijst'
}

/** De rapporten van een groep, in vaste volgorde. */
export function rapportenIn(groep: RapportGroep): RapportDefinitie[] {
  return RAPPORT_SLEUTELS.map((s) => RAPPORTEN[s]).filter((r) => r.groep === groep)
}
