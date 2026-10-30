import { woordenboek } from '../../woordenboek'

// De status van het abonnement van een sportschool bij AI Your Gym, zoals
// abonnementWeergave() in src/lib/aiyourgym/abonnement.ts hem opbouwt voor
// /club/beheer/abonnement. De datum komt al opgemaakt in de taal binnen.

export const ABONNEMENT_STATUS = woordenboek({
  nl: {
    onbekendPakket: 'Onbekend pakket',
    bundel: 'Alle zes pakketten (bundelprijs)',
    perMaand: (bedrag: string, inclBtw: boolean) => `${bedrag} per maand, ${inclBtw ? 'incl.' : 'excl.'} btw`,
    opgezegd: 'Opgezegd',
    loptTot: (datum: string) => `Loopt nog tot ${datum}.`,
    loptTotEinde: 'Loopt tot het einde van de periode.',
    proefTot: (datum: string) => `Proefperiode tot ${datum}`,
    daarnaBetaling: 'Daarna start de eerste betaling vanzelf.',
    actief: 'Actief',
    volgendeFactuur: (datum: string) => `Volgende factuur rond ${datum}.`,
    zonderStripe: 'Online betalen is nog niet gekoppeld, dus er wordt niets afgeschreven. We spreken samen af hoe je verder betaalt.',
    mislukt: 'Betaling mislukt',
    mislukUitleg: 'Een factuur is niet betaald. Stripe probeert het opnieuw; controleer je betaalgegevens.',
    gepauzeerd: 'Gepauzeerd',
    gepauzeerdUitleg: 'Het abonnement staat stil. Er worden geen facturen gemaakt.',
    opgezegdUitleg: 'Het abonnement is beeindigd. Je oude facturen blijven op te vragen.',
    test: 'Testaccount',
    testUitleg: 'Dit is een testaccount: er is geen abonnement en er komen geen facturen.',
    inrichten: 'Wordt ingericht',
    inrichtenUitleg: 'Je aanmelding is nog niet afgerond.',
  },
  en: {
    onbekendPakket: 'Unknown plan',
    bundel: 'All six packages (bundle price)',
    perMaand: (bedrag: string, inclBtw: boolean) => `${bedrag} per month, ${inclBtw ? 'incl.' : 'excl.'} VAT`,
    opgezegd: 'Cancelled',
    loptTot: (datum: string) => `Runs until ${datum}.`,
    loptTotEinde: 'Runs until the end of the period.',
    proefTot: (datum: string) => `Trial until ${datum}`,
    daarnaBetaling: 'After that, the first payment starts automatically.',
    actief: 'Active',
    volgendeFactuur: (datum: string) => `Next invoice around ${datum}.`,
    zonderStripe: 'Online payment is not connected yet, so nothing is charged. We will agree together how you pay from then on.',
    mislukt: 'Payment failed',
    mislukUitleg: 'An invoice has not been paid. Stripe will try again; check your payment details.',
    gepauzeerd: 'Paused',
    gepauzeerdUitleg: 'The subscription is on hold. No invoices are created.',
    opgezegdUitleg: 'The subscription has ended. Your old invoices remain available.',
    test: 'Test account',
    testUitleg: 'This is a test account: there is no subscription and there are no invoices.',
    inrichten: 'Being set up',
    inrichtenUitleg: 'Your sign-up has not been completed yet.',
  },
})
