// Club, Abonnement: de losse pakketten van de sportschool erbij nemen of
// opzeggen (besluit Kane 29-10-2026). Eerlijk over wat er gebeurt: via Stripe,
// testbetaling (niets afgeschreven) of een aanvraag die Kane verwerkt.

import { woordenboek } from '../../woordenboek'

export const PAKKETTEN_BEHEER = woordenboek({
  nl: {
    kop: 'Je pakketten',
    uitleg: 'Elk pakket werkt los van de andere. Wat je niet afneemt, staat niet in Club en niet in de ledenapp.',
    kern: 'Altijd inbegrepen',
    afgenomen: 'Afgenomen',
    nietAfgenomen: 'Niet afgenomen',
    aangevraagd: 'Aangevraagd',
    opzeggingAangevraagd: 'Opzegging aangevraagd',
    erbij: 'Erbij nemen',
    opzeggen: 'Opzeggen',
    bezig: 'Even geduld',
    laatste: 'Je houdt minstens een pakket.',
    zekerOpzeggen: (naam: string) => `${naam} opzeggen? Alles van dit pakket verdwijnt dan uit Club en de ledenapp. Je gegevens blijven bewaard.`,
    uitkomst: {
      stripe: 'Toegevoegd aan je abonnement. Stripe verrekent het naar rato op je volgende factuur.',
      stripeBundel: 'Je hebt nu alle zes pakketten, dus geldt de bundelprijs. Stripe verrekent het naar rato op je volgende factuur.',
      test: 'Aangepast. Er wordt niets afgeschreven: online betalen is nog niet gekoppeld.',
      direct: 'Aangepast.',
      aanvraagErbij: 'Aanvraag ontvangen. We zetten het pakket aan en spreken de prijs met je af.',
      aanvraagOpzeggen: 'Opzegging ontvangen. We verwerken hem volgens je contract; tot dan houd je het pakket.',
    },
    fout: 'Het pakket kon niet worden aangepast. Probeer het later opnieuw.',
    betalenNietErin: 'Ledenabonnementen en incasso zitten er nog niet in.',
    bundel: 'Neem je alle zes, dan geldt een bundelprijs. Een opzegging verwerken we volgens je jaarcontract; daarna gelden weer de losse prijzen.',
  },
  en: {
    kop: 'Your packages',
    uitleg: 'Each package works on its own. What you do not take is not in Club and not in the member app.',
    kern: 'Always included',
    afgenomen: 'Included',
    nietAfgenomen: 'Not included',
    aangevraagd: 'Requested',
    opzeggingAangevraagd: 'Cancellation requested',
    erbij: 'Add',
    opzeggen: 'Cancel',
    bezig: 'One moment',
    laatste: 'You keep at least one package.',
    zekerOpzeggen: (naam: string) => `Cancel ${naam}? Everything in this package disappears from Club and the member app. Your data is kept.`,
    uitkomst: {
      stripe: 'Added to your subscription. Stripe prorates it on your next invoice.',
      stripeBundel: 'You now have all six packages, so the bundle price applies. Stripe prorates it on your next invoice.',
      test: 'Changed. Nothing is charged: online payment is not connected yet.',
      direct: 'Changed.',
      aanvraagErbij: 'Request received. We switch the package on and agree the price with you.',
      aanvraagOpzeggen: 'Cancellation received. We process it according to your contract; until then you keep the package.',
    },
    fout: 'The package could not be changed. Please try again later.',
    betalenNietErin: 'Member subscriptions and direct debits are not included yet.',
    bundel: 'Take all six and a bundle price applies. We process a cancellation according to your annual contract; after that the separate prices apply again.',
  },
})
