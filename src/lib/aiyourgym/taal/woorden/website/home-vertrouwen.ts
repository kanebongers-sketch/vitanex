// De vertrouwensblokken van de voorpagina en de home-secties die ook op subpagina's staan
// (src/components/aiyourgym/home): Praktijk, WelNietKort, WelNiet, HomeVragen, StartStappen,
// WatKomtMee en Huisstijl. Het Nederlands is de bron in inhoud/ (eerlijk.ts, praktijk.ts,
// vertrouwen.ts; daar staat waarom elke zin klopt); het Engels zegt precies hetzelfde, niets meer.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { HOME_VRAGEN, KOMT_MEE, KOMT_NIET_MEE, NIET, NIET_KORT, OVERSTAP_TIPS, WEL, WEL_KORT } from '@/components/aiyourgym/inhoud/eerlijk'
import { BELOFTES, PRAKTIJK } from '@/components/aiyourgym/inhoud/praktijk'
import { woordenboek } from '../../woordenboek'

/** Kane kort en wat je mag verwachten (home/Praktijk.tsx). Beloftes in de volgorde van BELOFTES. */
export const PRAKTIJK_SECTIE = woordenboek({
  nl: {
    label: PRAKTIJK.label,
    kop: PRAKTIJK.kop,
    rol: PRAKTIJK.rol,
    tekst: PRAKTIJK.tekst,
    verwachten: 'Wat je mag verwachten',
    beloftes: BELOFTES.map((b) => ({ titel: b.titel, tekst: b.tekst })),
  },
  en: {
    label: 'Built on the gym floor',
    kop: 'Built by someone who knows the gym floor.',
    rol: 'Personal trainer and PT manager across 8 locations',
    tekst:
      'I work on the gym floor as a personal trainer, and as PT manager I support the trainers at eight locations. I’m building AI Your Gym because every week I see where the day-to-day gets stuck.',
    verwachten: 'What you can expect',
    beloftes: [
      {
        titel: 'Made for a busy evening',
        tekst: 'I design every feature around a trainer with a phone in hand. That’s why everything works on phone, tablet and desktop.',
      },
      { titel: 'New features every month', tekst: 'What gyms ask for goes on the list. Something new arrives every month.' },
      { titel: 'One personal point of contact', tekst: 'You talk to someone who knows how your club is set up, not a rotating helpdesk.' },
      {
        titel: 'A reply within one working day',
        tekst: 'Request a demo or ask a question and you’ll hear from us within one working day. From a person, not an automated email.',
      },
    ],
  },
})

const EERLIJK_TITEL = {
  nl: { voor: 'Wat we doen. ', accent: 'En wat niet.' },
  en: { voor: 'What we do. ', accent: 'And what we don’t.' },
} as const

/** Kort op de voorpagina: vier dingen die het doet en vier die het (nu) niet doet (home/WelNietKort.tsx). */
export const WEL_NIET_KORT = woordenboek({
  nl: {
    label: 'Eerlijk',
    titel: EERLIJK_TITEL.nl,
    zin: 'Liever nu duidelijk dan straks een verrassing.',
    welTitel: 'Doet het',
    nietTitel: 'Doet het (nu) niet',
    wel: WEL_KORT,
    niet: NIET_KORT,
    link: 'Alles wat wel en niet',
  },
  en: {
    label: 'Honest',
    titel: EERLIJK_TITEL.en,
    zin: 'Better clear now than a surprise later.',
    welTitel: 'What it does',
    nietTitel: 'What it doesn’t do (for now)',
    wel: ['Check-in with QR', 'Classes and booking', 'Programmes with coaching', 'Member app in your branding'],
    niet: ['Member direct debits and invoices', 'Member subscriptions', 'A link with your membership admin', 'An app in the app stores'],
    link: 'Everything it does and doesn’t do',
  },
})

