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
    metaOmschrijving: `De pakketten van AI Your Gym: Start, Club en Keten. Scherp geprijsd, met een prijs die past bij je sportschool. Probeer ${PROEFDAGEN} dagen gratis.`,
    label: 'Prijzen',
    titel: 'Een prijs die past bij je sportschool.',
    tekst: `Alles wat je van serieuze clubsoftware verwacht, scherp geprijsd en op maat. Voor een vestiging of een hele keten. Probeer eerst ${PROEFDAGEN} dagen gratis.`,
    pakketten: 'Pakketten',
    vraagPrijs: 'Vraag een prijs op maat',
    vragenLabel: 'Vragen',
    vragenTitel: 'Over pakketten en proberen.',
    zonderStripe:
      ' Online betalen is nog niet gekoppeld: bij het starten wordt niets afgeschreven, en voor het einde van je proefperiode spreken we samen af hoe je verder betaalt.',
    vragen: {
      kosten: {
        vraag: 'Wat kost AI Your Gym?',
        antwoord:
          'Dat hangt af van het pakket en het aantal vestigingen. Vraag een prijs op maat aan in drie korte stappen, dan krijg je een prijs die past bij je sportschool.',
      },
      proef: {
        vraag: 'Hoe werkt de proefperiode?',
        antwoord: `Je probeert AI Your Gym ${PROEFDAGEN} dagen gratis, met je eigen logo, kleuren en team. Zo zie je in je eigen club of het past.`,
      },
      contract: VRAAG_CONTRACT,
      gegevens: VRAAG_GEGEVENS,
      hulp: {
        vraag: 'Zit hulp bij het inrichten erbij?',
        antwoord:
          'Elke sportschool krijgt de startwizard, die in acht stappen alles meteen instelt. In Club en Keten zit daarnaast persoonlijke hulp bij het inrichten, zonder extra kosten.',
      },
      eerstZien: {
        vraag: 'Kan ik het eerst zien zonder aan te melden?',
        antwoord: 'Ja. De demo laat de echte schermen zien met een voorbeeldsportschool, zonder account en zonder gegevens van echte leden.',
      },
      incasso: {
        vraag: 'Zitten incasso en abonnementen erin?',
        antwoord:
          'Nee. AI Your Gym werkt naast je ledenadministratie. Incasso en abonnementen blijven daar, je leden lees je in met een CSV- of Excel-bestand.',
      },
      nieuw: {
        vraag: 'Komen er nieuwe functies bij?',
        antwoord: 'Ja. Elke maand nieuwe functies, automatisch voor iedereen. Je hoeft niets te installeren.',
      },
    },
  },
  en: {
    metaTitel: 'Pricing',
    metaOmschrijving: `The AI Your Gym plans: Start, Club and Keten. Competitively priced, with a price that fits your gym. Try it free for ${PROEFDAGEN} days.`,
    label: 'Pricing',
    titel: 'A price that fits your gym.',
    tekst: `Everything you expect from serious club software, competitively priced and tailored to you. For a single location or a whole chain. Try it free for ${PROEFDAGEN} days first.`,
    pakketten: 'Plans',
    vraagPrijs: 'Ask for a tailored price',
    vragenLabel: 'Questions',
    vragenTitel: 'About plans and trying it out.',
    zonderStripe:
      ' Online payment is not connected yet: nothing is charged when you start, and before your trial ends we agree together how you pay from then on.',
    vragen: {
      kosten: {
        vraag: 'What does AI Your Gym cost?',
        antwoord: 'That depends on the plan and the number of locations. Ask for a tailored price in three short steps and you get a price that fits your gym.',
      },
      proef: {
        vraag: 'How does the trial work?',
        antwoord: `You try AI Your Gym free for ${PROEFDAGEN} days, with your own logo, colours and team. That way you see in your own club whether it fits.`,
      },
      contract: {
        vraag: 'Am I tied in?',
        antwoord: `You start with ${PROEFDAGEN} days free in your own environment. If you stop during that time, you pay nothing. If you continue, your subscription runs for a year and you pay monthly, per location. There is no set-up fee for now. You always see the amount before you pay anything.`,
      },
      gegevens: {
        vraag: 'Who owns my data, and can I take it with me?',
        antwoord:
          'You do. AI Your Gym only uses it to make the software work for you. You export the member list, leads, visits, occupancy and hours worked as CSV through the reports, and for each member you can download all of their data from the member card.',
      },
      hulp: {
        vraag: 'Is help with setting up included?',
        antwoord:
          'Every gym gets the start wizard, which sets everything up straight away in eight steps. Club and Keten also include personal help with setting up, at no extra cost.',
      },
      eerstZien: {
        vraag: 'Can I see it first without signing up?',
        antwoord: 'Yes. The demo shows the real screens with an example gym, without an account and without data from real members.',
      },
      incasso: {
        vraag: 'Are direct debits and memberships included?',
        antwoord:
          'No. AI Your Gym works alongside your membership administration. Direct debits and memberships stay there; you import your members from a CSV or Excel file.',
      },
      nieuw: {
        vraag: 'Will new features be added?',
        antwoord: 'Yes. New features every month, automatically for everyone. You do not need to install anything.',
      },
    },
  },
})
