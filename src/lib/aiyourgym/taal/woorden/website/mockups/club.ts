// De beheer- en werkvloerschermen in de productbeelden: cijfers en personeel
// (mockups/BeheerSchermen.tsx), check-in, taken en opvolgen (WerkvloerSchermen.tsx),
// het lesrooster (RoosterScherm.tsx) en het ledenbestand inlezen (ImportScherm.tsx).
// Waar het beeld een naam uit Club laat zien (opvolgregels, importvelden), komt het
// Nederlands uit Club zelf. Namen van mensen en lessen zijn voorbeelden en blijven gelijk.

import { REGEL_DEFINITIES } from '@/lib/club/automatisering/regels'
import { IMPORT_VELD_LABEL } from '@/lib/club/leden/import/kolommen'
import { woordenboek } from '../../../woordenboek'

export const BEHEER = woordenboek({
  nl: {
    periode: 'Cijfers · 1 tot en met 31 oktober',
    maand: 'Oktober 2026',
    tegels: ['Nieuwe leden', 'Bezoeken', 'Bezetting lessen', 'Opzeggingen'],
    personeelBoven: 'Personeel · week 43',
    personeelKop: 'Diensten en uren',
    exportUren: 'Export uren',
    kolommen: ['Medewerker', 'Dienst', 'Uren'],
    dagen: ['Ma', 'Di'],
    dienst: (dag: string, van: string, tot: string) => `${dag} ${van} tot ${tot}`,
    status: { verwerkt: 'Verwerkt', goedgekeurd: 'Goedgekeurd', gewerkt: 'Gewerkt', gepland: 'Gepland' },
  },
  en: {
    periode: 'Figures · 1 to 31 October',
    maand: 'October 2026',
    tegels: ['New members', 'Visits', 'Class attendance', 'Cancellations'],
    personeelBoven: 'Staff · week 43',
    personeelKop: 'Shifts and hours',
    exportUren: 'Export hours',
    kolommen: ['Staff member', 'Shift', 'Hours'],
    dagen: ['Mon', 'Tue'],
    dienst: (dag: string, van: string, tot: string) => `${dag} ${van} to ${tot}`,
    status: { verwerkt: 'Processed', goedgekeurd: 'Approved', gewerkt: 'Worked', gepland: 'Planned' },
  },
})

export const WERKVLOER = woordenboek({
  nl: {
    checkinBoven: 'Check-in · balie',
    nuBinnen: (aantal: number) => `Nu binnen: ${aantal}`,
    qrOfNaam: 'QR of naam',
    zoek: 'Zoek een lid of scan de QR-code',
    kolommen: ['Lid', 'Tijd', 'Status'],
    status: { actief: 'Actief', proeflid: 'Proeflid', geenToegang: 'Geen toegang hier' },
    takenBoven: 'Taken · week',
    takenKop: 'Taken en poetslijst',
    dagWeek: 'Dag · Week',
    taak: 'Taak',
    dagen: ['Ma', 'Di', 'Wo', 'Do', 'Vr'],
    taken: ['Toestellen afnemen', 'Kleedkamers controleren', 'Handdoeken aanvullen', 'Afsluitronde: lichten en deuren'],
    opvolgBoven: 'Opvolgen · vandaag',
    opvolgKop: 'Wie spreek je vandaag aan?',
    open: (aantal: number) => `${aantal} open`,
    opgepakt: 'Opgepakt',
    regels: [
      REGEL_DEFINITIES.niet_gezien.titel,
      REGEL_DEFINITIES.proefles_opvolgen.titel,
      REGEL_DEFINITIES.welkom.titel,
      REGEL_DEFINITIES.verjaardag.titel,
    ],
    wat: ['17 dagen niet geweest', 'Proefles gisteren', 'Twee weken lid', 'Vandaag jarig'],
  },
  en: {
    checkinBoven: 'Check-in · front desk',
    nuBinnen: (aantal: number) => `In now: ${aantal}`,
    qrOfNaam: 'QR or name',
    zoek: 'Search for a member or scan the QR code',
    kolommen: ['Member', 'Time', 'Status'],
    status: { actief: 'Active', proeflid: 'Trial member', geenToegang: 'No access here' },
    takenBoven: 'Tasks · week',
    takenKop: 'Tasks and cleaning rota',
    dagWeek: 'Day · Week',
    taak: 'Task',
    dagen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    taken: ['Wipe down equipment', 'Check the changing rooms', 'Restock towels', 'Closing round: lights and doors'],
    opvolgBoven: 'Follow-up · today',
    opvolgKop: 'Who do you speak to today?',
    open: (aantal: number) => `${aantal} open`,
    opgepakt: 'Handled',
    regels: ['Not seen for a while', 'Follow up trial member', 'Welcome chat', 'Birthday'],
    wat: ['Not in for 17 days', 'Trial class yesterday', 'Member for two weeks', 'Birthday today'],
  },
})

export const ROOSTER = woordenboek({
  nl: {
    boven: 'Groepslessen · week 43',
    kop: 'Lesrooster Centrum',
    nieuweLes: '+ Les',
    dagen: ['Ma', 'Di', 'Wo', 'Do', 'Vr'],
    vol: (wachtlijst: number) => `Vol · wachtlijst ${wachtlijst}`,
  },
  en: {
    boven: 'Group classes · week 43',
    kop: 'Centre timetable',
    nieuweLes: '+ Class',
    dagen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    vol: (wachtlijst: number) => `Full · waiting list ${wachtlijst}`,
  },
})

export const IMPORT = woordenboek({
  nl: {
    boven: 'Leden · ledenbestand inlezen',
    bestand: 'leden-export.csv',
    herkend: 'Kolommen herkend',
    kolomInBestand: 'Kolom in je bestand',
    veld: 'Veld',
    kolommen: ['Roepnaam', 'Achternaam', 'E-mailadres', 'Mobiel', 'Abonnement', 'Lid sinds'],
    velden: [
      IMPORT_VELD_LABEL.voornaam,
      IMPORT_VELD_LABEL.achternaam,
      IMPORT_VELD_LABEL.email,
      IMPORT_VELD_LABEL.telefoon,
      IMPORT_VELD_LABEL.abonnement,
      IMPORT_VELD_LABEL.lidSinds,
    ],
    tegels: ['Nieuw', 'Bijgewerkt', 'Ongewijzigd', 'Dubbel'],
  },
  en: {
    boven: 'Members · import member file',
    bestand: 'members-export.csv',
    herkend: 'Columns recognised',
    kolomInBestand: 'Column in your file',
    veld: 'Field',
    kolommen: ['Known as', 'Last name', 'Email address', 'Mobile', 'Membership', 'Joined'],
    velden: ['First name', 'Surname', 'Email', 'Phone', 'Subscription', 'Member since'],
    tegels: ['New', 'Updated', 'Unchanged', 'Duplicate'],
  },
})
