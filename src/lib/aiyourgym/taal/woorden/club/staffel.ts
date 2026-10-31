import { woordenboek } from '../../woordenboek'

// Staffelprijzen per vestiging op aantal actieve leden (besluit Kane
// 31-10-2026): de namen van de staffels, het blok op /club/beheer/abonnement,
// de afspraak uit de voorwaarden in een regel, en de mail bij een andere
// staffel. Nooit een bedrag: dat staat alleen in Stripe.

export const STAFFEL = woordenboek({
  nl: {
    tot: (n: string) => `Tot ${n} leden`,
    opMaat: 'Meer dan 5.000 leden: prijs op maat',
    kop: 'Staffel per vestiging',
    uitleg: 'De prijs per vestiging volgt het aantal actieve leden. Een actief lid is een lid met de status actief of proef, of opgezegd tot de einddatum; niet gepauzeerd, gestopt of demo.',
    afspraak: 'We tellen elke dag de actieve leden per vestiging. Past een vestiging in een andere staffel, dan geldt die vanzelf vanaf de volgende maandfactuur, omhoog en omlaag; je jaarcontract loopt gewoon door. Je krijgt een mail als de staffel verandert. Boven 5.000 leden spreken we een prijs op maat af.',
    vestiging: 'Vestiging',
    leden: 'Actieve leden',
    staffel: 'Staffel',
    bedrag: 'Bedrag bij Stripe',
    geteld: (datum: string) => `Geteld op ${datum}`,
    nogNietGeteld: 'Nog niet geteld',
    geenAbonnement: 'Nog geen eigen abonnement',
    wijzigingen: 'Laatste wijzigingen',
    wijziging: (vestiging: string, oud: string, nieuw: string, datum: string) => `${vestiging}: van ${oud} naar ${nieuw} (geteld op ${datum}), vanaf de volgende maandfactuur.`,
    mailOnderwerp: (vestiging: string) => `Andere staffel voor ${vestiging}`,
    mailTekst: (p: { naam: string; sportschool: string; vestiging: string; leden: number; oud: string; nieuw: string; adres: string }) =>
      [
        `Hoi ${p.naam},`,
        '',
        `Vestiging ${p.vestiging} van ${p.sportschool} heeft nu ${p.leden} actieve leden. Daarmee valt de vestiging in een andere staffel: ${p.nieuw} (was ${p.oud}).`,
        '',
        'De nieuwe staffel geldt vanzelf vanaf je volgende maandfactuur. Er wordt niets met terugwerkende kracht verrekend en je jaarcontract loopt gewoon door, zoals in de voorwaarden staat.',
        '',
        `Je ziet de staffel en het aantal actieve leden altijd in Club bij Abonnement: ${p.adres}`,
        '',
        'Groet,',
        'AI Your Gym',
      ].join('\n'),
  },
  en: {
    tot: (n: string) => `Up to ${n} members`,
    opMaat: 'More than 5,000 members: custom price',
    kop: 'Tier per location',
    uitleg: 'The price per location follows the number of active members. An active member has the status active or trial, or cancelled until the end date; not paused, stopped or demo.',
    afspraak: 'We count the active members per location every day. If a location fits a different tier, that tier applies automatically from the next monthly invoice, up and down; your annual contract simply continues. You get an email when the tier changes. Above 5,000 members we agree a custom price.',
    vestiging: 'Location',
    leden: 'Active members',
    staffel: 'Tier',
    bedrag: 'Amount at Stripe',
    geteld: (datum: string) => `Counted on ${datum}`,
    nogNietGeteld: 'Not counted yet',
    geenAbonnement: 'No own subscription yet',
    wijzigingen: 'Latest changes',
    wijziging: (vestiging: string, oud: string, nieuw: string, datum: string) => `${vestiging}: from ${oud} to ${nieuw} (counted on ${datum}), from the next monthly invoice.`,
    mailOnderwerp: (vestiging: string) => `New tier for ${vestiging}`,
    mailTekst: (p: { naam: string; sportschool: string; vestiging: string; leden: number; oud: string; nieuw: string; adres: string }) =>
      [
        `Hi ${p.naam},`,
        '',
        `Location ${p.vestiging} of ${p.sportschool} now has ${p.leden} active members. That puts the location in a different tier: ${p.nieuw} (was ${p.oud}).`,
        '',
        'The new tier applies automatically from your next monthly invoice. Nothing is charged retroactively and your annual contract simply continues, as stated in the terms.',
        '',
        `You can always see the tier and the number of active members in Club under Subscription: ${p.adres}`,
        '',
        'Best regards,',
        'AI Your Gym',
      ].join('\n'),
  },
})
