import { woordenboek } from '../../woordenboek'
import type { Taal } from '../../taal'
import { GROEP_LABEL, RAPPORTEN } from '@/lib/club/rapporten/definities'
import { OPVOLGEN } from './opvolgen'

// Rapporten en exports in Club. De Nederlandse namen, uitleg en telling komen
// uit src/lib/club/rapporten/definities.ts (bron); het Engels staat ernaast.
// Kolomnamen vertaalt kolomIn(), voor het voorbeeld en de koppen van de CSV.

const nlRapport = (s: keyof typeof RAPPORTEN) => ({ titel: RAPPORTEN[s].titel, uitleg: RAPPORTEN[s].uitleg, telling: RAPPORTEN[s].telling })

export const RAPPORTEN_TEKST = woordenboek({
  nl: {
    titel: 'Rapporten',
    laden: 'Rapport laden',
    boventitel: 'Beheer · rapporten en exports',
    intro: 'Elk rapport beslaat een hele kalendermaand, van de 1e tot en met de laatste dag. Bekijk de eerste rijen en download het geheel als CSV voor Excel.',
    groepen: GROEP_LABEL,
    rapporten: {
      ledenlijst: nlRapport('ledenlijst'),
      instroom: nlRapport('instroom'),
      bezoek: nlRapport('bezoek'),
      bezetting: nlRapport('bezetting'),
      noshows: nlRapport('noshows'),
      leads: nlRapport('leads'),
      afspraken: nlRapport('afspraken'),
      uren: nlRapport('uren'),
      opvolging: nlRapport('opvolging'),
    },
    keuzes: {
      rapport: 'Rapport',
      maand: 'Kalendermaand',
      kiesMaand: 'Kies een maand',
      vestigingen: 'Vestigingen',
      geenVinkje: 'Niets aangevinkt? Dan geldt de vestiging van de balk bovenin.',
      bezig: 'Bezig met laden',
      toon: 'Toon voorbeeld',
    },
    voorbeeld: {
      leeg: 'leeg',
      alleN: (n: number) => `Alle ${n} vestigingen`,
      periode: (eind: number, maand: string) => `1 tot en met ${eind} ${maand}`,
      lopend: 'Lopende maand',
      totVandaag: (dag: string) => `tot en met vandaag (${dag})`,
      rijen: (n: number) => (n === 1 ? 'rij' : 'rijen'),
      download: 'Download CSV',
      geteld: 'Zo is het geteld.',
      csvUitleg: 'CSV voor Excel: puntkomma als scheiding, UTF-8, datums als dd-mm-jjjj, uren met een komma. Elke download komt in het logboek.',
      geenGegevens: 'Geen gegevens in deze maand voor de gekozen vestigingen.',
      afgekapt: (totaal: string, max: string) => `Dit rapport heeft ${totaal} rijen; de export bevat de eerste ${max}. Kies minder vestigingen voor een volledig bestand.`,
      onvolledig: 'Niet alle gegevens konden worden geladen; de cijfers zijn een ondergrens.',
      bijschrift: (n: number) => `Voorbeeld: de eerste ${n} rijen`,
      eerste: (n: number, totaal: string) => `Je ziet de eerste ${n} van ${totaal} rijen. De download bevat ze allemaal.`,
      alle: (totaal: string, n: number) => `Dit zijn alle ${totaal} ${n === 1 ? 'rij' : 'rijen'}.`,
      fout: 'Het rapport kon niet worden gemaakt. Probeer het later opnieuw.',
    },
  },
  en: {
    titel: 'Reports',
    laden: 'Loading report',
    boventitel: 'Management · reports and exports',
    intro: 'Each report covers a whole calendar month, from the 1st to the last day. Look at the first rows and download the full report as a CSV for Excel.',
    groepen: {
      leden: 'Members and visits',
      lessen: 'Classes and leads',
      team: 'Team',
    },
    rapporten: {
      ledenlijst: {
        titel: 'Member list',
        uitleg: 'Everyone who was a member during the month, with contact details and membership.',
        telling: 'A member if the start date is on or before the last day and there is no end date, or the end date is on or after the first day. Without date of birth or health data.',
      },
      instroom: {
        titel: 'Joiners and cancellations',
        uitleg: 'Who joined during the month and whose membership ended during the month.',
        telling: 'New: start date in the month. Cancellation: end date in the month. A member can appear in both.',
      },
      bezoek: {
        titel: 'Visits per member',
        uitleg: 'For each member how often they came during the month, with the first and last visit.',
        telling: 'A visit day is a calendar day (Dutch time) with at least one check-in at one of the chosen locations. Members without a check-in are not included.',
      },
      bezetting: {
        titel: 'Group class occupancy',
        uitleg: 'Every class of the month with capacity, bookings, attendance and waiting list.',
        telling: 'Taken = booked, attended or no-show. Occupancy = taken divided by capacity. Cancelled classes are included with the status Cancelled.',
      },
      noshows: {
        titel: 'No-shows',
        uitleg: 'Who had a class or appointment and did not come, or cancelled too late.',
        telling: 'Classes: bookings with the status no-show and cancellations that were too late. Appointments: the status Did not come.',
      },
      leads: {
        titel: 'Leads with source and status',
        uitleg: 'All leads that came in during the month, with source, status and trial class.',
        telling: 'A lead counts in the month in which it was created. The status is the current one.',
      },
      afspraken: {
        titel: 'Appointments per trainer',
        uitleg: 'For each trainer and location how many appointments there were and how they went.',
        telling: 'Appointments with a start time in the month. Hours count all appointments except cancelled ones, without buffer.',
      },
      uren: {
        titel: 'Worked and approved hours',
        uitleg: 'For each staff member the hours from the staff rota: planned, worked, approved and processed.',
        telling: 'Worked = actual time minus break, from the status Worked. Approved also includes what has already been processed. Sick leave and holiday at the planned time. Open shifts without a staff member are not counted.',
      },
      opvolging: {
        titel: 'Follow-up tasks completed',
        uitleg: 'For each staff member how many member retention follow-up tasks were completed during the month.',
        telling: 'Tasks with the status Done or Skipped and a completion date in the month, under the name of who completed them. Notes are not included.',
      },
    },
    keuzes: {
      rapport: 'Report',
      maand: 'Calendar month',
      kiesMaand: 'Choose a month',
      vestigingen: 'Locations',
      geenVinkje: 'Nothing ticked? Then the location in the bar at the top applies.',
      bezig: 'Loading',
      toon: 'Show preview',
    },
    voorbeeld: {
      leeg: 'empty',
      alleN: (n: number) => `All ${n} locations`,
      periode: (eind: number, maand: string) => `1 to ${eind} ${maand}`,
      lopend: 'Month in progress',
      totVandaag: (dag: string) => `up to and including today (${dag})`,
      rijen: (n: number) => (n === 1 ? 'row' : 'rows'),
      download: 'Download CSV',
      geteld: 'How it is counted.',
      csvUitleg: 'CSV for Excel: semicolon as separator, UTF-8, dates as dd-mm-yyyy, hours with a decimal comma. Every download is recorded in the log.',
      geenGegevens: 'No data this month for the chosen locations.',
      afgekapt: (totaal: string, max: string) => `This report has ${totaal} rows; the export contains the first ${max}. Choose fewer locations for a complete file.`,
      onvolledig: 'Not all data could be loaded; the figures are a lower bound.',
      bijschrift: (n: number) => `Preview: the first ${n} rows`,
      eerste: (n: number, totaal: string) => `You are seeing the first ${n} of ${totaal} rows. The download contains all of them.`,
      alle: (totaal: string, n: number) => `These are all ${totaal} ${n === 1 ? 'row' : 'rows'}.`,
      fout: 'The report could not be created. Please try again later.',
    },
  },
})

