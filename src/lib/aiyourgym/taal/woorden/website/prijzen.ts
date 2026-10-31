// De prijzenpagina (src/app/(aiyourgym)/(website)/aiyourgym/(site)/prijzen/page.tsx).
// Geen bedragen op de website (besluit Kane): de prijs is altijd op maat. De
// vragen over vastzitten en gegevens zijn VRAAG_CONTRACT en VRAAG_GEGEVENS uit
// inhoud/vertrouwen.ts (daar staat waarom ze kloppen); het Engels zegt hetzelfde.

import { VRAAG_CONTRACT, VRAAG_GEGEVENS } from '@/components/aiyourgym/inhoud/vertrouwen'
import { woordenboek } from '../../woordenboek'

export const PRIJZEN = woordenboek({
  nl: {
    metaTitel: 'Prijzen',
    metaOmschrijving: `AI Your Gym is een basis met add-ons: ledenadministratie en ledenapp altijd, daarbovenop alleen wat je nodig hebt. Scherp geprijsd, per vestiging, zonder opstartkosten.`,
    label: 'Prijzen',
    titel: 'Kies alleen wat je nodig hebt.',
    tekst: `Een basis met ledenadministratie en ledenapp, plus vijf add-ons. Bijvoorbeeld de basis plus Groepslessen, of alles: jij kiest.`,
    pakketten: 'Pakketten',
    kernTitel: 'Altijd in de basis',
    addOnsTitel: 'Vijf add-ons, kies wat je nodig hebt',
    startBasis: 'Start met de basis',
    kiesAddOn: 'Basis plus deze add-on',
    vraagPrijs: 'Vraag een prijs op maat',
    vragenLabel: 'Vragen',
    vragenTitel: 'Over pakketten en starten.',
    zonderStripe: ' Online betalen is nog niet gekoppeld: er wordt nu niets afgeschreven en we spreken samen af hoe je betaalt.',
    vragen: {
      kosten: {
        vraag: 'Wat kost AI Your Gym?',
        antwoord: 'Dat hangt af van de pakketten die je kiest en het aantal vestigingen. Vraag in drie korte stappen een prijs op maat aan.',
      },
      later: {
        vraag: 'Kan ik later een add-on erbij nemen of opzeggen?',
        antwoord: 'Ja. In Club, onder Abonnement, neem je een add-on erbij of vraag je een opzegging aan. Een add-on opzeggen gaat volgens je contract. De basis loopt zolang je abonnement loopt.',
      },
      start: {
        vraag: 'Hoe start ik?',
        antwoord: 'Je kiest je add-ons bovenop de basis, je adres en je wachtwoord en betaalt via Stripe. Daarna staat je omgeving klaar en zet de startwizard je club live.',
      },
      contract: VRAAG_CONTRACT,
      gegevens: VRAAG_GEGEVENS,
      incasso: {
        vraag: 'Zitten incasso en abonnementen erin?',
        antwoord: 'Nee. Die blijven in je huidige systeem. Je leden lees je in met een CSV- of Excel-bestand.',
      },
    },
  },
  en: {
    metaTitel: 'Pricing',
    metaOmschrijving: `AI Your Gym is a core with add-ons: membership administration and the member app always, and on top only what you need. Competitively priced, per location, with no set-up fee.`,
    label: 'Pricing',
    titel: 'Choose only what you need.',
    tekst: `A core with membership administration and the member app, plus five add-ons. For example the core plus Group classes, or everything: you choose.`,
    pakketten: 'Packages',
    kernTitel: 'Always in the core',
    addOnsTitel: 'Five add-ons, pick what you need',
    startBasis: 'Start with the core',
    kiesAddOn: 'Core plus this add-on',
    vraagPrijs: 'Ask for a tailored price',
    vragenLabel: 'Questions',
    vragenTitel: 'About packages and getting started.',
    zonderStripe: ' Online payment is not connected yet: nothing is charged for now, and together we agree how you pay.',
    vragen: {
      kosten: {
        vraag: 'What does AI Your Gym cost?',
        antwoord: 'That depends on the packages you choose and the number of locations. Ask for a tailored price in three short steps.',
      },
      later: {
        vraag: 'Can I add or cancel an add-on later?',
        antwoord: 'Yes. In Club, under Subscription, you add an add-on or request a cancellation. Cancelling an add-on follows your contract. The core runs as long as your subscription runs.',
      },
      start: {
        vraag: 'How do I get started?',
        antwoord: 'You choose your add-ons on top of the core, your address and your password and pay through Stripe. Your environment is then ready and the set-up wizard puts your club live.',
      },
      contract: {
        vraag: 'Am I tied in?',
        antwoord: 'A yearly subscription, paid monthly per location. No set-up fee for now, and you always see the amount before you pay.',
      },
      gegevens: {
        vraag: 'Who owns my data, and can I take it with me?',
        antwoord:
          'You do. We only use it to make the software work. Export the member list, leads, visits and hours as CSV, and download all data per member.',
      },
      incasso: {
        vraag: 'Are direct debits and memberships included?',
        antwoord: 'No. They stay in your current system. You import your members from a CSV or Excel file.',
      },
    },
  },
})