/** De volledige lijst wat het wel en niet doet (home/WelNiet.tsx, op /overstappen). */
export const WEL_NIET = woordenboek({
  nl: {
    label: 'Eerlijk',
    titel: EERLIJK_TITEL.nl,
    tekst: 'Liever nu duidelijk dan straks een verrassing. Dit is wat AI Your Gym voor je club doet, en wat bij je eigen ledenadministratie blijft.',
    welTitel: 'Dit doet AI Your Gym',
    nietTitel: 'Dit doet het (nu) niet',
    wel: WEL,
    niet: NIET,
  },
  en: {
    label: 'Honest',
    titel: EERLIJK_TITEL.en,
    tekst: 'Better clear now than a surprise later. This is what AI Your Gym does for your club, and what stays with your own membership admin.',
    welTitel: 'What AI Your Gym does',
    nietTitel: 'What it doesn’t do (for now)',
    wel: [
      { titel: 'Check-in and front desk', tekst: 'Members check in with the QR code in the member app; the front desk sees who’s arriving.' },
      { titel: 'Classes and rotas', tekst: 'Group classes per room, booking with a waiting list, and the staff rota with hours.' },
      { titel: 'Training programmes', tekst: 'Intakes and programmes with coaching and a moving image for every exercise.' },
      { titel: 'Member app', tekst: 'A web app in your own name and colours, for classes, programmes and check-in.' },
      { titel: 'Leads and follow-up', tekst: 'Prospects and trial classes, plus members who stay away, flagged in time.' },
      { titel: 'Figures', tekst: 'Visits, attendance, members and hours per calendar month, exportable as CSV.' },
    ],
    niet: [
      { titel: 'Member direct debits and invoices', tekst: 'These stay in your own membership admin. AI Your Gym works alongside it.' },
      { titel: 'Managing member subscriptions', tekst: 'The subscription name comes in with the import; the contract itself stays where it is now.' },
      {
        titel: 'A link with your membership admin',
        tekst: 'There’s no automatic link yet. You import your members with a CSV or Excel file, and again when a lot has changed.',
      },
      { titel: 'Its own app in the app stores', tekst: 'The member app is a web app that members add to their home screen, no app store needed.' },
    ],
  },
})

/**
 * De vier vragen op de voorpagina (home/HomeVragen.tsx). Vragen in de volgorde van HOME_VRAGEN;
 * de paden van de links zijn zonder taal, de component zet de taal ervoor.
 */
export const HOME_VRAGEN_SECTIE = woordenboek({
  nl: {
    label: 'Vragen',
    titel: 'Wat eigenaren als eerste vragen.',
    meerLabel: 'Meer vragen',
    meerPrijs: 'Vragen over prijs en proberen',
    meerOverstappen: 'Vragen over overstappen',
    vragen: HOME_VRAGEN,
  },
  en: {
    label: 'Questions',
    titel: 'What owners ask first.',
    meerLabel: 'More questions',
    meerPrijs: 'Questions about pricing and trials',
    meerOverstappen: 'Questions about switching',
    vragen: [
      {
        vraag: 'Does AI Your Gym also handle my members’ direct debits and subscriptions?',
        antwoord:
          'No. Direct debits, subscriptions and member invoices stay in your own membership admin. AI Your Gym handles the rest of the club: check-in, classes and booking, training programmes, the member app, leads, staff and figures. You import your members with a CSV or Excel file.',
        link: { label: 'Everything we do and don’t do', pad: '/overstappen#wel-niet' },
      },
      {
        vraag: 'Am I tied in?',
        antwoord: `You start with ${PROEFDAGEN} days free in your own environment. Stop during that time and you pay nothing. If you continue, your subscription runs for a year and you pay monthly, per location. We’re not charging a set-up fee for now. You always see the amount before you pay anything.`,
      },
      {
        vraag: 'Where is my data stored?',
        antwoord:
          'In Frankfurt, inside the EU: the database and the server that uses it. Every gym has its own, strictly separated environment. Health data from an intake or measurement is only stored with the member’s explicit consent.',
        link: { label: 'Privacy and security', pad: '/privacy-en-beveiliging' },
      },
      {
        vraag: 'Does it work for multiple locations?',
        antwoord:
          'Yes. You set up rooms, opening hours and rules per location, and members can belong to a location. The owner decides per role what a club manager sees. The Keten plan has no limit on the number of locations.',
      },
    ],
  },
})

/** "Zo simpel start je" (home/StartStappen.tsx). De stappen zelf staan in WIZARD (mockups/schermen.ts). */
export const START_SECTIE = woordenboek({
  nl: {
    label: 'Zo simpel start je',
    titel: (aantal: number) => ({ voor: `${aantal} stappen. `, accent: 'Een kwartier.' }),
    tekst: (minuten: number) =>
      `Na het aanmelden leidt een startwizard je door de inrichting, samen ongeveer ${minuten} minuten. Elke stap stelt zijn deel meteen in, je stopt wanneer je wilt en gaat later verder waar je was. Pas als alles echt staat, staat je sportschool live.`,
    hulpLabel: 'Persoonlijke hulp',
    hulpKop: 'Persoonlijke hulp, gratis in Club en Keten',
    hulpTekst: 'We richten je sportschool samen met je in: ledenbestand, rooster en je eerste schema’s.',
    link: 'Zo stap je over',
    figuurLabel:
      'De startwizard bij stap 5, Lessen: de teller met 4 van 8 stappen af en de tijd die nog over is, een balk per stap, de regel dat alles alvast is ingevuld voor de soort sportschool, de lestypen en de vaste week, en de knoppen Opslaan en stoppen en Klaar, verder',
  },
  en: {
    label: 'Getting started is simple',
    titel: (aantal: number) => ({ voor: `${aantal} steps. `, accent: 'Fifteen minutes.' }),
    tekst: (minuten: number) =>
      `After you sign up, a set-up wizard guides you through it, about ${minuten} minutes in total. Each step sets up its part straight away, and you can stop whenever you like and pick up where you left off. Your gym only goes live once everything is really in place.`,
    hulpLabel: 'Personal help',
    hulpKop: 'Personal help, free in Club and Keten',
    hulpTekst: 'We set up your gym together with you: member list, timetable and your first programmes.',
    link: 'How to switch',
    figuurLabel:
      'The set-up wizard at step 5, Classes: the counter with 4 of 8 steps done and the time remaining, a bar per step, the line saying everything is prefilled for the type of gym, the class types and the regular week, and the buttons Save and stop and Done, next',
  },
})

