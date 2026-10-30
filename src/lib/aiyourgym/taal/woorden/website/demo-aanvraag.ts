// Een gratis demo aanvragen ((site)/demo-aanvragen/page.tsx en src/components/aiyourgym/demo-aanvraag).
// We beloven alleen wat we waarmaken: een reactie binnen een werkdag, Kane belt of
// mailt zelf. De keuzes (soort sportschool, moment) staan in demo-aanvraag.ts; hier
// hun labels per taal. Foutmeldingen vertaalt meldingen.ts.

import { DEMO_MOMENTEN, DEMO_SOORTEN, type DemoMoment, type DemoSoort } from '@/lib/aiyourgym/demo-aanvraag'
import { woordenboek } from '../../woordenboek'

function labels<T extends string>(lijst: readonly { sleutel: T; label: string }[]): Record<T, string> {
  return Object.fromEntries(lijst.map((x) => [x.sleutel, x.label])) as Record<T, string>
}

export const DEMO_AANVRAAG = woordenboek({
  nl: {
    metaTitel: 'Plan een gratis demo',
    metaOmschrijving:
      'Vraag een gratis, vrijblijvende demo van AI Your Gym aan. We nemen binnen een werkdag contact op en laten zien hoe het werkt voor jouw sportschool.',
    label: 'Gratis en vrijblijvend',
    titel: 'Plan een gratis demo.',
    lead: 'We laten AI Your Gym persoonlijk zien, ingericht op jouw soort sportschool.',
    zoGaatHet: 'Zo gaat het',
    stappen: [
      { titel: 'We nemen contact op', tekst: 'Binnen een werkdag bellen of mailen we je, op het moment dat jij aangeeft.' },
      { titel: 'We plannen de demo', tekst: 'Op een moment dat jou uitkomt, gerust met je team erbij.' },
      { titel: 'We laten het zien', tekst: 'Met ruimte voor al je vragen. Daarna beslis je zelf.' },
    ],
    direct: 'Liever direct contact?',
    zelfProberen: 'Liever meteen zelf starten?',
    // Het formulier
    uitleg: 'Vrijblijvend. Binnen een werkdag plannen we samen een moment.',
    naam: 'Je naam',
    sportschoolNaam: 'Naam van je sportschool',
    email: 'E-mailadres',
    telefoon: 'Telefoonnummer',
    telefoonHint: 'We bellen je om een moment af te spreken.',
    vestigingen: 'Aantal vestigingen',
    vestigingenHint: (max: number) => `1 tot ${max}`,
    soort: 'Soort sportschool',
    kiesSoort: 'Kies een soort',
    moment: 'Wanneer komt het je uit om te bellen?',
    opmerking: 'Opmerking',
    nietVerplicht: '(niet verplicht)',
    opmerkingHint: 'Waar ben je naar op zoek, of wat wil je zeker zien?',
    akkoord: { voor: 'Ik heb de ', privacy: 'privacyverklaring', na: ' gelezen. Mijn gegevens worden alleen gebruikt om contact op te nemen over de demo.' },
    versturen: 'Versturen…',
    aanvragen: 'Plan mijn gratis demo',
    vrijblijvend: 'Je zit nergens aan vast. We sturen geen nieuwsbrief.',
    mislukt: 'Versturen lukte niet. Probeer het later opnieuw.',
    geenVerbinding: 'Geen verbinding. Controleer het internet en probeer het opnieuw.',
    soorten: labels<DemoSoort>(DEMO_SOORTEN),
    momenten: labels<DemoMoment>(DEMO_MOMENTEN),
    // Bedankt
    bedankt: (naam: string) => `Bedankt${naam ? `, ${naam}` : ''}. We nemen binnen een werkdag contact op.`,
    bedanktTekst: 'We bellen of mailen je om een moment te plannen dat jou uitkomt. Je zit nergens aan vast.',
    tussentijd: 'Kijk in de tussentijd gerust al rond in de live demo.',
    bekijkDemo: 'Bekijk de live demo',
    terug: 'Terug naar de website',
  },
  en: {
    metaTitel: 'Book a free demo',
    metaOmschrijving:
      'Request a free demo of AI Your Gym with no obligation. We get in touch within one working day and show you how it works for your gym.',
    label: 'Free, no obligation',
    titel: 'Book a free demo.',
    lead: 'We show you AI Your Gym in person, set up for your kind of gym.',
    zoGaatHet: 'How it works',
    stappen: [
      { titel: 'We get in touch', tekst: 'Within one working day we call or email you, at the time you choose.' },
      { titel: 'We schedule the demo', tekst: 'At a time that suits you, with your team welcome too.' },
      { titel: 'We show you around', tekst: 'With room for all your questions. Then you decide.' },
    ],
    direct: 'Prefer direct contact?',
    zelfProberen: 'Rather get started yourself straight away?',
    uitleg: 'No obligation. Within one working day we find a time together.',
    naam: 'Your name',
    sportschoolNaam: 'Name of your gym',
    email: 'Email address',
    telefoon: 'Phone number',
    telefoonHint: 'We call you to arrange a time.',
    vestigingen: 'Number of locations',
    vestigingenHint: (max: number) => `1 to ${max}`,
    soort: 'Kind of gym',
    kiesSoort: 'Choose a kind',
    moment: 'When suits you for a call?',
    opmerking: 'Comments',
    nietVerplicht: '(optional)',
    opmerkingHint: 'What are you looking for, or what do you definitely want to see?',
    akkoord: { voor: 'I have read the ', privacy: 'privacy statement', na: '. My details are only used to contact me about the demo.' },
    versturen: 'Sending…',
    aanvragen: 'Book my free demo',
    vrijblijvend: 'You are not committed to anything. We do not send a newsletter.',
    mislukt: 'Sending did not work. Please try again later.',
    geenVerbinding: 'No connection. Check your internet and try again.',
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
    momenten: { ochtend: 'Morning', middag: 'Afternoon', avond: 'Evening', 'maakt-niet-uit': 'Any time' },
    bedankt: (naam: string) => `Thank you${naam ? `, ${naam}` : ''}. We will get in touch within one working day.`,
    bedanktTekst: 'We will call or email you to find a time that suits you. You are not committed to anything.',
    tussentijd: 'In the meantime, feel free to look around the live demo.',
    bekijkDemo: 'Explore the live demo',
    terug: 'Back to the website',
  },
})