/** Engelse namen van de kolommen (het Nederlands is de kolomnaam zelf). */
const KOLOM_EN: Readonly<Record<string, string>> = {
  Lidnummer: 'Member number',
  Voornaam: 'First name',
  Achternaam: 'Last name',
  'E-mail': 'Email',
  Telefoon: 'Phone',
  Vestiging: 'Location',
  Abonnement: 'Membership',
  Status: 'Status',
  'Lid sinds': 'Member since',
  Einddatum: 'End date',
  Soort: 'Type',
  Datum: 'Date',
  Thuisvestiging: 'Home location',
  Bezoekdagen: 'Visit days',
  'Check-ins': 'Check-ins',
  'Eerste bezoek': 'First visit',
  'Laatste bezoek': 'Last visit',
  'Bezochte vestigingen': 'Locations visited',
  Begintijd: 'Start time',
  Les: 'Class',
  Instructeur: 'Instructor',
  Capaciteit: 'Capacity',
  Bezet: 'Taken',
  Aanwezig: 'Attended',
  'No-show': 'No-show',
  Wachtlijst: 'Waiting list',
  'Bezetting (%)': 'Occupancy (%)',
  Tijd: 'Time',
  'Les of afspraak': 'Class or appointment',
  Binnengekomen: 'Received',
  Naam: 'Name',
  Bron: 'Source',
  Interesse: 'Interest',
  Proefles: 'Trial class',
  'Verloren reden': 'Reason lost',
  Medewerker: 'Staff member',
  Afspraken: 'Appointments',
  Geweest: 'Attended',
  'Niet gekomen': 'Did not come',
  Geannuleerd: 'Cancelled',
  'Nog gepland': 'Still planned',
  Uren: 'Hours',
  Diensten: 'Shifts',
  'Gepland (uren)': 'Planned (hours)',
  'Gewerkt (uren)': 'Worked (hours)',
  'Goedgekeurd (uren)': 'Approved (hours)',
  'Verwerkt (uren)': 'Processed (hours)',
  'Nog goed te keuren (uren)': 'Awaiting approval (hours)',
  'Ziek (uren)': 'Sick (hours)',
  'Verlof (uren)': 'Holiday (hours)',
  'Afgehandeld door': 'Completed by',
  Totaal: 'Total',
  Gedaan: 'Done',
  Overgeslagen: 'Skipped',
}

/** Een kolomnaam van een rapport in de gekozen taal (ook de namen van de opvolgregels). */
export function kolomIn(kolom: string, taal: Taal): string {
  if (taal === 'nl') return kolom
  if (KOLOM_EN[kolom]) return KOLOM_EN[kolom]
  const regel = Object.entries(OPVOLGEN.nl.regel).find(([, r]) => r.titel === kolom)?.[0] as keyof typeof OPVOLGEN.nl.regel | undefined
  return regel ? OPVOLGEN.en.regel[regel].titel : kolom
}