/** Wat er uit je ledenbestand meekomt en wat niet (home/WatKomtMee.tsx, op /overstappen). */
export const WAT_KOMT_MEE = woordenboek({
  nl: {
    label: 'Wat komt mee',
    titel: 'Wat je meeneemt, en wat niet.',
    tekst: 'Uit je ledenbestand lees je de gegevens van je leden in. Wat bij geld en geschiedenis hoort, blijft waar het nu staat.',
    bijschrift: 'Wat er bij overstappen wel en niet meekomt',
    kolomGegevens: 'Gegevens',
    kolomMee: 'Komt mee',
    kolomToelichting: 'Toelichting',
    ja: 'Ja',
    nee: 'Nee',
    tipsTitel: 'Tips voor je eigen leden',
    mee: KOMT_MEE,
    nietMee: KOMT_NIET_MEE,
    tips: OVERSTAP_TIPS,
  },
  en: {
    label: 'What comes across',
    titel: 'What you bring with you, and what you don’t.',
    tekst: 'You import your members’ details from your member file. Anything to do with money and history stays where it is now.',
    bijschrift: 'What does and doesn’t come across when you switch',
    kolomGegevens: 'Data',
    kolomMee: 'Comes across',
    kolomToelichting: 'Notes',
    ja: 'Yes',
    nee: 'No',
    tipsTitel: 'Tips for your own members',
    mee: [
      { titel: 'Name', tekst: 'First name, name prefix and surname, or one column with the full name.' },
      { titel: 'Contact', tekst: 'Email address and phone number.' },
      { titel: 'Personal', tekst: 'Date of birth and gender.' },
      { titel: 'Membership', tekst: 'Subscription name, status, member since and end date.' },
      { titel: 'Numbers', tekst: 'Member number and the customer number from your current system.' },
      { titel: 'Location', tekst: 'When you import, you choose which location the file is for.' },
    ],
    nietMee: [
      { titel: 'Direct debits and payment details', tekst: 'These stay in your membership admin, as do invoices and payment history.' },
      { titel: 'Visit and class history', tekst: 'Old check-ins and bookings don’t come across. Your figures start on the day you go live.' },
      { titel: 'Existing programmes', tekst: 'You recreate these in the editor, using exercises from the library.' },
      { titel: 'Member login details', tekst: 'Members choose their own password via the link in their email or the QR code on the poster.' },
    ],
    tips: [
      'Announce the switch in your current app or by email, with the date the new app starts.',
      'Put up the poster with the QR code at the front desk, so members can install the app on their phone right there.',
      'Run both systems side by side for a short while and set a clear end date for the old one.',
      `Use the ${PROEFDAGEN}-day trial to try everything with your own team first.`,
    ],
  },
})

/** De ledenapp in de huisstijl van de sportschool (home/Huisstijl.tsx, op /ledenapp). */
export const HUISSTIJL_SECTIE = woordenboek({
  nl: {
    label: 'Ledenapp',
    titel: { voor: 'Jouw naam. Jouw kleuren. ', accent: 'Jouw app.' },
    tekst:
      'Leden zien jouw sportschool, niet de onze. Kies een kleur en een thema en kijk hoe de ledenapp meekleurt. Zo werkt het in de software ook, en het zit in elk pakket.',
    link: 'Alles over de ledenapp',
    beeldLabel: 'De ledenapp in de gekozen kleur: volgende les, bezoeken deze maand, QR-code en een challenge',
  },
  en: {
    label: 'Member app',
    titel: { voor: 'Your name. Your colours. ', accent: 'Your app.' },
    tekst:
      'Members see your gym, not ours. Pick a colour and a theme and watch the member app follow. That’s how it works in the software too, and it’s in every plan.',
    link: 'All about the member app',
    beeldLabel: 'The member app in the chosen colour: next class, visits this month, QR code and a challenge',
  },
})
