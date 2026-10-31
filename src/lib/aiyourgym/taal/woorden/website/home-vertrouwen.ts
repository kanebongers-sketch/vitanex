// De vertrouwensblokken van de voorpagina en de home-secties die ook op subpagina's staan
// (src/components/aiyourgym/home): WelNiet, StartStappen, WatKomtMee en
// Huisstijl. Het Nederlands is de bron in inhoud/ (eerlijk.ts, vertrouwen.ts; daar staat waarom elke zin klopt); het Engels zegt precies hetzelfde, niets meer.

import { KOMT_MEE, KOMT_NIET_MEE, NIET, OVERSTAP_TIPS, WEL } from '@/components/aiyourgym/inhoud/eerlijk'
import { woordenboek } from '../../woordenboek'

const EERLIJK_TITEL = {
  nl: { voor: 'Wat we doen. ', accent: 'En wat niet.' },
  en: { voor: 'What we do. ', accent: 'And what we don’t.' },
} as const

/** Wat het wel en niet doet (home/WelNiet.tsx, op /overstappen). */
export const WEL_NIET = woordenboek({
  nl: {
    label: 'Eerlijk',
    titel: EERLIJK_TITEL.nl,
    tekst: 'Liever nu duidelijk dan straks een verrassing.',
    welTitel: 'Dit doet AI Your Gym',
    nietTitel: 'Dit doet het (nu) niet',
    wel: WEL,
    niet: NIET,
  },
  en: {
    label: 'Honest',
    titel: EERLIJK_TITEL.en,
    tekst: 'Better clear now than a surprise later.',
    welTitel: 'What AI Your Gym does',
    nietTitel: 'What it doesn’t do (for now)',
    wel: [
      { titel: 'Front desk and classes', tekst: 'QR check-in, group classes with a waiting list and the staff rota.' },
      { titel: 'Programmes and member app', tekst: 'Intakes and programmes with coaching, in an app with your name.' },
      { titel: 'Leads and figures', tekst: 'Trial classes and follow-up, and monthly figures as CSV.' },
    ],
    niet: [
      { titel: 'Member direct debits, invoices and subscriptions', tekst: 'These stay in your current system. AI Your Gym works alongside it.' },
      { titel: 'A link with your current system', tekst: 'Not yet. You import your members with a CSV or Excel file.' },
      { titel: 'An app in the app stores', tekst: 'The member app is a web app on the home screen.' },
    ],
  },
})

/** "Zo simpel start je" (home/StartStappen.tsx), naast het scherm van de startwizard. */
export const START_SECTIE = woordenboek({
  nl: {
    label: 'Zo simpel start je',
    titel: (aantal: number) => ({ voor: `${aantal} stappen. `, accent: 'Jij kiest alles.' }),
    tekst: 'Een startwizard brengt je club stap voor stap live. Stoppen en later verdergaan kan altijd.',
    hulpLabel: 'Persoonlijke hulp',
    hulpKop: 'Persoonlijke hulp bij het inrichten',
    hulpTekst: 'We richten je sportschool samen met je in: ledenbestand, rooster en je eerste schema’s.',
    figuurLabel:
      'De startwizard bij de stap Lessen: de teller met de stappen die af zijn en de tijd die nog over is, een balk per stap, de lestypen en de vaste week, en de knoppen Opslaan en stoppen en Klaar, verder',
  },
  en: {
    label: 'Getting started is simple',
    titel: (aantal: number) => ({ voor: `${aantal} steps. `, accent: 'You choose everything.' }),
    tekst: 'A set-up wizard takes your club live step by step. Stop any time and pick up where you left off.',
    hulpLabel: 'Personal help',
    hulpKop: 'Personal help with setting up',
    hulpTekst: 'We set up your gym together with you: member list, timetable and your first programmes.',
    figuurLabel:
      'The set-up wizard at the Classes step: the counter with the steps done and the time remaining, a bar per step, the class types and the regular week, and the buttons Save and stop and Done, next',
  },
})

/** Wat er uit je ledenbestand meekomt en wat niet (home/WatKomtMee.tsx, op /overstappen). */
export const WAT_KOMT_MEE = woordenboek({
  nl: {
    label: 'Wat komt mee',
    titel: 'Wat je meeneemt, en wat niet.',
    tekst: 'Je ledengegevens komen mee. Geld en geschiedenis blijven waar ze zijn.',
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
    tekst: 'Your member details come across. Money and history stay where they are.',
    bijschrift: 'What does and doesn’t come across when you switch',
    kolomGegevens: 'Data',
    kolomMee: 'Comes across',
    kolomToelichting: 'Notes',
    ja: 'Yes',
    nee: 'No',
    tipsTitel: 'Tips for your own members',
    mee: [
      { titel: 'Person and contact', tekst: 'Name, email address, phone, date of birth and gender.' },
      { titel: 'Membership', tekst: 'Subscription name, status, member since and end date.' },
      { titel: 'Numbers and location', tekst: 'Member and customer number. You choose the location per file.' },
    ],
    nietMee: [
      { titel: 'Direct debits and payment details', tekst: 'These stay in your current system, as do invoices.' },
      { titel: 'Visit and class history', tekst: 'Your figures start on the day you go live.' },
      { titel: 'Programmes and passwords', tekst: 'You recreate programmes in the editor. Members choose their own password.' },
    ],
    tips: [
      'Announce the switch, with the date the new app starts.',
      'Put up the poster with the QR code at the front desk.',
      'Run both systems side by side for a short while, with a fixed end date.',
    ],
  },
})

/** De ledenapp in de huisstijl van de sportschool (home/Huisstijl.tsx, op /ledenapp). */
export const HUISSTIJL_SECTIE = woordenboek({
  nl: {
    label: 'Ledenapp',
    titel: { voor: 'Jouw naam. Jouw kleuren. ', accent: 'Jouw app.' },
    tekst: 'Kies een kleur en een thema en zie de ledenapp meekleuren. Zo werkt het ook in de software, in elk pakket.',
    beeldLabel: 'De ledenapp in de gekozen kleur: volgende les, bezoeken deze maand, QR-code en een challenge',
  },
  en: {
    label: 'Member app',
    titel: { voor: 'Your name. Your colours. ', accent: 'Your app.' },
    tekst: 'Pick a colour and a theme and watch the member app follow. That’s how it works in the software too, in every plan.',
    beeldLabel: 'The member app in the chosen colour: next class, visits this month, QR code and a challenge',
  },
})
