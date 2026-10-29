// De prijzenpagina (src/app/(aiyourgym)/(website)/aiyourgym/(site)/prijzen/page.tsx).
// Geen bedragen op de website (besluit Kane): de prijs is altijd op maat. De
// vragen over vastzitten en gegevens zijn VRAAG_CONTRACT en VRAAG_GEGEVENS uit
// inhoud/vertrouwen.ts (daar staat waarom ze kloppen); het Engels zegt hetzelfde.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { VRAAG_CONTRACT, VRAAG_GEGEVENS } from '@/components/aiyourgym/inhoud/vertrouwen'
import { woordenboek } from '../../woordenboek'

export const PRIJZEN = woordenboek({
  nl: {
    metaTitel: 'Prijzen',
    metaOmschrijving: `De losse pakketten van AI Your Gym: kies alleen wat je nodig hebt. Scherp geprijsd, per vestiging. Probeer ${PROEFDAGEN} dagen gratis.`,
    label: 'Prijzen',
    titel: 'Kies alleen wat je nodig hebt.',
    tekst: `Zes losse pakketten die elk op zichzelf werken. Alleen groepslessen, alleen ledenadministratie of alles: jij kiest. Eerst ${PROEFDAGEN} dagen gratis.`,
    pakketten: 'Pakketten',
    kernTitel: 'Bij elk pakket',
    vraagPrijs: 'Vraag een prijs op maat',
    vragenLabel: 'Vragen',
    vragenTitel: 'Over pakketten en proberen.',
    zonderStripe: ' Online betalen is nog niet gekoppeld: er wordt niets afgeschreven, en voor het einde spreken we samen af hoe je verder betaalt.',
    vragen: {
      kosten: {
        vraag: 'Wat kost AI Your Gym?',
        antwoord: 'Dat hangt af van de pakketten die je kiest en het aantal vestigingen. Vraag in drie korte stappen een prijs op maat aan.',
      },
      later: {
        vraag: 'Kan ik later een pakket erbij nemen of opzeggen?',
        antwoord: 'Ja. In Club, onder Abonnement, neem je een pakket erbij of vraag je een opzegging aan. Een pakket opzeggen gaat volgens je contract.',
      },
      proef: {
        vraag: 'Hoe werkt de proefperiode?',
        antwoord: `${PROEFDAGEN} dagen gratis, met je eigen logo, kleuren en team.`,
      },
      contract: VRAAG_CONTRACT,
      gegevens: VRAAG_GEGEVENS,
      incasso: {
        vraag: 'Zitten incasso en abonnementen erin?',
        antwoord: 'Nee. Die blijven in je ledenadministratie. Je leden lees je in met een CSV- of Excel-bestand.',
      },
    },
  },
  en: {
    metaTitel: 'Pricing',
    metaOmschrijving: `The separate AI Your Gym packages: choose only what you need. Competitively priced, per location. Try it free for ${PROEFDAGEN} days.`,
    label: 'Pricing',
    titel: 'Choose only what you need.',
    tekst: `Six separate packages that each work on their own. Only group classes, only membership administration or everything: you choose. ${PROEFDAGEN} days free first.`,
    pakketten: 'Packages',
    kernTitel: 'With every package',
    vraagPrijs: 'Ask for a tailored price',
    vragenLabel: 'Questions',
    vragenTitel: 'About packages and trying it out.',
    zonderStripe: ' Online payment is not connected yet: nothing is charged, and before the trial ends we agree together how you pay from then on.',
    vragen: {
      kosten: {
        vraag: 'What does AI Your Gym cost?',
        antwoord: 'That depends on the packages you choose and the number of locations. Ask for a tailored price in three short steps.',
      },
      later: {
        vraag: 'Can I add or cancel a package later?',
        antwoord: 'Yes. In Club, under Subscription, you add a package or request a cancellation. Cancelling a package follows your contract.',
      },
      proef: {
        vraag: 'How does the trial work?',
        antwoord: `${PROEFDAGEN} days free, with your own logo, colours and team.`,
      },
      contract: {
        vraag: 'Am I tied in?',
        antwoord: `You start with ${PROEFDAGEN} days free. Stop, and you pay nothing. Carry on: a yearly subscription, paid monthly per location. No set-up fee for now, and you always see the amount up front.`,
      },
      gegevens: {
        vraag: 'Who owns my data, and can I take it with me?',
        antwoord:
          'You do. We only use it to make the software work. Export the member list, leads, visits and hours as CSV, and download all data per member.',
      },
      incasso: {
        vraag: 'Are direct debits and memberships included?',
        antwoord: 'No. They stay in your membership administration. You import your members from a CSV or Excel file.',
      },
    },
  },
})
