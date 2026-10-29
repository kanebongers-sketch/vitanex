// Een prijs op maat aanvragen ((site)/prijs-op-maat/page.tsx en src/components/aiyourgym/prijs).
// Zonder bedragen (besluit Kane). Hoe de prijs werkt is dezelfde afspraak als
// VRAAG_CONTRACT in inhoud/vertrouwen.ts. De keuzes (soort sportschool, aantal
// leden) staan in demo-aanvraag.ts en prijs-aanvraag.ts; hier hun labels per taal.

import { DEMO_SOORTEN, type DemoSoort } from '@/lib/aiyourgym/demo-aanvraag'
import { PRIJS_LEDEN, type PrijsLeden } from '@/lib/aiyourgym/prijs-aanvraag'
import { woordenboek } from '../../woordenboek'

function labels<T extends string>(lijst: readonly { sleutel: T; label: string }[]): Record<T, string> {
  return Object.fromEntries(lijst.map((x) => [x.sleutel, x.label])) as Record<T, string>
}

export const PRIJS_OP_MAAT = woordenboek({
  nl: {
    metaTitel: 'Vraag een prijs op maat',
    metaOmschrijving: 'Vraag in drie korte stappen een prijs op maat aan voor je sportschool. Per vestiging per maand, met een jaarcontract en nu zonder opstartkosten.',
    label: 'Prijs op maat',
    titel: 'Een prijs die past bij je sportschool.',
    lead: 'Drie korte vragen, dan krijg je binnen een werkdag een prijs op maat. Vrijblijvend.',
    hoeTitel: 'Zo werkt de prijs',
    hoe: [
      { titel: 'Per vestiging, per maand', tekst: 'Een jaarcontract, maandelijks betaald. Het pakket bepaalt wat erin zit.' },
      { titel: 'Nu geen opstartkosten', tekst: 'In Club en Keten helpen we je persoonlijk met inrichten.' },
      { titel: 'Altijd vooraf duidelijk', tekst: 'Je ziet het bedrag voordat je iets betaalt.' },
    ],
    eerstZien: 'Eerst zelf zien of het past?',
    // Het formulier
    stappen: { sportschool: 'Je sportschool', omvang: 'Omvang', contact: 'Contact' },
    stapVan: (nu: number, totaal: number) => `Stap ${nu} van ${totaal}`,
    stapSr: (nu: number) => `Stap ${nu}: `,
    voortgangLabel: 'Stappen van de prijsaanvraag',
    terug: 'Terug',
    volgende: 'Volgende',
    versturen: 'Versturen…',
    aanvragen: 'Vraag mijn prijs op maat aan',
    vrijblijvend: 'Vrijblijvend. We sturen geen nieuwsbrief.',
    mislukt: 'Versturen lukte niet. Probeer het later opnieuw.',
    geenVerbinding: 'Geen verbinding. Controleer het internet en probeer het opnieuw.',
    soortVraag: 'Wat voor sportschool heb je?',
    pakketVraag: 'Welk pakket past het best?',
    vestigingen: 'Aantal vestigingen',
    vestigingenHint: (max: number) => `1 tot ${max}`,
    ledenVraag: 'Hoeveel leden heb je ongeveer, alle vestigingen samen?',
    naam: 'Je naam',
    sportschoolNaam: 'Naam van je sportschool',
    email: 'E-mailadres',
    telefoon: 'Telefoonnummer',
    telefoonHint: 'Voor als er nog een vraag is over je club.',
    akkoord: { voor: 'Ik heb de ', privacy: 'privacyverklaring', na: ' gelezen. Mijn gegevens worden alleen gebruikt om mijn prijs op maat te sturen.' },
    soorten: labels<DemoSoort>(DEMO_SOORTEN),
    leden: labels<PrijsLeden>(PRIJS_LEDEN),
    // Bedankt
    bedankt: (naam: string) => `Bedankt${naam ? `, ${naam}` : ''}. Je hoort binnen een werkdag van ons.`,
    bedanktTekst: 'Je krijgt een prijs die past bij je sportschool. Je zit nergens aan vast.',
    alvast: (dagen: number) => `Probeer alvast ${dagen} dagen gratis`,
    bekijkDemo: 'Bekijk de live demo',
  },
  en: {
    metaTitel: 'Ask for a tailored price',
    metaOmschrijving: 'Ask for a tailored price for your gym in three short steps. Per location per month, with an annual contract and no set-up fee for now.',
    label: 'Tailored price',
    titel: 'A price that fits your gym.',
    lead: 'Three short questions, and you get a tailored price within one working day. No obligation.',
    hoeTitel: 'How the price works',
    hoe: [
      { titel: 'Per location, per month', tekst: 'An annual contract, paid monthly. The plan decides what is included.' },
      { titel: 'No set-up fee for now', tekst: 'In Club and Keten we help you set up personally.' },
      { titel: 'Always clear in advance', tekst: 'You see the amount before you pay anything.' },
    ],
    eerstZien: 'Want to see for yourself whether it fits first?',
    stappen: { sportschool: 'Your gym', omvang: 'Size', contact: 'Contact' },
    stapVan: (nu: number, totaal: number) => `Step ${nu} of ${totaal}`,
    stapSr: (nu: number) => `Step ${nu}: `,
    voortgangLabel: 'Steps of the price request',
    terug: 'Back',
    volgende: 'Next',
    versturen: 'Sending…',
    aanvragen: 'Request my tailored price',
    vrijblijvend: 'No obligation. We do not send a newsletter.',
    mislukt: 'Sending did not work. Please try again later.',
    geenVerbinding: 'No connection. Check your internet and try again.',
    soortVraag: 'What kind of gym do you run?',
    pakketVraag: 'Which plan fits best?',
    vestigingen: 'Number of locations',
    vestigingenHint: (max: number) => `1 to ${max}`,
    ledenVraag: 'Roughly how many members do you have, across all locations?',
    naam: 'Your name',
    sportschoolNaam: 'Name of your gym',
    email: 'Email address',
    telefoon: 'Phone number',
    telefoonHint: 'In case we have a question about your club.',
    akkoord: { voor: 'I have read the ', privacy: 'privacy statement', na: '. My details are only used to send me my tailored price.' },
    soorten: {
      zelfstandig: 'Independent gym',
      boutique: 'Boutique studio',
      'pt-studio': 'PT studio',
      keten: 'Chain with several locations',
      yoga: 'Yoga, pilates or dance',
      vechtsport: 'Martial arts or boxing',
      bootcamp: 'Bootcamp or HIIT',
      anders: 'Something else',
    },
    leden: { 'tot-250': 'Up to 250', '250-750': '250 to 750', '750-1500': '750 to 1,500', 'meer-1500': 'More than 1,500', 'weet-niet': 'Not sure' },
    bedankt: (naam: string) => `Thank you${naam ? `, ${naam}` : ''}. You will hear from us within one working day.`,
    bedanktTekst: 'You will get a price that fits your gym. You are not committed to anything.',
    alvast: (dagen: number) => `Try it free for ${dagen} days in the meantime`,
    bekijkDemo: 'Explore the live demo',
  },
})
