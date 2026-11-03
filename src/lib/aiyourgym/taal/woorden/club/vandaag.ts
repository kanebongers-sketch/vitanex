// De secties op Vandaag in Club (besluit Kane 27-10-2026, minder tabbladen):
// check-in, taken en opvolgen staan op het dagscherm, met links naar hun
// volledige schermen. De bestaande teksten van die onderdelen zelf staan nog in
// de componenten; nieuwe teksten van Vandaag komen hier.
// Ontwerp "Club in 10 minuten" (03-11-2026): een hoofdactie bovenaan (Inchecken),
// Opvolgen heet "Bellen vandaag" en zonder takenlijst staat er een knop.
// Bellen vandaag toont hoogstens vijf gesprekken (belijst.ts), met "Alle n bekijken".

import { woordenboek } from '../../woordenboek'

export const VANDAAG_SECTIES = woordenboek({
  nl: {
    checkin: {
      titel: 'Check-in',
      sub: 'Scan de QR-code of een bandje, of zoek op naam.',
      balie: 'Volledig scherm',
      hoofdactie: 'Inchecken',
      hoofdactieUitleg: 'Check-in op volledig scherm openen',
      kiosk: 'Zelf-check-in scherm',
    },
    taken: {
      titel: 'Taken vandaag',
      sub: 'Tik op een vakje om af te vinken.',
      week: 'Hele week',
      overzicht: 'Overzicht',
      beheer: 'Lijsten beheren',
      geenLijst: 'Nog geen takenlijst voor openen, sluiten of poetsen.',
      maken: 'Takenlijst maken',
    },
    opvolgen: {
      titel: 'Bellen vandaag',
      sub: 'Wie je vandaag belt of aanspreekt. Club verstuurt zelf niets.',
      leden: 'Leden',
      lijst: 'Alles opvolgen',
      alle: (n: number) => `Alle ${n} bekijken`,
      subMeer: (getoond: number, totaal: number) => `De ${getoond} belangrijkste van ${totaal}. De rest staat in de volledige lijst.`,
      regels: 'Opvolgregels',
      fout: 'De opvolglijst kon niet worden geladen. Ververs de pagina of probeer het later opnieuw.',
      allesUit: 'Alle opvolgregels staan uit, dus Club zet niemand klaar.',
    },
    laden: 'Bezig met laden',
  },
  en: {
    checkin: {
      titel: 'Check-in',
      sub: 'Scan the QR code or a wristband, or search by name.',
      balie: 'Full screen',
      hoofdactie: 'Check in',
      hoofdactieUitleg: 'Open check-in in full screen',
      kiosk: 'Self check-in screen',
    },
    taken: {
      titel: 'Tasks today',
      sub: 'Tap a box to tick it off.',
      week: 'Whole week',
      overzicht: 'Overview',
      beheer: 'Manage lists',
      geenLijst: 'No task list yet for opening, closing or cleaning.',
      maken: 'Create task list',
    },
    opvolgen: {
      titel: 'Calls today',
      sub: 'Who to call or talk to today. Club never sends anything itself.',
      leden: 'Members',
      lijst: 'All follow-ups',
      alle: (n: number) => `View all ${n}`,
      subMeer: (getoond: number, totaal: number) => `The ${getoond} most important of ${totaal}. The rest is in the full list.`,
      regels: 'Follow-up rules',
      fout: 'The follow-up list could not be loaded. Refresh the page or try again later.',
      allesUit: 'All follow-up rules are off, so Club lists nobody.',
    },
    laden: 'Loading',
  },
})
