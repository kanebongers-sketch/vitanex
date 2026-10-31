import { woordenboek } from '../../woordenboek'

// Data voor behoud (migratie 482): de opzegreden op de ledenkaart, de uitkomst
// van een opvolgtaak en van een contactmoment met een lead, en de opbouw van
// de behoudsscore op de risicolijst. De lijsten staan in src/lib/club/behoud/.

export const BEHOUD_DATA = woordenboek({
  nl: {
    opzeg: {
      kop: 'Waarom gaat dit lid?',
      reden: 'Reden',
      kies: 'Kies een reden',
      redenen: {
        prijs: 'Prijs',
        verhuizing: 'Verhuizing',
        tijd: 'Geen tijd of te druk',
        gezondheid: 'Blessure of gezondheid',
        begeleiding: 'Ontevreden over de begeleiding',
        faciliteiten: 'Ontevreden over de faciliteiten',
        andere_sportschool: 'Naar een andere sportschool',
        doel_bereikt: 'Doel bereikt',
        anders: 'Anders',
      },
      toelichting: 'Toelichting (optioneel)',
      gezondheidUitleg: 'Bij gezondheid leggen we alleen de categorie vast, geen details. Er is daarom geen toelichting.',
      verplicht: 'Kies eerst waarom dit lid gaat.',
      teLang: (max: number) => `De toelichting is hoogstens ${max} tekens.`,
      laatste: 'Reden van opzeggen',
      laatsteOp: (reden: string, datum: string) => `${reden}, vastgelegd op ${datum}`,
    },
    uitkomst: {
      kop: 'Wat leverde het op?',
      kies: 'Kies een uitkomst',
      lid: {
        bereikt_blijft: 'Bereikt, blijft lid',
        bereikt_twijfelt: 'Bereikt, twijfelt',
        niet_bereikt: 'Niet bereikt',
        wil_opzeggen: 'Wil opzeggen',
        opgezegd: 'Heeft opgezegd',
      },
      lead: {
        niet_bereikt: 'Niet bereikt',
        bereikt_twijfelt: 'Bereikt, twijfelt',
        afspraak_gemaakt: 'Afspraak gemaakt',
        geen_interesse: 'Geen interesse',
        lid_geworden: 'Lid geworden',
      },
      bevestig: 'Klaar',
      annuleer: 'Annuleren',
      verplicht: 'Kies eerst wat het opleverde.',
      leadOptioneel: 'Uitkomst (bij bellen verplicht)',
    },
    opbouw: {
      label: 'Waar de score vandaan komt',
      punten: (punten: number, max: number) => `${punten} van ${max} punten`,
    },
  },
  en: {
    opzeg: {
      kop: 'Why is this member leaving?',
      reden: 'Reason',
      kies: 'Choose a reason',
      redenen: {
        prijs: 'Price',
        verhuizing: 'Moving away',
        tijd: 'No time or too busy',
        gezondheid: 'Injury or health',
        begeleiding: 'Unhappy with the coaching',
        faciliteiten: 'Unhappy with the facilities',
        andere_sportschool: 'Going to another gym',
        doel_bereikt: 'Goal reached',
        anders: 'Other',
      },
      toelichting: 'Note (optional)',
      gezondheidUitleg: 'For health we only record the category, no details. That is why there is no note.',
      verplicht: 'First choose why this member is leaving.',
      teLang: (max: number) => `The note can be at most ${max} characters.`,
      laatste: 'Reason for cancelling',
      laatsteOp: (reden: string, datum: string) => `${reden}, recorded on ${datum}`,
    },
    uitkomst: {
      kop: 'What was the outcome?',
      kies: 'Choose an outcome',
      lid: {
        bereikt_blijft: 'Reached, staying a member',
        bereikt_twijfelt: 'Reached, in doubt',
        niet_bereikt: 'Not reached',
        wil_opzeggen: 'Wants to cancel',
        opgezegd: 'Has cancelled',
      },
      lead: {
        niet_bereikt: 'Not reached',
        bereikt_twijfelt: 'Reached, in doubt',
        afspraak_gemaakt: 'Appointment made',
        geen_interesse: 'Not interested',
        lid_geworden: 'Became a member',
      },
      bevestig: 'Done',
      annuleer: 'Cancel',
      verplicht: 'First choose the outcome.',
      leadOptioneel: 'Outcome (required for calls)',
    },
    opbouw: {
      label: 'Where the score comes from',
      punten: (punten: number, max: number) => `${punten} of ${max} points`,
    },
  },
})
