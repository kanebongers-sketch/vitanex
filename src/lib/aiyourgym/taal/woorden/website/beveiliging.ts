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
      'Hoe AI Your Gym de gegevens van je sportschool en je leden beschermt: opslag in Frankfurt, gescheiden per sportschool, AVG-rechten in de software en bewaartermijnen die je zelf instelt.',
    label: 'Privacy en beveiliging',
    titel: 'De gegevens van je leden, goed bewaard.',
    tekst: 'In gewone taal, en alleen wat echt zo is gebouwd.',
    inHetKort: 'In het kort',
    kern: KERN,
    groepen: GROEPEN,
    afsprakenLabel: 'Afspraken',
    afsprakenTitel: 'Op papier.',
    dpaKop: 'Verwerkersovereenkomst',
    dpaTekst:
      'Jij bent verantwoordelijk voor de gegevens van je leden, wij verwerken ze in jouw opdracht. De verwerkersovereenkomst is op aanvraag beschikbaar: bij een demo-aanvraag, of via Hulp in je eigen omgeving.',
    dpaLink: 'Vraag een demo aan',
    dienstenKop: 'Diensten die we gebruiken',
    diensten: SUBVERWERKERS,
    meer: { voor: 'Meer over de gegevens op deze website zelf staat in de ', link: 'privacyverklaring', na: '.' },
    bandTitel: 'Start in je eigen, afgeschermde omgeving.',
  },
  en: {
    metaTitel: 'Privacy and security',
    metaOmschrijving:
      'How AI Your Gym protects the data of your gym and your members: stored in Frankfurt, separated per gym, GDPR rights built into the software and retention periods you set yourself.',
    label: 'Privacy and security',
    titel: 'Your members’ data, kept safe.',
    tekst: 'In plain language, and only what has really been built.',
    inHetKort: 'In short',
    kern: [
      { titel: 'Frankfurt', tekst: 'The database and server are in Frankfurt, within the EU.' },
      { titel: 'Separated', tekst: 'Every gym its own environment. You never see anyone else’s data.' },
      { titel: 'Yours', tekst: 'Your data belongs to you. Export it any time.' },
    ],
    groepen: [
      {
        sleutel: 'opslag',
        label: 'Storage',
        titel: 'Where the data is kept.',
        punten: [
          { titel: 'In the EU', tekst: 'Database and server in a data centre in Frankfurt.' },
          { titel: 'Separated per gym', tekst: 'Every request to the database stays within your own gym. Only the server reads it, never the browser.' },
          { titel: 'No AI services with member data', tekst: 'Your members’ data does not go to third-party AI services. The only exception: a member can have a meal photo estimated, only with their own consent. The photo then goes to Anthropic and is not stored.' },
        ],
      },
      {
        sleutel: 'toegang',
        label: 'Access',
        titel: 'Who can get in.',
        punten: [
          { titel: 'Strong passwords', tekst: 'Never stored in readable form (scrypt). Passwords that are too short or easy to guess are refused.' },
          { titel: 'Permissions per role', tekst: 'The owner decides which sections each role can see.' },
          { titel: 'What a member sees', tekst: 'Only their own data. Notes, blood pressure and heart rate stay with the team.' },
        ],
      },
      {
        sleutel: 'leden',
        label: 'Members',
        titel: 'Your members’ rights, built into the software.',
        punten: [
          { titel: 'Access', tekst: 'All data of a member, lead or staff member in one file.' },
          { titel: 'Deletion in two steps', tekst: 'Restorable for 30 days, then erased for good. Only the owner can do this.' },
          { titel: 'Health data only with consent', tekst: 'Only stored with explicit consent, and never in reports, emails or notifications.' },
        ],
      },
      {
        sleutel: 'bewaren',
        label: 'Retention',
        titel: 'No longer than needed.',
        punten: [
          { titel: 'Periods per gym', tekst: 'You decide how long leads, former members, visits and the log are kept. Cleared every night.' },
          { titel: 'No IP addresses', tekst: 'To prevent abuse, only an irreversible code, never the address itself.' },
          { titel: 'No tracking', tekst: 'Only cookies to sign in. No advertising or analytics cookies, no third-party scripts.' },
        ],
      },
    ],
    afsprakenLabel: 'Agreements',
    afsprakenTitel: 'In writing.',
    dpaKop: 'Data processing agreement',
    dpaTekst:
      'You are responsible for your members’ data; we process it on your behalf. The data processing agreement is available on request: when you request a demo, or through Help in your own environment.',
    dpaLink: 'Request a demo',
    dienstenKop: 'Services we use',
    diensten: [
      { titel: 'Supabase', tekst: 'Database and storage of logos, in Frankfurt.' },
      { titel: 'Render', tekst: 'The software’s server, in Frankfurt.' },
      { titel: 'Resend', tekst: 'Emails, such as invitations and notifications.' },
      { titel: 'Stripe', tekst: 'Paying for your AI Your Gym subscription.' },
      { titel: 'Browser push', tekst: 'Only if phone notifications are switched on. The message is encrypted.' },
    ],
    meer: { voor: 'More about the data on this website itself is in the ', link: 'privacy statement', na: ' (in Dutch).' },
    bandTitel: 'Start in your own, protected environment.',
  },
})
