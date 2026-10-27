// De secties op Vandaag in Club (besluit Kane 27-10-2026, minder tabbladen):
// check-in, taken en opvolgen staan op het dagscherm, met links naar hun
// volledige schermen. De bestaande teksten van die onderdelen zelf staan nog in
// de componenten; nieuwe teksten van Vandaag komen hier.

import { woordenboek } from '../../woordenboek'

export const VANDAAG_SECTIES = woordenboek({
  nl: {
    checkin: {
      titel: 'Check-in',
      sub: 'Scan de QR-code of een bandje, of zoek op naam of lidnummer.',
      balie: 'Volledig scherm',
      kiosk: 'Zelf-check-in scherm',
    },
    taken: {
      titel: 'Taken vandaag',
      sub: 'Tik op een vakje om af te vinken. Sluit de dag af met de afsluitronde.',
      week: 'Hele week',
      overzicht: 'Overzicht',
      beheer: 'Lijsten beheren',
    },
    opvolgen: {
      titel: 'Opvolgen',
      sub: 'Wie je vandaag belt, appt of aanspreekt. Club verstuurt zelf niets.',
      leden: 'Leden',
      lijst: 'Volledige lijst',
      regels: 'Opvolgregels',
      fout: 'De opvolglijst kon niet worden geladen. Ververs de pagina of probeer het later opnieuw.',
      allesUit: 'Alle opvolgregels staan uit, dus Club zet niemand klaar.',
    },
    laden: 'Bezig met laden',
  },
  en: {
    checkin: {
      titel: 'Check-in',
      sub: 'Scan the QR code or a wristband, or search by name or member number.',
      balie: 'Full screen',
      kiosk: 'Self check-in screen',
    },
    taken: {
      titel: 'Tasks today',
      sub: 'Tap a box to tick it off. Close the day with the closing round.',
      week: 'Whole week',
      overzicht: 'Overview',
      beheer: 'Manage lists',
    },
    opvolgen: {
      titel: 'Follow-up',
      sub: 'Who to call, message or talk to today. Club never sends anything itself.',
      leden: 'Members',
      lijst: 'Full list',
      regels: 'Follow-up rules',
      fout: 'The follow-up list could not be loaded. Refresh the page or try again later.',
      allesUit: 'All follow-up rules are off, so Club lists nobody.',
    },
    laden: 'Loading',
  },
})
