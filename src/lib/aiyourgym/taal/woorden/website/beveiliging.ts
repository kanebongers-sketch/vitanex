// Privacy en beveiliging ((site)/privacy-en-beveiliging/page.tsx). Het Nederlands is
// KERN, GROEPEN en SUBVERWERKERS uit inhoud/beveiliging.ts (daar staat waarom elke
// zin klopt); het Engels zegt precies hetzelfde. Geen keurmerken of certificaten.
// De verwerkersovereenkomst is nog een concept: op aanvraag, niet als download.

import { GROEPEN, KERN, SUBVERWERKERS } from '@/components/aiyourgym/inhoud/beveiliging'
import { woordenboek } from '../../woordenboek'

export const BEVEILIGING = woordenboek({
  nl: {
    metaTitel: 'Privacy en beveiliging',
    metaOmschrijving:
      'Hoe AI Your Gym de gegevens van je sportschool en je leden beschermt: opslag in Frankfurt, gescheiden per sportschool, AVG-rechten van leden in de software en bewaartermijnen die je zelf instelt.',
    label: 'Privacy en beveiliging',
    titel: 'De gegevens van je leden, goed bewaard.',
    tekst: 'Wat we doen om de gegevens van je sportschool en je leden te beschermen. In gewone taal, en alleen wat echt zo is gebouwd.',
    inHetKort: 'In het kort',
    kern: KERN,
    groepen: GROEPEN,
    afsprakenLabel: 'Afspraken',
    afsprakenTitel: 'Op papier.',
    dpaKop: 'Verwerkersovereenkomst',
    dpaTekst:
      'Jij bent verantwoordelijk voor de gegevens van je leden, wij verwerken ze in jouw opdracht. Die afspraken leggen we vast in een verwerkersovereenkomst. Die is op aanvraag beschikbaar: vraag ernaar bij een demo-aanvraag, of via Hulp in je eigen omgeving als je al begonnen bent.',
    dpaLink: 'Vraag een demo aan',
    dienstenKop: 'Diensten die we gebruiken',
    diensten: SUBVERWERKERS,
    meer: { voor: 'Meer over de gegevens op deze website zelf staat in de ', link: 'privacyverklaring', na: '.' },
    bandTitel: 'Probeer het in je eigen, afgeschermde omgeving.',
  },
  en: {
    metaTitel: 'Privacy and security',
    metaOmschrijving:
      'How AI Your Gym protects the data of your gym and your members: stored in Frankfurt, separated per gym, members’ GDPR rights built into the software and retention periods you set yourself.',
    label: 'Privacy and security',
    titel: 'Your members’ data, kept safe.',
    tekst: 'What we do to protect the data of your gym and your members. In plain language, and only what has really been built.',
    inHetKort: 'In short',
    kern: [
      { titel: 'Frankfurt', tekst: 'The database and server are in Frankfurt, within the EU.' },
      { titel: 'Separated', tekst: 'Every gym has its own environment. You never see anyone else’s data.' },
      { titel: 'Yours', tekst: 'Your data belongs to you. You export it whenever you like.' },
    ],
    groepen: [
      {
        sleutel: 'opslag',
        label: 'Storage',
        titel: 'Where the data is kept.',
        punten: [
          { titel: 'In the EU', tekst: 'The database is in a data centre in Frankfurt, as is the server that uses it.' },
          { titel: 'Separated per gym', tekst: 'Every request to the database is limited to your own gym. Only the server reads the database, never the browser.' },
          { titel: 'No AI services with member data', tekst: 'Your members’ data does not go to third-party AI services.' },
        ],
      },
      {
        sleutel: 'toegang',
        label: 'Access',
        titel: 'Who can get in.',
        punten: [
          {
            titel: 'Strong passwords',
            tekst: 'Everyone signs in with an email address and password. Passwords are never stored in readable form (scrypt), and passwords that are too short or easy to guess are refused.',
          },
          { titel: 'Permissions per role', tekst: 'For each role you decide which sections someone can see. The owner decides what a club manager can do.' },
          { titel: 'What a member sees', tekst: 'In the member app a member only sees their own data. Trainer notes, blood pressure and heart rate stay with the team.' },
        ],
      },
      {
        sleutel: 'leden',
        label: 'Members',
        titel: 'Your members’ rights, built into the software.',
        punten: [
          { titel: 'Access', tekst: 'On the member card you download all of a member’s data in one file. The same goes for leads and staff.' },
          { titel: 'Deletion in two steps', tekst: 'A deleted member is first kept for 30 days so they can be restored. After that they are erased for good. Only the owner can do this.' },
          {
            titel: 'Health data only with consent',
            tekst: 'Measurements and health answers from an intake are only stored with the member’s explicit consent. They do not appear in reports, emails or notifications.',
          },
        ],
      },
      {
        sleutel: 'bewaren',
        label: 'Retention',
        titel: 'No longer than needed.',
        punten: [
          { titel: 'Periods per gym', tekst: 'You decide how long leads, former members, visits and the log are kept. Every night the system clears out whatever is past its period.' },
          { titel: 'No IP addresses', tekst: 'To prevent abuse we only keep an irreversible code of an IP address, never the address itself.' },
          { titel: 'No tracking', tekst: 'Only the cookies needed to sign in. No advertising or analytics cookies, and no third-party scripts looking over your shoulder.' },
        ],
      },
    ],
    afsprakenLabel: 'Agreements',
    afsprakenTitel: 'In writing.',
    dpaKop: 'Data processing agreement',
    dpaTekst:
      'You are responsible for your members’ data; we process it on your behalf. We set out those agreements in a data processing agreement. It is available on request: ask for it when you request a demo, or through Help in your own environment if you have already started.',
    dpaLink: 'Request a demo',
    dienstenKop: 'Services we use',
    diensten: [
      { titel: 'Supabase', tekst: 'Database and storage of logos, in Frankfurt.' },
      { titel: 'Render', tekst: 'The server the software runs on, in Frankfurt.' },
      { titel: 'Resend', tekst: 'Sending emails, such as invitations and notifications.' },
      { titel: 'Stripe', tekst: 'Paying for your AI Your Gym subscription.' },
      { titel: 'Browser push', tekst: 'Only used if phone notifications are switched on for your gym. The message is encrypted.' },
    ],
    meer: { voor: 'More about the data on this website itself is in the ', link: 'privacy statement', na: ' (in Dutch).' },
    bandTitel: 'Try it in your own, protected environment.',
  },
})
